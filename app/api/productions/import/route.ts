// app/api/productions/import/route.ts - Enhanced version
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

interface ImportRow {
  [key: string]: string;
}

// Helper function to parse Excel files
async function parseExcelFile(file: File): Promise<{ headers: string[], dataRows: string[][] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  
  // Ambil sheet pertama
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert ke array
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
  
  if (jsonData.length < 2) {
    throw new Error('File Excel kosong atau tidak memiliki data');
  }
  
  const headers = (jsonData[0] as string[]).map(h => String(h).trim());
  const dataRows = jsonData.slice(1).map(row => 
    (row as any[]).map(cell => String(cell || '').trim())
  );
  
  return { headers, dataRows };
}

// Helper function to parse CSV files
async function parseCSVFile(file: File): Promise<{ headers: string[], dataRows: string[][] }> {
  const fileContent = await file.text();
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('File CSV kosong atau tidak valid');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1).map(line => 
    line.split(',').map(v => v.trim().replace(/"/g, ''))
  );
  
  return { headers, dataRows };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    );

    // Parse file berdasarkan tipe
    let headers: string[];
    let dataRows: string[][];
    
    if (file.type.includes('sheet') || file.type.includes('excel')) {
      // Excel file
      const excelData = await parseExcelFile(file);
      headers = excelData.headers;
      dataRows = excelData.dataRows;
    } else {
      // CSV file
      const csvData = await parseCSVFile(file);
      headers = csvData.headers;
      dataRows = csvData.dataRows;
    }

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Ambil data referensi lengkap
    const [productsRes, companiesRes, varietasRes, kelasBenihRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('companies').select('*'),
      supabase.from('varietas').select('*'),
      supabase.from('kelas_benih').select('*')
    ]);

    const productMap = new Map(productsRes.data?.map(p => [p.id.toString(), p]) || []);
    const companyMap = new Map(companiesRes.data?.map(c => [c.id.toString(), c]) || []);
    const varietasMap = new Map(varietasRes.data?.map(v => [v.id.toString(), v]) || []);
    const kelasBenihMap = new Map(kelasBenihRes.data?.map(kb => [kb.id.toString(), kb]) || []);

    const productionsToInsert = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // Excel/CSV row numbering starts from 2 (header is row 1)
      
      try {
        const values = dataRows[i];
        const row: ImportRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validasi field wajib
        if (!row.product_id || !row.company_id) {
          errors.push(`Baris ${rowNum}: product_id dan company_id wajib diisi`);
          skipped++;
          continue;
        }

        // Ambil data produk lengkap & modifikasi foto
        const productDataFromMap = productMap.get(row.product_id);
        let finalProductJsonb = null;
        if (productDataFromMap) {
            finalProductJsonb = { ...productDataFromMap }; 
            if (finalProductJsonb.photo && !finalProductJsonb.photo.startsWith('http')) {
                finalProductJsonb.photo = `https://bstxdyyglxrrfqgohllz.supabase.co/storage/v1/object/public/product-photos/${finalProductJsonb.photo}`;
            }
        }
        
        const lotTotalValue = row.lot_total;

        const productionData = {
          product_id: parseInt(row.product_id),
          product: finalProductJsonb,
          group_number: row.group_number,
          code_1: row.code_1,
          code_2: row.code_2,
          code_3: row.code_3,
          code_4: row.code_4,
          clearance_number: row.clearance_number || null,
          company_id: parseInt(row.company_id),
          company: companyMap.get(row.company_id) || null,
          target_certification_wide: parseFloat(row.target_certification_wide) || null,
          target_kelas_benih_id: row.target_kelas_benih_id ? parseInt(row.target_kelas_benih_id) : null,
          target_kelas_benih: kelasBenihMap.get(row.target_kelas_benih_id) || null,
          target_seed_production: parseFloat(row.target_seed_production) || null,
          seed_source_company_id: parseInt(row.seed_source_company_id),
          seed_source_company: companyMap.get(row.seed_source_company_id) || null,
          seed_source_male_varietas_id: parseInt(row.seed_source_male_varietas_id),
          seed_source_male_varietas: varietasMap.get(row.seed_source_male_varietas_id) || null,
          seed_source_female_varietas_id: parseInt(row.seed_source_female_varietas_id),
          seed_source_female_varietas: varietasMap.get(row.seed_source_female_varietas_id) || null,
          seed_source_kelas_benih_id: parseInt(row.seed_source_kelas_benih_id),
          seed_source_kelas_benih: kelasBenihMap.get(row.seed_source_kelas_benih_id) || null,
          seed_source_serial_number: row.seed_source_serial_number || null,
          seed_source_male_lot_number: row.seed_source_male_lot_number,
          seed_source_female_lot_number: row.seed_source_female_lot_number,
          cert_realization_wide: parseFloat(row.cert_realization_wide) || null,
          cert_realization_seed_production: row.cert_realization_seed_production || null,
          cert_realization_tanggal_panen: row.cert_realization_tanggal_panen || null,
          lot_number: row.lot_number,
          lot_kelas_benih_id: parseInt(row.lot_kelas_benih_id),
          lot_kelas_benih: kelasBenihMap.get(row.lot_kelas_benih_id) || null,
          lot_varietas_id: parseInt(row.lot_varietas_id),
          lot_varietas: varietasMap.get(row.lot_varietas_id) || null,
          lot_volume: parseFloat(row.lot_volume) || 0,
          lot_content: parseFloat(row.lot_content) || 0,
          lot_total: lotTotalValue ? Math.round(parseFloat(lotTotalValue)) : 0,
          lab_result_certification_number: row.lab_result_certification_number,
          lab_result_test_result: parseFloat(row.lab_result_test_result) || 0,
          lab_result_incoming_date: row.lab_result_incoming_date || null,
          lab_result_filing_date: row.lab_result_filing_date,
          lab_result_testing_date: row.lab_result_testing_date,
          lab_result_tested_date: row.lab_result_tested_date,
          lab_result_serial_number: row.lab_result_serial_number,
          lab_result_expired_date: row.lab_result_expired_date,
          test_param_kadar_air: parseFloat(row.test_param_kadar_air) || 0,
          test_param_benih_murni: parseFloat(row.test_param_benih_murni) || 0,
          test_param_campuran_varietas_lain: parseFloat(row.test_param_campuran_varietas_lain) || 0,
          test_param_benih_tanaman_lain: parseFloat(row.test_param_benih_tanaman_lain) || 0,
          test_param_kotoran_benih: parseFloat(row.test_param_kotoran_benih) || 0,
          test_param_daya_berkecambah: parseFloat(row.test_param_daya_berkecambah) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        productionsToInsert.push(productionData);

      } catch (error: any) {
        errors.push(`Baris ${rowNum}: Error processing - ${error.message}`);
        skipped++;
      }
    }

    if (productionsToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('productions')
            .insert(productionsToInsert);

        if (insertError) {
            errors.push(`Gagal menyimpan ke database: ${insertError.message}`);
            skipped += productionsToInsert.length;
        } else {
            imported = productionsToInsert.length;
        }
    }

    revalidatePath('/admin/productions');

    return NextResponse.json({
      success: imported > 0 && errors.length === 0,
      imported,
      skipped,
      errors: errors.slice(0, 50),
      totalProcessed: dataRows.length
    });

  } catch (error: any) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Gagal mengimpor data', details: error.message },
      { status: 500 }
    );
  }
}