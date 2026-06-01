import * as XLSX from 'xlsx';
import { COMPLAINT_VALIDITY_LABELS, type ComplaintValidity } from './complaintStatus';

export type ComplaintReportType = 'observation' | 'investigation' | 'labTesting' | 'approval';

type LooseRecord = Record<string, any>;

interface ExportComplaintReportParams {
  complaint: LooseRecord;
  approvalData?: LooseRecord | null;
  reportType: ComplaintReportType;
}

interface SheetRow {
  Bagian: string;
  Field: string;
  Nilai: string | number;
}

export const complaintReportLabels: Record<ComplaintReportType, string> = {
  observation: 'Report Observasi',
  investigation: 'Report Investigasi',
  labTesting: 'Report Lab Testing',
  approval: 'Report Approval'
};

const reportFilePrefixes: Record<ComplaintReportType, string> = {
  observation: 'Report_Observasi',
  investigation: 'Report_Investigasi',
  labTesting: 'Report_Lab_Testing',
  approval: 'Report_Approval'
};

const reportSheetNames: Record<ComplaintReportType, string> = {
  observation: 'Report Observasi',
  investigation: 'Report Investigasi',
  labTesting: 'Report Lab Testing',
  approval: 'Report Approval'
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
  return String(value);
};

const formatStatus = (status?: string) => {
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

  return status ? labels[status] || status : '-';
};

const formatApprovalStatus = (status?: string) => {
  const labels: Record<string, string> = {
    pending: 'Menunggu Approval',
    approved: 'Disetujui',
    rejected: 'Ditolak'
  };

  return status ? labels[status] || status : '-';
};

const formatUser = (user?: LooseRecord | null) => {
  if (!user) return '-';
  return [user.full_name || user.name, user.department, user.job_title]
    .filter(Boolean)
    .join(' - ') || '-';
};

// Ambil penugasan terakhir per role dari history (untuk fallback)
const getLastAssigneeNameFromHistory = (
  history: LooseRecord[],
  role: 'assignee_observasi' | 'assignee_investigasi_1' | 'assignee_investigasi_2' | 'assignee_lab_testing' | 'assignee_approval'
): string => {
  if (!history || history.length === 0) return '-';
  for (const record of history) {
    if (record[`${role}_name`]) return String(record[`${role}_name`]);
  }
  return '-';
};

const sanitizeFilename = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');

const getFirstItem = (items?: unknown) => (Array.isArray(items) && items.length > 0 ? items[0] : null);

const sectionRows = (section: string, rows: Array<[string, unknown]>): SheetRow[] =>
  rows.map(([field, value]) => ({
    Bagian: section,
    Field: field,
    Nilai: formatValue(value)
  }));

const appendSheet = (workbook: XLSX.WorkBook, name: string, rows: SheetRow[] | LooseRecord[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 36 },
    { wch: 70 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, name.substring(0, 31));
};

// Resolve nama penugasan: aktif jika ada, fallback ke history terakhir
const resolveAssigneeName = (
  activeUser: LooseRecord | null | undefined,
  history: LooseRecord[],
  role: 'assignee_observasi' | 'assignee_investigasi_1' | 'assignee_investigasi_2' | 'assignee_lab_testing' | 'assignee_approval'
): string => {
  const fromActive = formatUser(activeUser);
  if (fromActive !== '-') return fromActive;
  // Fallback ke history — cari record terakhir yang punya UUID untuk role ini
  if (history && history.length > 0) {
    for (const record of history) {
      if (record[role]) {
        // Gunakan assigned_by_name jika ada, atau tandai sebagai history
        const reason = record.assignment_reason || '';
        const assignedAt = record.assigned_at ? ` (${formatDate(record.assigned_at)})` : '';
        // Kita tidak punya nama langsung di sini, tapi API sudah resolve via getUserProfile.
        // Jika masih '-', tandai bahwa pernah ditugaskan
        return `[History] Ditugaskan${assignedAt}`;
      }
    }
  }
  return '-';
};

