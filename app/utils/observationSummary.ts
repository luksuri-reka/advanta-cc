// app/utils/observationSummary.ts
export interface ObservationData {
  planting_date?: string | null;
  label_expired_date?: string | null;
  purchase_date?: string | null;
  purchase_place?: string | null;
  purchase_address?: string | null;
  observer_name?: string | null;
  observer_position?: string | null;
  observation_date?: string | null;
  is_germination_issue?: string | null;
  germination_below_85?: string | null;
  seed_not_found?: string | null;
  seed_not_grow_soil?: string | null;
  seed_damaged_chemical?: string | null;
  seed_damaged_insect?: string | null;
  fungal_infection?: string | null;
  seed_excavated?: string | null;
  additional_seed_treatment?: string | null;
  seed_soaking?: string | null;
  planting_depth_over_7cm?: string | null;
  has_purchase_proof?: string | null;
  has_packaging_evidence?: string | null;
  replacement_qty?: number | null;
  replacement_hybrid?: string | null;
  observation_result?: string | null;
  general_notes?: string | null;
}

export interface ObservationSummary {
  status: 'Valid' | 'Invalid' | 'Pending';
  statusLabel: string;
  statusColor: string;
  badgeColor: string;
  observerName: string;
  observationDate: string;
  issueCategory: string;
  issueSeverity: 'high' | 'medium' | 'low';
  totalIssuesFound: number;
  issuesList: string[];
  hasProof: boolean;
  hasPackaging: boolean;
  replacementProposal: string | null;
  daysSincePlanting: number | null;
  isExpired: boolean;
  shortSummary: string;
  detailedSummary: string;
}

