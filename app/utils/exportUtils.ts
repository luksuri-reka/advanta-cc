// app/utils/exportUtils.ts
import * as XLSX from 'xlsx';

// Interface untuk data produksi yang akan diexport
export interface ExportProductionData {
  id: number;
  group_number: string;
  lot_number: string;
  code_1: string;
  code_2: string;
  code_3: string;
  code_4: string;
  clearance_number?: string;
  
  // Target data
  target_certification_wide?: number;
  target_seed_production?: number;
  
  // Source seed data
  seed_source_serial_number?: string;
  seed_source_male_lot_number: string;
  seed_source_female_lot_number: string;
  
  // Lot data
  lot_volume: number;
  lot_content: number;
  lot_total: number;
  
  // Realization data
  cert_realization_wide?: number;
  cert_realization_seed_production?: string;
  cert_realization_tanggal_panen: string;
  
  // Lab results
  lab_result_certification_number: string;
  lab_result_test_result: number;
  lab_result_filing_date: string;
  lab_result_testing_date: string;
  lab_result_tested_date: string;
  lab_result_serial_number: string;
  lab_result_expired_date: string;
  
  // Test parameters
  test_param_kadar_air: number;
  test_param_benih_murni: number;
  test_param_campuran_varietas_lain: number;
  test_param_benih_tanaman_lain: number;
  test_param_kotoran_benih: number;
  test_param_daya_berkecambah: number;
  
  // Documents
  docs_form_permohonan?: string;
  docs_pemeriksaan_pertamanan?: string;
  docs_uji_lab?: string;
  docs_sertifikasi?: string;
  
  // Relations
  product?: { name: string };
  company?: { name: string };
  target_kelas_benih?: { name: string };
  seed_source_company?: { name: string };
  seed_source_male_varietas?: { name: string };
  seed_source_female_varietas?: { name: string };
  seed_source_kelas_benih?: { name: string };
  lot_kelas_benih?: { name: string };
  lot_varietas?: { name: string };
}

