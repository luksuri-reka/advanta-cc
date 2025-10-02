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
  QrCodeIcon,
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
  BuildingOfficeIcon as BuildingSolid,
  ExclamationTriangleIcon as ComplaintSolid,
  ChatBubbleLeftRightIcon as SurveySolid
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
  totalCompanies: number;
  totalBags: number;
  totalQrCodes: number;
  // Complaint metrics
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  // Survey metrics
  totalSurveys: number;
  thisMonthSurveys: number;
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
    totalCompanies: 0,
    totalBags: 0,
    totalQrCodes: 0,
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

  // Check user permissions
  const hasComplaintPermission = (permission: string) => {
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Fetch basic stats
      const [
        productsResult,
        productionsResult,
        companiesResult,
        bagsResult,
        qrCodesResult,
        complaintsResult,
        surveysResult
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('productions').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('bags').select('id', { count: 'exact', head: true }),
        supabase.from('qr_bags').select('id', { count: 'exact', head: true }),
        // Complaint stats
        supabase.from('complaints').select(`
          id, status, created_at, resolved_at, customer_satisfaction_rating
        `),
        // Survey stats  
        supabase.from('surveys').select(`
          id, created_at, ratings
        `)
      ]);

      // Try to get user count
      let userCount = 0;
      try {
        const response = await fetch('/api/admin/users-count');
        if (response.ok) {
          const data = await response.json();
          userCount = data.count || 0;
        } else {
          userCount = 4; // Fallback
        }
      } catch (error) {
        userCount = 4; // Fallback
      }

      // Process complaint data
      const complaints = complaintsResult.data || [];
      const pendingComplaints = complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length;
      const resolvedComplaints = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
      
      // Calculate average resolution time (in hours)
      const resolvedComplaintsWithTime = complaints.filter(c => c.resolved_at && c.created_at);
      const avgResolutionTime = resolvedComplaintsWithTime.length > 0 
        ? resolvedComplaintsWithTime.reduce((acc, c) => {
            const created = new Date(c.created_at).getTime();
            const resolved = new Date(c.resolved_at).getTime();
            return acc + (resolved - created) / (1000 * 60 * 60); // Convert to hours
          }, 0) / resolvedComplaintsWithTime.length
        : 0;

      // Calculate satisfaction score
      const ratedComplaints = complaints.filter(c => c.customer_satisfaction_rating);
      const avgSatisfactionScore = ratedComplaints.length > 0
        ? ratedComplaints.reduce((acc, c) => acc + c.customer_satisfaction_rating, 0) / ratedComplaints.length
        : 0;

      // Process survey data
      const surveys = surveysResult.data || [];
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const thisMonthSurveys = surveys.filter(s => new Date(s.created_at) >= thisMonthStart).length;
      
      // Calculate average survey rating
      const surveysWithRatings = surveys.filter(s => s.ratings?.overall_satisfaction);
      const avgSurveyRating = surveysWithRatings.length > 0
        ? surveysWithRatings.reduce((acc, s) => acc + (s.ratings.overall_satisfaction || 0), 0) / surveysWithRatings.length
        : 0;

      setStats({
        totalUsers: userCount,
        totalProducts: productsResult.count || 0,
        totalProductions: productionsResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalBags: bagsResult.count || 0,
        totalQrCodes: qrCodesResult.count || 0,
        totalComplaints: complaints.length,
        pendingComplaints,
        resolvedComplaints,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        satisfactionScore: Math.round(avgSatisfactionScore * 10) / 10,
        totalSurveys: surveys.length,
        thisMonthSurveys,
        avgSurveyRating: Math.round(avgSurveyRating * 10) / 10
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set fallback values
      setStats({
        totalUsers: 4,
        totalProducts: 0,
        totalProductions: 0,
        totalCompanies: 0,
        totalBags: 0,
        totalQrCodes: 0,
        totalComplaints: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        avgResolutionTime: 0,
        satisfactionScore: 0,
        totalSurveys: 0,
        thisMonthSurveys: 0,
        avgSurveyRating: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Prepare stat cards
  const statCards = [
    { 
      icon: UsersSolid, 
      title: 'Total Pengguna', 
      value: stats.totalUsers,
      color: 'from-blue-600 to-blue-700' 
    },
    { 
      icon: ArchiveSolid, 
      title: 'Produk Terdaftar', 
      value: stats.totalProducts,
      color: 'from-emerald-600 to-emerald-700' 
    },
    { 
      icon: CircleSolid, 
      title: 'Data Produksi', 
      value: stats.totalProductions,
      color: 'from-purple-600 to-purple-700' 
    },
    { 
      icon: BuildingSolid, 
      title: 'Perusahaan', 
      value: stats.totalCompanies,
      color: 'from-orange-600 to-orange-700' 
    },
    // Show complaint stats only if user has permission
    ...(hasComplaintPermission('canViewComplaints') ? [
      { 
        icon: ComplaintSolid, 
        title: 'Total Komplain', 
        value: stats.totalComplaints,
        color: 'from-red-600 to-red-700'
      },
      { 
        icon: SurveySolid, 
        title: 'Survey Bulan Ini', 
        value: stats.thisMonthSurveys,
        color: 'from-indigo-600 to-indigo-700' 
      }
    ] : [])
  ];

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
      count: stats.totalCompanies,
      countLabel: 'perusahaan'
    },
    // Show complaint management only if user has permission
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
      icon: QrCodeIcon, 
      title: 'Manajemen QR & Bags', 
      description: 'Kelola QR code dan packaging untuk produk.', 
      link: '/admin/bags',
      count: stats.totalBags,
      countLabel: 'bags aktif'
    },
    { 
      icon: CogIcon, 
      title: 'Master Data', 
      description: 'Konfigurasi jenis tanaman, varietas, dan kelas benih.', 
      link: '/admin/jenis-tanaman'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-800 bg-clip-text text-transparent">
                  Dashboard Admin
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Selamat datang kembali, <span className="font-bold text-emerald-600">{user?.name || 'Admin'}</span>! 
                  Kelola sistem verifikasi Advanta Seeds dengan mudah.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{currentDate}</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <ClockIcon className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">{currentTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
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

          {/* Complaint Summary Cards (only if user has permission) */}
          {hasComplaintPermission('canViewComplaints') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingComplaints}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Perlu Ditindak</span>
                  {stats.pendingComplaints > 0 && (
                    <Link href="/admin/complaints" className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold hover:bg-yellow-200">
                      Lihat →
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats.resolvedComplaints}</p>
                    <p className="text-sm text-gray-500">Selesai</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Resolved</span>
                  <div className="text-xs text-green-600 font-bold">
                    {stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime}h</p>
                    <p className="text-sm text-gray-500">Avg Resolution</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Waktu Rata-rata</span>
                  <div className="text-xs text-blue-600 font-bold">
                    Target: 24h
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats.satisfactionScore}/5</p>
                    <p className="text-sm text-gray-500">CSAT Score</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Customer Satisfaction</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <div key={star} className={`w-3 h-3 ${star <= Math.round(stats.satisfactionScore) ? 'text-yellow-400' : 'text-gray-300'}`}>
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
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CubeIcon className="h-6 w-6 text-emerald-600" />
              Manajemen Sistem
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managementItems.map((item, index) => (
                <div key={item.title} className="animate-fade-in" style={{ animationDelay: `${(index + 6) * 0.1}s` }}>
                  <Link href={item.link} className="block">
                    <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-2">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
                            <item.icon className="h-6 w-6" />
                          </div>
                          {item.badge && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                        
                        {typeof item.count !== 'undefined' && item.countLabel && (
                          <div className="mb-4">
                            {isLoading ? (
                              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              <>
                                <span className="text-2xl font-bold text-emerald-600">{item.count.toLocaleString()}</span>
                                <span className="ml-2 text-sm text-gray-500">{item.countLabel}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-500 flex items-center gap-2">
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentChartBarIcon className="h-5 w-5 text-emerald-600" />
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/products" className="flex flex-col items-center p-4 rounded-xl hover:bg-emerald-50 transition-colors group">
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-emerald-200 transition-colors">
                  <ArchiveBoxIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600 text-center">Kelola Produk</span>
              </Link>
              
              <Link href="/admin/productions" className="flex flex-col items-center p-4 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                  <CircleStackIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 text-center">Data Produksi</span>
              </Link>
              
              <Link href="/admin/users" className="flex flex-col items-center p-4 rounded-xl hover:bg-purple-50 transition-colors group">
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 text-center">Kelola User</span>
              </Link>
              
              {hasComplaintPermission('canViewComplaints') ? (
                <Link href="/admin/complaints" className="flex flex-col items-center p-4 rounded-xl hover:bg-red-50 transition-colors group">
                  <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 text-center">Komplain</span>
                </Link>
              ) : (
                <Link href="/admin/bags" className="flex flex-col items-center p-4 rounded-xl hover:bg-orange-50 transition-colors group">
                  <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-colors">
                    <QrCodeIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 text-center">QR & Bags</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}