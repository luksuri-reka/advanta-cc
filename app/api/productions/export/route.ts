// app/api/productions/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

// Buat Supabase client
const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
};

// Template structure berdasarkan analisis file Excel yang diupload
const TEMPLATE_HEADERS = {
  row2: [
    'NO', 'PROVINSI', 'JENIS BENIH', 'PRODUSEN', '', '', '', '', '', '', '',
    'PROSES SERTIFIKASI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'PERMOHONAN SERTIFIKASI', '', '', '', '', '', '', '',
    'REALISASI SERTIFIKASI (FORM 3)', '', '',
    'PROSES SERTIFIKASI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'UPLOAD DOKUMEN', '', '', ''
  ],
  row3: [
    '', '', '', 'NAMA', 'ALAMAT', 'STATUS', '', '', '', '', '',
    'PERMOHONAN (FORM 1)', '', '', 'PENDAHULUAN (FORM 5)', '', '', 'PEMERIKSAAN TANAMAN  (FORM 3)', '', '',
    '', '', '', '', '', '', 'PEMERIKSAAN PASCA PANEN (FORM 4)', '', '',
    '', '', '', 'ASAL BENIH SUMBER', '', '', '', '', '', '', '',
    'LOT', '', '', '', '', '', 'HASIL PEMERIKSAAN LABORATORIUM', '', '', '', '', '', '',
    'PARAMETER UJI (%)', '', '', '', '', '', '', '', '', ''
  ],
  row4: [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'I', '', '', 'II', '', '', 'III', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ],
  row5: [
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
  row6: [
    '', '', '', '', '', '', '', '', '', '', '', '', 'LULUS', 'TIDAK LULUS', '', 'MEMENUHI SYARAT', 'TIDAK MEMENUHI SYARAT',
    '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS', '', 'LULUS', 'TIDAK LULUS',
    'LUAS SERTIFIKASI (HA)', 'KELAS BENIH', 'PRODUKSI BENIH (KG)', 'PRODUSEN BENIH', 'VARIETAS', 'NOMOR SERI LABEL',
    'KELAS BENIH', 'NOMOR LOT', 'LUAS SERTIFIKASI (HA)', 'PRODUKSI CALON BENIH (KG)', 'TGL PANEN',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]
};

// Fungsi untuk format tanggal ke format YYYY-MM-DD
const formatDateForExcel = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Fungsi untuk mapping data produksi ke format template
const mapProductionToTemplateRow = (production: any, index: number) => {
  const row = new Array(65).fill(''); // Total 65 kolom berdasarkan template
  
  // Column A: NO
  row[0] = index + 1;
  
  // Column B: PROVINSI (ambil dari alamat perusahaan atau set default)
  row[1] = 'JAWA TIMUR'; // Default, bisa disesuaikan dengan data perusahaan
  
  // Column C: JENIS BENIH
  row[2] = 'Jagung Hibrida';
  
  // Column D: NAMA PRODUSEN
  row[3] = production.company?.name || '';
  
  // Column E: ALAMAT (bisa diambil dari data company jika ada)
  row[4] = 'Jl. Kraton Industri Raya No.15, Curah Dukuh Barat, PIER, Kec. Kraton, Pasuruan, Jawa Timur - Indonesia'; // Perlu ditambahkan alamat di database company
  
  // Column F-K: STATUS PRODUSEN (BUMN, SWASTA, dll) - set SWASTA default
  row[6] = 'v'; // SWASTA
  
  // Column L-AC: PROSES SERTIFIKASI - kosongkan dulu atau isi default
  // Ini untuk form-form sertifikasi yang biasanya diisi manual
  
  // Column AD: TARGET LUAS SERTIFIKASI
  row[29] = production.target_certification_wide || '';
  
  // Column AE: TARGET KELAS BENIH
  row[30] = production.target_kelas_benih?.name || '';
  
  // Column AF: TARGET PRODUKSI BENIH
  row[31] = production.target_seed_production || '';
  
  // Column AG: PRODUSEN BENIH SUMBER
  row[32] = production.seed_source_company?.name || '';
  
  // Column AH: VARIETAS SUMBER
  row[33] = `${production.seed_source_male_varietas?.name || ''};${production.seed_source_female_varietas?.name || ''}`.trim();
  
  // Column AI: NOMOR SERI SUMBER
  row[34] = '-';
  
  // Column AJ: KELAS BENIH SUMBER
  row[35] = production.seed_source_kelas_benih?.name || '';
  
  // Column AK: NOMOR LOT SUMBER
  row[36] = `${production.seed_source_male_lot_number || ''};${production.seed_source_female_lot_number || ''}`.trim();
  
  // Column AL: REALISASI LUAS SERTIFIKASI
  row[37] = production.cert_realization_wide || '';
  
  // Column AM: REALISASI PRODUKSI CALON BENIH
  row[38] = production.cert_realization_seed_production || '';
  
  // Column AN: TANGGAL PANEN
  row[39] = formatDateForExcel(production.cert_realization_tanggal_panen);
  
  // Column AO: NOMOR LOT
  row[40] = production.lot_number || '';
  
  // Column AP: KELAS BENIH LOT
  row[41] = production.lot_kelas_benih?.name || '';
  
  // Column AQ: VARIETAS LOT
  row[42] = production.lot_varietas?.name || '';
  
  // Column AR: VOLUME
  row[43] = production.lot_volume || '';
  
  // Column AS: ISI KEMASAN
  row[44] = production.lot_content || '';
  
  // Column AT: JUMLAH
  row[45] = production.lot_total || '';
  
  // Column AU: NOMOR INDUK SERTIFIKASI
  row[46] = production.lab_result_certification_number || '';
  
  // Column AV: TANGGAL AJU
  row[47] = formatDateForExcel(production.lab_result_filing_date);
  
  // Column AW: TANGGAL UJI
  row[48] = formatDateForExcel(production.lab_result_testing_date);
  
  // Column AX: TANGGAL SELESAI UJI
  row[49] = formatDateForExcel(production.lab_result_tested_date);
  
  // Column AY: HASIL UJI
  row[50] = production.lab_result_test_result || '';
  
  // Column AZ: TANGGAL BERAKHIR LABEL
  row[51] = formatDateForExcel(production.lab_result_expired_date);
  
  // Column BA: NOMOR SERI LABEL
  row[52] = production.lab_result_serial_number || '';
  
  // Column BB-BG: PARAMETER UJI
  row[53] = production.test_param_kadar_air || '';
  row[54] = production.test_param_benih_murni || '';
  row[55] = production.test_param_campuran_varietas_lain || '';
  row[56] = production.test_param_benih_tanaman_lain || '';
  row[57] = production.test_param_kotoran_benih || '';
  row[58] = production.test_param_daya_berkecambah || '';
  
  // Column BH-BK: UPLOAD DOKUMEN - bisa diisi dengan status atau link
  row[59] = production.docs_form_permohonan ? 'UPLOADED' : '';
  row[60] = production.docs_pemeriksaan_pertamanan ? 'UPLOADED' : '';
  row[61] = production.docs_uji_lab ? 'UPLOADED' : '';
  row[62] = production.docs_sertifikasi ? 'UPLOADED' : '';
  
  return row;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    
    const {
      status,
      lotNumbers,
      dateFrom,
      dateTo,
      selectedCompany,
      selectedProduct,
      productionIds
    } = body;

    // Build query
    let query = supabase
      .from('productions')
      .select(`
        id, group_number, lot_number, code_1, code_2, code_3, code_4, clearance_number,
        target_certification_wide, target_seed_production, cert_realization_wide, 
        cert_realization_seed_production, cert_realization_tanggal_panen,
        seed_source_serial_number, seed_source_male_lot_number, seed_source_female_lot_number,
        lot_volume, lot_content, lot_total, import_qr_at,
        lab_result_certification_number, lab_result_test_result, lab_result_incoming_date,
        lab_result_filing_date, lab_result_testing_date, lab_result_tested_date, 
        lab_result_serial_number, lab_result_expired_date,
        test_param_kadar_air, test_param_benih_murni, test_param_campuran_varietas_lain,
        test_param_benih_tanaman_lain, test_param_kotoran_benih, test_param_daya_berkecambah,
        docs_form_permohonan, docs_pemeriksaan_pertamanan, docs_uji_lab, docs_sertifikasi,
        product:product_id(id, name),
        company:company_id(id, name),
        target_kelas_benih:target_kelas_benih_id(id, name),
        seed_source_company:seed_source_company_id(id, name),
        seed_source_male_varietas:seed_source_male_varietas_id(id, name),
        seed_source_female_varietas:seed_source_female_varietas_id(id, name),
        seed_source_kelas_benih:seed_source_kelas_benih_id(id, name),
        lot_kelas_benih:lot_kelas_benih_id(id, name),
        lot_varietas:lot_varietas_id(id, name)
      `);

    // Apply filters
    if (productionIds && productionIds.length > 0) {
      query = query.in('id', productionIds);
    }

    if (status === 'generated') {
      query = query.not('import_qr_at', 'is', null);
    } else if (status === 'not_generated') {
      query = query.is('import_qr_at', null);
    }

    if (lotNumbers && lotNumbers.length > 0) {
      query = query.in('lot_number', lotNumbers);
    }

    if (dateFrom) {
      query = query.gte('cert_realization_tanggal_panen', dateFrom);
    }

    if (dateTo) {
      query = query.lte('cert_realization_tanggal_panen', dateTo);
    }

    const { data: productions, error } = await query.order('cert_realization_tanggal_panen', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Gagal mengambil data dari database' }, { status: 500 });
    }

    if (!productions || productions.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diekspor' }, { status: 400 });
    }

    console.log(`Exporting ${productions.length} productions`);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data
    const worksheetData = [];
    
    // Row 0: Catatan
    worksheetData[0] = ['CATATAN', '', 'MOHON JANGAN MENGUBAH SUSUNAN KOLOM PADA TEMPLATE EXCEL DIBAWAH INI AGAR PROSES UPLOAD BERJALAN DENGAN LANCAR'];
    
    // Row 1: Empty
    worksheetData[1] = [];
    
    // Row 2-6: Headers
    worksheetData[2] = TEMPLATE_HEADERS.row2;
    worksheetData[3] = TEMPLATE_HEADERS.row3;
    worksheetData[4] = TEMPLATE_HEADERS.row4;
    worksheetData[5] = TEMPLATE_HEADERS.row5;
    worksheetData[6] = TEMPLATE_HEADERS.row6;
    
    // Row 7: Data rows
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
      { wch: 30 },  // ALAMAT
      { wch: 8 },   // STATUS columns
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      // ... more columns with appropriate widths
    ];
    
    // Fill remaining columns with default width
    while (colWidths.length < 65) {
      colWidths.push({ wch: 12 });
    }
    
    worksheet['!cols'] = colWidths;

    // Set row heights for header rows
    worksheet['!rows'] = [
      { hpt: 20 }, // Row 0
      { hpt: 15 }, // Row 1
      { hpt: 20 }, // Row 2
      { hpt: 20 }, // Row 3
      { hpt: 15 }, // Row 4
      { hpt: 20 }, // Row 5
      { hpt: 15 }, // Row 6
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produksi');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
      compression: true 
    });

    // Create response with proper headers
    const response = new NextResponse(excelBuffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', `attachment; filename="export_produksi_${Date.now()}.xlsx"`);
    response.headers.set('Content-Length', excelBuffer.length.toString());

    return response;

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan saat mengekspor data',
      details: error.message 
    }, { status: 500 });
  }
}