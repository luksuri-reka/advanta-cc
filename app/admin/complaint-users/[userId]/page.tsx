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
  StarIcon
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
        await loadUserDetail();
      } catch (err) {
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/complaint-users/${userId}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        setUserDetail(result.data);
      }
    } catch (error) {
      console.error('Error loading user detail:', error);
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
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return `${hours}h ${minutes}m`;
    }
    return interval;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-gray-600">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/complaint-users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to User List
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {userDetail.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userDetail.full_name}
                </h1>
                <p className="text-gray-600">{userDetail.email}</p>
                {userDetail.job_title && (
                  <p className="text-sm text-gray-500">{userDetail.job_title}</p>
                )}
              </div>
            </div>

            <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
              userDetail.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userDetail.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Current Workload</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {userDetail.current_assigned_count} / {userDetail.max_assigned_complaints}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full ${
                  userDetail.current_assigned_count >= userDetail.max_assigned_complaints
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
                style={{
                  width: `${Math.min((userDetail.current_assigned_count / userDetail.max_assigned_complaints) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Resolved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {userDetail.total_resolved_complaints}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatInterval(userDetail.avg_resolution_time)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <StarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Customer Satisfaction</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {userDetail.customer_satisfaction_avg 
                ? `${userDetail.customer_satisfaction_avg.toFixed(1)}/5` 
                : 'N/A'}
            </p>
            {userDetail.customer_satisfaction_avg && (
              <div className="flex mt-2">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={`text-lg ${
                    star <= Math.round(userDetail.customer_satisfaction_avg!)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}>
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-emerald-600" />
            Current Assignments ({userDetail.actual_assigned_count})
          </h2>

          {userDetail.current_assignments && userDetail.current_assignments.length > 0 ? (
            <div className="space-y-3">
              {userDetail.current_assignments.map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/admin/complaints/${complaint.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-gray-900">
                          {complaint.complaint_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{complaint.subject}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-4">
                      {complaint.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active assignments</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCircleIcon className="h-6 w-6 text-blue-600" />
              User Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Department</p>
                <p className="text-base text-gray-900 mt-1">{userDetail.department}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Max Workload</p>
                <p className="text-base text-gray-900 mt-1">
                  {userDetail.max_assigned_complaints} complaints
                </p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Last Active</p>
                <p className="text-base text-gray-900 mt-1">
                  {userDetail.last_active_at 
                    ? new Date(userDetail.last_active_at).toLocaleString('id-ID')
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
              Performance Summary
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-sm font-semibold text-green-800">Resolved</span>
                <span className="text-lg font-bold text-green-800">
                  {userDetail.total_resolved_complaints}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm font-semibold text-blue-800">Avg Time</span>
                <span className="text-lg font-bold text-blue-800">
                  {formatInterval(userDetail.avg_resolution_time)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm font-semibold text-purple-800">CSAT Score</span>
                <span className="text-lg font-bold text-purple-800">
                  {userDetail.customer_satisfaction_avg 
                    ? `${userDetail.customer_satisfaction_avg.toFixed(1)}/5` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}