// Template struktur header berdasarkan analisis template Excel
export const CERTIFICATION_TEMPLATE_HEADERS = {
  // Row 0: Catatan
  catatan: [
    'CATATAN', '', 
    'MOHON JANGAN MENGUBAH SUSUNAN KOLOM PADA TEMPLATE EXCEL DIBAWAH INI AGAR PROSES UPLOAD BERJALAN DENGAN LANCAR'
  ],
  
  // Row 2: Main headers
  mainHeaders: [
    'NO', 'PROVINSI', 'JENIS BENIH', 'PRODUSEN', '', '', '', '', '', '', '',
    'PROSES SERTIFIKASI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'PERMOHONAN SERTIFIKASI', '', '', '', '', '', '', '',
    'REALISASI SERTIFIKASI (FORM 3)', '', '',
    'PROSES SERTIFIKASI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'UPLOAD DOKUMEN', '', '', ''
  ],
  
  // Row 3: Sub headers level 1
  subHeaders1: [
    '', '', '', 'NAMA', 'ALAMAT', 'STATUS', '', '', '', '', '',
    'PERMOHONAN (FORM 1)', '', '', 'PENDAHULUAN (FORM 5)', '', '', 'PEMERIKSAAN TANAMAN  (FORM 3)', '', '',
    '', '', '', '', '', '', 'PEMERIKSAAN PASCA PANEN (FORM 4)', '', '',
    '', '', '', 'ASAL BENIH SUMBER', '', '', '', '', '', '', '',
    'LOT', '', '', '', '', '', 'HASIL PEMERIKSAAN LABORATORIUM', '', '', '', '', '', '',
    'PARAMETER UJI (%)', '', '', '', '', '', '', '', '', ''
  ],
  
  // Row 4: Sub headers level 2
  subHeaders2: [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'I', '', '', 'II', '', '', 'III', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ],
  
  // Row 5: Sub headers level 3 (Detail columns)
  detailHeaders: [
    '', '', '', '', '', 'BUMN', 'SWASTA', 'PERORANGAN/KELOMPOK TANI', 'DINAS', 'ST. PROVINSI', 'LITBANGDA',
    'NOMOR', 'DOKUMEN', '', 'NOMOR', 'DOKUMEN', '', 'NOMOR', 'DOKUMEN', '',
    'NOMOR', 'DOKUMEN', '', 'NOMOR', 'DOKUMEN', '', 'NOMOR', 'DOKUMEN', '',
    'TARGET', '', '', 'ASAL BENIH SUMBER', '', '', '', '', '', '', '',
    'NOMOR', 'KELAS BENIH', 'VARIETAS', 'VOLUME (KG)', 'ISI KEMASAN (KG)', 'JUMLAH',
    'NOMOR INDUK SERTIFIKASI', 'TANGGAL AJU TAHUN-BULAN-HARI', 'TANGGAL UJI TAHUN-BULAN-HARI', 
    'TANGGAL SELESAI UJI TAHUN-BULAN-HARI', 'HASIL UJI (KG)', 'TGL BERAKHIR LABEL TAHUN-BULAN-HARI', 'NOMOR SERI LABEL',
    'KADAR AIR', 'BENIH MURNI', 'CAMPURAN VARIETAS LAIN (CVL) LAPANG', 'BENIH TANAMAN LAIN/BIJI GULMA', 
    'KOTORAN BENIH', 'DAYA BERKECAMBAH',
    'PERMOHONAN (FORM 1)', 'PEMERIKSAAN PERTANAMAN (FORM 3)', 'UJI LAB (FORM 5)', 'SERTIFIKASI (FORM 6)'
  ],
  
  // Row 6: Sub headers level 4 (Status columns)
  statusHeaders: [
    '', '', '', '', '', '', '', '', '', '', '', 
    '', 'LULUS', 'TIDAK LULUS', '', 'MEMENUHI SYARAT', 'TIDAK MEMENUHI SYARAT',
    '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS',
    'LUAS SERTIFIKASI (HA)', 'KELAS BENIH', 'PRODUKSI BENIH (KG)', 'PRODUSEN BENIH', 'VARIETAS', 'NOMOR SERI LABEL',
    'KELAS BENIH', 'NOMOR LOT', 'LUAS SERTIFIKASI (HA)', 'PRODUKSI CALON BENIH (KG)', 'TGL PANEN',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]
};

// Mapping kolom untuk data produksi
export const COLUMN_MAPPING = {
  NO: 0,
  PROVINSI: 1,
  JENIS_BENIH: 2,
  NAMA_PRODUSEN: 3,
  ALAMAT_PRODUSEN: 4,
  
  // Status produsen (checkboxes)
  STATUS_BUMN: 5,
  STATUS_SWASTA: 6,
  STATUS_PERORANGAN: 7,
  STATUS_DINAS: 8,
  STATUS_ST_PROVINSI: 9,
  STATUS_LITBANGDA: 10,
  
  // Target sertifikasi
  TARGET_LUAS_SERTIFIKASI: 29,
  TARGET_KELAS_BENIH: 30,
  TARGET_PRODUKSI_BENIH: 31,
  
  // Asal benih sumber
  PRODUSEN_BENIH_SUMBER: 32,
  VARIETAS_SUMBER: 33,
  NOMOR_SERI_SUMBER: 34,
  KELAS_BENIH_SUMBER: 35,
  NOMOR_LOT_SUMBER: 36,
  
  // Realisasi sertifikasi
  REALISASI_LUAS_SERTIFIKASI: 37,
  REALISASI_PRODUKSI_CALON_BENIH: 38,
  TGL_PANEN: 39,
  
  // Lot information
  NOMOR_LOT: 40,
  KELAS_BENIH_LOT: 41,
  VARIETAS_LOT: 42,
  VOLUME_LOT: 43,
  ISI_KEMASAN: 44,
  JUMLAH_LOT: 45,
  
  // Hasil pemeriksaan laboratorium
  NOMOR_INDUK_SERTIFIKASI: 46,
  TANGGAL_AJU: 47,
  TANGGAL_UJI: 48,
  TANGGAL_SELESAI_UJI: 49,
  HASIL_UJI: 50,
  TGL_BERAKHIR_LABEL: 51,
  NOMOR_SERI_LABEL: 52,
  
  // Parameter uji
  KADAR_AIR: 53,
  BENIH_MURNI: 54,
  CAMPURAN_VARIETAS_LAIN: 55,
  BENIH_TANAMAN_LAIN: 56,
  KOTORAN_BENIH: 57,
  DAYA_BERKECAMBAH: 58,
  
  // Upload dokumen
  DOC_PERMOHONAN: 59,
  DOC_PEMERIKSAAN_PERTANAMAN: 60,
  DOC_UJI_LAB: 61,
  DOC_SERTIFIKASI: 62
} as const;

