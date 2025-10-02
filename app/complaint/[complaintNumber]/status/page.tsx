// app/complaint/[complaintNumber]/status/page.tsx
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
  ShieldCheckIcon
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
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  customer_satisfaction_rating?: number;
  customer_feedback?: string;
  complaint_responses: Array<{
    id: number;
    message: string;
    admin_name: string;
    created_at: string;
    is_internal: boolean;
  }>;
}

export default function ComplaintStatusPage() {
  const params = useParams();
  const complaintNumber = params?.complaintNumber as string;
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (complaintNumber) {
      fetchComplaintStatus();
    }
  }, [complaintNumber]);

  // Auto refresh setiap 30 detik
  useEffect(() => {
    if (autoRefresh && complaintNumber) {
      const interval = setInterval(() => {
        fetchComplaintStatus(true); // Silent refresh
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, complaintNumber]);

  const fetchComplaintStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Search by complaint_number - pastikan exact match
      const response = await fetch(`/api/complaints?complaint_number=${encodeURIComponent(complaintNumber)}&limit=1`);
      const result = await response.json();
      
      if (response.ok && result.data && result.data.length > 0) {
        // Verifikasi complaint_number benar-benar match
        const foundComplaint = result.data.find(
          (c: Complaint) => c.complaint_number === complaintNumber
        );
        
        if (!foundComplaint) {
          setError('Komplain tidak ditemukan');
          return;
        }
        
        // Get detailed complaint info
        const detailResponse = await fetch(`/api/complaints/${foundComplaint.id}`);
        const detailResult = await detailResponse.json();
        
        if (detailResponse.ok) {
          setComplaint(detailResult.data);
          setError(null);
        } else {
          setError('Komplain tidak ditemukan');
        }
      } else {
        setError('Komplain tidak ditemukan');
      }
    } catch (err) {
      if (!silent) {
        setError('Gagal memuat data komplain');
      }
      console.error('Error fetching complaint:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!complaint || rating === 0) return;

    setSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_satisfaction_rating: rating,
          customer_feedback: feedback,
          customer_feedback_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        setComplaint(prev => prev ? {
          ...prev,
          customer_satisfaction_rating: rating,
          customer_feedback: feedback
        } : null);
        setShowFeedback(false);
        alert('Terima kasih atas feedback Anda!');
      } else {
        alert('Gagal mengirim feedback. Silakan coba lagi.');
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      submitted: { 
        label: 'Dikirim', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: ClockIcon,
        description: 'Komplain Anda telah diterima dan sedang menunggu review'
      },
      acknowledged: { 
        label: 'Dikonfirmasi', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ExclamationTriangleIcon,
        description: 'Komplain Anda telah dikonfirmasi dan dialokasikan ke tim yang tepat'
      },
      investigating: { 
        label: 'Sedang Diselidiki', 
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: ArrowPathIcon,
        description: 'Tim kami sedang menyelidiki masalah yang Anda laporkan'
      },
      pending_response: { 
        label: 'Menunggu Respons Anda', 
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: ChatBubbleLeftRightIcon,
        description: 'Tim kami telah merespon dan menunggu informasi tambahan dari Anda'
      },
      resolved: { 
        label: 'Selesai', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        description: 'Komplain Anda telah diselesaikan'
      },
      closed: { 
        label: 'Ditutup', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircleIcon,
        description: 'Komplain telah ditutup'
      }
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

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Rendah',
      medium: 'Sedang',
      high: 'Tinggi',
      critical: 'Kritis'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat status komplain...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Komplain Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/complaint"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Ajukan Komplain Baru
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(complaint.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Status Komplain</h1>
                <p className="text-sm text-gray-600">{complaint.complaint_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchComplaintStatus()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Status Header */}
        <div className="bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden mb-8">
          <div className={`px-8 py-8 text-center border-b-4 ${statusInfo.color}`}>
            <div className="flex items-center justify-center mb-4">
              <StatusIcon className="h-12 w-12 text-current" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Status: {statusInfo.label}
            </h2>
            <p className="text-sm opacity-90 max-w-2xl mx-auto">
              {statusInfo.description}
            </p>
          </div>

          {/* Complaint Info */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Complaint Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                    Informasi Komplain
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-500 block mb-1">Nomor Komplain</span>
                          <span className="font-bold text-gray-900 block">{complaint.complaint_number}</span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color.split(' ').slice(0, 2).join(' ')}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                            {getPriorityLabel(complaint.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subjek</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{complaint.subject}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Deskripsi</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                {/* Communication History */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                    Riwayat Komunikasi
                    {complaint.complaint_responses?.filter(r => !r.is_internal).length > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {complaint.complaint_responses.filter(r => !r.is_internal).length} pesan
                      </span>
                    )}
                  </h3>
                  
                  <div className="space-y-4">
                    {complaint.complaint_responses && complaint.complaint_responses.length > 0 ? (
                      complaint.complaint_responses
                        .filter(response => !response.is_internal)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((response) => (
                        <div key={response.id} className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl p-5 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-blue-900 text-sm block">
                                  {response.admin_name || 'Tim Customer Care'}
                                </span>
                                <span className="text-xs text-blue-600">
                                  PT Advanta Seeds Indonesia
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-blue-700 font-medium block">
                                {new Date(response.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-blue-600">
                                {new Date(response.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-blue-900 leading-relaxed whitespace-pre-wrap text-sm">
                            {response.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 font-medium">Belum ada komunikasi dari tim kami</p>
                        <p className="text-sm text-gray-500 mt-1">Tim akan segera menghubungi Anda</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Feedback Section */}
                {(complaint.status === 'resolved' || complaint.status === 'closed') && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                      <StarIcon className="h-5 w-5" />
                      Feedback Anda
                    </h4>
                    
                    {complaint.customer_satisfaction_rating ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-emerald-700">Rating:</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <StarIcon
                                key={star}
                                className={`h-5 w-5 ${star <= complaint.customer_satisfaction_rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            ({complaint.customer_satisfaction_rating}/5)
                          </span>
                        </div>
                        {complaint.customer_feedback && (
                          <div>
                            <span className="text-sm font-medium text-emerald-700">Komentar:</span>
                            <p className="text-emerald-800 mt-1 bg-white/50 p-3 rounded-lg">
                              {complaint.customer_feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-emerald-700 mb-4">
                          Bagaimana pengalaman Anda dengan penyelesaian komplain ini?
                        </p>
                        
                        {!showFeedback ? (
                          <button
                            onClick={() => setShowFeedback(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
                          >
                            <StarIcon className="h-4 w-4" />
                            Berikan Feedback
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-emerald-700 mb-2">
                                Rating (1-5 bintang)
                              </label>
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                  >
                                    <StarIcon
                                      className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'}`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-emerald-700 mb-2">
                                Komentar (Opsional)
                              </label>
                              <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Bagikan pengalaman Anda..."
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={submitFeedback}
                                disabled={rating === 0 || submittingFeedback}
                                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submittingFeedback ? 'Mengirim...' : 'Kirim Feedback'}
                              </button>
                              <button
                                onClick={() => setShowFeedback(false)}
                                className="px-4 py-2 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-100"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Timeline */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                    Timeline
                  </h3>
                  
                  <div className="space-y-4">
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

                {/* Auto Refresh Toggle */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Auto Refresh</p>
                      <p className="text-xs text-gray-500">Update otomatis setiap 30 detik</p>
                    </div>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoRefresh ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoRefresh ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">Butuh Bantuan Lebih Lanjut?</h3>
          <p className="text-gray-600 mb-4">
            Jika Anda memiliki pertanyaan tambahan mengenai komplain ini, silakan hubungi tim customer care kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL}?subject=Komplain ${complaint.complaint_number}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Email Customer Care
            </a>
            <Link
              href="/complaint"
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Ajukan Komplain Lain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}