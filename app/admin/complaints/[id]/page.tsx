// app/admin/complaints/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProfile, logout } from '../../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../../Navbar';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon,
  UserPlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  complaint_type: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  related_product_serial?: string;
  related_product_name?: string;
  customer_satisfaction_rating?: number;
  customer_feedback?: string;
  assigned_to?: string;
  assigned_at?: string;
  department?: string;
  complaint_responses: Array<{
    id: number;
    message: string;
    admin_name: string;
    created_at: string;
    is_internal: boolean;
  }>;
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface ComplaintProfile {
  user_id: string;
  full_name: string;
  department: string;
  is_active: boolean;
  current_assigned_count: number;
  max_assigned_complaints: number;
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params?.id as string;
  
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Assignment states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<ComplaintProfile[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

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
    if (mounted && complaintId && user) {
      loadComplaintDetail();
      markAsRead(parseInt(complaintId));
    }
  }, [mounted, complaintId, user]);

  const markAsRead = (id: number) => {
    try {
      const stored = localStorage.getItem('read_complaint_ids');
      const readIds = stored ? new Set(JSON.parse(stored)) : new Set();
      readIds.add(id);
      localStorage.setItem('read_complaint_ids', JSON.stringify([...readIds]));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadComplaintDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/complaints/${complaintId}`);
      const result = await response.json();

      if (response.ok) {
        setComplaint(result.data);
        setNewStatus(result.data.status);
      } else {
        console.error('Failed to load complaint:', result.error);
      }
    } catch (error) {
      console.error('Error loading complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProfiles = async () => {
    try {
      const response = await fetch('/api/complaint-profiles');
      const result = await response.json();
      
      if (response.ok && result.data) {
        // Filter hanya user yang aktif
        const activeProfiles = result.data.filter((p: ComplaintProfile) => p.is_active);
        setAvailableProfiles(activeProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleOpenAssignmentModal = () => {
    loadAvailableProfiles();
    setShowAssignmentModal(true);
    setSelectedAssignee('');
    setAssignmentReason('');
  };

  const handleAssignComplaint = async () => {
    if (!selectedAssignee) {
      alert('Pilih user untuk ditugaskan');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedAssignee,
          assignment_reason: assignmentReason || 'Manual assignment'
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Komplain berhasil ditugaskan!');
        setShowAssignmentModal(false);
        await loadComplaintDetail();
      } else {
        alert(result.error || 'Gagal menugaskan komplain');
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Terjadi kesalahan saat menugaskan komplain');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === complaint?.status) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadComplaintDetail();
        alert('Status berhasil diperbarui');
      } else {
        alert('Gagal memperbarui status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMessage.trim()) return;

    setIsSubmittingResponse(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: responseMessage,
          admin_name: user?.name || 'Admin',
          is_internal: false
        })
      });

      if (response.ok) {
        setResponseMessage('');
        await loadComplaintDetail();
        alert('Respon berhasil dikirim');
      } else {
        alert('Gagal mengirim respon');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      submitted: { label: 'Dikirim', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      acknowledged: { label: 'Dikonfirmasi', color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
      investigating: { label: 'Diselidiki', color: 'bg-orange-100 text-orange-800', icon: ClockIcon },
      pending_response: { label: 'Menunggu Respons', color: 'bg-purple-100 text-purple-800', icon: ChatBubbleLeftRightIcon },
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

  const getDepartmentLabel = (dept?: string) => {
    const deptMap: Record<string, string> = {
      customer_service: 'Customer Service',
      quality_assurance: 'Quality Assurance',
      technical: 'Technical',
      management: 'Management'
    };
    return dept ? deptMap[dept] || dept : '-';
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail komplain...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canViewComplaints')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <Link href="/admin" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Komplain Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-4">Komplain yang Anda cari tidak tersedia.</p>
            <Link
              href="/admin/complaints"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Kembali ke Daftar Komplain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(complaint.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Daftar Komplain
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detail Komplain
              </h1>
              <p className="text-lg text-gray-600">
                {complaint.complaint_number}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </span>
              <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-bold ${getPriorityColor(complaint.priority)}`}>
                Prioritas: {complaint.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Complaint Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Komplain</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Subjek</h3>
                  <p className="text-base font-semibold text-gray-900">{complaint.subject}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Deskripsi</h3>
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Jenis Komplain</h3>
                  <p className="text-base text-gray-900">
                    {complaint.complaint_type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </p>
                </div>

                {complaint.related_product_serial && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-2">Produk Terkait</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-emerald-700">
                        <span className="font-semibold">Serial:</span> {complaint.related_product_serial}
                      </p>
                      {complaint.related_product_name && (
                        <p className="text-emerald-700">
                          <span className="font-semibold">Nama:</span> {complaint.related_product_name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Communication History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Komunikasi</h2>
              
              <div className="space-y-4 mb-6">
                {complaint.complaint_responses && complaint.complaint_responses.length > 0 ? (
                  complaint.complaint_responses
                    .filter(response => !response.is_internal)
                    .map((response) => (
                    <div key={response.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-blue-800 text-sm">
                            {response.admin_name}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600">
                          {new Date(response.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {response.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Belum ada komunikasi</p>
                  </div>
                )}
              </div>

              {/* Response Form */}
              {hasComplaintPermission('canRespondToComplaints') && (
                <form onSubmit={handleSubmitResponse} className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Kirim Respon</h3>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Tulis respon untuk pelanggan..."
                    required
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingResponse || !responseMessage.trim()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmittingResponse ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Kirim Respon
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Customer Feedback */}
            {complaint.customer_satisfaction_rating && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Feedback Pelanggan</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Rating Kepuasan</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={`text-2xl ${star <= complaint.customer_satisfaction_rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {complaint.customer_satisfaction_rating}/5
                      </span>
                    </div>
                  </div>
                  
                  {complaint.customer_feedback && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Komentar</h3>
                      <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">
                        {complaint.customer_feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Assignment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
                Penugasan
              </h2>
              
              {complaint.assigned_to ? (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 mb-2">Ditugaskan Kepada</p>
                    <p className="text-sm font-bold text-purple-900">{complaint.assigned_to}</p>
                    {complaint.department && (
                      <p className="text-xs text-purple-700 mt-1">
                        {getDepartmentLabel(complaint.department)}
                      </p>
                    )}
                    {complaint.assigned_at && (
                      <p className="text-xs text-purple-600 mt-2">
                        {new Date(complaint.assigned_at).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                  
                  {hasComplaintPermission('canAssignComplaints') && (
                    <button
                      onClick={handleOpenAssignmentModal}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-xl hover:bg-purple-200 transition-colors"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Tugaskan Ulang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <UserPlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Belum ditugaskan</p>
                  </div>
                  
                  {hasComplaintPermission('canAssignComplaints') && (
                    <button
                      onClick={handleOpenAssignmentModal}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                      Tugaskan Komplain
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                Informasi Pelanggan
              </h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-1">Nama</h3>
                  <p className="text-sm font-semibold text-gray-900">{complaint.customer_name}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-1">Email</h3>
                  <p className="text-sm text-gray-900 break-words">{complaint.customer_email}</p>
                </div>
                
                {complaint.customer_phone && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-1">Telepon</h3>
                    <p className="text-sm text-gray-900">{complaint.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                Timeline
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <ClockIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500">Dibuat</p>
                    <p className="text-sm text-gray-900">
                      {new Date(complaint.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                    <ClockIcon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500">Terakhir Diupdate</p>
                    <p className="text-sm text-gray-900">
                      {new Date(complaint.updated_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                {complaint.resolved_at && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500">Diselesaikan</p>
                      <p className="text-sm text-gray-900">
                        {new Date(complaint.resolved_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update */}
            {hasComplaintPermission('canUpdateComplaintStatus') && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Update Status</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status Baru
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="submitted">Dikirim</option>
                      <option value="acknowledged">Dikonfirmasi</option>
                      <option value="investigating">Diselidiki</option>
                      <option value="pending_response">Menunggu Respons</option>
                      <option value="resolved">Selesai</option>
                      <option value="closed">Ditutup</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || newStatus === complaint.status}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memperbarui...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <UserPlusIcon className="h-7 w-7 text-purple-600" />
                  Tugaskan Komplain
                </h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Komplain: {complaint.complaint_number}
                    </p>
                    <p className="text-xs text-blue-700">
                      {complaint.subject}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pilih Admin / User *
                </label>
                
                {availableProfiles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Tidak ada user yang tersedia</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Semua user mungkin sudah mencapai beban kerja maksimal
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableProfiles.map((profile) => {
                      const loadPercentage = (profile.current_assigned_count / profile.max_assigned_complaints) * 100;
                      const isNearLimit = loadPercentage >= 80;
                      const isAtLimit = profile.current_assigned_count >= profile.max_assigned_complaints;
                      
                      return (
                        <label
                          key={profile.user_id}
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedAssignee === profile.user_id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          } ${isAtLimit ? 'opacity-60' : ''}`}
                        >
                          <input
                            type="radio"
                            name="assignee"
                            value={profile.user_id}
                            checked={selectedAssignee === profile.user_id}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="w-4 h-4 text-purple-600"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-gray-900">{profile.full_name}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                isAtLimit 
                                  ? 'bg-red-100 text-red-800' 
                                  : isNearLimit 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {profile.current_assigned_count}/{profile.max_assigned_complaints}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {getDepartmentLabel(profile.department)}
                              </span>
                              {isAtLimit && (
                                <span className="text-red-600 font-semibold">
                                  ⚠️ Beban Penuh
                                </span>
                              )}
                            </div>
                            
                            {/* Load Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isAtLimit 
                                    ? 'bg-red-500' 
                                    : isNearLimit 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan Penugasan (Opsional)
                </label>
                <textarea
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  placeholder="Contoh: Memiliki expertise di bidang ini, beban kerja paling rendah, dll..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-6 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAssignComplaint}
                disabled={isAssigning || !selectedAssignee}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAssigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menugaskan...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Tugaskan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}