// Fungsi utilitas untuk format tanggal
export const formatDateForExcel = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  } catch (error) {
    return '';
  }
};

// Fungsi untuk menentukan status produsen
export const getProducerStatus = (companyName: string): { [key: string]: string } => {
  const status = {
    BUMN: '',
    SWASTA: '',
    PERORANGAN: '',
    DINAS: '',
    ST_PROVINSI: '',
    LITBANGDA: ''
  };
  
  // Default ke SWASTA, bisa disesuaikan dengan logika yang lebih kompleks
  status.SWASTA = 'v';
  
  // Logika penentuan status berdasarkan nama perusahaan
  if (companyName) {
    const lowerName = companyName.toLowerCase();
    
    if (lowerName.includes('pt') || lowerName.includes('cv') || lowerName.includes('ud')) {
      status.SWASTA = 'v';
      status.BUMN = '';
    } else if (lowerName.includes('bumn') || lowerName.includes('pertani') || lowerName.includes('bulog')) {
      status.BUMN = 'v';
      status.SWASTA = '';
    } else if (lowerName.includes('dinas') || lowerName.includes('pemda')) {
      status.DINAS = 'v';
      status.SWASTA = '';
    } else if (lowerName.includes('balai') || lowerName.includes('litbang')) {
      status.LITBANGDA = 'v';
      status.SWASTA = '';
    }
  }
  
  return status;
};

