// app/admin/complaint-users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface ComplaintUser {
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  complaint_permissions: Record<string, boolean>;
  max_assigned_complaints: number;
  current_assigned_count: number;
  total_resolved_complaints: number;
  avg_resolution_time: string | null;
  customer_satisfaction_avg: number | null;
  is_active: boolean;
  last_active_at: string | null;
}

export default function ComplaintUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [users, setUsers] = useState<ComplaintUser[]>([]);
  const [availableAuthUsers, setAvailableAuthUsers] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ComplaintUser | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    department: 'customer_service',
    job_title: '',
    max_assigned_complaints: 10,
    is_active: true,
    complaint_permissions: {
      canViewComplaints: false,
      canAssignComplaints: false,
      canRespondToComplaints: false,
      canUpdateComplaintStatus: false,
      canViewComplaintAnalytics: false,
      canConfigureComplaintSystem: false,
      canManageComplaintUsers: false,
      canExportComplaintData: false
    }
  });

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
        await loadUsers();
      } catch (err) {
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/complaint-users');
      const result = await response.json();
      
      if (response.ok && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAuthUsers = async () => {
    try {
      setLoadingAuthUsers(true);
      const response = await fetch('/api/admin/auth-users');
      const result = await response.json();
      
      if (response.ok && result.data) {
        setAvailableAuthUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading auth users:', error);
    } finally {
      setLoadingAuthUsers(false);
    }
  };

  const handleOpenModal = (user: ComplaintUser | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        user_id: user.user_id,
        full_name: user.full_name,
        department: user.department,
        job_title: user.job_title || '',
        max_assigned_complaints: user.max_assigned_complaints,
        is_active: user.is_active,
        complaint_permissions: {
          canViewComplaints: user.complaint_permissions?.canViewComplaints || false,
          canAssignComplaints: user.complaint_permissions?.canAssignComplaints || false,
          canRespondToComplaints: user.complaint_permissions?.canRespondToComplaints || false,
          canUpdateComplaintStatus: user.complaint_permissions?.canUpdateComplaintStatus || false,
          canViewComplaintAnalytics: user.complaint_permissions?.canViewComplaintAnalytics || false,
          canConfigureComplaintSystem: user.complaint_permissions?.canConfigureComplaintSystem || false,
          canManageComplaintUsers: user.complaint_permissions?.canManageComplaintUsers || false,
          canExportComplaintData: user.complaint_permissions?.canExportComplaintData || false,
        }
      });
    } else {
      setEditingUser(null);
      setFormData({
        user_id: '',
        full_name: '',
        department: 'customer_service',
        job_title: '',
        max_assigned_complaints: 10,
        is_active: true,
        complaint_permissions: {
          canViewComplaints: false,
          canAssignComplaints: false,
          canRespondToComplaints: false,
          canUpdateComplaintStatus: false,
          canViewComplaintAnalytics: false,
          canConfigureComplaintSystem: false,
          canManageComplaintUsers: false,
          canExportComplaintData: false
        }
      });
      // Load available users when opening modal for new user
      loadAvailableAuthUsers();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/complaint-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'User saved successfully');
        setShowModal(false);
        await loadUsers();
      } else {
        alert(result.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('An error occurred');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/complaint-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        await loadUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('An error occurred');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const getDepartmentLabel = (dept: string) => {
    const labels: Record<string, string> = {
      customer_service: 'Customer Service',
      quality_assurance: 'Quality Assurance',
      technical: 'Technical',
      management: 'Management',
      admin: 'Admin'
    };
    return labels[dept] || dept;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canManageComplaintUsers')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage complaint users.</p>
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
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-emerald-600" />
                Complaint Team Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage users who handle customer complaints
              </p>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Assigned</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {users.reduce((sum, u) => sum + u.current_assigned_count, 0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Resolved</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {users.reduce((sum, u) => sum + u.total_resolved_complaints, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Workload
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((complaintUser) => (
                  <tr key={complaintUser.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {complaintUser.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{complaintUser.email}</div>
                        {complaintUser.job_title && (
                          <div className="text-xs text-gray-400">{complaintUser.job_title}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                        {getDepartmentLabel(complaintUser.department)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-700">
                              {complaintUser.current_assigned_count} / {complaintUser.max_assigned_complaints}
                            </span>
                            <span className="text-gray-500">
                              {Math.round((complaintUser.current_assigned_count / complaintUser.max_assigned_complaints) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                complaintUser.current_assigned_count >= complaintUser.max_assigned_complaints
                                  ? 'bg-red-500'
                                  : complaintUser.current_assigned_count / complaintUser.max_assigned_complaints > 0.7
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min((complaintUser.current_assigned_count / complaintUser.max_assigned_complaints) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">Resolved:</span>
                          <span className="font-semibold text-gray-900">
                            {complaintUser.total_resolved_complaints}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">Avg Time:</span>
                          <span className="font-semibold text-gray-900">
                            {formatInterval(complaintUser.avg_resolution_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">CSAT:</span>
                          <span className="font-semibold text-gray-900">
                            {complaintUser.customer_satisfaction_avg 
                              ? `${complaintUser.customer_satisfaction_avg.toFixed(1)}/5` 
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(complaintUser.user_id, complaintUser.is_active)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          complaintUser.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {complaintUser.is_active ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(complaintUser)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No complaint users found</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-emerald-600 hover:text-emerald-500 font-semibold"
              >
                Add your first user
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* User Selection Dropdown (only for new users) */}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select User *
                  </label>
                  {loadingAuthUsers ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Loading users...</span>
                    </div>
                  ) : availableAuthUsers.length > 0 ? (
                    <>
                      <select
                        value={formData.user_id}
                        onChange={(e) => {
                          const selectedUser = availableAuthUsers.find(u => u.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            user_id: e.target.value,
                            full_name: selectedUser?.name || ''
                          });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">-- Select a user --</option>
                        {availableAuthUsers.map(authUser => (
                          <option key={authUser.id} value={authUser.id}>
                            {authUser.name} ({authUser.email})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {availableAuthUsers.length} user(s) available (users without complaint profile)
                      </p>
                    </>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-yellow-50 text-sm text-yellow-800">
                      No available users found. All users already have complaint profiles.
                    </div>
                  )}
                </div>
              )}

              {/* Show User ID as read-only when editing */}
              {editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={formData.user_id}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Auto-filled from selected user"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can edit the auto-filled name if needed
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="customer_service">Customer Service</option>
                  <option value="quality_assurance">Quality Assurance</option>
                  <option value="technical">Technical</option>
                  <option value="management">Management</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Senior Customer Care Representative"
                />
              </div>

              {/* Max Assigned Complaints */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Assigned Complaints
                </label>
                <input
                  type="number"
                  value={formData.max_assigned_complaints}
                  onChange={(e) => setFormData({ ...formData, max_assigned_complaints: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  min="1"
                  max="100"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                  Permissions
                </label>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                  {Object.entries(formData.complaint_permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          complaint_permissions: {
                            ...formData.complaint_permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/can/g, '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Active Status</p>
                  <p className="text-sm text-gray-600">Enable or disable this user</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingUser && (!formData.user_id || availableAuthUsers.length === 0)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}