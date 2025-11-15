// app/complaint/[complaintNumber]/status/page.tsx - PREMIUM UI (GAYA WHATSAPP + BADGE ADMIN DIHAPUS)
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  StarIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  MapPinIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';

interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_province: string;
  customer_city: string;
  customer_address: string;
  complaint_type: string;
  subject: string;
  description: string;

  complaint_category_name?: string;
  complaint_subcategory_name?: string;
  complaint_case_type_name?: string;

  related_product_name?: string;

  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  customer_satisfaction_rating?: number;
  customer_feedback?: string;
  complaint_responses: Array<{
    id: number;
    message: string;
    admin_name: string; // Ini adalah nama admin (null jika dari customer)
    created_at: string;
    is_internal: boolean; // Ini untuk memfilter
  }>;
}

const getStatusTimeline = (currentStatus: string) => {
  const timeline = [
    { status: 'submitted', label: 'Dikirim', icon: '📝' },
    { status: 'acknowledged', label: 'Dikonfirmasi', icon: '✅' },
    { status: 'investigating', label: 'Diselidiki', icon: '🔍' },
    { status: 'pending_response', label: 'Menunggu Respons', icon: '⏳' },
    { status: 'resolved', label: 'Selesai', icon: '🎉' },
    { status: 'closed', label: 'Ditutup', icon: '🔒' }
  ];

  let currentIndex = timeline.findIndex(item => item.status === currentStatus);
  if (currentIndex === -1) currentIndex = 0;

  return timeline.map((item, index) => ({
    ...item,
    isCurrent: item.status === currentStatus,
    isCompleted: index < currentIndex
  }));
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    submitted: 'Dikirim',
    acknowledged: 'Dikonfirmasi',
    investigating: 'Diselidiki',
    pending_response: 'Menunggu Respons Anda',
    resolved: 'Selesai',
    closed: 'Ditutup'
  };
  return labels[status] || status;
};

// --- FUNGSI FORMAT WAKTU (SESUAI ADMIN) ---
const formatDateShort = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
};

const formatTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
// --- AKHIR FUNGSI FORMAT WAKTU ---