// Fungsi utama untuk mapping data produksi ke row template
export const mapProductionToTemplateRow = (
  production: ExportProductionData, 
  index: number
): (string | number)[] => {
  const row = new Array(65).fill(''); // Total 65 kolom berdasarkan analisis template
  
  // Basic information
  row[COLUMN_MAPPING.NO] = index + 1;
  row[COLUMN_MAPPING.PROVINSI] = 'JAWA TIMUR'; // Default, bisa disesuaikan
  row[COLUMN_MAPPING.JENIS_BENIH] = production.product?.name || '';
  row[COLUMN_MAPPING.NAMA_PRODUSEN] = production.company?.name || '';
  row[COLUMN_MAPPING.ALAMAT_PRODUSEN] = ''; // Perlu ditambahkan alamat di database company
  
  // Status produsen
  const producerStatus = getProducerStatus(production.company?.name || '');
  row[COLUMN_MAPPING.STATUS_BUMN] = producerStatus.BUMN;
  row[COLUMN_MAPPING.STATUS_SWASTA] = producerStatus.SWASTA;
  row[COLUMN_MAPPING.STATUS_PERORANGAN] = producerStatus.PERORANGAN;
  row[COLUMN_MAPPING.STATUS_DINAS] = producerStatus.DINAS;
  row[COLUMN_MAPPING.STATUS_ST_PROVINSI] = producerStatus.ST_PROVINSI;
  row[COLUMN_MAPPING.STATUS_LITBANGDA] = producerStatus.LITBANGDA;
  
  // Target sertifikasi
  row[COLUMN_MAPPING.TARGET_LUAS_SERTIFIKASI] = production.target_certification_wide || '';
  row[COLUMN_MAPPING.TARGET_KELAS_BENIH] = production.target_kelas_benih?.name || '';
  row[COLUMN_MAPPING.TARGET_PRODUKSI_BENIH] = production.target_seed_production || '';
  
  // Asal benih sumber
  row[COLUMN_MAPPING.PRODUSEN_BENIH_SUMBER] = production.seed_source_company?.name || '';
  row[COLUMN_MAPPING.VARIETAS_SUMBER] = `${production.seed_source_male_varietas?.name || ''} x ${production.seed_source_female_varietas?.name || ''}`.trim().replace(' x ', ' x ');
  row[COLUMN_MAPPING.NOMOR_SERI_SUMBER] = production.seed_source_serial_number || '';
  row[COLUMN_MAPPING.KELAS_BENIH_SUMBER] = production.seed_source_kelas_benih?.name || '';
  row[COLUMN_MAPPING.NOMOR_LOT_SUMBER] = `${production.seed_source_male_lot_number || ''} / ${production.seed_source_female_lot_number || ''}`.trim();
  
  // Realisasi sertifikasi
  row[COLUMN_MAPPING.REALISASI_LUAS_SERTIFIKASI] = production.cert_realization_wide || '';
  row[COLUMN_MAPPING.REALISASI_PRODUKSI_CALON_BENIH] = production.cert_realization_seed_production || '';
  row[COLUMN_MAPPING.TGL_PANEN] = formatDateForExcel(production.cert_realization_tanggal_panen);
  
  // Lot information
  row[COLUMN_MAPPING.NOMOR_LOT] = production.lot_number || '';
  row[COLUMN_MAPPING.KELAS_BENIH_LOT] = production.lot_kelas_benih?.name || '';
  row[COLUMN_MAPPING.VARIETAS_LOT] = production.lot_varietas?.name || '';
  row[COLUMN_MAPPING.VOLUME_LOT] = production.lot_volume || '';
  row[COLUMN_MAPPING.ISI_KEMASAN] = production.lot_content || '';
  row[COLUMN_MAPPING.JUMLAH_LOT] = production.lot_total || '';
  
  // Hasil pemeriksaan laboratorium
  row[COLUMN_MAPPING.NOMOR_INDUK_SERTIFIKASI] = production.lab_result_certification_number || '';
  row[COLUMN_MAPPING.TANGGAL_AJU] = formatDateForExcel(production.lab_result_filing_date);
  row[COLUMN_MAPPING.TANGGAL_UJI] = formatDateForExcel(production.lab_result_testing_date);
  row[COLUMN_MAPPING.TANGGAL_SELESAI_UJI] = formatDateForExcel(production.lab_result_tested_date);
  row[COLUMN_MAPPING.HASIL_UJI] = production.lab_result_test_result || '';
  row[COLUMN_MAPPING.TGL_BERAKHIR_LABEL] = formatDateForExcel(production.lab_result_expired_date);
  row[COLUMN_MAPPING.NOMOR_SERI_LABEL] = production.lab_result_serial_number || '';
  
  // Parameter uji
  row[COLUMN_MAPPING.KADAR_AIR] = production.test_param_kadar_air || '';
  row[COLUMN_MAPPING.BENIH_MURNI] = production.test_param_benih_murni || '';
  row[COLUMN_MAPPING.CAMPURAN_VARIETAS_LAIN] = production.test_param_campuran_varietas_lain || '';
  row[COLUMN_MAPPING.BENIH_TANAMAN_LAIN] = production.test_param_benih_tanaman_lain || '';
  row[COLUMN_MAPPING.KOTORAN_BENIH] = production.test_param_kotoran_benih || '';
  row[COLUMN_MAPPING.DAYA_BERKECAMBAH] = production.test_param_daya_berkecambah || '';
  
  // Upload dokumen - menunjukkan status upload
  row[COLUMN_MAPPING.DOC_PERMOHONAN] = production.docs_form_permohonan ? 'UPLOADED' : '';
  row[COLUMN_MAPPING.DOC_PEMERIKSAAN_PERTANAMAN] = production.docs_pemeriksaan_pertamanan ? 'UPLOADED' : '';
  row[COLUMN_MAPPING.DOC_UJI_LAB] = production.docs_uji_lab ? 'UPLOADED' : '';
  row[COLUMN_MAPPING.DOC_SERTIFIKASI] = production.docs_sertifikasi ? 'UPLOADED' : '';
  
  return row;
};