export function generateObservationSummary(data: ObservationData | null): ObservationSummary {
  if (!data || !data.observation_result) {
    return {
      status: 'Pending',
      statusLabel: 'Menunggu Observasi',
      statusColor: 'yellow',
      badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      observerName: 'Belum ditentukan',
      observationDate: '-',
      issueCategory: 'Belum diobservasi',
      issueSeverity: 'low',
      totalIssuesFound: 0,
      issuesList: [],
      hasProof: false,
      hasPackaging: false,
      replacementProposal: null,
      daysSincePlanting: null,
      isExpired: false,
      shortSummary: 'Menunggu hasil observasi lapangan',
      detailedSummary: 'Observasi lapangan belum dilakukan. Menunggu kunjungan tim lapangan untuk verifikasi komplain.'
    };
  }

  const status = data.observation_result as 'Valid' | 'Invalid';
  
  const statusConfig = {
    Valid: { 
      label: 'Komplain Diterima', 
      color: 'green',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    },
    Invalid: { 
      label: 'Komplain Ditolak', 
      color: 'red',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
  };

  // Hitung masalah yang ditemukan
  const germinationIssues: Record<string, boolean> = {
    'Germinasi di bawah 85%': data.germination_below_85 === 'Ya',
    'Benih tidak ditemukan (dimakan hewan)': data.seed_not_found === 'Ya',
    'Benih tidak tumbuh (kondisi tanah)': data.seed_not_grow_soil === 'Ya',
    'Benih rusak oleh pupuk/pestisida': data.seed_damaged_chemical === 'Ya',
    'Benih rusak oleh serangga': data.seed_damaged_insect === 'Ya',
    'Infeksi jamur (genangan air)': data.fungal_infection === 'Ya',
    'Benih tergali oleh hewan': data.seed_excavated === 'Ya',
    'Penambahan seed treatment': data.additional_seed_treatment === 'Ya',
    'Perendaman benih': data.seed_soaking === 'Ya',
    'Kedalaman tanam >7cm': data.planting_depth_over_7cm === 'Ya'
  };

  const issuesList = Object.entries(germinationIssues)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const totalIssuesFound = issuesList.length;

  // Kategori masalah
  let issueCategory = 'Tidak ada masalah';
  let issueSeverity: 'high' | 'medium' | 'low' = 'low';

  if (data.is_germination_issue === 'Ya') {
    if (data.germination_below_85 === 'Ya') {
      issueCategory = 'Masalah Kualitas Benih';
      issueSeverity = 'high';
    } else if (data.seed_not_grow_soil === 'Ya' || data.fungal_infection === 'Ya' || data.planting_depth_over_7cm === 'Ya') {
      issueCategory = 'Masalah Budidaya/Lingkungan';
      issueSeverity = 'medium';
    } else if (data.seed_not_found === 'Ya' || data.seed_excavated === 'Ya') {
      issueCategory = 'Masalah Eksternal (Hewan)';
      issueSeverity = 'low';
    } else if (data.seed_damaged_chemical === 'Ya' || data.additional_seed_treatment === 'Ya') {
      issueCategory = 'Masalah Treatment/Kimia';
      issueSeverity = 'medium';
    } else {
      issueCategory = 'Masalah Germinasi Lainnya';
      issueSeverity = 'medium';
    }
  }

  // Bukti
  const hasProof = data.has_purchase_proof === 'Ya';
  const hasPackaging = data.has_packaging_evidence === 'Ya';

  // Replacement
  let replacementProposal = null;
  if (status === 'Valid' && data.replacement_qty && data.replacement_hybrid) {
  replacementProposal = `${data.replacement_qty} unit ${data.replacement_hybrid}`;
  }

  // Timeline
  let daysSincePlanting = null;
  let isExpired = false;

  if (data.planting_date) {
    const plantDate = new Date(data.planting_date);
    const now = new Date();
    daysSincePlanting = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (data.label_expired_date && data.purchase_date) {
    const expDate = new Date(data.label_expired_date);
    const purchaseDate = new Date(data.purchase_date);
    isExpired = purchaseDate > expDate;
  }

  // Short Summary
  let shortSummary = '';
  if (status === 'Valid') {
    shortSummary = `Komplain disetujui untuk proses penggantian${replacementProposal ? `: ${replacementProposal}` : ''}`;
  } else {
    shortSummary = `Komplain ditolak - ${issueCategory}`;
  }

  // Detailed Summary
    const parts: string[] = [];
    parts.push(`Observasi dilakukan oleh ${data.observer_name || 'Observer'} (${data.observer_position || '-'}) pada ${formatDate(data.observation_date)}.`);

    if (totalIssuesFound > 0) {
    parts.push(`\n**Kategori Masalah:** ${issueCategory}`);
    parts.push(`**Masalah Ditemukan:** ${totalIssuesFound} dari 10 kriteria pemeriksaan`);
    parts.push('\n**Detail Temuan:**');
    issuesList.forEach(issue => parts.push(`• ${issue}`));
    }

    parts.push(`\n**Kelengkapan Bukti:**`);
    parts.push(`• Bukti pembelian: ${hasProof ? '✓ Tersedia' : '✗ Tidak tersedia'}`);
    parts.push(`• Kemasan produk: ${hasPackaging ? '✓ Tersedia' : '✗ Tidak tersedia'}`);

    if (daysSincePlanting !== null) {
    parts.push(`\n**Timeline:** ${daysSincePlanting} hari sejak penanaman`);
    }

    if (isExpired) {
    parts.push('\n⚠️ **Catatan Penting:** Benih dibeli setelah melewati tanggal expired pada label');
    }

    // 🔥 HANYA tampilkan replacement jika Valid
    if (status === 'Valid' && replacementProposal) {
    parts.push(`\n**Usulan Penggantian:** ${replacementProposal}`);
    }

    parts.push(`\n**Kesimpulan:** ${status === 'Valid' 
    ? 'Masalah terbukti terkait dengan kualitas produk. Komplain disetujui untuk proses penggantian.' 
    : 'Masalah disebabkan oleh faktor eksternal atau budidaya. Komplain tidak dapat diproses lebih lanjut.'}`);

    if (data.general_notes) {
    parts.push(`\n**Catatan Tambahan:**\n${data.general_notes}`);
    }

  // 🔥 PERBAIKAN: Join array parts menjadi string
  const detailedSummary = parts.join('\n');

  return {
    status,
    statusLabel: statusConfig[status].label,
    statusColor: statusConfig[status].color,
    badgeColor: statusConfig[status].badgeColor,
    observerName: data.observer_name || 'Belum ditentukan',
    observationDate: formatDate(data.observation_date),
    issueCategory,
    issueSeverity,
    totalIssuesFound,
    issuesList,
    hasProof,
    hasPackaging,
    replacementProposal,
    daysSincePlanting,
    isExpired,
    shortSummary,
    detailedSummary  // ✅ Sekarang sudah berupa string
  };
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}