export default function ComplaintStatusPage() {
  const params = useParams();
  const complaintNumber = params.complaintNumber as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadComplaint = async () => {
    setError(null);
    try {
      // Panggilan ini seharusnya sudah benar (dari perbaikan sebelumnya)
      const response = await fetch(`/api/complaints?complaint_number=${complaintNumber}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Komplain tidak ditemukan.');
      }
      
      const data = await response.json();
      
      // Ini juga seharusnya sudah benar (data.data[0])
      if (!data.data || data.data.length === 0) {
        throw new Error('Detail komplain tidak ditemukan.');
      }
      setComplaint(data.data[0]); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintNumber) {
      loadComplaint();
    }
  }, [complaintNumber]);

  const handlePostResponse = async () => {
    if (!responseMessage.trim() || !complaint) return;
    
    setIsSending(true);
    try {
      // API ini memanggil /api/complaints/[id]/responses
      const response = await fetch(`/api/complaints/${complaint.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: responseMessage,
          admin_id: null,
          admin_name: null, // null menandakan ini dari customer
          is_internal: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Gagal mengirim balasan');
      }

      toast.success('Balasan Anda berhasil terkirim!', {
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
        },
      });
      setResponseMessage('');
      loadComplaint(); // Muat ulang data komplain untuk menampilkan balasan baru

    } catch (error: any) {
      console.error('Error posting response:', error);
      toast.error(error.message || 'Gagal mengirim balasan', {
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
        },
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <ArrowPathIcon className="relative h-16 w-16 text-emerald-600 dark:text-emerald-400 mx-auto animate-spin mb-6" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Memuat Status Komplain...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50 dark:from-gray-900 dark:via-red-950/20 dark:to-orange-950 flex items-center justify-center p-4">
        <div className="text-center p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-md w-full">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full blur-2xl opacity-20"></div>
            <ExclamationTriangleIcon className="relative h-20 w-20 text-red-500 dark:text-red-400 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error}
          </p>
          <Link
            href="/complaint"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-blue-950 pb-16">
      <Toaster position="top-right" />

      {/* Header Premium dengan Glassmorphism */}
      <div className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link
            href="/complaint"
            className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-100/50 dark:bg-gray-700/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Kembali
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Status Komplain
          </h1>
          <button
            onClick={loadComplaint}
            disabled={loading}
            className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300"
            title="Refresh"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {complaint && (
          <div className="space-y-8">
            
            {/* Status Card Premium (Tidak ada perubahan) */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div className="relative p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <SparklesIcon className="h-6 w-6 text-emerald-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Komplain #{complaint.complaint_number}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-sm rounded-full shadow-lg shadow-emerald-500/30">
                          {getStatusLabel(complaint.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Premium (Tidak ada perubahan) */}
                  <div className="relative">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-emerald-200 to-gray-200 dark:from-gray-700 dark:via-emerald-700 dark:to-gray-700 rounded-full"></div>
                    <div className="relative flex justify-between items-start">
                      {getStatusTimeline(complaint.status).map((item, index) => (
                        <div key={item.status} className="flex-1 text-center">
                          <div className="relative mb-3">
                            <div className={`
                              w-10 h-10 rounded-full text-xl flex items-center justify-center mx-auto
                              transition-all duration-500 transform hover:scale-110
                              ${item.isCompleted || item.isCurrent 
                                ? 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/50' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                              ${item.isCurrent ? 'ring-4 ring-emerald-300 dark:ring-emerald-500/50 animate-pulse' : ''}
                            `}>
                              {item.isCompleted ? '✓' : item.icon}
                            </div>
                          </div>
                          <div className={`
                            text-xs font-bold transition-colors duration-300
                            ${item.isCompleted || item.isCurrent 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600' 
                              : 'text-gray-500 dark:text-gray-400'}
                          `}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Box Premium (Tidak ada perubahan) */}
            {complaint.status === 'pending_response' && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-500 animate-pulse"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-yellow-400/50 dark:border-yellow-600/50 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"></div>
                  <div className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-50"></div>
                          <div className="relative p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl">
                            <InformationCircleIcon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Balasan Anda Dibutuhkan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Tim kami membutuhkan informasi tambahan dari Anda. Mohon tulis balasan di bawah ini untuk melanjutkan proses penanganan komplain.
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={5}
                        className="
                          w-full text-base rounded-2xl 
                          border-2 border-gray-200 dark:border-gray-600 
                          dark:bg-gray-700/50 dark:text-white 
                          dark:placeholder-gray-400
                          focus:ring-4 focus:ring-yellow-500/30 focus:border-yellow-500
                          shadow-lg dark:shadow-xl
                          px-5 py-4
                          transition-all duration-300
                          placeholder:text-gray-400
                        "
                        placeholder="Tulis balasan Anda di sini..."
                        disabled={isSending}
                      />
                      <div className="absolute bottom-4 right-4 text-gray-300 dark:text-gray-600 pointer-events-none">
                        <PaperAirplaneIcon className="h-6 w-6" />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handlePostResponse}
                        disabled={isSending || !responseMessage.trim()}
                        className="
                          group relative flex items-center gap-3 px-8 py-3.5
                          bg-gradient-to-r from-emerald-600 to-blue-600 text-white 
                          font-bold rounded-2xl 
                          hover:shadow-2xl hover:shadow-emerald-500/50
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300
                          transform hover:-translate-y-0.5
                          overflow-hidden
                        "
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <PaperAirplaneIcon className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
                        <span className="relative">{isSending ? 'Mengirim...' : 'Kirim Balasan'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* === 🎨 PERUBAHAN UI DIMULAI DI SINI (BADGE ADMIN DIHAPUS) 🎨 === */}
            {/* Communication History Premium */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Riwayat Komunikasi
                    </h3>
                  </div>
                  {complaint.complaint_responses && complaint.complaint_responses.filter(r => !r.is_internal).length > 0 ? (
                    <div className="space-y-6">
                      {complaint.complaint_responses
                        .filter(response => !response.is_internal) // <-- Filter penting: jangan tampilkan catatan internal
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((response) => {
                          
                          // --- TAMPILAN 1: Balasan Pelanggan (ANDA) ---
                          // (Layout KANAN, Sesuai WA)
                          if (!response.admin_name) {
                            return (
                              <div key={response.id} className="flex gap-3 w-full flex-row-reverse">
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
                                      Anda
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
                                  
                                  {/* Footer "Terkirim" (Tidak Berubah) */}
                                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatTime(response.created_at)}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
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
                          }

                          // --- TAMPILAN 2: Balasan Admin PUBLIC (ADMIN) ---
                          // (Layout KIRI, Sesuai WA)
                          return (
                            <div key={response.id} className="flex gap-3 w-full flex-row">
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
                                
                                {/* === FOOTER DIPERBAIKI DI SINI === */}
                                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatTime(response.created_at)}
                                  </span>
                                  {/* Badge "Terkirim" sudah dihapus dari sini */}
                                </div>
                                {/* === AKHIR PERBAIKAN FOOTER === */}

                              </div>
                              <div className="flex-grow"></div>
                            </div>
                          );

                        })}
                    </div>
                  ) : (
                    // Placeholder (Sesuai Admin UI)
                    <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-700/20">
                      <ChatBubbleLeftRightIcon className="h-14 w-14 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-2">Belum Ada Riwayat</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Semua balasan dari tim kami akan muncul di sini.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* === 🎨 PERUBAHAN UI SELESAI DI SINI 🎨 === */}
            {/* ======================================================== */}


            {/* Detail Info Premium (Tidak ada perubahan) */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                      <InformationCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Detail Komplain
                    </h3>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Pelanggan</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{complaint.customer_name}</dd>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{complaint.customer_email || '-'}</dd>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
      
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">WhatsApp</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{complaint.customer_phone || '-'}</dd>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Tanggal Lapor</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{formatDateTimeFull(complaint.created_at)}</dd>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Terakhir Diperbarui</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{formatDateTimeFull(complaint.updated_at)}</dd>
                    </div>

                    {(complaint.complaint_category_name || complaint.complaint_subcategory_name || complaint.complaint_case_type_name) && (
                      <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kategori Komplain - Produk {complaint.related_product_name || '-'}</dt>
                        <dd className="space-y-1 text-sm text-gray-900 dark:text-white">
                          <p>
                            <span className="font-medium">Kategori:</span> {complaint.complaint_category_name || '-'}
                          </p>
                          <p>
                            <span className="font-medium">Sub-Kategori:</span> {complaint.complaint_subcategory_name || '-'}
                          </p>
                          <p>
                            <span className="font-medium">Tipe Kasus:</span> {complaint.complaint_case_type_name || '-'}
                          </p>
                        </dd>
                      </div>
                    )}

                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subjek</dt>
                      <dd className="text-base font-bold text-gray-900 dark:text-white">{complaint.subject}</dd>
                    </div>
                    <div className="sm:col-span-2 p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                      <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Deskripsi</dt>
                      <dd className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {complaint.description}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Rating Card Premium (Tidak ada perubahan) */}
            {(complaint.status === 'resolved' || complaint.status === 'closed') && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                        <StarIcon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Feedback Anda
                      </h3>
                    </div>
                    {complaint.customer_satisfaction_rating ? (
                      <div>
                        <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Rating Kepuasan</dt>
                        <dd className="flex items-center gap-2 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-8 w-8 transition-all duration-300 hover:scale-110 ${
                                i < (complaint.customer_satisfaction_rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </dd>
                        {complaint.customer_feedback && (
                          <div className="p-5 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl">
                            <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Ulasan</dt>
                            <dd className="text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">
                              "{complaint.customer_feedback}"
                            </dd>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-700/20">
                        <InformationCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Anda belum memberikan feedback untuk komplain ini.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Help Section Premium (Tidak ada perubahan) */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                <div className="relative p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl">
                        <ChatBubbleLeftRightIcon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Butuh Bantuan Lebih Lanjut?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Jika Anda memiliki pertanyaan tambahan mengenai komplain ini, tim customer care kami siap membantu Anda.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {complaint && (
                      <a
                        href={`mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'cs@advantaindonesia.com'}?subject=Komplain ${complaint.complaint_number}`}
                        className="group inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                        Email Customer Care
                      </a>
                    )}
                    <Link
                      href="/complaint"
                      className="group inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <PaperAirplaneIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      Ajukan Komplain Baru
                    </Link>
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