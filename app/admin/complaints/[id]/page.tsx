// app/admin/complaints/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProfile, logout } from '../../../utils/auth';
import type { User } from '@supabase/supabase-js';
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
  PencilIcon,
  DocumentMagnifyingGlassIcon,
  BeakerIcon,
  QrCodeIcon, // 🔥 BARU: Import Icon Lot
  ScaleIcon,   // 🔥 BARU: Import Icon Timbangan
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import ObservationSummaryCard from '@/app/components/ObservationSummaryCard';
import InvestigationSummaryCard from '@/app/components/InvestigationSummaryCard';
import LabTestingSummaryCard from '@/app/components/LabTestingSummaryCard';

interface QuickActionsProps {
  complaint: Complaint;
  userId: string;
  user: DisplayUser; // 🔥 TAMBAHKAN INI
  onStatusChange: () => void;
  approvalData?: any;
  onApprovalUpdate?: () => void;
}

function QuickActions({ complaint, userId, user, onStatusChange, approvalData, onApprovalUpdate }: QuickActionsProps) {
  const [updating, setUpdating] = useState(false);

  // 🔥 TAMBAHKAN STATE UNTUK MODAL
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementQty, setReplacementQty] = useState('');
  const [replacementHybrid, setReplacementHybrid] = useState('');

  // States for Approval Flow
  const [showRequestApprovalModal, setShowRequestApprovalModal] = useState(false);
  const [approvalItem, setApprovalItem] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const activeAssignees = [
    complaint.assignee_observasi,
    complaint.assignee_investigasi_1,
    complaint.assignee_investigasi_2,
    complaint.assignee_lab_testing,
    complaint.assigned_to // Fallback legacy
  ].filter(Boolean);

  const isAssignedToMe = activeAssignees.includes(userId);
  const isSuperAdmin = user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin');
  const isManagement = user?.department === 'management';

  const handleQuickStatus = async (newStatus: string, message?: string) => {
    setUpdating(true);
    try {
      const statusResponse = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update status');
      }

      if (message) {
        await fetch(`/api/complaints/${complaint.id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            admin_id: userId,
            admin_name: user?.name || 'Admin',
            is_internal: false,
          }),
        });
      }

      toast.success('Status berhasil diperbarui!');
      onStatusChange();
    } catch (error) {
      console.error('Quick action failed:', error);
      toast.error('Gagal memperbarui status');
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 HANDLER UNTUK REQUEST APPROVAL (NEW)
  const handleRequestApproval = async () => {
    if (!approvalItem.trim()) {
      toast.error('Item penggantian harus diisi');
      return;
    }
    setUpdating(true);
    try {
      const resp = await fetch(`/api/complaints/${complaint.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replacement_item: approvalItem,
          notes: approvalNotes
        })
      });
      if (!resp.ok) throw new Error('Gagal mengajukan approval');
      toast.success('Approval berhasil diajukan');
      setShowRequestApprovalModal(false);
      if (onApprovalUpdate) onApprovalUpdate(); // Refresh approval data in parent
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 HANDLER UNTUK APPROVE / REJECT
  const handleProcessApproval = async (status: 'approved' | 'rejected') => {
    setUpdating(true);
    try {
      const resp = await fetch(`/api/complaints/${complaint.id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!resp.ok) throw new Error(`Gagal memproses ${status}`);
      toast.success(`Approval berhasil di-${status}`);
      if (onApprovalUpdate) onApprovalUpdate();
      onStatusChange(); // Because status could change to 'decision'
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 HANDLER UNTUK KONFIRMASI DENGAN REPLACEMENT
  const handleAcknowledgeWithReplacement = async () => {
    if (!replacementQty || !replacementHybrid) {
      toast.error('Mohon isi qty dan hybrid penggantian');
      return;
    }

    setUpdating(true);
    try {
      // 1. Update status dan simpan data replacement
      const response = await fetch(`/api/complaints/${complaint.id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replacement_qty: parseInt(replacementQty),
          replacement_hybrid: replacementHybrid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge complaint');
      }

      toast.success('Komplain dikonfirmasi dengan usulan penggantian!');
      setShowReplacementModal(false);
      setReplacementQty('');
      setReplacementHybrid('');
      onStatusChange();
    } catch (error) {
      console.error('Acknowledge failed:', error);
      toast.error('Gagal konfirmasi komplain');
    } finally {
      setUpdating(false);
    }
  };

  if (!isAssignedToMe) return null;

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-blue-600" />
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* === STATUS: SUBMITTED → ACKNOWLEDGED === */}
          {complaint.status === 'submitted' && (
            <button
              onClick={() => handleQuickStatus('acknowledged', 'Komplain Anda telah kami terima dan dikonfirmasi. Tim kami akan segera memproses lebih lanjut.')}
              disabled={updating}
              className="col-span-1 sm:col-span-2 flex flex-col items-center gap-2 p-4 bg-blue-100 dark:bg-blue-900/40 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors disabled:opacity-50 border border-blue-200 dark:border-blue-800"
            >
              <CheckCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Konfirmasi Penerimaan Komplain</span>
              <span className="text-xs text-blue-700 dark:text-blue-300 text-center">Konfirmasi bahwa komplain telah diterima</span>
            </button>
          )}

          {/* === STATUS: ACKNOWLEDGED → OBSERVATION atau DIRECT REPLACEMENT === */}
          {complaint.status === 'acknowledged' && (
            <>
              <button
                onClick={() => setShowReplacementModal(true)}
                disabled={updating}
                className="col-span-1 sm:col-span-2 flex flex-col items-center gap-2 p-4 bg-amber-100 dark:bg-amber-900/40 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors disabled:opacity-50 border border-amber-200 dark:border-amber-800"
              >
                <CheckCircleIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Direct Replacement (Ganti Langsung)</span>
                <span className="text-xs text-amber-700 dark:text-amber-300 text-center">Tentukan usulan penggantian benih tanpa observasi</span>
              </button>

              <button
                onClick={() => handleQuickStatus('observation', 'Tim kami telah memulai proses observasi lapangan untuk memverifikasi komplain Anda.')}
                disabled={updating}
                className="col-span-1 sm:col-span-2 flex flex-col items-center gap-2 p-4 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl hover:bg-cyan-200 dark:hover:bg-cyan-800/60 transition-colors disabled:opacity-50 border border-cyan-200 dark:border-cyan-800"
              >
                <DocumentMagnifyingGlassIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-cyan-900 dark:text-cyan-200">Mulai Observasi Lapangan</span>
                <span className="text-xs text-cyan-700 dark:text-cyan-300 text-center">Lakukan verifikasi dan observasi terlebih dahulu</span>
              </button>
            </>
          )}

          {/* === STATUS: OBSERVATION - ISI FORM OBSERVASI === */}
          {complaint.status === 'observation' && (
            <>
              <Link
                href={`/admin/complaints/${complaint.id}/observation`}
                className={`col-span-1 sm:col-span-2 flex items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border ${complaint.complaint_observations && complaint.complaint_observations.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-emerald-400 text-white hover:from-emerald-700 hover:to-green-700'
                  : 'bg-gradient-to-r from-cyan-600 to-teal-600 border-cyan-400 text-white hover:from-cyan-700 hover:to-teal-700'
                  }`}
              >
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
                <span className="font-bold text-lg">
                  {complaint.complaint_observations && complaint.complaint_observations.length > 0
                    ? 'Lihat / Edit Hasil Observasi'
                    : 'Isi Laporan Observasi Lapangan'
                  }
                </span>
              </Link>

              {/* Tombol Mulai Investigasi jika user adalah petugas investigasi/lab */}
              {(userId === complaint.assignee_investigasi_1 ||
                userId === complaint.assignee_investigasi_2 ||
                userId === complaint.assignee_lab_testing ||
                complaint.department?.startsWith('investigasi') ||
                complaint.department?.startsWith('lab') ||
                isSuperAdmin ||
                isManagement) && (
                  <button
                    onClick={() => handleQuickStatus('investigation', 'Tim investigasi telah memulai pengujian dan analisis mendalam.')}
                    disabled={updating}
                    className="col-span-1 sm:col-span-2 flex flex-col items-center gap-2 p-4 bg-amber-100 dark:bg-amber-900/40 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors disabled:opacity-50 border border-amber-200 dark:border-amber-800"
                  >
                    <BeakerIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Mulai Investigasi & Lab Testing</span>
                    <span className="text-xs text-amber-700 dark:text-amber-300 text-center">Ubah status ke "Investigasi"</span>
                  </button>
                )}
            </>
          )}

          {/* === STATUS: INVESTIGATION - ISI FORM INVESTIGASI & LAB === */}
          {complaint.status === 'investigation' && (
            <>
              <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(userId === complaint.assignee_investigasi_1 || userId === complaint.assignee_investigasi_2 || complaint.department?.startsWith('investigasi') || isSuperAdmin || isManagement) && (
                  <Link
                    href={`/admin/complaints/${complaint.id}/investigation`}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border ${complaint.complaint_investigations && complaint.complaint_investigations.length > 0
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-emerald-400 text-white hover:from-emerald-700 hover:to-green-700'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white hover:from-indigo-700 hover:to-purple-700'
                      }`}
                  >
                    <BeakerIcon className="h-6 w-6" />
                    <span className="font-bold text-base">
                      {complaint.complaint_investigations && complaint.complaint_investigations.length > 0
                        ? 'Lihat / Edit Investigasi'
                        : 'Isi Laporan Investigasi'
                      }
                    </span>
                  </Link>
                )}
                {(userId === complaint.assignee_lab_testing || complaint.department?.startsWith('lab') || isSuperAdmin || isManagement) && (
                  <Link
                    href={`/admin/complaints/${complaint.id}/lab-testing`}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border ${complaint.complaint_lab_testing && complaint.complaint_lab_testing.length > 0
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-emerald-400 text-white hover:from-emerald-700 hover:to-green-700'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 border-teal-400 text-white hover:from-teal-700 hover:to-cyan-700'
                      }`}
                  >
                    <ClipboardDocumentCheckIcon className="h-6 w-6" />
                    <span className="font-bold text-base">
                      {complaint.complaint_lab_testing && complaint.complaint_lab_testing.length > 0
                        ? 'Lihat / Edit Lab Testing'
                        : 'Isi Hasil Lab Testing'
                      }
                    </span>
                  </Link>
                )}
              </div>

              {/* Tombol Selesai Investigasi */}
              <button
                onClick={() => handleQuickStatus('decision', 'Investigasi dan lab testing telah selesai dilakukan. Menunggu keputusan manajemen.')}
                disabled={updating}
                className="col-span-1 sm:col-span-2 flex flex-col items-center gap-2 p-4 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors disabled:opacity-50 border border-indigo-200 dark:border-indigo-800"
              >
                <CheckCircleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Selesai Investigasi</span>
                <span className="text-xs text-indigo-700 dark:text-indigo-300 text-center">Ubah status ke "Menunggu Keputusan"</span>
              </button>
            </>
          )}

          {/* === STATUS: DECISION - MANAJEMEN APPROVAL === */}
          {complaint.status === 'decision' && (
            <div className="col-span-1 sm:col-span-2 p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Persetujuan Penggantian</h4>

              {!approvalData ? (
                // 1. Belum ada request approval diajukan
                <button
                  onClick={() => setShowRequestApprovalModal(true)}
                  disabled={updating}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Ajukan Persetujuan Penggantian (Request Approval)
                </button>
              ) : approvalData.status === 'pending' ? (
                // 2. Ada request pending. Cek siapa yang berhak approve.
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium whitespace-pre-wrap">
                      <span className="block mb-1 text-xs text-amber-600">Request Detail:</span>
                      Item: {approvalData.replacement_item}<br />
                      Notes: {approvalData.notes || '-'}
                    </p>
                  </div>

                  {isSuperAdmin || isManagement || userId === complaint.assigned_to ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleProcessApproval('approved')}
                        disabled={updating}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                      >
                        Approve Penggantian
                      </button>
                      <button
                        onClick={() => handleProcessApproval('rejected')}
                        disabled={updating}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 px-4 bg-gray-100 text-gray-600 rounded-xl text-center text-sm font-medium">
                      Menunggu persetujuan dari Management/Admin
                    </div>
                  )}
                </div>
              ) : (
                // 3. Status Approved atau Rejected
                <div className={`p-4 rounded-xl border ${approvalData.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm font-bold mb-1 ${approvalData.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>
                    Penggantian telah di-{approvalData.status}
                  </p>
                  <p className={`text-xs ${approvalData.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                    Item: {approvalData.replacement_item}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Diputuskan oleh: {approvalData.approved_user?.full_name || 'Admin'}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-6 text-center">
          Gunakan tombol ini untuk update status dengan cepat
        </p>
      </div >

      {/* 🔥 MODAL DIRECT REPLACEMENT */}
      {
        showReplacementModal && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Direct Replacement Proposal</h3>
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <InformationCircleIcon className="h-5 w-5 inline mr-2" />
                    Tentukan usulan penggantian benih untuk komplain ini. Data ini akan ditampilkan ke customer.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={replacementQty}
                    onChange={(e) => setReplacementQty(e.target.value)}
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-base px-4 py-3"
                    placeholder="Jumlah unit"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hybrid / Varietas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={replacementHybrid}
                    onChange={(e) => setReplacementHybrid(e.target.value)}
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-base px-4 py-3"
                    placeholder="Nama varietas hybrid"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAcknowledgeWithReplacement}
                  disabled={updating || !replacementQty || !replacementHybrid}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      Konfirmasi & Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 🔥 MODAL REQUEST APPROVAL */}
      {showRequestApprovalModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Approval Penggantian</h3>
              <button
                onClick={() => setShowRequestApprovalModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usulan Item Pengganti <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={approvalItem}
                  onChange={(e) => setApprovalItem(e.target.value)}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-base px-4 py-3"
                  placeholder="Contoh: 5 Sak Benih Hybrid X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan Tambahan
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-base px-4 py-3"
                  placeholder="Alasan disetujui, hasil lab, dsb."
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRequestApprovalModal(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRequestApproval}
                disabled={updating || !approvalItem}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Mengirim...' : 'Ajukan Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
  complaint_case_type_ids?: string[];
  complaint_case_type_names?: string[];

  related_product_serial?: string;
  related_product_name?: string;

  lot_number?: string;
  problematic_quantity?: string;

  acknowledged_replacement_qty?: number | null;
  acknowledged_replacement_hybrid?: string | null;

  complaint_observations?: any[];
  complaint_investigations?: any[];
  complaint_lab_testing?: any[];

  attachments?: string[];
  verification_data?: Record<string, any>;
  status: string;

  assigned_to?: string;
  assigned_at?: string;
  assigned_by?: string;

  assignee_observasi?: string;
  assignee_investigasi_1?: string;
  assignee_investigasi_2?: string;
  assignee_lab_testing?: string;

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

  assignee_observasi_user?: RelatedUser;
  assignee_investigasi_1_user?: RelatedUser;
  assignee_investigasi_2_user?: RelatedUser;
  assignee_lab_testing_user?: RelatedUser;

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
  user_id: string;
  full_name: string;
  department: string;
  email: string;
  job_title?: string;
  is_active: boolean;
}

interface DisplayUser {
  name: string;
  roles?: string[];
  department?: string;
  complaint_permissions?: Record<string, boolean>;
  id?: string;
}

const complaintDepartments = [
  'admin',
  'customer_service',
  'quality_assurance',
  'technical',
  'management',
  'observasi',
  'investigasi_1',
  'investigasi_2',
  'lab_testing',
  'sales'
];

const complaintStatuses = [
  'submitted',
  'acknowledged',
  'observation',
  'investigation',
  'decision',
  'pending_response',
  'resolved',
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

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  // Removed selectedAssignee and selectedDepartment as per refactor
  // const [selectedAssignee, setSelectedAssignee] = useState('');
  // const [selectedDepartment, setSelectedDepartment] = useState('');

  // States for multi-department assignments
  const [assigneeObservasi, setAssigneeObservasi] = useState('');
  const [assigneeInvestigasi1, setAssigneeInvestigasi1] = useState('');
  const [assigneeInvestigasi2, setAssigneeInvestigasi2] = useState('');
  const [assigneeLabTesting, setAssigneeLabTesting] = useState('');

  const [assignmentNotes, setAssignmentNotes] = useState('');

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // 🔥 Approval State
  const [approvalData, setApprovalData] = useState<any>(null);

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
      loadApprovalData();
    }
  }, [user, id]);

  useEffect(() => {
    if (complaint) {
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

  const loadApprovalData = async () => {
    try {
      const response = await fetch(`/api/complaints/${id}/approval`);
      if (response.ok) {
        const json = await response.json();
        setApprovalData(json.data);
      }
    } catch (err) {
      console.error('Failed to load approval data:', err);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/complaint-users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.data || []);
      } else {
        console.error('Failed to load admin users');
        setAdminUsers([]);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setAdminUsers([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handlePostResponse = async () => {
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
          is_internal: isInternalResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to post response');
      }

      setResponseMessage('');
      setIsInternalResponse(false);
      loadComplaint();
      toast.success('Balasan berhasil dikirim!');

    } catch (error: any) {
      console.error('Error posting response:', error.message);
      toast.error(error.message || 'Gagal mengirim balasan');
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignComplaint = async () => {
    if (!assigneeObservasi && !assigneeInvestigasi1 && !assigneeInvestigasi2 && !assigneeLabTesting) {
      toast.error('Gagal, pilih setidaknya satu petugas untuk departemen.');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/complaints/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignee_observasi: assigneeObservasi,
          assignee_investigasi_1: assigneeInvestigasi1,
          assignee_investigasi_2: assigneeInvestigasi2,
          assignee_lab_testing: assigneeLabTesting,
          notes: assignmentNotes,
        }),
      });

      if (!response.ok) throw new Error('Penugasan gagal');

      toast.success('Komplain berhasil ditugaskan');
      setShowAssignmentModal(false);
      setAssigneeObservasi('');
      setAssigneeInvestigasi1('');
      setAssigneeInvestigasi2('');
      setAssigneeLabTesting('');
      setAssignmentNotes('');
      loadComplaint();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan penugasan');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleResolveComplaint = async () => {
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

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === complaint?.status) {
      setShowStatusModal(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          updated_by: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setShowStatusModal(false);
      loadComplaint();
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'observation':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case 'investigation':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'decision':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'pending_response':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'resolved':
      case 'closed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: 'Dikirim',
      acknowledged: 'Dikonfirmasi',
      observation: 'Proses Observasi',
      investigation: 'Proses Investigasi & Lab Testing',
      decision: 'Menunggu Keputusan',
      pending_response: 'Menunggu Respon Customer',
      resolved: 'Selesai',
      closed: 'Ditutup'
    };
    return labels[status] || status;
  };

  const formatDepartment = (dept?: string) => {
    if (!dept) return '-';
    return dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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

  if (!user) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900"><Toaster position="top-right" />

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
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat detail keluhan...</p>
          </div>
        )}

        {error && (
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
            {/* === QUICK ACTIONS === */}
            {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
              <div className="lg:col-span-3">
                <QuickActions
                  complaint={complaint}
                  userId={user.id!}
                  user={user}
                  onStatusChange={loadComplaint}
                  approvalData={approvalData}
                  onApprovalUpdate={loadApprovalData}
                />
              </div>
            )}
            {/* Observation Summary Card */}
            {complaint.complaint_observations && complaint.complaint_observations.length > 0 && (
              <div className="lg:col-span-3 space-y-4">
                <ObservationSummaryCard
                  data={complaint.complaint_observations[0]}
                />

                {/* OBSERVATION EVIDENCE FILES */}
                {complaint.complaint_observations[0].evidence_files && complaint.complaint_observations[0].evidence_files.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <dt className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-2 mb-4">
                      <DocumentTextIcon className="w-5 h-5 text-cyan-500" />
                      Dokumentasi Observasi
                    </dt>
                    <dd className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {complaint.complaint_observations[0].evidence_files.map((src: string, index: number) => {
                        let fileNameStr = `File Observasi ${index + 1}`;
                        let base64Data = src;

                        if (src.includes('|')) {
                          const separatorIndex = src.indexOf('|');
                          fileNameStr = src.substring(0, separatorIndex);
                          base64Data = src.substring(separatorIndex + 1);
                        }

                        const isBase64 = base64Data.startsWith('data:image/');
                        const isHttp = base64Data.startsWith('http');
                        const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;

                        const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));
                        const finalFileName = isHttp ? src.split('/').pop() : fileNameStr;

                        return (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col justify-between aspect-square">
                            {isVisualImage ? (
                              <img
                                src={displayUrl}
                                alt={finalFileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 h-full">
                                <DocumentTextIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-full px-2 text-center">
                                  {finalFileName}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay for download */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                              <a
                                href={displayUrl}
                                download={finalFileName || `obs-${complaint.complaint_number}-${index + 1}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg text-xs"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Unduh
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </dd>
                  </div>
                )}
              </div>
            )}

            {/* Investigation Summary Card & Evidence */}
            {complaint.complaint_investigations && complaint.complaint_investigations.length > 0 && (
              <div className="lg:col-span-3 space-y-4">
                <InvestigationSummaryCard
                  data={complaint.complaint_investigations[0]}
                />

                {/* INVESTIGATION EVIDENCE FILES */}
                {complaint.complaint_investigations[0].evidence_files && complaint.complaint_investigations[0].evidence_files.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <dt className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-4">
                      <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                      Dokumentasi Investigasi
                    </dt>
                    <dd className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {complaint.complaint_investigations[0].evidence_files.map((src: string, index: number) => {
                        let fileNameStr = `File Evidence ${index + 1}`;
                        let base64Data = src;

                        if (src.includes('|')) {
                          const separatorIndex = src.indexOf('|');
                          fileNameStr = src.substring(0, separatorIndex);
                          base64Data = src.substring(separatorIndex + 1);
                        }

                        const isBase64 = base64Data.startsWith('data:image/');
                        const isHttp = base64Data.startsWith('http');
                        const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;

                        const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));
                        const finalFileName = isHttp ? src.split('/').pop() : fileNameStr;

                        return (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col justify-between aspect-square">
                            {isVisualImage ? (
                              <img
                                src={displayUrl}
                                alt={finalFileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 h-full">
                                <DocumentTextIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-full px-2 text-center">
                                  {finalFileName}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay for download */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                              <a
                                href={displayUrl}
                                download={finalFileName || `evidence-${complaint.complaint_number}-${index + 1}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg text-xs"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Unduh
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </dd>
                  </div>
                )}
              </div>
            )}

            {/* Lab Testing Summary Card & Evidence */}
            {complaint.complaint_lab_testing && complaint.complaint_lab_testing.length > 0 && (
              <div className="lg:col-span-3 space-y-4">
                <LabTestingSummaryCard
                  data={complaint.complaint_lab_testing[0]}
                />

                {/* LAB TESTING EVIDENCE FILES */}
                {complaint.complaint_lab_testing[0].evidence_files && complaint.complaint_lab_testing[0].evidence_files.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <dt className="text-sm font-medium text-teal-600 dark:text-teal-400 flex items-center gap-2 mb-4">
                      <BeakerIcon className="w-5 h-5 text-teal-500" />
                      Dokumentasi Lab Testing
                    </dt>
                    <dd className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {complaint.complaint_lab_testing[0].evidence_files.map((src: string, index: number) => {
                        let fileNameStr = `File Lab ${index + 1}`;
                        let base64Data = src;

                        if (src.includes('|')) {
                          const separatorIndex = src.indexOf('|');
                          fileNameStr = src.substring(0, separatorIndex);
                          base64Data = src.substring(separatorIndex + 1);
                        }

                        const isBase64 = base64Data.startsWith('data:image/');
                        const isHttp = base64Data.startsWith('http');
                        const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;

                        const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));
                        const finalFileName = isHttp ? src.split('/').pop() : fileNameStr;

                        return (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col justify-between aspect-square">
                            {isVisualImage ? (
                              <img
                                src={displayUrl}
                                alt={finalFileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 h-full">
                                <DocumentTextIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-full px-2 text-center">
                                  {finalFileName}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay for download */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                              <a
                                href={displayUrl}
                                download={finalFileName || `lab-${complaint.complaint_number}-${index + 1}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg text-xs"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Unduh
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </dd>
                  </div>
                )}
              </div>
            )}
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

                  {/* === LOKASI PELANGGAN === */}
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

                  {/* 🔥 BARU: BAGIAN LOT NUMBER DAN QUANTITY */}
                  {(complaint.lot_number || complaint.problematic_quantity) && (
                    <div className="mt-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {complaint.lot_number && (
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                          <div className="p-2 bg-white dark:bg-emerald-900 rounded-lg shadow-sm">
                            <QrCodeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                              Nomor Lot
                            </dt>
                            <dd className="text-sm font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                              {complaint.lot_number}
                            </dd>
                          </div>
                        </div>
                      )}

                      {complaint.problematic_quantity && (
                        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                          <div className="p-2 bg-white dark:bg-orange-900 rounded-lg shadow-sm">
                            <ScaleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                              Jumlah Bermasalah
                            </dt>
                            <dd className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                              {complaint.problematic_quantity} kg
                            </dd>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KATEGORISASI KOMPLAIN */}
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

                      {/* MULTIPLE CASE TYPES */}
                      {complaint.complaint_case_type_names && complaint.complaint_case_type_names.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-purple-900/30 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <dt className="text-base font-bold text-purple-900 dark:text-purple-100">
                                Jenis Masalah Dilaporkan
                              </dt>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full shadow-lg">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                              {complaint.complaint_case_type_names.length} Masalah
                            </span>
                          </div>

                          <dd className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {complaint.complaint_case_type_names.map((caseTypeName, index) => (
                              <div
                                key={index}
                                className="group relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/20 dark:to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                                <div className="relative flex items-start gap-3 p-4 bg-white dark:bg-gray-800/80 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/60 dark:to-pink-900/60 rounded-lg">
                                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 leading-snug">
                                      {caseTypeName}
                                    </p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                      Masalah #{index + 1}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </dd>
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
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Lampiran Komplain Awal</dt>
                        <dd className="mt-2 space-y-4">
                          {complaint.attachments.map((url, index) => {
                            // Cek apakah lampiran adalah base64 image
                            const isBase64Image = url.startsWith('data:image/');
                            // Terapkan URL proxy yang sama (encoded base64) agar domain supabase tidak bocor
                            const proxyUrl = isBase64Image
                              ? url
                              : `/api/public/images?url=${btoa(url)}`;

                            return isBase64Image || proxyUrl ? (
                              <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video max-w-sm">
                                <img
                                  src={proxyUrl}
                                  alt={`Lampiran ${index + 1}`}
                                  className="w-full h-full object-contain bg-white dark:bg-slate-900"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a
                                    href={proxyUrl}
                                    download={`lampiran-${complaint.complaint_number}-${index + 1}.jpg`}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium transition-colors shadow-lg"
                                  >
                                    Unduh Gambar
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={proxyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={index}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-fit"
                              >
                                <PaperClipIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                                  {url.split('/').pop() || `Lampiran ${index + 1}`}
                                </span>
                                <LinkIcon className="h-4 w-4 text-gray-400 ml-2" />
                              </a>
                            );
                          })}
                        </dd>
                      </div>
                    )}


                  </div>
                </div>

                {/* Riwayat Pesan */}
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
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                  <div className="w-full border-t-2 border-amber-400 dark:border-amber-600 border-dashed"></div>
                                </div>
                                <div className="relative flex justify-center">
                                  <div className="px-5 py-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 rounded-xl shadow-lg border-2 border-amber-300 dark:border-amber-700 max-w-2xl">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="flex-shrink-0 mt-0.5">
                                        <div className="p-2 bg-amber-500 dark:bg-amber-600 rounded-lg">
                                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
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

                                    <div className="pl-14">
                                      <p className="text-sm text-amber-950 dark:text-amber-50 whitespace-pre-wrap leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                                        {response.message}
                                      </p>
                                    </div>

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

                          // 🔥 PERBAIKAN DI SINI: Cek apakah ada admin_name DAN admin_name tidak kosong
                          // Jika admin_name ada dan tidak kosong = Balasan Admin
                          // Jika admin_name null/undefined/kosong = Balasan Customer
                          const isAdminResponse = response.admin_name && response.admin_name.trim() !== '';

                          // --- TAMPILAN 2: Balasan Customer ---
                          if (!isAdminResponse) {
                            return (
                              <div key={response.id} className="flex gap-3 w-full flex-row">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1
                                                bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
                                  <UserIcon className="h-5 w-5" />
                                </div>
                                <div className="max-w-xl rounded-2xl p-4
                                              bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 
                                              border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
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
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {response.message}
                                  </p>
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

                          // --- TAMPILAN 3: Balasan Admin PUBLIC ---
                          return (
                            <div key={response.id} className="flex gap-3 w-full flex-row-reverse">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1
                                              bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md">
                                <ShieldCheckIcon className="h-5 w-5" />
                              </div>
                              <div className="max-w-xl rounded-2xl p-4
                                            bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 
                                            border-2 border-blue-200 dark:border-blue-800 shadow-md">
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
                                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                  {response.message}
                                </p>
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

                {/* Kirim Balasan */}
                {(complaint.status !== 'resolved' && complaint.status !== 'closed' && hasPermission('canRespondToComplaints')) && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Kirim Balasan
                    </h3>

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
                          px-4 py-3
                        "
                        placeholder="Tulis balasan Anda di sini..."
                      />
                      <div className="absolute top-3 right-3 text-gray-400 dark:text-gray-500">
                        <PencilSquareIcon className="h-5 w-5" />
                      </div>
                    </div>

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

                      {isInternalResponse && (
                        <div className="mt-2 ml-8 text-xs text-yellow-700 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                          Catatan ini hanya akan terlihat oleh tim admin.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handlePostResponse}
                        disabled={isSending || !responseMessage.trim()}
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

              {/* Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Status</h3>
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
              </div>

              {/* 🔥 TAMBAHKAN DI SINI - DIRECT REPLACEMENT INFO */}
              {(complaint.acknowledged_replacement_qty || complaint.acknowledged_replacement_hybrid) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl shadow-lg border-2 border-amber-300 dark:border-amber-700 p-6">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Direct Replacement Proposal
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-amber-700 dark:text-amber-400">Quantity</dt>
                      <dd className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {complaint.acknowledged_replacement_qty} unit
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-amber-700 dark:text-amber-400">Hybrid</dt>
                      <dd className="text-lg font-bold text-amber-900 dark:text-amber-100">
                        {complaint.acknowledged_replacement_hybrid}
                      </dd>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 italic">
                    Usulan penggantian ini sudah dikirimkan ke customer saat konfirmasi penerimaan komplain.
                  </p>
                </div>
              )}

              {/* FEEDBACK CUSTOMER CARD */}
              {(complaint.status === 'resolved' || complaint.status === 'closed') && complaint.customer_satisfaction_rating && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg border-2 border-yellow-300 dark:border-yellow-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StarIcon className="h-5 w-5 text-white" />
                      <span className="text-white font-bold text-sm">
                        Feedback dari Customer
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-3">
                        Rating Kepuasan
                      </dt>
                      <dd className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-6 w-6 transition-all duration-300 ${i < (complaint.customer_satisfaction_rating || 0)
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

                    {complaint.feedback_submitted_at && (
                      <div className="pt-3 border-t border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>Dikirim pada {formatDateTimeFull(complaint.feedback_submitted_at)}</span>
                        </div>
                      </div>
                    )}

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

              {/* Placeholder Feedback */}
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

              {/* Info Penugasan */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                  Penugasan & Departemen
                </h3>

                <div className="space-y-4">
                  {/* Observasi */}
                  {complaint.assignee_observasi_user ? (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Observasi</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{complaint.assignee_observasi_user.name}</dd>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Observasi</dt>
                        <dd className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">Belum Ditugaskan</dd>
                      </div>
                    </div>
                  )}

                  {/* Investigasi 1 */}
                  {complaint.assignee_investigasi_1_user ? (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Investigasi 1</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{complaint.assignee_investigasi_1_user.name}</dd>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Investigasi 1</dt>
                        <dd className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">Belum Ditugaskan</dd>
                      </div>
                    </div>
                  )}

                  {/* Investigasi 2 */}
                  {complaint.assignee_investigasi_2_user ? (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Investigasi 2</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{complaint.assignee_investigasi_2_user.name}</dd>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Investigasi 2</dt>
                        <dd className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">Belum Ditugaskan</dd>
                      </div>
                    </div>
                  )}

                  {/* Lab Testing */}
                  {complaint.assignee_lab_testing_user ? (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-teal-500 dark:text-teal-400" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Lab Testing</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{complaint.assignee_lab_testing_user.name}</dd>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Tim Lab Testing</dt>
                        <dd className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">Belum Ditugaskan</dd>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {complaint.assigned_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Terakhir Ditugaskan</dt>
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

                {complaint.internal_notes && (
                  <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Catatan Internal</dt>
                    <dd className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      "{complaint.internal_notes}"
                    </dd>
                  </div>
                )}

                {(complaint.status !== 'resolved' && complaint.status !== 'closed') && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
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

            </div>
          </div>
        )}
      </main>

      {/* Modal Resolusi */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          {/* Isi Modal Resolusi (Sama seperti sebelumnya) */}
        </div>
      )}

      {/* Modal Penugasan */}
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
              {/* Observasi Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Petugas Observasi
                </label>
                <select
                  value={assigneeObservasi}
                  onChange={(e) => setAssigneeObservasi(e.target.value)}
                  className="mt-1 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Petugas Observasi --</option>
                  {adminUsers
                    .filter(admin => admin.department === 'observasi' || admin.department === 'admin')
                    .map((admin) => (
                      <option key={admin.user_id} value={admin.user_id}>
                        {admin.full_name} - {formatDepartment(admin.department)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Investigasi 1 Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Petugas Investigasi 1
                </label>
                <select
                  value={assigneeInvestigasi1}
                  onChange={(e) => setAssigneeInvestigasi1(e.target.value)}
                  className="mt-1 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Petugas Investigasi 1 --</option>
                  {adminUsers
                    .filter(admin => admin.department === 'investigasi_1' || admin.department === 'admin')
                    .map((admin) => (
                      <option key={admin.user_id} value={admin.user_id}>
                        {admin.full_name} - {formatDepartment(admin.department)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Investigasi 2 Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Petugas Investigasi 2
                </label>
                <select
                  value={assigneeInvestigasi2}
                  onChange={(e) => setAssigneeInvestigasi2(e.target.value)}
                  className="mt-1 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Petugas Investigasi 2 --</option>
                  {adminUsers
                    .filter(admin => admin.department === 'investigasi_2' || admin.department === 'admin')
                    .map((admin) => (
                      <option key={admin.user_id} value={admin.user_id}>
                        {admin.full_name} - {formatDepartment(admin.department)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Lab Testing Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Petugas Lab Testing
                </label>
                <select
                  value={assigneeLabTesting}
                  onChange={(e) => setAssigneeLabTesting(e.target.value)}
                  className="mt-1 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
                >
                  <option value="">-- Pilih Petugas Lab Testing --</option>
                  {adminUsers
                    .filter(admin => admin.department === 'lab_testing' || admin.department === 'admin')
                    .map((admin) => (
                      <option key={admin.user_id} value={admin.user_id}>
                        {admin.full_name} - {formatDepartment(admin.department)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan Penugasan (Internal)
                </label>
                <textarea
                  id="notes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500 text-base px-4 py-3"
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
                disabled={isAssigning || (!assigneeObservasi && !assigneeInvestigasi1 && !assigneeInvestigasi2 && !assigneeLabTesting)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          {/* Isi Modal Eskalasi (Sama seperti sebelumnya) */}
        </div>
      )}

      {/* Modal Ubah Status */}
      {showStatusModal && complaint && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] z-50 border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ubah Status Keluhan</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Status Saat Ini:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${getStatusClass(complaint.status)}`}>
                    {getStatusLabel(complaint.status)}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pilih Status Baru
                </label>
                <div className="space-y-1.5">
                  {complaintStatuses.map((status) => (
                    <label
                      key={status}
                      className={`
                        flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
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
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          {status === complaint.status && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">(Aktif)</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedStatus === 'resolved' || selectedStatus === 'closed') && !complaint.resolved_at && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Status ini akan menandai komplain sebagai selesai dan mengirim notifikasi ke customer.
                    </p>
                  </div>
                </div>
              )}

              {selectedStatus === 'pending_response' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      Pastikan sudah mengirim permintaan informasi sebelum mengubah status ini.
                    </p>
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