// Fungsi untuk membuat worksheet Excel dengan format template
export const createCertificationWorksheet = (productions: ExportProductionData[]): XLSX.WorkSheet => {
  const worksheetData: (string | number)[][] = [];
  
  // Row 0: Catatan
  worksheetData[0] = CERTIFICATION_TEMPLATE_HEADERS.catatan;
  
  // Row 1: Empty
  worksheetData[1] = [];
  
  // Row 2-6: Headers
  worksheetData[2] = CERTIFICATION_TEMPLATE_HEADERS.mainHeaders;
  worksheetData[3] = CERTIFICATION_TEMPLATE_HEADERS.subHeaders1;
  worksheetData[4] = CERTIFICATION_TEMPLATE_HEADERS.subHeaders2;
  worksheetData[5] = CERTIFICATION_TEMPLATE_HEADERS.detailHeaders;
  worksheetData[6] = CERTIFICATION_TEMPLATE_HEADERS.statusHeaders;
  
  // Row 7+: Data rows
  productions.forEach((production, index) => {
    const rowIndex = 7 + index;
    worksheetData[rowIndex] = mapProductionToTemplateRow(production, index);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // NO
    { wch: 15 },  // PROVINSI
    { wch: 20 },  // JENIS BENIH
    { wch: 25 },  // NAMA PRODUSEN
    { wch: 35 },  // ALAMAT
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, // Status columns
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, // Process certification
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, // More process
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, // Even more process
    { wch: 15 }, { wch: 15 }, { wch: 15 }, // Target
    { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, // Source seed
    { wch: 15 }, { wch: 20 }, { wch: 12 }, // Realization
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, // Lot info
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, // Lab results
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, // Parameter uji
    { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 } // Upload dokumen
  ];
  
  worksheet['!cols'] = colWidths;

  // Set row heights for header rows
  worksheet['!rows'] = [
    { hpt: 25 }, // Row 0 - Catatan
    { hpt: 15 }, // Row 1 - Empty
    { hpt: 20 }, // Row 2 - Main headers
    { hpt: 20 }, // Row 3 - Sub headers 1
    { hpt: 15 }, // Row 4 - Sub headers 2
    { hpt: 20 }, // Row 5 - Detail headers
    { hpt: 15 }, // Row 6 - Status headers
  ];

  return worksheet;
};

// Fungsi untuk generate file Excel lengkap
export const generateExcelFile = (
  productions: ExportProductionData[],
  filename?: string
): Buffer => {
  const workbook = XLSX.utils.book_new();
  const worksheet = createCertificationWorksheet(productions);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produksi');

  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    bookSST: false,
    compression: true 
  });
};