const buildComplaintInfoRows = (complaint: LooseRecord): SheetRow[] => {
  const history: LooseRecord[] = complaint.complaint_assignment_history || [];

  return [
    ...sectionRows('Keluhan', [
      ['No. Tiket', complaint.complaint_number],
      ['Status', formatStatus(complaint.status)],
      [
        'Validitas Komplain',
        complaint.complaint_validity
          ? COMPLAINT_VALIDITY_LABELS[complaint.complaint_validity as ComplaintValidity]
          : '-'
      ],
      ['Tanggal Masuk', formatDate(complaint.created_at)],
      ['Tanggal Update', formatDate(complaint.updated_at)],
      ['Tanggal Selesai', formatDate(complaint.resolved_at)],
      ['Departemen', complaint.department],
      ['Subjek', complaint.subject],
      ['Deskripsi', complaint.description]
    ]),
    ...sectionRows('Pelanggan', [
      ['Nama Pelanggan', complaint.customer_name],
      ['Email', complaint.customer_email],
      ['WhatsApp', complaint.customer_phone],
      ['Provinsi', complaint.customer_province],
      ['Kabupaten/Kota', complaint.customer_city],
      ['Alamat Lengkap', complaint.customer_address]
    ]),
    ...sectionRows('Produk', [
      ['Nama Produk', complaint.related_product_name],
      ['Serial Produk', complaint.related_product_serial],
      ['Nomor Lot', complaint.lot_number],
      ['Jumlah Bermasalah', complaint.problematic_quantity],
      ['Kategori', complaint.complaint_category_name],
      ['Subkategori', complaint.complaint_subcategory_name],
      ['Jenis Kasus', complaint.complaint_case_type_names]
    ]),
    ...sectionRows('Penugasan', [
      ['Petugas Observasi', resolveAssigneeName(complaint.assignee_observasi_user, history, 'assignee_observasi')],
      ['Petugas Investigasi 1', resolveAssigneeName(complaint.assignee_investigasi_1_user, history, 'assignee_investigasi_1')],
      ['Petugas Investigasi 2', resolveAssigneeName(complaint.assignee_investigasi_2_user, history, 'assignee_investigasi_2')],
      ['Petugas Lab Testing', resolveAssigneeName(complaint.assignee_lab_testing_user, history, 'assignee_lab_testing')],
      ['Petugas Approval', resolveAssigneeName(complaint.assignee_approval_user, history, 'assignee_approval')]
    ])
  ];
};

const buildObservationRows = (observation: LooseRecord): SheetRow[] => [
  ...sectionRows('Petugas Observasi', [
    ['Nama Observer', observation.observer_name],
    ['Posisi Observer', observation.observer_position],
    ['Tanggal Observasi', formatDate(observation.observation_date)],
    ['Terakhir Diupdate', formatDate(observation.updated_at)]
  ]),
  ...sectionRows('Data Penanaman dan Pembelian', [
    ['Tanggal Tanam', formatDate(observation.planting_date)],
    ['Tanggal Expired Label', formatDate(observation.label_expired_date)],
    ['Tanggal Pembelian', formatDate(observation.purchase_date)],
    ['Tempat Pembelian', observation.purchase_place],
    ['Alamat Pembelian', observation.purchase_address]
  ]),
  ...sectionRows('Temuan Germinasi', [
    ['Isu Germinasi', observation.is_germination_issue],
    ['Germinasi Di Bawah 85%', observation.germination_below_85],
    ['Benih Tidak Ditemukan', observation.seed_not_found],
    ['Benih Tidak Tumbuh di Tanah', observation.seed_not_grow_soil],
    ['Benih Rusak Kimia', observation.seed_damaged_chemical],
    ['Benih Rusak Serangga', observation.seed_damaged_insect],
    ['Infeksi Jamur', observation.fungal_infection],
    ['Benih Digali', observation.seed_excavated],
    ['Additional Seed Treatment', observation.additional_seed_treatment],
    ['Seed Soaking', observation.seed_soaking],
    ['Kedalaman Tanam > 7cm', observation.planting_depth_over_7cm]
  ]),
  ...sectionRows('Bukti dan Hasil', [
    ['Ada Bukti Pembelian', observation.has_purchase_proof],
    ['Ada Bukti Kemasan', observation.has_packaging_evidence],
    ['Jumlah Lampiran', observation.evidence_files?.length || 0],
    ['Hasil Observasi', observation.observation_result],
    ['Qty Penggantian', observation.replacement_qty],
    ['Hybrid Penggantian', observation.replacement_hybrid],
    ['Catatan Umum', observation.general_notes]
  ])
];

