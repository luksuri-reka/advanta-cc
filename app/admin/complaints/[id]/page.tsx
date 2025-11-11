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
    is_customer_response: boolean;
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
    // ... (fungsi ini tetap sama)
    if (!responseMessage.trim() || !user) return;
    setIsSending(true);
    try {
      const response = await fetch(`/api/complaints/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: responseMessage,
          admin_id: user.id,
          admin_name: user.name,
          is_customer_response: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post response');
      }
      setResponseMessage('');
      loadComplaint();
    } catch (err) {
      console.error('Error posting response:', err);
    } finally {
      setIsSending(false);
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

  // Helper untuk format nama departemen
  const formatDepartment = (dept?: string) => {
    if (!dept) return '-';
    return dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</dt>
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

                  <div className="space-y-4">
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

                {/* Riwayat Pesan */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    {/* ... (kode riwayat pesan tetap sama) ... */}
                </div>

                {/* Kirim Balasan */}
                {(complaint.status !== 'resolved' && complaint.status !== 'closed' && hasPermission('canRespondToComplaints')) && (
                  // ... (kode kirim balasan tetap sama) ...
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Kirim Balasan</h3>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows={5}
                      className="w-full text-sm rounded-xl border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Tulis balasan Anda di sini..."
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handlePostResponse}
                        disabled={isSending || !responseMessage.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
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
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full z-50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ubah Status Keluhan</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pilih Status Baru
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-2 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 text-base px-4 py-3"
                >
                  {complaintStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mengubah status akan memicu pembaruan dan dicatat dalam riwayat.
              </p>
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
                disabled={isUpdatingStatus || selectedStatus === complaint?.status}
                className="
                  w-full flex items-center justify-center gap-2 px-6 py-3
                  font-semibold text-white rounded-xl
                  border border-transparent

                  // --- Gaya Gradien Premium (Light Mode) ---
                  bg-gradient-to-r from-emerald-600 to-teal-600
                  shadow-lg shadow-emerald-500/40
                  hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl

                  // --- Gaya Dark Mode ---
                  dark:from-emerald-500 dark:to-teal-500
                  dark:shadow-lg dark:shadow-emerald-400/30
                  dark:hover:from-emerald-600 dark:hover:to-teal-600

                  // --- Transisi & Status ---
                  transition-all duration-300 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                  dark:ring-offset-gray-800
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-md 
                  disabled:hover:from-emerald-600 disabled:dark:hover:from-emerald-500
                "
              >
                {isUpdatingStatus ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckIcon className="h-5 w-5" />
                )}
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}