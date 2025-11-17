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
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon,
  UserPlusIcon,
  UserGroupIcon,
  LinkIcon,
  ShieldCheckIcon,
  StarIcon,
  MapPinIcon,
  PaperClipIcon,
  BoltIcon,
  PencilSquareIcon,
  UserIcon,
  InformationCircleIcon,
  PencilIcon, // --- ICON BARU UNTUK UBAH STATUS ---
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';

// --- INTERFACE PENGGUNA TERKAIT ---
interface RelatedUser {
  id: string;
  name: string;
  department?: string;
}

// --- INTERFACE COMPLAINT ---
interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_province?: string;
  customer_city?: string;
  customer_address?: string;
  complaint_type: string;
  subject: string;
  description: string;

  complaint_category_name?: string;
  complaint_subcategory_name?: string;
  // UBAH DARI SINGLE KE ARRAY
  complaint_case_type_ids?: string[];
  complaint_case_type_names?: string[];
  
  related_product_serial?: string;
  related_product_name?: string;

  attachments?: string[]; 
  verification_data?: Record<string, any>;
  status: string;
  
  assigned_to?: string; 
  assigned_at?: string;
  assigned_by?: string; 
  
  department?: string; 
  
  first_response_at?: string;
  first_response_sla?: string;
  resolution_sla?: string; 
  
  resolution?: string;
  resolution_summary?: string;
  resolved_at?: string;
  resolved_by?: string; 
  
  customer_satisfaction_rating?: number;
  customer_feedback?: string;
  customer_feedback_at?: string;
  feedback_submitted_at?: string;
  feedback_quick_answers?: string[];
  
  internal_notes?: string;
  
  escalated: boolean;
  escalated_at?: string;
  escalated_by?: string; 
  
  created_at: string;
  updated_at: string;
  created_by?: string; 

  assigned_to_user?: RelatedUser;
  assigned_by_user?: RelatedUser;
  resolved_by_user?: RelatedUser;
  escalated_by_user?: RelatedUser;
  created_by_user?: RelatedUser;

  complaint_responses: Array<{
    id: number;
    message: string;
    admin_name: string;
    created_at: string;
    is_internal: boolean;
  }>;
}

interface AdminUser {
  id: string;
  name: string;
  department: string;
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
  id?: string;
}

// --- TIPE DATA BARU UNTUK STATUS DAN DEPARTEMEN ---
// Sesuaikan dengan enum di database Anda
const complaintDepartments = [
  'customer_service',
  'observasi',
  'investigasi_1',
  'investigasi_2',
  'lab_tasting',
  'technical_support',
  'sales'
];

