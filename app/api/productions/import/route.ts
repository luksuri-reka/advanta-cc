// app/api/productions/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface ImportRow {
  [key: string]: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Setup Supabase client
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

    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File kosong atau tidak valid' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Get reference data untuk validasi dan JSONB
    const [productsRes, companiesRes, varietasRes, kelasBenihRes] = await Promise.all([
      supabase.from('products').select('id, name'),
      supabase.from('companies').select('id, name'),
      supabase.from('varietas').select('id, name'),
      supabase.from('kelas_benih').select('id, name')
    ]);

    const productMap = new Map(productsRes.data?.map(p => [p.id.toString(), p]) || []);
    const companyMap = new Map(companiesRes.data?.map(c => [c.id.toString(), c]) || []);
    const varietasMap = new Map(varietasRes.data?.map(v => [v.id.toString(), v]) || []);
    const kelasBenihMap = new Map(kelasBenihRes.data?.map(kb => [kb.id.toString(), kb]) || []);

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // +2 because of header and 0-based index
      
      try {
        const values = dataRows[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: ImportRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validasi field wajib
        const requiredFields = ['product_id', 'group_number', 'company_id', 'lot_number'];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          errors.push(`Baris ${rowNum}: Field wajib kosong: ${missingFields.join(', ')}`);
          skipped++;
          continue;
        }

        // Validasi referensi data exists
        if (!productMap.has(row.product_id)) {
          errors.push(`Baris ${rowNum}: Product ID ${row.product_id} tidak ditemukan`);
          skipped++;
          continue;
        }

        if (!companyMap.has(row.company_id)) {
          errors.push(`Baris ${rowNum}: Company ID ${row.company_id} tidak ditemukan`);
          skipped++;
          continue;
        }

        // Cek duplikasi berdasarkan kombinasi unique
        const { data: existingData } = await supabase
          .from('productions')
          .select('id')
          .eq('group_number', row.group_number)
          .eq('lot_number', row.lot_number)
          .single();

        if (existingData) {
          errors.push(`Baris ${rowNum}: Data dengan group_number ${row.group_number} dan lot_number ${row.lot_number} sudah ada`);
          skipped++;
          continue;
        }

        // Transform data untuk insert
        const productionData = {
          product_id: parseInt(row.product_id),
          product: productMap.get(row.product_id),
          group_number: row.group_number,
          code_1: row.code_1 || 'A',
          code_2: row.code_2 || 'B',
          code_3: row.code_3 || 'C',
          code_4: row.code_4 || 'D',
          clearance_number: row.clearance_number || null,
          company_id: parseInt(row.company_id),
          company: companyMap.get(row.company_id),
          target_certification_wide: parseFloat(row.target_certification_wide) || null,
          target_kelas_benih_id: row.target_kelas_benih_id ? parseInt(row.target_kelas_benih_id) : null,
          target_kelas_benih: row.target_kelas_benih_id ? kelasBenihMap.get(row.target_kelas_benih_id) : null,
          target_seed_production: parseFloat(row.target_seed_production) || null,
          seed_source_company_id: parseInt(row.seed_source_company_id || row.company_id),
          seed_source_company: companyMap.get(row.seed_source_company_id || row.company_id),
          seed_source_male_varietas_id: parseInt(row.seed_source_male_varietas_id || '1'),
          seed_source_male_varietas: varietasMap.get(row.seed_source_male_varietas_id || '1'),
          seed_source_female_varietas_id: parseInt(row.seed_source_female_varietas_id || '1'),
          seed_source_female_varietas: varietasMap.get(row.seed_source_female_varietas_id || '1'),
          seed_source_kelas_benih_id: parseInt(row.seed_source_kelas_benih_id || '1'),
          seed_source_kelas_benih: kelasBenihMap.get(row.seed_source_kelas_benih_id || '1'),
          seed_source_serial_number: row.seed_source_serial_number || null,
          seed_source_male_lot_number: row.seed_source_male_lot_number || 'LOT-M-001',
          seed_source_female_lot_number: row.seed_source_female_lot_number || 'LOT-F-001',
          cert_realization_wide: parseFloat(row.cert_realization_wide) || null,
          cert_realization_seed_production: row.cert_realization_seed_production || null,
          cert_realization_tanggal_panen: row.cert_realization_tanggal_panen || null,
          lot_number: row.lot_number,
          lot_kelas_benih_id: parseInt(row.lot_kelas_benih_id || '1'),
          lot_kelas_benih: kelasBenihMap.get(row.lot_kelas_benih_id || '1'),
          lot_varietas_id: parseInt(row.lot_varietas_id || '1'),
          lot_varietas: varietasMap.get(row.lot_varietas_id || '1'),
          lot_volume: parseFloat(row.lot_volume) || 0,
          lot_content: parseFloat(row.lot_content) || 0,
          lot_total: parseInt(row.lot_total) || 0,
          lab_result_certification_number: row.lab_result_certification_number || 'CERT-001',
          lab_result_test_result: parseFloat(row.lab_result_test_result) || 0,
          lab_result_incoming_date: row.lab_result_incoming_date || null,
          lab_result_filing_date: row.lab_result_filing_date || new Date().toISOString().split('T')[0],
          lab_result_testing_date: row.lab_result_testing_date || new Date().toISOString().split('T')[0],
          lab_result_tested_date: row.lab_result_tested_date || new Date().toISOString().split('T')[0],
          lab_result_serial_number: row.lab_result_serial_number || 'SER-001',
          lab_result_expired_date: row.lab_result_expired_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
          test_param_kadar_air: parseFloat(row.test_param_kadar_air) || 0,
          test_param_benih_murni: parseFloat(row.test_param_benih_murni) || 0,
          test_param_campuran_varietas_lain: parseFloat(row.test_param_campuran_varietas_lain) || 0,
          test_param_benih_tanaman_lain: parseFloat(row.test_param_benih_tanaman_lain) || 0,
          test_param_kotoran_benih: parseFloat(row.test_param_kotoran_benih) || 0,
          test_param_daya_berkecambah: parseFloat(row.test_param_daya_berkecambah) || 0,
        };

        // Insert ke database
        const { error: insertError } = await supabase
          .from('productions')
          .insert(productionData);

        if (insertError) {
          errors.push(`Baris ${rowNum}: Gagal menyimpan - ${insertError.message}`);
          skipped++;
        } else {
          imported++;
        }

      } catch (error) {
        errors.push(`Baris ${rowNum}: Error processing - ${error}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: imported > 0,
      imported,
      skipped,
      errors: errors.slice(0, 50), // Limit error messages
      totalProcessed: dataRows.length
    });

  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Gagal mengimpor data' },
      { status: 500 }
    );
  }
}