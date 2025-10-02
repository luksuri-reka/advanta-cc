// app/admin/complaints/page.tsx - With auto mark as read
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import {
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  complaint_type: string;
  priority: string;
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
    priority: '',
    search: ''
  });

  // Mark complaints as read when page loads
  useEffect(() => {
    if (complaints.length > 0) {
      markComplaintsAsRead(complaints.map(c => c.id));
    }
  }, [complaints]);

  const markComplaintsAsRead = (complaintIds: number[]) => {
    try {
      const stored = localStorage.getItem('read_complaint_ids');
      const readIds = stored ? new Set(JSON.parse(stored)) : new Set();
      
      complaintIds.forEach(id => readIds.add(id));
      
      localStorage.setItem('read_complaint_ids', JSON.stringify([...readIds]));
    } catch (error) {
      console.error('Error marking complaints as read:', error);
    }
  };

  // Check user permissions
  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      
      const searchParams = new URLSearchParams();
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.priority) searchParams.set('priority', filters.priority);
      searchParams.set('limit', '50');

      const response = await fetch(`/api/complaints?${searchParams.toString()}`);
      const result = await response.json();

      if (response.ok) {
        let data = result.data || [];
        
        // Client-side search filter
        if (filters.search) {
          data = data.filter((complaint: Complaint) =>
            complaint.complaint_number.toLowerCase().includes(filters.search.toLowerCase()) ||
            complaint.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            complaint.subject.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setComplaints(data);
      } else {
        console.error('Failed to load complaints:', result.error);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
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
    if (mounted && user) {
      if (!hasComplaintPermission('canViewComplaints')) {
        router.push('/admin');
        return;
      }
      
      loadComplaints();
    }
  }, [mounted, user, filters]);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      submitted: { label: 'Dikirim', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      acknowledged: { label: 'Dikonfirmasi', color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
      investigating: { label: 'Diselidiki', color: 'bg-orange-100 text-orange-800', icon: ArrowPathIcon },
      pending_response: { label: 'Pending', color: 'bg-purple-100 text-purple-800', icon: ClockIcon },
      resolved: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      closed: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800', icon: CheckCircleIcon }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.submitted;
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return priorityMap[priority as keyof typeof priorityMap] || 'bg-gray-100 text-gray-800';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canViewComplaints')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses halaman komplain.</p>
          <Link href="/admin" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
            Kembali ke Dashboard
          </Link>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                Manajemen Komplain
              </h1>
              <p className="mt-2 text-gray-600">
                Kelola dan tindaklanjuti komplain dari pelanggan
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Total: {complaints.length} komplain
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Filter & Pencarian</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Dikirim</option>
                <option value="acknowledged">Dikonfirmasi</option>
                <option value="investigating">Diselidiki</option>
                <option value="pending_response">Pending</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Semua Prioritas</option>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Cari nomor komplain, nama pelanggan, atau subjek..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data komplain...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada komplain</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f !== '') 
                  ? 'Tidak ada komplain yang sesuai dengan filter.'
                  : 'Belum ada komplain yang masuk.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Komplain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioritas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => {
                    const statusInfo = getStatusInfo(complaint.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {complaint.complaint_number}
                            </div>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {complaint.subject}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {complaint.complaint_type.replace('_', ' ')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {complaint.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {complaint.customer_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{new Date(complaint.created_at).toLocaleDateString('id-ID')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(complaint.created_at).toLocaleTimeString('id-ID')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/complaints/${complaint.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-emerald-600 hover:text-emerald-500 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {complaints.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total', value: complaints.length, color: 'blue' },
              { label: 'Pending', value: complaints.filter(c => ['submitted', 'acknowledged', 'investigating'].includes(c.status)).length, color: 'yellow' },
              { label: 'Selesai', value: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length, color: 'green' },
              { label: 'Kritis', value: complaints.filter(c => c.priority === 'critical').length, color: 'red' }
            ].map((stat, index) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'yellow' ? 'bg-yellow-100' :
                    stat.color === 'green' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <ExclamationTriangleIcon className={`h-6 w-6 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'yellow' ? 'text-yellow-600' :
                      stat.color === 'green' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}