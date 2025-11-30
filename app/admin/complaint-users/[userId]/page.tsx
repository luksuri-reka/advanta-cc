// app/admin/complaint-users/[userId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProfile, logout } from '../../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../../Navbar';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ExclamationTriangleIcon, // Ditambahkan untuk error
  ArrowPathIcon, // Ditambahkan untuk loading
  ShieldCheckIcon,
  WrenchIcon
} from '@heroicons/react/24/outline';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface ComplaintUserDetail {
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  max_assigned_complaints: number;
  current_assigned_count: number;
  total_resolved_complaints: number;
  avg_resolution_time: string | null;
  customer_satisfaction_avg: number | null;
  is_active: boolean;
  last_active_at: string | null;
  current_assignments: Array<{
    id: number;
    complaint_number: string;
    subject: string;
    priority: string;
    status: string;
  }>;
  actual_assigned_count: number;
}

export default function ComplaintUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [user, setUser] = useState<DisplayUser | null>(null);
  const [userDetail, setUserDetail] = useState<ComplaintUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDepartment = (dept: string) => {
    const departments: Record<string, string> = {
      admin: 'Admin',
      customer_service: 'Customer Service',
      quality_assurance: 'Quality Assurance',
      technical: 'Technical',
      management: 'Management',
      observasi: 'Observasi',
      investigasi_1: 'Investigasi 1',
      investigasi_2: 'Investigasi 2',
      lab_tasting: 'Lab Tasting',
      sales: 'Sales'
    };
    return departments[dept] || dept;
  };

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
    if (user && userId) {
      loadUserDetail();
    }
  }, [user, userId]);

  const permissionList = [
    { id: 'canViewComplaints', name: 'View Complaints' },
    { id: 'canEditComplaints', name: 'Edit Complaints' },
    { id: 'canAssignComplaints', name: 'Assign Complaints' },
    { id: 'canResolveComplaints', name: 'Resolve Complaints' },
    { id: 'canRespondToComplaints', name: 'Respond to Complaints' },
    { id: 'canUpdateComplaintStatus', name: 'Update Status' }, // TAMBAHKAN
    { id: 'canDeleteComplaints', name: 'Delete Complaints' }, // TAMBAHKAN
    { id: 'canManageComplaintSettings', name: 'Manage Settings' },
    { id: 'canViewComplaintAnalytics', name: 'View Analytics' },
    { id: 'canExportComplaintData', name: 'Export Data' }, // TAMBAHKAN
  ];

  const loadUserDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/complaint-users/${userId}`);
      const result = await response.json();
      if (response.ok) {
        setUserDetail(result.data);
      } else {
        setError(result.message || 'Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return '-';
    // Contoh: "0 0 02:30:00" -> "2h 30m"
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return `${hours}h ${minutes}m`;
    }
    return interval; // Fallback
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/complaint-users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Manajemen User
          </Link>

          {loading ? (
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4"></div>
          ) : userDetail ? (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <UserCircleIcon className="h-8 w-8 text-emerald-600" />
              {userDetail.full_name}
            </h1>
          ) : (
             <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">User Not Found</h1>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
            Memuat detail user...
          </div>
        ) : error ? (
           <div className="text-center py-20 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-4" />
            {error}
          </div>
        ) : !userDetail ? (
           <div className="text-center py-20 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-4" />
            User tidak ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details & Assignments */}
            <div className="lg:col-span-2 space-y-8">
              {/* User Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCircleIcon className="h-6 w-6 text-emerald-600" />
                    Detail User
                  </h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{userDetail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Jabatan</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{userDetail.job_title || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Departemen</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDepartment(userDetail.department) || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1 text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userDetail.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {userDetail.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Beban Kerja Saat Ini</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {userDetail.actual_assigned_count} / {userDetail.max_assigned_complaints}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Terakhir Aktif</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(userDetail.last_active_at)}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Current Assignments */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <WrenchIcon className="h-6 w-6 text-emerald-600" />
                    Penugasan Saat Ini ({userDetail.actual_assigned_count})
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ID Keluhan</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Subjek</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Prioritas</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {userDetail.current_assignments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 px-6 text-gray-500 dark:text-gray-400">
                            Tidak ada keluhan yang sedang ditangani.
                          </td>
                        </tr>
                      ) : (
                        userDetail.current_assignments.map(complaint => (
                          <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link href={`/admin/complaints/${complaint.id}`} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200">
                                {complaint.complaint_number}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {complaint.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                               <span className={`font-semibold ${
                                 complaint.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                                 complaint.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                 complaint.priority === 'medium' ? 'text-blue-600 dark:text-blue-400' :
                                 'text-gray-600 dark:text-gray-400'
                               }`}>
                                {complaint.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(complaint.status)}`}>
                                {complaint.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Performance */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  Performance Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/50 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">Resolved</span>
                    <span className="text-lg font-bold text-green-800 dark:text-green-200">
                      {userDetail.total_resolved_complaints}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/50 rounded-xl border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Avg Time</span>
                    <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {formatInterval(userDetail.avg_resolution_time)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/50 rounded-xl border border-purple-200 dark:border-purple-800">
                    <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">CSAT Score</span>
                    <span className="text-lg font-bold text-purple-800 dark:text-purple-200 flex items-center gap-1">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                      <span>
                        {userDetail.customer_satisfaction_avg 
                          ? `${userDetail.customer_satisfaction_avg.toFixed(1)}/5` 
                          : 'N/A'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}