const buildInvestigationRows = (investigation: LooseRecord): SheetRow[] => [
  ...sectionRows('Petugas Investigasi', [
    ['Nama Investigator', investigation.investigator_name],
    ['Posisi Investigator', investigation.investigator_position],
    ['Tanggal Investigasi', formatDate(investigation.investigation_date)],
    ['Terakhir Diupdate', formatDate(investigation.updated_at)]
  ]),
  ...sectionRows('Data Komplain', [
    ['Inisiator Komplain', investigation.initiator_complaint],
    ['Lokasi Komplain', investigation.complaint_location],
    ['Nama Petani', investigation.farmer_name],
    ['Tipe Komplain', investigation.complaint_type],
    ['Varietas Benih', investigation.seed_variety],
    ['Nomor Lot Dicek', investigation.lot_number_check],
    ['Qty Bermasalah (kg)', investigation.problematic_quantity_kg]
  ]),
  ...sectionRows('Data Penanaman dan Pembelian', [
    ['Tanggal Tanam', formatDate(investigation.planting_date)],
    ['Tanggal Expired Label', formatDate(investigation.label_expired_date)],
    ['Tanggal Pembelian', formatDate(investigation.purchase_date)],
    ['Tempat Pembelian', investigation.purchase_place],
    ['Alamat Pembelian', investigation.purchase_address]
  ]),
  ...sectionRows('Analisis Penyebab', [
    ['Kategori Penyebab', investigation.cause_category],
    ['Kerusakan Kemasan', investigation.packaging_damage],
    ['Kesalahan Produk', investigation.product_error],
    ['Isu Pengiriman', investigation.delivery_issue],
    ['Kondisi Pengiriman', investigation.delivery_condition],
    ['Isu Pertumbuhan', investigation.growth_issue],
    ['Isu Seed Treatment', investigation.seed_treatment_issue],
    ['Penampilan Produk', investigation.product_appearance],
    ['Kemurnian Produk', investigation.product_purity],
    ['Kesehatan Benih', investigation.seed_health],
    ['Faktor Fisiologis', investigation.physiological_factors],
    ['Isu Genetik', investigation.genetic_issue],
    ['Kerusakan Herbisida', investigation.herbicide_damage],
    ['Performa Produk', investigation.product_performance],
    ['Produk Expired', investigation.product_expired]
  ]),
  ...sectionRows('Kesimpulan', [
    ['Deskripsi Masalah', investigation.problem_description],
    ['Tindakan yang Dilakukan', investigation.action_taken],
    ['Info Hama', investigation.pest_info],
    ['Aspek Agronomis', investigation.agronomic_aspect],
    ['Info Lingkungan', investigation.environment_info],
    ['Fase Performa Tanaman', investigation.plant_performance_phase],
    ['Kesimpulan Investigasi', investigation.investigation_conclusion],
    ['Root Cause Determination', investigation.root_cause_determination],
    ['Long Term Corrective Action', investigation.long_term_corrective_action],
    ['Validitas', investigation.is_valid === true ? 'Valid' : investigation.is_valid === false ? 'Tidak Valid' : '-'],
    ['Catatan Validitas', investigation.validity_notes],
    ['Jumlah Lampiran', investigation.evidence_files?.length || 0]
  ])
];

const buildLabTestingRows = (lab: LooseRecord): SheetRow[] => [
  ...sectionRows('Petugas Lab', [
    ['Nama Teknisi Lab', lab.lab_technician_name],
    ['Metode Pengujian', lab.testing_method],
    ['Terakhir Diupdate', formatDate(lab.updated_at)]
  ]),
  ...sectionRows('Market Sample', [
    ['Tanggal Sampel Diterima', formatDate(lab.market_sample_received_date)],
    ['Tanggal Hasil Germinasi', formatDate(lab.market_germination_result_date)],
    ['Tanggal Hasil Vigour', formatDate(lab.market_vigour_result_date)],
    ['Germinasi (%)', lab.market_germination_percent],
    ['Vigour (%)', lab.market_vigour_percent],
    ['Physical Purity (%)', lab.market_physical_purity_percent],
    ['MC (%)', lab.market_mc_percent],
    ['Genetic Purity (%)', lab.market_genetic_purity_percent],
    ['Hasil Market Sample', lab.market_result]
  ]),
  ...sectionRows('Guard Sample', [
    ['Tanggal Sampel Diterima', formatDate(lab.guard_sample_received_date)],
    ['Tanggal Hasil Germinasi', formatDate(lab.guard_germination_result_date)],
    ['Tanggal Hasil Vigour', formatDate(lab.guard_vigour_result_date)],
    ['Germinasi (%)', lab.guard_germination_percent],
    ['Vigour (%)', lab.guard_vigour_percent],
    ['Physical Purity (%)', lab.guard_physical_purity_percent],
    ['MC (%)', lab.guard_mc_percent],
    ['Genetic Purity (%)', lab.guard_genetic_purity_percent],
    ['Hasil Guard Sample', lab.guard_result]
  ]),
  ...sectionRows('Catatan dan Bukti', [
    ['Catatan', lab.notes],
    ['Jumlah Lampiran', lab.evidence_files?.length || 0]
  ])
];

