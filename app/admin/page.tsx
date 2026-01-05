// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../utils/auth';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import Navbar from './Navbar';
import {
  UsersIcon,
  ArchiveBoxIcon,
  CircleStackIcon,
  BuildingOfficeIcon,
  ClockIcon, 
  DocumentChartBarIcon,
  ArrowRightIcon,
  CogIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  UsersIcon as UsersSolid,
  ArchiveBoxIcon as ArchiveSolid,
  CircleStackIcon as CircleSolid,
  ExclamationTriangleIcon as ComplaintSolid,
  ChatBubbleLeftRightIcon as SurveySolid,
  ClockIcon as ClockSolid
} from '@heroicons/react/24/solid';
import Link from 'next/link';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalProductions: number;
  expiringProducts: number; // Pengganti statistik perusahaan/QR
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  totalSurveys: number;
  thisMonthSurveys: number; // Pastikan ini ada
  avgSurveyRating: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalProductions: 0,
    expiringProducts: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    avgResolutionTime: 0,
    satisfactionScore: 0,
    totalSurveys: 0,
    thisMonthSurveys: 0,
    avgSurveyRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const hasComplaintPermission = (permission: string) => {
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);

      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      
      const todayStr = today.toISOString().split('T')[0];
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      const [
        productsResult,
        productionsResult,
        // Query Expired: Ambil produksi yang expirednya diantara hari ini dan 30 hari lagi
        expiringResult, 
        complaintsResult,
        surveysResult
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('productions').select('id', { count: 'exact', head: true }),
        supabase.from('productions')
          .select('id', { count: 'exact', head: true })
          .gte('lab_result_expired_date', todayStr)
          .lte('lab_result_expired_date', nextMonthStr),
        supabase.from('complaints').select(`
          id, status, created_at, resolved_at, customer_satisfaction_rating
        `),
        supabase.from('surveys').select(`
          id, created_at, ratings
        `)
      ]);

      let userCount = 0;
      try {
        const response = await fetch('/api/admin/users-count');
        if (response.ok) {
          const data = await response.json();
          userCount = data.count || 0;
        } else {
          userCount = 4;
        }
      } catch (error) {
        userCount = 4;
      }

      const complaints = complaintsResult.data || [];
      const pendingComplaints = complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length;
      const resolvedComplaints = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
      
      const resolvedComplaintsWithTime = complaints.filter(c => c.resolved_at && c.created_at);
      const avgResolutionTime = resolvedComplaintsWithTime.length > 0 
        ? resolvedComplaintsWithTime.reduce((acc, c) => {
            const created = new Date(c.created_at).getTime();
            const resolved = new Date(c.resolved_at).getTime();
            return acc + (resolved - created) / (1000 * 60 * 60);
          }, 0) / resolvedComplaintsWithTime.length
        : 0;

      const ratedComplaints = complaints.filter(c => c.customer_satisfaction_rating);
      const avgSatisfactionScore = ratedComplaints.length > 0
        ? ratedComplaints.reduce((acc, c) => acc + c.customer_satisfaction_rating, 0) / ratedComplaints.length
        : 0;

      const surveys = surveysResult.data || [];
      // Hitung Survey Bulan Ini
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const thisMonthSurveys = surveys.filter(s => new Date(s.created_at) >= thisMonthStart).length;
      
      const surveysWithRatings = surveys.filter(s => s.ratings?.overall_satisfaction);
      const avgSurveyRating = surveysWithRatings.length > 0
        ? surveysWithRatings.reduce((acc, s) => acc + (s.ratings.overall_satisfaction || 0), 0) / surveysWithRatings.length
        : 0;

      setStats({
        totalUsers: userCount,
        totalProducts: productsResult.count || 0,
        totalProductions: productionsResult.count || 0,
        expiringProducts: expiringResult.count || 0,
        totalComplaints: complaints.length,
        pendingComplaints,
        resolvedComplaints,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        satisfactionScore: Math.round(avgSatisfactionScore * 10) / 10,
        totalSurveys: surveys.length,
        thisMonthSurveys, // Masukkan ke state
        avgSurveyRating: Math.round(avgSurveyRating * 10) / 10
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID'));
      setCurrentDate(now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const profile: User | null = await getProfile();
        if (profile) {
          setUser({
            name: profile.user_metadata?.name || 'Admin',
            roles: profile.app_metadata?.roles || ['Superadmin'],
            complaint_permissions: profile.user_metadata?.complaint_permissions || {}
          });
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (mounted) {
      loadDashboardStats();
    }
  }, [mounted]);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
      </div>
    );
  }

  // --- KONFIGURASI KARTU STATISTIK ---
  const statCards = [
    { 
      icon: UsersSolid, 
      title: 'Total Pengguna', 
      value: stats.totalUsers,
      color: 'from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600' 
    },
    { 
      icon: ArchiveSolid, 
      title: 'Produk Terdaftar', 
      value: stats.totalProducts,
      color: 'from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600' 
    },
    { 
      icon: CircleSolid, 
      title: 'Data Produksi', 
      value: stats.totalProductions,
      color: 'from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600' 
    },
    // KARTU KE-4: EXPIRED WARNING
    { 
      icon: ClockSolid, 
      title: 'Expired < 1 Bulan', 
      value: stats.expiringProducts,
      color: 'from-rose-600 to-red-700 dark:from-rose-500 dark:to-red-600' 
    },
    // KARTU COMPLAINT & SURVEY (Jika ada izin)
    ...(hasComplaintPermission('canViewComplaints') ? [
      { 
        icon: ComplaintSolid, 
        title: 'Total Komplain', 
        value: stats.totalComplaints,
        color: 'from-red-600 to-red-700 dark:from-red-500 dark:to-red-600'
      },
      // ++ KARTU SURVEY BULAN INI DIKEMBALIKAN ++
      { 
        icon: SurveySolid, 
        title: 'Survey Bulan Ini', 
        value: stats.thisMonthSurveys,
        color: 'from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600' 
      }
    ] : [])
  ];

  // --- KONFIGURASI MENU MANAJEMEN ---
  const managementItems = [
    { 
      icon: UsersIcon, 
      title: 'Manajemen Pengguna', 
      description: 'Kelola akun pengguna dan hak akses sistem.', 
      link: '/admin/users',
      count: stats.totalUsers,
      countLabel: 'pengguna terdaftar'
    },
    { 
      icon: ArchiveBoxIcon, 
      title: 'Katalog Produk', 
      description: 'Atur database produk dan informasi teknis benih.', 
      link: '/admin/products',
      count: stats.totalProducts,
      countLabel: 'produk aktif'
    },
    { 
      icon: CircleStackIcon, 
      title: 'Data Produksi', 
      description: 'Monitor batch produksi dan tracking inventory.', 
      link: '/admin/productions',
      count: stats.totalProductions,
      countLabel: 'batch produksi'
    },
    { 
      icon: BuildingOfficeIcon, 
      title: 'Data Perusahaan', 
      description: 'Kelola informasi perusahaan dan partner.', 
      link: '/admin/companies',
      // Count Statistik Perusahaan dihapus agar tidak muncul angka
      countLabel: 'Manajemen partner'
    },
    { 
      icon: ClockIcon, 
      title: 'Monitoring Expired', 
      description: 'Cek produk yang akan segera kadaluarsa.', 
      link: '/admin/productions?sort=expired_asc',
      count: stats.expiringProducts,
      countLabel: 'batch akan expired',
      badge: stats.expiringProducts > 0 ? `${stats.expiringProducts}` : undefined
    },
    ...(hasComplaintPermission('canViewComplaints') ? [
      { 
        icon: ExclamationTriangleIcon, 
        title: 'Manajemen Komplain', 
        description: 'Kelola komplain pelanggan dan tracking penyelesaian.', 
        link: '/admin/complaints',
        count: stats.pendingComplaints,
        countLabel: 'komplain pending',
        badge: stats.pendingComplaints > 0 ? `${stats.pendingComplaints}` : undefined
      },
      { 
        icon: DocumentTextIcon, 
        title: 'Survey & Feedback', 
        description: 'Analisis kepuasan pelanggan dan feedback produk.', 
        link: '/admin/surveys',
        count: stats.totalSurveys,
        countLabel: 'survey terkumpul'
      }
    ] : []),
    { 
      icon: CogIcon, 
      title: 'Master Data', 
      description: 'Konfigurasi jenis tanaman, varietas, dan kelas benih.', 
      link: '/admin/jenis-tanaman'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-800 dark:from-slate-100 dark:via-slate-200 dark:to-emerald-400 bg-clip-text text-transparent">
                  Dashboard Admin
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-slate-300">
                  Selamat datang kembali, <span className="font-bold text-emerald-600 dark:text-emerald-400">{user?.name || 'Admin'}</span>! 
                  Kelola sistem verifikasi Advanta Seeds dengan mudah.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{currentDate}</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <ClockIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{currentTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-sm opacity-90 mb-1">{stat.title}</p>
                    {isLoading ? (
                      <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Complaint Summary Cards */}
          {hasComplaintPermission('canViewComplaints') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 text-white">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.pendingComplaints}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Pending</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Perlu Ditindak</span>
                  {stats.pendingComplaints > 0 && (
                    <Link href="/admin/complaints" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full font-bold hover:bg-yellow-200 dark:hover:bg-yellow-900/50">
                      Lihat →
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.resolvedComplaints}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Selesai</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Resolved</span>
                  <div className="text-xs text-green-600 dark:text-green-400 font-bold">
                    {stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.avgResolutionTime}h</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Avg Resolution</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Waktu Rata-rata</span>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    Target: 24h
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.satisfactionScore}/5</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">CSAT Score</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Customer Satisfaction</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <div key={star} className={`w-3 h-3 ${star <= Math.round(stats.satisfactionScore) ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}>
                        ★
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Management Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <CubeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Manajemen Sistem
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managementItems.map((item, index) => (
                <div key={item.title} className="animate-fade-in" style={{ animationDelay: `${(index + 6) * 0.1}s` }}>
                  <Link href={item.link} className="block">
                    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:-translate-y-2">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white shadow-lg">
                            <item.icon className="h-6 w-6" />
                          </div>
                          {item.badge && (
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-2">{item.description}</p>
                        
                        {typeof item.count !== 'undefined' && item.countLabel && (
                          <div className="mb-4">
                            {isLoading ? (
                              <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            ) : (
                              <>
                                <span className={`text-2xl font-bold ${item.title.includes('Expired') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {item.count.toLocaleString()}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 dark:text-slate-400">{item.countLabel}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 flex items-center gap-2">
                            Kelola Data 
                            <ArrowRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <DocumentChartBarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/products" className="flex flex-col items-center p-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <ArchiveBoxIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-center">Kelola Produk</span>
              </Link>
              
              <Link href="/admin/productions" className="flex flex-col items-center p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <CircleStackIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center">Data Produksi</span>
              </Link>
              
              <Link href="/admin/users" className="flex flex-col items-center p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 text-center">Kelola User</span>
              </Link>
              
              {hasComplaintPermission('canViewComplaints') ? (
                <Link href="/admin/complaints" className="flex flex-col items-center p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 text-center">Komplain</span>
                </Link>
              ) : (
                <Link href="/admin/productions" className="flex flex-col items-center p-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors group">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                    <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 text-center">Cek Expired</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}