const complaintStatuses = [
  'submitted',
  'acknowledged',
  'investigating',
  'pending_response',
  'resolved',
  'closed'
];

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [user, setUser] = useState<DisplayUser | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [responseMessage, setResponseMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInternalResponse, setIsInternalResponse] = useState(false);
  
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveMessage, setResolveMessage] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  
  // --- STATE PENUGASAN ---
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(''); // STATE BARU
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // --- STATE ESKALASI ---
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');

  // --- STATE BARU: UBAH STATUS ---
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile: User | null = await getProfile();
        if (profile) {
          setUser({
            id: profile.id,
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
      loadComplaint();
      loadAdminUsers();
    }
  }, [user, id]);

  // --- EFEK BARU: Set default value saat modal dibuka ---
  useEffect(() => {
    if (complaint) {
      // Set default untuk modal penugasan
      setSelectedAssignee(complaint.assigned_to || '');
      setSelectedDepartment(complaint.department || 'customer_service');
      
      // Set default untuk modal status
      setSelectedStatus(complaint.status);
    }
  }, [complaint]);


  const hasPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadComplaint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/complaints/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch complaint details');
      }
      const data = await response.json();
      setComplaint(data.data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/complaint-users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handlePostResponse = async () => {
    if (!responseMessage.trim() || !user) return;
    
    setIsSending(true); // 👈 Menggunakan 'isSending'
    
    try {
      const response = await fetch(`/api/complaints/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: responseMessage,
          admin_id: user.id, // 👈 Menggunakan 'user.id'
          admin_name: user.name, // 👈 Menggunakan 'user.name'
          is_internal: isInternalResponse, // 👈 Menggunakan state 'isInternalResponse'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', errorData);
        throw new Error(errorData?.error || 'Failed to post response');
      }
      
      setResponseMessage('');
      setIsInternalResponse(false); // 👈 Reset toggle setelah kirim
      loadComplaint(); 
      toast.success('Balasan berhasil dikirim!'); // 👈 Menggunakan 'toast'

    } catch (error: any) {
      console.error('Error posting response:', error.message);
      toast.error(error.message || 'Gagal mengirim balasan'); // 👈 Menggunakan 'toast'
    } finally {
      setIsSending(false); // 👈 Menggunakan 'isSending'
    }
  };

  // --- FUNGSI DIPERBARUI: PENUGASAN ---
  const handleAssignComplaint = async () => {
    if (!selectedAssignee || !selectedDepartment) {
        alert('Harap pilih petugas dan departemen.');
        return;
    }
    
    setIsAssigning(true);
    try {
      // API ini perlu diperbarui untuk menerima 'department'
      const response = await fetch(`/api/complaints/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: selectedAssignee,
          department: selectedDepartment, // KIRIM DEPARTEMEN BARU
          notes: assignmentNotes,
          assigner_id: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign complaint');
      }
      
      setShowAssignmentModal(false);
      // Reset notes, tapi biarkan selectedAssignee & department
      // terisi default dari data complaint
      setAssignmentNotes('');
      loadComplaint();
    } catch (err) {
      console.error('Error assigning complaint:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleResolveComplaint = async () => {
    // ... (fungsi ini tetap sama)
    setIsResolving(true);
    try {
      const response = await fetch(`/api/complaints/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: resolveMessage,
          resolution_summary: resolveMessage.substring(0, 100) + '...',
          resolved_by: user?.id,
          customer_satisfaction_rating: satisfactionRating || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve complaint');
      }
      
      setShowResolveModal(false);
      setResolveMessage('');
      setSatisfactionRating(0);
      loadComplaint();
    } catch (err) {
      console.error('Error resolving complaint:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleEscalateComplaint = async () => {
    // ... (fungsi ini tetap sama)
    if (!escalationNotes.trim()) {
      alert('Harap isi alasan eskalasi.');
      return;
    }
    setIsEscalating(true);
    try {
      const response = await fetch(`/api/complaints/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalated_by: user?.id,
          notes: escalationNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to escalate complaint');
      }
      
      setShowEscalateModal(false);
      setEscalationNotes('');
      loadComplaint();
    } catch (err) {
      console.error('Error escalating complaint:', err);
    } finally {
      setIsEscalating(false);
    }
  };

  // --- HANDLER BARU: UBAH STATUS ---
  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === complaint?.status) {
      setShowStatusModal(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      // Anda perlu membuat API endpoint ini: /api/complaints/${id}/status
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          updated_by: user?.id, // Opsional, tapi bagus untuk logging
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      setShowStatusModal(false);
      loadComplaint(); // Muat ulang untuk melihat status baru
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
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

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      submitted: 'Komplain baru diterima, menunggu verifikasi tim',
      acknowledged: 'Komplain dikonfirmasi dan dialokasikan ke departemen terkait',
      investigating: 'Tim sedang menyelidiki dan menganalisis masalah',
      pending_response: 'Menunggu informasi tambahan dari customer',
      resolved: 'Masalah telah diselesaikan',
      closed: 'Kasus ditutup'
    };
    return descriptions[status] || 'Status tidak diketahui';
  };

  // Helper untuk format nama departemen
  const formatDepartment = (dept?: string) => {
    if (!dept) return '-';
    return dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // FUNGSI BARU: Untuk Tanggal di Header Bubble (Contoh: 16 Nov)
  const formatDateShort = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
    });
  };

  // FUNGSI BARU: Untuk Jam di Kanan Bawah (Contoh: 14:30)
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // (Opsional: Jika Anda masih butuh format lama, ganti namanya)
  const formatDateTimeFull = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    // ... (kode loading user tetap sama)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('canViewComplaints')) {
    // ... (kode akses ditolak tetap sama)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      <Toaster position="top-right" />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Daftar Keluhan
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                Detail Keluhan
              </h1>
              <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                {loading ? 'Memuat...' : (complaint ? `#${complaint.complaint_number}` : 'Tidak Ditemukan')}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
              <button
                onClick={loadComplaint}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && (
          // ... (kode loading tetap sama)
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat detail keluhan...</p>
          </div>
        )}

        {error && (
          // ... (kode error tetap sama)
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-bold">Terjadi Kesalahan</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {complaint && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                
                {/* Info Pelanggan (TERMASUK ALAMAT) */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Info Pelanggan</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{complaint.customer_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.customer_email || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.customer_phone || '-'}</dd>
                    </div>
                  </div>

                  {/* === PERMINTAAN ALAMAT ANDA === */}
                  {(complaint.customer_province || complaint.customer_city || complaint.customer_address) && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <dt className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Lokasi Pelanggan</dt>
                          <dd className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            {(complaint.customer_province || complaint.customer_city) && (
                              <p className="font-medium">
                                {complaint.customer_city}, {complaint.customer_province}
                              </p>
                            )}
                            {complaint.customer_address && (
                              <p className="text-blue-700 dark:text-blue-300">{complaint.customer_address}</p>
                            )}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================================== */}
                </div>

                {/* Detail Keluhan */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Detail Keluhan</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipe</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.complaint_type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Serial Produk</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.related_product_serial || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Produk</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.related_product_name || '-'}</dd>
                    </div>
                  </div>

                  {(complaint.complaint_category_name || complaint.complaint_subcategory_name || (complaint.complaint_case_type_names && complaint.complaint_case_type_names.length > 0)) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Kategorisasi Komplain
                    </h4>
                    
                    {/* Path: Kategori → Sub-Kategori */}
                    {complaint.complaint_category_name && (
                      <div className="mb-4">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Kategori Path:</dt>
                        <dd className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm font-bold shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {complaint.complaint_category_name}
                          </span>
                          {complaint.complaint_subcategory_name && (
                            <>
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-bold shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {complaint.complaint_subcategory_name}
                              </span>
                            </>
                          )}
                        </dd>
                      </div>
                    )}

                    {/* Multiple Case Types */}
                    {complaint.complaint_case_type_names && complaint.complaint_case_type_names.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <dt className="text-sm font-bold text-purple-900 dark:text-purple-300">
                            Jenis Masalah ({complaint.complaint_case_type_names.length}):
                          </dt>
                        </div>
                        <dd className="flex flex-wrap gap-2 ml-7">
                          {complaint.complaint_case_type_names.map((caseTypeName, index) => (
                            <span 
                              key={index}
                              className="group inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/60 dark:to-pink-900/60 text-purple-800 dark:text-purple-200 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-purple-200 dark:border-purple-700 hover:scale-105"
                            >
                              <svg className="w-4 h-4 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {caseTypeName}
                            </span>
                          ))}
                        </dd>
                        
                        {/* Info box untuk admin */}
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                          <div className="flex items-start gap-2 text-xs text-purple-700 dark:text-purple-300">
                            <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p className="italic">
                              Customer melaporkan {complaint.complaint_case_type_names.length} jenis masalah dalam komplain ini. 
                              Harap periksa dan tangani semua masalah yang dilaporkan.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                  <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subjek</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{complaint.subject}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {complaint.description}
                      </dd>
                    </div>

                    {/* ATTACHMENTS */}
                    {complaint.attachments && complaint.attachments.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Lampiran</dt>
                        <dd className="mt-2 space-y-2">
                          {complaint.attachments.map((url, index) => (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={index}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <PaperClipIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">
                                {url.split('/').pop()}
                              </span>
                              <LinkIcon className="h-4 w-4 text-gray-400 ml-auto" />
                            </a>
                          ))}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Riwayat Pesan (DENGAN BADGE YANG BERBEDA) */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Riwayat Komunikasi
                  </h3>

                  {complaint.complaint_responses && complaint.complaint_responses.length > 0 ? (
                    <div className="space-y-6">
                      {complaint.complaint_responses
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((response) => {
                          
                          // --- TAMPILAN 1: Catatan Internal (is_internal = TRUE) ---
                          if (response.is_internal) {
                            return (
                              <div key={response.id} className="relative py-4">
                                {/* Garis pemisah khusus internal */}
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                  <div className="w-full border-t-2 border-amber-400 dark:border-amber-600 border-dashed"></div>
                                </div>
                                {/* Konten Catatan Internal */}
                                <div className="relative flex justify-center">
                                  <div className="px-5 py-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 rounded-xl shadow-lg border-2 border-amber-300 dark:border-amber-700 max-w-2xl">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="flex-shrink-0 mt-0.5">
                                        {/* Icon Gembok untuk Internal */}
                                        <div className="p-2 bg-amber-500 dark:bg-amber-600 rounded-lg">
                                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          {/* Badge "PRIVATE - INTERNAL ONLY" */}
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold uppercase rounded-full shadow-md">
                                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            Private
                                          </span>
                                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-semibold rounded-md">
                                            <InformationCircleIcon className="h-3.5 w-3.5" />
                                            Internal Only
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                                          <span className="font-semibold">{response.admin_name || 'Admin'}</span>
                                          <span>•</span>
                                          <span>{formatDate(response.created_at)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Pesan */}
                                    <div className="pl-14">
                                      <p className="text-sm text-amber-950 dark:text-amber-50 whitespace-pre-wrap leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                                        {response.message}
                                      </p>
                                    </div>
                                    
                                    {/* Info Footer dengan Icon */}
                                    <div className="mt-3 pl-14 pt-3 border-t border-amber-300 dark:border-amber-700">
                                      <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                                        <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium italic">Catatan ini hanya terlihat oleh tim admin, tidak terlihat oleh customer</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // --- TAMPILAN 2: Balasan Pelanggan (admin_name = null, is_internal = FALSE) ---
                          if (!response.admin_name) {
                            return (
                              <div key={response.id} className="flex gap-3 w-full flex-row">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1
                                                bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
                                  <UserIcon className="h-5 w-5" />
                                </div>
                                <div className="max-w-xl rounded-2xl p-4
                                              bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 
                                              border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
                                  {/* Header: Badge Customer + Nama + Tanggal */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold uppercase rounded-full shadow-sm">
                                      <UserIcon className="h-3 w-3" />
                                      Customer
                                    </span>
                                    <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                      {complaint.customer_name}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
                                      {formatDateShort(response.created_at)}
                                    </span>
                                  </div>
                                  {/* Isi Pesan */}
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {response.message}
                                  </p>
                                  {/* Footer: Jam */}
                                  <div className="flex justify-end mt-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatTime(response.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-grow"></div>
                              </div>
                            );
                          }

                          // --- TAMPILAN 3: Balasan Admin PUBLIC (admin_name ada, is_internal = FALSE) ---
                          return (
                            <div key={response.id} className="flex gap-3 w-full flex-row-reverse">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1
                                              bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md">
                                <ShieldCheckIcon className="h-5 w-5" />
                              </div>
                              <div className="max-w-xl rounded-2xl p-4
                                            bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 
                                            border-2 border-blue-200 dark:border-blue-800 shadow-md">
                                {/* Header: Badge Public + Admin + Nama + Tanggal */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase rounded-full shadow-sm">
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    Admin
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded-md border border-green-300 dark:border-green-700">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Public
                                  </span>
                                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    {response.admin_name}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
                                    {formatDateShort(response.created_at)}
                                  </span>
                                </div>
                                {/* Isi Pesan */}
                                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                  {response.message}
                                </p>
                                {/* Footer: Jam + Terkirim ke Customer */}
                                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatTime(response.created_at)}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Terkirim</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-grow"></div>
                            </div>
                          );

                        })}
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300">Belum Ada Riwayat</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Balasan dari pelanggan atau admin akan muncul di sini.
                      </p>
                    </div>
                  )}
                </div>

                {/* Kirim Balasan (DIPERBARUI - LEBIH RAPI) */}
                {(complaint.status !== 'resolved' && complaint.status !== 'closed' && hasPermission('canRespondToComplaints')) && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Kirim Balasan
                    </h3>
                    
                    {/* Kotak Textarea yang sudah diperbaiki */}
                    <div className="relative">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={5}
                        className="
                          w-full text-sm rounded-xl 
                          border-gray-300 dark:border-gray-600 
                          dark:bg-gray-700 dark:text-white 
                          dark:placeholder-gray-400
                          focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                          shadow-sm
                          px-4 py-3 /* 👈 INI SOLUSINYA: Menambah padding internal */
                        "
                        placeholder="Tulis balasan Anda di sini..."
                      />
                      {/* Ikon di dalam textarea untuk membuatnya 'eye-catching' */}
                      <div className="absolute top-3 right-3 text-gray-400 dark:text-gray-500">
                        <PencilSquareIcon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Checkbox Catatan Internal (Dengan Jarak) */}
                    <div className="mt-4">
                      <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalResponse}
                          onChange={(e) => setIsInternalResponse(e.target.checked)}
                          className="
                            rounded border-gray-400 
                            dark:bg-gray-600 dark:border-gray-500 
                            text-purple-600 focus:ring-purple-500
                            w-5 h-5
                          "
                        />
                        <span className="font-medium">Tandai sebagai catatan internal (tidak terlihat oleh pelanggan)</span>
                      </label>
                      
                      {/* Info tambahan untuk checkbox internal */}
                      {isInternalResponse && (
                        <div className="mt-2 ml-8 text-xs text-yellow-700 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                          Catatan ini hanya akan terlihat oleh tim admin.
                        </div>
                      )}
                    </div>

                    {/* Tombol Kirim (Dengan Jarak) */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handlePostResponse}
                        disabled={isSending || !responseMessage.trim()}
                        // Perubahan kecil: tombol jadi biru agar beda dengan 'emerald' pelanggan
                        className="
                          flex items-center gap-2 px-5 py-2.5 
                          bg-blue-600 text-white 
                          font-semibold rounded-xl 
                          hover:bg-blue-500 
                          disabled:opacity-50 transition-colors
                          shadow-lg shadow-blue-500/30
                        "
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        {isSending ? 'Mengirim...' : 'Kirim Balasan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Status Card (DENGAN TOMBOL UBAH STATUS) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Status</h3>
                    {/* --- TOMBOL BARU: UBAH STATUS --- */}
                    {hasPermission('canUpdateComplaintStatus') && (complaint.status !== 'resolved' && complaint.status !== 'closed') && (
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <PencilIcon className="h-3 w-3" />
                        Ubah
                      </button>
                    )}
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full ${getStatusClass(complaint.status)}`}>
                  {complaint.status === 'resolved' || complaint.status === 'closed' ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <ClockIcon className="h-5 w-5" />
                  )}
                  {getStatusLabel(complaint.status)}
                </span>
                
                {complaint.resolved_at && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tgl Selesai</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(complaint.resolved_at)}</dd>
                  </div>
                )}
                
                {complaint.customer_satisfaction_rating && (
                  <div className="mt-4">
                    {/* ... (kode rating tetap sama) ... */}
                  </div>
                )}
                
                {complaint.customer_feedback && (
                  <div className="mt-4">
                    {/* ... (kode feedback tetap sama) ... */}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* === 🆕 FEEDBACK CUSTOMER CARD (BARU) === */}
              {/* ========================================== */}
              {(complaint.status === 'resolved' || complaint.status === 'closed') && complaint.customer_satisfaction_rating && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg border-2 border-yellow-300 dark:border-yellow-700 overflow-hidden">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StarIcon className="h-5 w-5 text-white" />
                      <span className="text-white font-bold text-sm">
                        Feedback dari Customer
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Rating Display */}
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-3">
                        Rating Kepuasan
                      </dt>
                      <dd className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-6 w-6 transition-all duration-300 ${
                                i < (complaint.customer_satisfaction_rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-md'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                          {complaint.customer_satisfaction_rating}/5
                        </span>
                      </dd>

                      {/* Rating Label with Emoji */}
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm font-semibold">
                          {complaint.customer_satisfaction_rating === 1 && '😞 Sangat Tidak Puas'}
                          {complaint.customer_satisfaction_rating === 2 && '😕 Tidak Puas'}
                          {complaint.customer_satisfaction_rating === 3 && '😐 Cukup'}
                          {complaint.customer_satisfaction_rating === 4 && '😊 Puas'}
                          {complaint.customer_satisfaction_rating === 5 && '🤩 Sangat Puas!'}
                        </span>
                      </div>
                    </div>

                    {/* Feedback Text */}
                    {complaint.customer_feedback && (
                      <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                        <dt className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2">
                          Ulasan Customer
                        </dt>
                        <dd className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                            "{complaint.customer_feedback}"
                          </p>
                        </dd>
                      </div>
                    )}

                    {/* Feedback Submitted At */}
                    {complaint.feedback_submitted_at && (
                      <div className="pt-3 border-t border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>Dikirim pada {formatDateTimeFull(complaint.feedback_submitted_at)}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Answers (Jika ada) */}
                    {complaint.feedback_quick_answers && complaint.feedback_quick_answers.length > 0 && (
                      <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                        <dt className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2">
                          Poin-poin Feedback
                        </dt>
                        <dd className="flex flex-wrap gap-2">
                          {complaint.feedback_quick_answers.map((answer, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs font-semibold border border-yellow-300 dark:border-yellow-700"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              {answer}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}

                    {/* Empty State - No Feedback Yet */}
                    {!complaint.customer_feedback && (!complaint.feedback_quick_answers || complaint.feedback_quick_answers.length === 0) && (
                      <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic text-center">
                          Customer hanya memberikan rating tanpa ulasan tertulis
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Placeholder - Belum Ada Feedback */}
              {(complaint.status === 'resolved' || complaint.status === 'closed') && !complaint.customer_satisfaction_rating && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6">
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                      <StarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Belum Ada Feedback
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Customer belum memberikan rating atau ulasan untuk komplain ini
                    </p>
                  </div>
                </div>
              )}
              {/* ========================================== */}
              {/* === END FEEDBACK CUSTOMER CARD === */}
              {/* ========================================== */}

              {/* Info Penugasan (JUDUL DIGANTI) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                  Penugasan & Departemen
                </h3>
                
                {/* === INI ADALAH "STATUS HASIL PENUGASAN" === */}
                {complaint.assigned_to_user ? (
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ditugaskan ke</dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-white">{complaint.assigned_to_user.name}</dd>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ditugaskan ke</dt>
                      <dd className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">Belum Ditugaskan</dd>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {complaint.department && (
                     <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Departemen</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {formatDepartment(complaint.department)}
                      </dd>
                    </div>
                  )}
                  {complaint.assigned_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tgl Ditugaskan</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(complaint.assigned_at)}</dd>
                    </div>
                  )}
                  {complaint.assigned_by_user && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ditugaskan Oleh</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.assigned_by_user.name}</dd>
                    </div>
                  )}
                </div>
                {/* ============================================== */}

                {complaint.internal_notes && (
                  <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                    {/* ... (kode catatan internal tetap sama) ... */}
                  </div>
                )}

                {(complaint.status !== 'resolved' && complaint.status !== 'closed') && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {/* --- TOMBOL DIGANTI: PENUGASAN --- */}
                    {hasPermission('canAssignComplaints') && (
                      <button
                        onClick={() => setShowAssignmentModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors"
                      >
                        <UserPlusIcon className="h-5 w-5" />
                        Penugasan
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Kartu Eskalasi */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                {/* ... (kode eskalasi tetap sama) ... */}
              </div>
              
              {/* Kartu Detail & Riwayat */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                {/* ... (kode detail & riwayat tetap sama) ... */}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Modal Resolusi */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            {/* ... (kode modal resolusi tetap sama) ... */}
        </div>
      )}

      {/* Modal Penugasan (DIPERBARUI) */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full z-50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Penugasan Keluhan</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* --- DROPDOWN BARU: DEPARTEMEN --- */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pilih Departemen (Tujuan Penugasan)
                </label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="mt-2 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Departemen --</option>
                  {complaintDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {formatDepartment(dept)}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- DROPDOWN LAMA: PETUGAS --- */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pilih Petugas
                </label>
                <select
                  id="assignee"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="mt-2 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Petugas --</option>
                  {adminUsers
                    // Opsional: Filter user berdasarkan departemen terpilih
                    // .filter(admin => admin.department.toLowerCase() === selectedDepartment.toLowerCase())
                    
                    // --- PERBAIKAN: Tambahkan 'index' ---
                    .map((admin, index) => (
                      // --- PERBAIKAN: Buat key unik ---
                      <option key={`${admin.id}-${index}`} value={admin.id}>
                        {admin.name} ({admin.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Catatan Penugasan (Internal)
                </label>
                <textarea
                  id="notes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                  placeholder="Contoh: Memiliki expertise di bidang ini, beban kerja paling rendah, dll..."
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAssignComplaint}
                disabled={isAssigning || !selectedAssignee || !selectedDepartment}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 disabled:opacity-50"
              >
                {isAssigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Simpan Penugasan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eskalasi */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          {/* ... (kode modal eskalasi tetap sama) ... */}
        </div>
      )}

      {/* --- MODAL BARU: UBAH STATUS --- */}
      {showStatusModal && complaint && ( // TAMBAHKAN && complaint
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full z-50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ubah Status Keluhan</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Current Status Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Status Saat Ini</span>
                </div>
                <div className="ml-8">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full ${getStatusClass(complaint.status)}`}>
                    {getStatusLabel(complaint.status)}
                  </span>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    {getStatusDescription(complaint.status)}
                  </p>
                </div>
              </div>

              {/* Status Selection with Descriptions */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pilih Status Baru
                </label>
                <div className="space-y-2">
                  {complaintStatuses.map((status) => (
                    <label
                      key={status}
                      className={`
                        flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedStatus === status 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={selectedStatus === status}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          {status === complaint.status && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">(Aktif)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {getStatusDescription(status)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning untuk status tertentu */}
              {(selectedStatus === 'resolved' || selectedStatus === 'closed') && !complaint.resolved_at && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800 dark:text-yellow-300">
                      <p className="font-semibold mb-1">Perhatian!</p>
                      <p>Status ini akan menandai komplain sebagai selesai dan mencatat waktu penyelesaian. Customer akan menerima notifikasi bahwa komplain mereka telah diselesaikan.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedStatus === 'pending_response' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-800 dark:text-purple-300">
                      <p className="font-semibold mb-1">Info</p>
                      <p>Status ini menandakan tim menunggu respons atau informasi tambahan dari customer. Pastikan sudah mengirim pesan permintaan informasi sebelum mengubah status ini.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus || selectedStatus === complaint.status}
                className="
                  flex items-center justify-center gap-2 px-6 py-3 min-w-[140px]
                  font-semibold text-white rounded-xl
                  bg-gradient-to-r from-emerald-600 to-teal-600
                  shadow-lg shadow-emerald-500/40
                  hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl
                  dark:from-emerald-500 dark:to-teal-500
                  dark:shadow-emerald-400/30
                  dark:hover:from-emerald-600 dark:hover:to-teal-600
                  transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                  dark:ring-offset-gray-800
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-md
                "
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    <span>Simpan Status</span>
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