const buildApprovalRows = (approval: LooseRecord): SheetRow[] => [
  ...sectionRows('Approval Penggantian', [
    ['Status Approval', formatApprovalStatus(approval.status)],
    ['Item Penggantian', approval.replacement_item],
    ['Catatan', approval.notes],
    ['Diminta Oleh', formatUser(approval.requested_user)],
    ['Diputuskan Oleh', formatUser(approval.approved_user)],
    ['Tanggal Request', formatDate(approval.created_at)],
    ['Tanggal Update', formatDate(approval.updated_at)]
  ])
];

const parseEvidenceFile = (fileValue: string, index: number) => {
  let fileName = `Lampiran ${index + 1}`;
  let payload = fileValue;

  if (fileValue.includes('|')) {
    const separatorIndex = fileValue.indexOf('|');
    fileName = fileValue.substring(0, separatorIndex) || fileName;
    payload = fileValue.substring(separatorIndex + 1);
  } else if (fileValue.startsWith('http')) {
    fileName = fileValue.split('/').pop() || fileName;
  }

  const isUrl = payload.startsWith('http');
  const isData = payload.startsWith('data:');

  return {
    No: index + 1,
    'Nama File': fileName,
    Tipe: isData ? 'Data lampiran tersimpan' : isUrl ? 'URL' : 'Lampiran',
    Sumber: isUrl ? payload : 'Tersimpan di data report'
  };
};

const appendEvidenceSheet = (workbook: XLSX.WorkBook, files?: string[]) => {
  if (!files || files.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(files.map(parseEvidenceFile));
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 28 },
    { wch: 80 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lampiran');
};

// Sheet history penugasan — menampilkan semua riwayat assign per event
const appendAssignmentHistorySheet = (workbook: XLSX.WorkBook, history: LooseRecord[]) => {
  if (!history || history.length === 0) return;

  const rows = history.map((record, index) => ({
    No: index + 1,
    'Tanggal Penugasan': formatDate(record.assigned_at || record.created_at),
    'Petugas Observasi': record.assignee_observasi ? '✓ Ditugaskan' : '-',
    'Petugas Investigasi 1': record.assignee_investigasi_1 ? '✓ Ditugaskan' : '-',
    'Petugas Investigasi 2': record.assignee_investigasi_2 ? '✓ Ditugaskan' : '-',
    'Petugas Lab Testing': record.assignee_lab_testing ? '✓ Ditugaskan' : '-',
    'Petugas Approval': record.assignee_approval ? '✓ Ditugaskan' : '-',
    'Catatan': record.assignment_reason || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'History Penugasan');
};

export function exportComplaintReportToExcel({
  complaint,
  approvalData,
  reportType
}: ExportComplaintReportParams) {
  const workbook = XLSX.utils.book_new();
  appendSheet(workbook, 'Info Keluhan', buildComplaintInfoRows(complaint));

  let reportRows: SheetRow[] = [];
  let evidenceFiles: string[] | undefined;

  if (reportType === 'observation') {
    const observation = getFirstItem(complaint.complaint_observations);
    if (!observation) throw new Error('Report observasi belum tersedia.');
    reportRows = buildObservationRows(observation);
    evidenceFiles = observation.evidence_files;
  }

  if (reportType === 'investigation') {
    const investigation = getFirstItem(complaint.complaint_investigations);
    if (!investigation) throw new Error('Report investigasi belum tersedia.');
    reportRows = buildInvestigationRows(investigation);
    evidenceFiles = investigation.evidence_files;
  }

  if (reportType === 'labTesting') {
    const labTesting = getFirstItem(complaint.complaint_lab_testing);
    if (!labTesting) throw new Error('Report lab testing belum tersedia.');
    reportRows = buildLabTestingRows(labTesting);
    evidenceFiles = labTesting.evidence_files;
  }

  if (reportType === 'approval') {
    if (!approvalData) throw new Error('Report approval belum tersedia.');
    reportRows = buildApprovalRows(approvalData);
  }

  appendSheet(workbook, reportSheetNames[reportType], reportRows);
  appendEvidenceSheet(workbook, evidenceFiles);

  // Tambahkan sheet history penugasan di semua tipe report
  const assignmentHistory: LooseRecord[] = complaint.complaint_assignment_history || [];
  appendAssignmentHistorySheet(workbook, assignmentHistory);

  const ticketNumber = sanitizeFilename(complaint.complaint_number || `complaint-${complaint.id}`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${reportFilePrefixes[reportType]}_${ticketNumber}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return fileName;
}
