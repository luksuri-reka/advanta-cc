// app/admin/complaints/[id]/print/page.tsx
// Halaman print/PDF summary report - dioptimalkan untuk @media print dan html2canvas
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getProfile } from '../../../../utils/auth';
import { generateObservationSummary } from '@/app/utils/observationSummary';
import AdminSpinner from '@/app/admin/components/AdminSpinner';
import { COMPLAINT_VALIDITY_LABELS } from '@/app/utils/complaintStatus';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (s?: string | null) => {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};
const fmtDateTime = (s?: string | null) => {
  if (!s) return '-';
  return new Date(s).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Dikirim',
  acknowledged: 'Dikonfirmasi',
  observation: 'Proses Observasi',
  investigation: 'Proses Investigasi & Lab Testing',
  decision: 'Menunggu Keputusan',
  pending_response: 'Menunggu Respon Customer',
  resolved: 'Selesai',
  closed: 'Ditutup',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION COMPONENTS (print-safe, no dark mode)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ color, title }: { color: string; title: string }) {
  return (
    <div style={{
      background: color,
      color: 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontWeight: 700,
      fontSize: '11px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      marginBottom: '8px',
    }}>
      {title}
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined, marginBottom: '6px' }}>
      <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>{value || '-'}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontWeight: 700,
      background: color === 'green' ? '#d1fae5' : color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : color === 'amber' ? '#fef3c7' : color === 'purple' ? '#ede9fe' : '#f3f4f6',
      color: color === 'green' ? '#065f46' : color === 'red' ? '#7f1d1d' : color === 'blue' ? '#1e3a8a' : color === 'amber' ? '#78350f' : color === 'purple' ? '#4c1d95' : '#374151',
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PRINT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ComplaintPrintPage() {
  const params = useParams();
  const { id } = params;
  const printRef = useRef<HTMLDivElement>(null);

  const [complaint, setComplaint] = useState<any>(null);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (!profile) { window.location.href = '/admin/login'; return; }
        setAuthorized(true);

        const [cRes, aRes] = await Promise.all([
          fetch(`/api/complaints/${id}`),
          fetch(`/api/complaints/${id}/approval`),
        ]);
        if (cRes.ok) { const j = await cRes.json(); setComplaint(j.data); }
        if (aRes.ok) { const j = await aRes.json(); setApprovalData(j.data); }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const { exportComplaintSummaryPdf } = await import('@/app/utils/complaintPdfExport');
      const ticketNo = complaint?.complaint_number || `complaint-${id}`;
      await exportComplaintSummaryPdf('complaint-print-body', `Summary_${ticketNo}.pdf`);
    } catch (e: any) {
      alert('Gagal export PDF: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AdminSpinner text="Memuat report..." size="md" />
      </div>
    );
  }

  if (!complaint) {
    return <div className="p-8 text-center text-red-600 font-bold">Keluhan tidak ditemukan.</div>;
  }

  // ── Derived data ──
  const obs = complaint.complaint_observations?.[0] ?? null;
  const inv = complaint.complaint_investigations?.[0] ?? null;
  const lab = complaint.complaint_lab_testing?.[0] ?? null;
  const obsSummary = generateObservationSummary(obs);

  const statusLabel = STATUS_LABELS[complaint.status] ?? complaint.status;
  const validityLabel = complaint.complaint_validity
    ? (COMPLAINT_VALIDITY_LABELS as any)[complaint.complaint_validity] ?? complaint.complaint_validity
    : null;

  const userStr = (u: any) => {
    if (!u) return '-';
    const parts = [u.full_name || u.name];
    if (u.department) parts.push(u.department.replace(/_/g, ' '));
    if (u.job_title) parts.push(u.job_title);
    return parts.filter(Boolean).join(' · ');
  };

  // Observation issues list
  const issueMap: Record<string, string | null | undefined> = {
    'Germinasi < 85%': obs?.germination_below_85,
    'Benih tidak ditemukan': obs?.seed_not_found,
    'Tidak tumbuh (tanah)': obs?.seed_not_grow_soil,
    'Rusak pupuk/pestisida': obs?.seed_damaged_chemical,
    'Rusak serangga': obs?.seed_damaged_insect,
    'Infeksi jamur': obs?.fungal_infection,
    'Benih tergali hewan': obs?.seed_excavated,
    'Seed treatment ekstra': obs?.additional_seed_treatment,
    'Perendaman benih': obs?.seed_soaking,
    'Kedalaman tanam > 7cm': obs?.planting_depth_over_7cm,
  };

  const printDate = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      {/* ── TOOLBAR (hidden during print) ── */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            ← Kembali
          </button>
          <h1 className="text-sm font-bold text-gray-900">
            Summary Report — #{complaint.complaint_number}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {exporting ? 'Mengekspor...' : '⬇ Export PDF'}
          </button>
        </div>
      </div>

      {/* ── PRINT BODY ── */}
      <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:p-0">
        <div
          id="complaint-print-body"
          ref={printRef}
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            background: 'white',
            padding: '14mm 16mm',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: '11px',
            color: '#111827',
          }}
        >
          {/* ══ HEADER ══ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '2px solid #1e40af', paddingBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.5px' }}>
                SUMMARY REPORT KELUHAN
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginTop: '2px' }}>
                PT Advanta Seeds Indonesia
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                Dicetak: {printDate}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af' }}>#{complaint.complaint_number}</div>
              <div style={{ marginTop: '4px' }}>
                <Badge
                  label={statusLabel}
                  color={
                    complaint.status === 'resolved' || complaint.status === 'closed' ? 'green' :
                    complaint.status === 'investigation' ? 'amber' :
                    complaint.status === 'decision' ? 'purple' :
                    complaint.status === 'observation' ? 'blue' : 'blue'
                  }
                />
              </div>
              {validityLabel && (
                <div style={{ marginTop: '4px' }}>
                  <Badge label={validityLabel} color="green" />
                </div>
              )}
            </div>
          </div>

          {/* ══ INFORMASI KELUHAN ══ */}
          <SectionHeader color="#1e40af" title="Informasi Keluhan" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '10px' }}>
            <Field label="Tanggal Masuk" value={fmtDate(complaint.created_at)} />
            <Field label="Tanggal Update" value={fmtDate(complaint.updated_at)} />
            <Field label="Tanggal Selesai" value={fmtDate(complaint.resolved_at)} />
            <Field label="Kategori" value={complaint.complaint_category_name} />
            <Field label="Sub Kategori" value={complaint.complaint_subcategory_name} />
            <Field label="Jenis Masalah" value={complaint.complaint_case_type_names?.join(', ')} />
            <Field label="Subjek" value={complaint.subject} wide />
            <Field label="Deskripsi" value={complaint.description} wide />
          </div>

          <Divider />

          {/* ══ DATA PELANGGAN & PRODUK ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '10px' }}>
            <div>
              <SectionHeader color="#065f46" title="Data Pelanggan" />
              <Field label="Nama" value={complaint.customer_name} />
              <Field label="Email" value={complaint.customer_email} />
              <Field label="WhatsApp" value={complaint.customer_phone} />
              <Field label="Wilayah" value={[complaint.customer_city, complaint.customer_province].filter(Boolean).join(', ')} />
              <Field label="Alamat" value={complaint.customer_address} />
            </div>
            <div>
              <SectionHeader color="#1d4ed8" title="Data Produk" />
              <Field label="Nama Produk" value={complaint.related_product_name} />
              <Field label="Serial Produk" value={complaint.related_product_serial} />
              <Field label="Nomor Lot" value={complaint.lot_number} />
              <Field label="Jumlah Bermasalah" value={complaint.problematic_quantity} />
            </div>
          </div>

          <Divider />

          {/* ══ PENUGASAN ══ */}
          <SectionHeader color="#6d28d9" title="Info Penugasan" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '10px' }}>
            <Field label="Petugas Observasi" value={userStr(complaint.assignee_observasi_user)} />
            <Field label="Petugas Investigasi 1" value={userStr(complaint.assignee_investigasi_1_user)} />
            <Field label="Petugas Investigasi 2" value={userStr(complaint.assignee_investigasi_2_user)} />
            <Field label="Petugas Lab Testing" value={userStr(complaint.assignee_lab_testing_user)} />
            <Field label="Petugas Approval" value={userStr(complaint.assignee_approval_user)} />
            <Field label="Tanggal Penugasan" value={fmtDate(complaint.assigned_at)} />
          </div>

          <Divider />

          {/* ══ OBSERVASI ══ */}
          {obs && (
            <>
              <SectionHeader color="#0e7490" title="Hasil Observasi Lapangan" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Observer" value={obs.observer_name} />
                <Field label="Jabatan" value={obs.observer_position} />
                <Field label="Tanggal Observasi" value={fmtDate(obs.observation_date)} />
                <Field label="Tanggal Tanam" value={fmtDate(obs.planting_date)} />
                <Field label="Tgl Expired Label" value={fmtDate(obs.label_expired_date)} />
                <Field label="Tgl Pembelian" value={fmtDate(obs.purchase_date)} />
                <Field label="Tempat Pembelian" value={obs.purchase_place} />
                <Field label="Hasil Observasi" value={obsSummary.statusLabel} />
                <Field label="Kategori Masalah" value={obsSummary.issueCategory} />
              </div>

              {/* Issues checklist */}
              {obsSummary.totalIssuesFound > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px', textTransform: 'uppercase' }}>Temuan Masalah</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Object.entries(issueMap).filter(([_, v]) => v === 'Ya').map(([label]) => (
                      <span key={label} style={{ fontSize: '9px', background: '#fee2e2', color: '#7f1d1d', padding: '2px 6px', borderRadius: '4px' }}>✓ {label}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Bukti Pembelian" value={obs.has_purchase_proof === 'Ya' ? '✓ Ada' : '✗ Tidak Ada'} />
                <Field label="Kemasan Produk" value={obs.has_packaging_evidence === 'Ya' ? '✓ Ada' : '✗ Tidak Ada'} />
                {obs.replacement_qty && obs.replacement_hybrid && (
                  <Field label="Usulan Penggantian Obs." value={`${obs.replacement_qty} unit — ${obs.replacement_hybrid}`} />
                )}
              </div>

              {obs.general_notes && <Field label="Catatan Observasi" value={obs.general_notes} wide />}

              <Divider />
            </>
          )}

          {/* ══ INVESTIGASI ══ */}
          {inv && (
            <>
              <SectionHeader color="#7c3aed" title="Hasil Investigasi" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Investigator" value={inv.investigator_name} />
                <Field label="Tanggal Investigasi" value={fmtDate(inv.investigation_date)} />
                <Field label="Validitas" value={inv.is_valid === true ? '✓ Valid' : inv.is_valid === false ? '✗ Tidak Valid' : 'Belum diputuskan'} />
                <Field label="Kesimpulan" value={inv.investigation_conclusion} wide />
                <Field label="Akar Masalah (Root Cause)" value={inv.root_cause_determination} wide />
                {inv.corrective_action && <Field label="Tindakan Korektif" value={inv.corrective_action} wide />}
                {inv.preventive_action && <Field label="Tindakan Preventif" value={inv.preventive_action} wide />}
              </div>
              <Divider />
            </>
          )}

          {/* ══ LAB TESTING ══ */}
          {lab && (
            <>
              <SectionHeader color="#0369a1" title="Hasil Lab Testing" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Teknisi Lab" value={lab.lab_technician_name} />
                <Field label="Metode Pengujian" value={lab.testing_method} />
                <Field label="Tanggal Update" value={fmtDate(lab.updated_at)} />
                <Field label="Hasil Market Sample" value={lab.market_result || 'Belum ada hasil'} />
                <Field label="Hasil Guard Sample" value={lab.guard_result || 'Belum ada hasil'} />
                {lab.lab_conclusion && <Field label="Kesimpulan Lab" value={lab.lab_conclusion} wide />}
              </div>
              <Divider />
            </>
          )}

          {/* ══ APPROVAL PENGGANTIAN ══ */}
          {approvalData && (
            <>
              <SectionHeader color="#9d174d" title="Approval Penggantian" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Item Pengganti" value={approvalData.replacement_item} />
                <Field
                  label="Status Approval"
                  value={
                    approvalData.status === 'approved' ? '✓ Disetujui' :
                    approvalData.status === 'rejected' ? '✗ Ditolak' : '⏳ Menunggu'
                  }
                />
                <Field label="Diputuskan oleh" value={approvalData.approved_user?.full_name} />
                {approvalData.notes && <Field label="Catatan" value={approvalData.notes} wide />}
              </div>
              <Divider />
            </>
          )}

          {/* ══ RESOLUSI ══ */}
          {(complaint.resolution || complaint.resolution_summary) && (
            <>
              <SectionHeader color="#065f46" title="Resolusi & Penutupan" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: '6px' }}>
                <Field label="Diselesaikan oleh" value={complaint.resolved_by_user?.full_name || complaint.resolved_by_user?.name} />
                <Field label="Tanggal Selesai" value={fmtDateTime(complaint.resolved_at)} />
                <Field label="Ringkasan Resolusi" value={complaint.resolution_summary} wide />
                {complaint.resolution && complaint.resolution !== complaint.resolution_summary && (
                  <Field label="Detail Resolusi" value={complaint.resolution} wide />
                )}
              </div>
              <Divider />
            </>
          )}

          {/* ══ FOOTER ══ */}
          <div style={{
            marginTop: '16px',
            paddingTop: '10px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
            <div style={{ fontSize: '9px', color: '#9ca3af' }}>
              Dokumen ini digenerate secara otomatis dari sistem Advanta CC.<br />
              Tiket #{complaint.complaint_number} — {fmtDateTime(complaint.created_at)}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '24px' }}>Tanda Tangan & Cap,</div>
              <div style={{ width: '120px', borderTop: '1px solid #374151', paddingTop: '4px', fontSize: '9px', color: '#374151', textAlign: 'center' }}>
                {complaint.resolved_by_user?.full_name || 'Penanggung Jawab'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          #complaint-print-body {
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
    </>
  );
}