// Fungsi validasi data sebelum export
export const validateProductionData = (production: ExportProductionData): string[] => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!production.lot_number) {
    errors.push('Nomor lot tidak boleh kosong');
  }
  
  if (!production.product?.name) {
    errors.push('Nama produk tidak boleh kosong');
  }
  
  if (!production.company?.name) {
    errors.push('Nama perusahaan tidak boleh kosong');
  }
  
  if (!production.lab_result_certification_number) {
    errors.push('Nomor induk sertifikasi tidak boleh kosong');
  }
  
  if (!production.lab_result_serial_number) {
    errors.push('Nomor seri label tidak boleh kosong');
  }
  
  // Date validation
  const requiredDates = [
    { field: 'cert_realization_tanggal_panen', name: 'Tanggal panen' },
    { field: 'lab_result_filing_date', name: 'Tanggal aju' },
    { field: 'lab_result_testing_date', name: 'Tanggal uji' },
    { field: 'lab_result_tested_date', name: 'Tanggal selesai uji' },
    { field: 'lab_result_expired_date', name: 'Tanggal berakhir label' }
  ];
  
  requiredDates.forEach(({ field, name }) => {
    const value = production[field as keyof ExportProductionData] as string;
    if (!value) {
      errors.push(`${name} tidak boleh kosong`);
    } else if (isNaN(Date.parse(value))) {
      errors.push(`${name} format tidak valid`);
    }
  });
  
  // Numeric validation
  const requiredNumbers = [
    { field: 'lot_volume', name: 'Volume lot' },
    { field: 'lot_content', name: 'Isi kemasan' },
    { field: 'lot_total', name: 'Jumlah total' },
    { field: 'lab_result_test_result', name: 'Hasil uji' },
    { field: 'test_param_kadar_air', name: 'Kadar air' },
    { field: 'test_param_benih_murni', name: 'Benih murni' },
    { field: 'test_param_daya_berkecambah', name: 'Daya berkecambah' }
  ];
  
  requiredNumbers.forEach(({ field, name }) => {
    const value = production[field as keyof ExportProductionData];
    if (value === null || value === undefined || value === '') {
      errors.push(`${name} tidak boleh kosong`);
    } else if (isNaN(Number(value))) {
      errors.push(`${name} harus berupa angka`);
    }
  });
  
  return errors;
};

// Fungsi untuk batch validation
export const validateProductionsForExport = (productions: ExportProductionData[]): {
  validProductions: ExportProductionData[];
  invalidProductions: { production: ExportProductionData; errors: string[] }[];
  summary: { total: number; valid: number; invalid: number };
} => {
  const validProductions: ExportProductionData[] = [];
  const invalidProductions: { production: ExportProductionData; errors: string[] }[] = [];
  
  productions.forEach(production => {
    const errors = validateProductionData(production);
    
    if (errors.length === 0) {
      validProductions.push(production);
    } else {
      invalidProductions.push({ production, errors });
    }
  });
  
  return {
    validProductions,
    invalidProductions,
    summary: {
      total: productions.length,
      valid: validProductions.length,
      invalid: invalidProductions.length
    }
  };
};

// Constants untuk export statistics
export const EXPORT_STATS = {
  MAX_ROWS_PER_SHEET: 1000,
  SUPPORTED_FORMATS: ['xlsx', 'csv'] as const,
  DEFAULT_FILENAME: 'export_produksi_sertifikasi',
  TEMPLATE_VERSION: 'V4_CL_39_45'
} as const;

// Export type untuk filter options
export type ExportFilterOptions = {
  status: 'all' | 'not_generated' | 'generated';
  lotNumbers?: string[];
  dateFrom?: string;
  dateTo?: string;
  selectedCompany?: string;
  selectedProduct?: string;
  productionIds?: number[];
};

// Helper function untuk generate filename dengan timestamp dan filter info
export const generateExportFilename = (
  filterOptions: ExportFilterOptions,
  format: 'xlsx' | 'csv' = 'xlsx'
): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const statusText = filterOptions.status === 'not_generated' ? 'belum_generate' : 
                    filterOptions.status === 'generated' ? 'sudah_generate' : 'semua';
  
  let filename = `${EXPORT_STATS.DEFAULT_FILENAME}_${statusText}_${timestamp}`;
  
  if (filterOptions.selectedCompany) {
    filename += `_${filterOptions.selectedCompany.replace(/\s+/g, '_').toLowerCase()}`;
  }
  
  if (filterOptions.selectedProduct) {
    filename += `_${filterOptions.selectedProduct.replace(/\s+/g, '_').toLowerCase()}`;
  }
  
  return `${filename}.${format}`;
};