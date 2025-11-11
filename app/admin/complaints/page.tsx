// app/admin/complaints/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  InboxIcon,
  WrenchIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  customer_province?: string;
  customer_city?: string;
  complaint_type: string;
  subject: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/complaints/mark-as-read', { method: 'POST' });
      } catch (error) {
        console.error('Failed to mark complaints as read:', error);
      }
    })();
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
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      loadComplaints();
    }
    setMounted(true);
  }, [user]);

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.data || []);
      } else {
        console.error('Failed to load complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'acknowledged':
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending_response':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: 'Dikirim',
      acknowledged: 'Dikonfirmasi',
      investigating: 'Diselidiki',
      pending_response: 'Menunggu Respons',
      resolved: 'Selesai',
      closed: 'Ditutup'
    };
    return labels[status] || status;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canViewComplaints')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 dark:text-gray-400">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        </div>
      </div>
    );
  }

  const filteredComplaints = complaints.filter(c => {
    return (
      (filters.status === '' || c.status === filters.status) &&
      (filters.search === '' ||
        c.complaint_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.customer_email.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        (c.customer_province && c.customer_province.toLowerCase().includes(filters.search.toLowerCase())) ||
        (c.customer_city && c.customer_city.toLowerCase().includes(filters.search.toLowerCase()))
      )
    );
  });
  
  const stats = [
    { label: 'Total Keluhan', value: complaints.length, color: 'blue', icon: InboxIcon },
    { label: 'Sedang Diproses', value: complaints.filter(c => ['submitted', 'acknowledged', 'investigating'].includes(c.status)).length, color: 'yellow', icon: WrenchIcon },
    { label: 'Selesai', value: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length, color: 'green', icon: CheckCircleIcon },
    { label: 'Menunggu Respons', value: complaints.filter(c => c.status === 'pending_response').length, color: 'purple', icon: ExclamationTriangleIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <ArchiveBoxIcon className="h-8 w-8 text-emerald-600" />
            Daftar Keluhan
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Lihat dan kelola semua keluhan yang masuk.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                  stat.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  stat.color === 'green' ? 'bg-green-100 dark:bg-green-900' : 'bg-purple-100 dark:bg-purple-900'
                }`}>
                  <stat.icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                    stat.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filter bar */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Cari (ID, Nama, Email, Subjek, Lokasi)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {/* Status Filter */}
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Dikirim</option>
                <option value="acknowledged">Dikonfirmasi</option>
                <option value="investigating">Diselidiki</option>
                <option value="pending_response">Menunggu Respons</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ID Keluhan</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Subjek</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tgl Masuk</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 px-6 text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        <span>Memuat data keluhan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {complaint.complaint_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {complaint.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4 text-blue-500" />
                          <span>
                            {complaint.customer_city || 'N/A'}, {complaint.customer_province || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {complaint.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(complaint.created_at)}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/complaints/${complaint.id}`} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400 inline-flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" /> Lihat
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-16 px-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tidak ada keluhan</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tidak ada data keluhan yang cocok dengan filter Anda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}