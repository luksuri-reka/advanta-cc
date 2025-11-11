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
  ArrowLeftIcon,
  XMarkIcon // Pastikan XMarkIcon di-import
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

// Data untuk auth users
interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

// Data yang dikirim ke form
interface FormData {
  user_id: string;
  department: string;
  job_title: string;
  max_assigned_complaints: number;
  is_active: boolean;
  complaint_permissions: Record<string, boolean>;
}

export default function ComplaintUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [users, setUsers] = useState<ComplaintUser[]>([]);
  const [availableAuthUsers, setAvailableAuthUsers] = useState<AuthUser[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ComplaintUser | null>(null);
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    department: '',
    job_title: '',
    max_assigned_complaints: 5,
    is_active: true,
    complaint_permissions: {}
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
      } catch (err) {
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      loadComplaintUsers();
      loadAvailableAuthUsers();
    }
  }, [user]);

  const hasPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadComplaintUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/complaint-users');
      const result = await response.json();
      if (response.ok) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading complaint users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAvailableAuthUsers = async () => {
    try {
      const response = await fetch('/api/admin/auth-users');
      const result = await response.json();
      if (response.ok) {
        setAvailableAuthUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading auth users:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const openModal = (user: ComplaintUser | null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        user_id: user.user_id,
        department: user.department,
        job_title: user.job_title,
        max_assigned_complaints: user.max_assigned_complaints,
        is_active: user.is_active,
        complaint_permissions: user.complaint_permissions || {}
      });
    } else {
      setEditingUser(null);
      setFormData({
        user_id: '',
        department: '',
        job_title: '',
        max_assigned_complaints: 5,
        is_active: true,
        complaint_permissions: {}
      });
    }
    setShowModal(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        complaint_permissions: {
          ...prev.complaint_permissions,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value
      }));
    }
  };
  
  const handleToggleChange = (name: string, checked: boolean) => {
     setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const selectedAuthUser = availableAuthUsers.find(u => u.id === formData.user_id);
    const apiData = {
      ...formData,
      full_name: editingUser?.full_name || selectedAuthUser?.full_name,
      email: editingUser?.email || selectedAuthUser?.email
    };

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser 
        ? `/api/admin/complaint-users/${editingUser.user_id}`
        : '/api/admin/complaint-users';
        
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        alert(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowModal(false);
        loadComplaintUsers();
        loadAvailableAuthUsers(); // Refresh list if a user was just added
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return '-';
    // ... (logika formatInterval)
    return interval; // Placeholder
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID');
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

  const permissionList = [
    { id: 'canViewComplaints', name: 'View Complaints' },
    { id: 'canEditComplaints', name: 'Edit Complaints' },
    { id: 'canAssignComplaints', name: 'Assign Complaints' },
    { id: 'canResolveComplaints', name: 'Resolve Complaints' },
    { id: 'canRespondToComplaints', name: 'Respond to Complaints' },
    { id: 'canManageComplaintSettings', name: 'Manage Settings' },
    { id: 'canViewComplaintAnalytics', name: 'View Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-emerald-600" />
              Manajemen User Keluhan
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Kelola admin yang dapat mengakses dan mengelola keluhan.
            </p>
          </div>
          {hasPermission('canManageComplaintSettings') && (
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => openModal(null)}
                className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Tambah User
              </button>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Departemen</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Beban</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Izin</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500 dark:text-gray-400">Memuat data...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 px-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Belum ada data</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Mulai dengan menambahkan data user baru.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((member) => (
                    <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.full_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {member.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           member.is_active 
                           ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                           : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                         }`}>
                          {member.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                        {member.current_assigned_count} / {member.max_assigned_complaints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                        {member.total_resolved_complaints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          {Object.values(member.complaint_permissions).filter(Boolean).length} Izin
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/complaint-users/${member.user_id}`} className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 inline-flex items-center gap-1">
                          <ChartBarIcon className="h-4 w-4" /> Detail
                        </Link>
                        {hasPermission('canManageComplaintSettings') && (
                           <button onClick={() => openModal(member)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400 ml-4 inline-flex items-center gap-1">
                            <PencilIcon className="h-4 w-4" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                    {editingUser ? 'Edit User' : 'Tambah User'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="px-6 py-6 bg-white dark:bg-gray-800 space-y-6">
                  {/* User Selection */}
                  <div>
                    <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pilih User dari Akun Terdaftar
                    </label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleFormChange}
                      disabled={!!editingUser || availableAuthUsers.length === 0}
                      className="mt-1 block w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      required
                    >
                      <option value="" disabled>
                        {availableAuthUsers.length === 0 ? 'Tidak ada user tersedia' : 'Pilih user...'}
                      </option>
                      {availableAuthUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                      {editingUser && (
                        <option value={editingUser.user_id} disabled>
                          {editingUser.full_name} ({editingUser.email})
                        </option>
                      )}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Departemen</label>
                      <input
                        type="text"
                        name="department"
                        id="department"
                        value={formData.department}
                        onChange={handleFormChange}
                        className="mt-1 block w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="cth: Customer Service"
                      />
                    </div>
                    <div>
                      <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jabatan</label>
                      <input
                        type="text"
                        name="job_title"
                        id="job_title"
                        value={formData.job_title}
                        onChange={handleFormChange}
                        className="mt-1 block w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="cth: Staff Support"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="max_assigned_complaints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Batas Beban Keluhan
                    </label>
                    <input
                      type="number"
                      name="max_assigned_complaints"
                      id="max_assigned_complaints"
                      value={formData.max_assigned_complaints}
                      onChange={handleFormChange}
                      min="1"
                      className="mt-1 block w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>

                  {/* Permissions Section */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Izin Keluhan</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Atur izin spesifik untuk user ini terkait manajemen keluhan.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {permissionList.map(permission => (
                        <label key={permission.id} className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={permission.id}
                            checked={!!formData.complaint_permissions[permission.id]}
                            onChange={handleFormChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="font-medium text-gray-900 dark:text-white">Status User</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleToggleChange('is_active', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold rounded-xl ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!editingUser && (!formData.user_id || availableAuthUsers.length === 0)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Simpan User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}