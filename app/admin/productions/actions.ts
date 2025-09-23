// app/admin/productions/actions.ts - Enhanced with Bulk Generation
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper untuk membuat Supabase client
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

// Helper untuk mengambil nilai dari FormData dan mengubahnya menjadi null jika kosong
const getNullIfEmpty = (formData: FormData, field: string): string | null => {
  const value = formData.get(field) as string;
  return value === '' ? null : value;
};

// Helper untuk mengambil data relasi untuk disimpan sebagai JSONB
const getJsonbData = async (supabase: any, table: string, id: number | null) => {
    if (id === null) return null;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw new Error(`Gagal mengambil data dari ${table} dengan ID ${id}: ${error.message}`);
    return data;
};

// Helper untuk upload file ke Supabase Storage
const uploadFileToStorage = async (supabase: any, file: File, folder: string, productionId?: number): Promise<string | null> => {
  if (!file || file.size === 0) return null;
  
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('dokumen-pendukung')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Gagal upload ${folder}: ${error.message}`);
    }

    // Return the file path
    return data.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Helper untuk menghapus file dari storage jika ada
const deleteFileFromStorage = async (supabase: any, filePath: string): Promise<void> => {
  if (!filePath) return;
  
  try {
    const { error } = await supabase.storage
      .from('dokumen-pendukung')
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting file:', error);
    }
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error);
  }
};

// Fungsi utama untuk mengambil semua data dari FormData dan memformatnya
async function processProductionFormData(supabase: any, formData: FormData, isUpdate = false, existingData: any = null) {
    const productId = Number(formData.get('product_id'));
    const companyId = Number(formData.get('company_id'));
    const targetKelasBenihId = Number(getNullIfEmpty(formData, 'target_kelas_benih_id'));
    const seedSourceCompanyId = Number(formData.get('seed_source_company_id'));
    const seedSourceMaleVarietasId = Number(formData.get('seed_source_male_varietas_id'));
    const seedSourceFemaleVarietasId = Number(formData.get('seed_source_female_varietas_id'));
    const seedSourceKelasBenihId = Number(formData.get('seed_source_kelas_benih_id'));
    const lotKelasBenihId = Number(formData.get('lot_kelas_benih_id'));
    const lotVarietasId = Number(formData.get('lot_varietas_id'));

    // Handle file uploads untuk dokumen
    const handleFileUpload = async (fieldName: string, folder: string): Promise<string | null> => {
        const file = formData.get(fieldName) as File;
        
        // Jika tidak ada file baru dan ini update, gunakan file yang ada
        if ((!file || file.size === 0) && isUpdate && existingData) {
            return existingData[fieldName] || null;
        }
        
        // Jika ada file baru dan ini update, hapus file lama
        if (file && file.size > 0 && isUpdate && existingData?.[fieldName]) {
            await deleteFileFromStorage(supabase, existingData[fieldName]);
        }
        
        // Upload file baru jika ada
        if (file && file.size > 0) {
            return await uploadFileToStorage(supabase, file, folder);
        }
        
        return null;
    };

    // Ambil data JSONB secara paralel
    const [
        product, company, target_kelas_benih, seed_source_company, 
        seed_source_male_varietas, seed_source_female_varietas, 
        seed_source_kelas_benih, lot_kelas_benih, lot_varietas,
        docs_form_permohonan, docs_pemeriksaan_pertamanan,
        docs_uji_lab, docs_sertifikasi
    ] = await Promise.all([
        getJsonbData(supabase, 'products', productId),
        getJsonbData(supabase, 'companies', companyId),
        getJsonbData(supabase, 'kelas_benih', targetKelasBenihId),
        getJsonbData(supabase, 'companies', seedSourceCompanyId),
        getJsonbData(supabase, 'varietas', seedSourceMaleVarietasId),
        getJsonbData(supabase, 'varietas', seedSourceFemaleVarietasId),
        getJsonbData(supabase, 'kelas_benih', seedSourceKelasBenihId),
        getJsonbData(supabase, 'kelas_benih', lotKelasBenihId),
        getJsonbData(supabase, 'varietas', lotVarietasId),
        handleFileUpload('docs_form_permohonan', 'form-permohonan'),
        handleFileUpload('docs_pemeriksaan_pertamanan', 'pemeriksaan-pertamanan'),
        handleFileUpload('docs_uji_lab', 'uji-lab'),
        handleFileUpload('docs_sertifikasi', 'sertifikasi')
    ]);

    const lotTotalValue = formData.get('lot_total') as string;

    const baseData = {
      product_id: productId,
      product: product,
      group_number: formData.get('group_number') as string,
      code_1: formData.get('code_1') as string,
      code_2: formData.get('code_2') as string,
      code_3: formData.get('code_3') as string,
      code_4: formData.get('code_4') as string,
      clearance_number: getNullIfEmpty(formData, 'clearance_number'),
      company_id: companyId,
      company: company,
      target_certification_wide: Number(getNullIfEmpty(formData, 'target_certification_wide')),
      target_kelas_benih_id: targetKelasBenihId || null,
      target_kelas_benih: target_kelas_benih,
      target_seed_production: Number(getNullIfEmpty(formData, 'target_seed_production')),
      seed_source_company_id: seedSourceCompanyId,
      seed_source_company: seed_source_company,
      seed_source_male_varietas_id: seedSourceMaleVarietasId,
      seed_source_male_varietas: seed_source_male_varietas,
      seed_source_female_varietas_id: seedSourceFemaleVarietasId,
      seed_source_female_varietas: seed_source_female_varietas,
      seed_source_kelas_benih_id: seedSourceKelasBenihId,
      seed_source_kelas_benih: seed_source_kelas_benih,
      seed_source_serial_number: getNullIfEmpty(formData, 'seed_source_serial_number'),
      seed_source_male_lot_number: formData.get('seed_source_male_lot_number') as string,
      seed_source_female_lot_number: formData.get('seed_source_female_lot_number') as string,
      cert_realization_wide: Number(getNullIfEmpty(formData, 'cert_realization_wide')),
      cert_realization_seed_production: getNullIfEmpty(formData, 'cert_realization_seed_production'),
      cert_realization_tanggal_panen: getNullIfEmpty(formData, 'cert_realization_tanggal_panen'),
      lot_number: formData.get('lot_number') as string,
      lot_kelas_benih_id: lotKelasBenihId,
      lot_kelas_benih: lot_kelas_benih,
      lot_varietas_id: lotVarietasId,
      lot_varietas: lot_varietas,
      lot_volume: Number(formData.get('lot_volume')),
      lot_content: Number(formData.get('lot_content')),
      lot_total: lotTotalValue ? Math.round(parseFloat(lotTotalValue)) : 0,
      lab_result_certification_number: formData.get('lab_result_certification_number') as string,
      lab_result_test_result: Number(formData.get('lab_result_test_result')),
      lab_result_incoming_date: getNullIfEmpty(formData, 'lab_result_incoming_date'),
      lab_result_filing_date: formData.get('lab_result_filing_date') as string,
      lab_result_testing_date: formData.get('lab_result_testing_date') as string,
      lab_result_tested_date: formData.get('lab_result_tested_date') as string,
      lab_result_serial_number: formData.get('lab_result_serial_number') as string,
      lab_result_expired_date: formData.get('lab_result_expired_date') as string,
      test_param_kadar_air: Number(formData.get('test_param_kadar_air')),
      test_param_benih_murni: Number(formData.get('test_param_benih_murni')),
      test_param_campuran_varietas_lain: Number(formData.get('test_param_campuran_varietas_lain')),
      test_param_benih_tanaman_lain: Number(formData.get('test_param_benih_tanaman_lain')),
      test_param_kotoran_benih: Number(formData.get('test_param_kotoran_benih')),
      test_param_daya_berkecambah: Number(formData.get('test_param_daya_berkecambah')),
      // Dokumen fields
      docs_form_permohonan: docs_form_permohonan,
      docs_pemeriksaan_pertamanan: docs_pemeriksaan_pertamanan,
      docs_uji_lab: docs_uji_lab,
      docs_sertifikasi: docs_sertifikasi,
      updated_at: new Date().toISOString()
    };

    // Add created_at only for new records
    if (!isUpdate) {
        return {
            ...baseData,
            created_at: new Date().toISOString()
        };
    }

    return baseData;
}

export async function createProduction(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const productionData = await processProductionFormData(supabase, formData, false);

    const { data, error } = await supabase.from('productions').insert(productionData).select().single();

    if (error) {
      console.error('Supabase create error:', error);
      return { error };
    }

    revalidatePath('/admin/productions');
    return { data };

  } catch (error: any) {
    console.error('Error in createProduction:', error);
    return { error: { message: error.message } };
  }
}

export async function updateProduction(id: number, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get existing data untuk file handling
    const { data: existingData } = await supabase
      .from('productions')
      .select('docs_form_permohonan, docs_pemeriksaan_pertamanan, docs_uji_lab, docs_sertifikasi')
      .eq('id', id)
      .single();

    const productionData = await processProductionFormData(supabase, formData, true, existingData);

    const { data, error } = await supabase.from('productions').update(productionData).eq('id', id).select().single();

    if (error) {
      console.error('Supabase update error:', error);
      return { error };
    }

    revalidatePath('/admin/productions');
    return { data };

  } catch (error: any) {
    console.error('Error in updateProduction:', error);
    return { error: { message: error.message } };
  }
}

export async function deleteProduction(id: number) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get file paths untuk dihapus dari storage
    const { data: productionData } = await supabase
      .from('productions')
      .select('docs_form_permohonan, docs_pemeriksaan_pertamanan, docs_uji_lab, docs_sertifikasi')
      .eq('id', id)
      .single();

    // Delete files from storage
    if (productionData) {
      const filesToDelete = [
        productionData.docs_form_permohonan,
        productionData.docs_pemeriksaan_pertamanan,
        productionData.docs_uji_lab,
        productionData.docs_sertifikasi
      ].filter(Boolean);

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('dokumen-pendukung')
          .remove(filesToDelete);
      }
    }

    // Delete record from database
    const { error } = await supabase.from('productions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting production:', error);
      return { error };
    }

    revalidatePath('/admin/productions');
    return { data: { success: true } };
  } catch (error: any) {
    console.error('Error in deleteProduction:', error);
    return { error: { message: error.message } };
  }
}

// Enhanced single generate function with better error handling
export async function generateProductionRegisters(
  productionId: number, 
  token: string
) {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Ambil data induk yang lebih lengkap
    const { data: production, error: productionError } = await supabase
      .from('productions')
      .select('id, lot_total, code_1, code_2, code_3, code_4, lab_result_serial_number, lot_number')
      .eq('id', productionId)
      .single();

    if (productionError || !production) {
      throw new Error('Data produksi tidak ditemukan.');
    }

    // Validasi field yang diperlukan
    if (!production.lot_total || !production.lab_result_serial_number) {
        throw new Error('Data `lot_total` atau `lab_result_serial_number` pada produksi ini kosong. Harap lengkapi terlebih dahulu.');
    }

    // 2. Validasi untuk mencegah duplikasi (logika tetap sama)
    const { count, error: countError } = await supabase
      .from('production_registers')
      .select('*', { count: 'exact', head: true })
      .eq('production_id', productionId);
      
    if (countError) throw countError;
    if (count !== null && count > 0) {
      throw new Error(`Data register untuk produksi ${production.lot_number} sudah pernah di-generate (${count} data ditemukan).`);
    }

    // 3. Siapkan data untuk di-insert berdasarkan logika baru
    const registersToInsert = [];
    const baseProductionCode = `${production.code_1}${production.code_2}${production.code_3}`;
    const initialLastCharCode = production.code_4.charCodeAt(0);
    const quantity = production.lot_total;
    const startNumber = parseInt(production.lab_result_serial_number, 10);
    const baseUrl = 'https://perbenihan.com/qrcodeverification.php';
    const now = new Date().toISOString();

    if (isNaN(startNumber)) {
        throw new Error('Format `lab_result_serial_number` tidak valid (bukan angka).');
    }

    // --- LOGIKA BARU UNTUK KODE PRODUKSI DINAMIS ---
    for (let i = 0; i < quantity; i++) {
      const serialNumber = (startNumber + i).toString();
      
      // Hitung penambahan karakter berdasarkan kelipatan 1000
      const increment = Math.floor(i / 1000);
      const newLastChar = String.fromCharCode(initialLastCharCode + increment);
      
      const currentProductionCode = `${baseProductionCode}${newLastChar}`;
      const currentSearchKey = `${currentProductionCode}${serialNumber}`;
      
      registersToInsert.push({
        production_id: productionId,
        serial_number: serialNumber,
        production_code: currentProductionCode, // Kode produksi dinamis
        search_key: currentSearchKey,           // Search key dinamis
        qr_code_link: `${baseUrl}?token=${token}&seri=${serialNumber}`,
        created_at: now,
        updated_at: now,
      });
    }

    const { error: insertError } = await supabase
      .from('production_registers')
      .insert(registersToInsert);

    if (insertError) {
      throw new Error(`Gagal menyimpan data: ${insertError.message}`);
    }

    // *** UPDATE STATUS import_qr_at DI TABEL PRODUCTIONS ***
    const { error: updateProductionError } = await supabase
      .from('productions')
      .update({ 
        import_qr_at: now,
        updated_at: now
      })
      .eq('id', productionId);

    if (updateProductionError) {
      console.error('Error updating production import_qr_at status:', updateProductionError);
    }

    revalidatePath('/admin/productions');
    return { data: { generated: registersToInsert.length } };

  } catch (error: any) {
    console.error('Error in generateProductionRegisters:', error);
    return { error: { message: error.message } };
  }
}

// New bulk generate function
export async function bulkGenerateProductionRegisters(
  entries: { productionId: number; token: string }[]
) {
  if (!entries || entries.length === 0) {
    return { error: { message: 'Tidak ada data untuk di-generate.' } };
  }

  const results = [];
  let totalGenerated = 0;
  let successCount = 0;
  let failureCount = 0;

  try {
    for (const entry of entries) {
      try {
        const result = await generateProductionRegisters(entry.productionId, entry.token);

        if (result.error) {
          throw new Error(result.error.message);
        }

        const generated = result.data?.generated || 0;
        totalGenerated += generated;
        successCount++;

        results.push({
          productionId: entry.productionId,
          generated,
          success: true,
          error: null
        });

      } catch (error: any) {
        failureCount++;
        results.push({
          productionId: entry.productionId,
          generated: 0,
          success: false,
          error: error.message
        });
      }
    }

    const bulkResult = {
      success: successCount > 0,
      results,
      totalGenerated,
      successCount,
      failureCount,
      summary: `Berhasil: ${successCount}, Gagal: ${failureCount}, Total Records: ${totalGenerated}`
    };

    revalidatePath('/admin/productions');
    return { data: bulkResult };

  } catch (error: any) {
    console.error('Error in bulkGenerateProductionRegisters:', error);
    return { error: { message: `Bulk generate gagal: ${error.message}` } };
  }
}

// Utility function untuk validasi CSV token file
export async function validateTokenCsvFile(fileContent: string): Promise<{
  isValid: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const lines = fileContent.split('\n');
    
    // Skip header and get first data row
    const dataLines = lines.slice(1).filter(line => line.trim());
    if (dataLines.length === 0) {
      return { isValid: false, error: 'File CSV kosong atau tidak memiliki data' };
    }

    // Parse first row to get token
    const firstRow = dataLines[0].split(',');
    if (firstRow.length < 2) {
      return { isValid: false, error: 'Format CSV tidak valid. Minimal harus ada kolom Token' };
    }

    const token = firstRow[1]?.replace(/"/g, '').trim();
    if (!token) {
      return { isValid: false, error: 'Token tidak ditemukan di baris pertama' };
    }

    return { isValid: true, token };

  } catch (error: any) {
    return { isValid: false, error: `Error parsing CSV: ${error.message}` };
  }
}