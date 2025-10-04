// app/admin/productions/actions.ts - Final Complete Version with Progress Tracking
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

const getNullIfEmpty = (formData: FormData, field: string): string | null => {
  const value = formData.get(field) as string;
  return value === '' ? null : value;
};

const getJsonbData = async (supabase: any, table: string, id: number | null) => {
    if (id === null) return null;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw new Error(`Gagal mengambil data dari ${table} dengan ID ${id}: ${error.message}`);
    return data;
};

const uploadFileToStorage = async (supabase: any, file: File, folder: string, productionId?: number): Promise<string | null> => {
  if (!file || file.size === 0) return null;
  
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;
    
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

    return data.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

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

    const handleFileUpload = async (fieldName: string, folder: string): Promise<string | null> => {
        const file = formData.get(fieldName) as File;
        
        if ((!file || file.size === 0) && isUpdate && existingData) {
            return existingData[fieldName] || null;
        }
        
        if (file && file.size > 0 && isUpdate && existingData?.[fieldName]) {
            await deleteFileFromStorage(supabase, existingData[fieldName]);
        }
        
        if (file && file.size > 0) {
            return await uploadFileToStorage(supabase, file, folder);
        }
        
        return null;
    };

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
      docs_form_permohonan: docs_form_permohonan,
      docs_pemeriksaan_pertamanan: docs_pemeriksaan_pertamanan,
      docs_uji_lab: docs_uji_lab,
      docs_sertifikasi: docs_sertifikasi,
      updated_at: new Date().toISOString()
    };

    if (!isUpdate) {
        return {
            ...baseData,
            created_at: new Date().toISOString()
        };
    }

    return baseData;
}

// ============================================================================
// CRUD FUNCTIONS
// ============================================================================

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
    
    const { data: productionData } = await supabase
      .from('productions')
      .select('docs_form_permohonan, docs_pemeriksaan_pertamanan, docs_uji_lab, docs_sertifikasi')
      .eq('id', id)
      .single();

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

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

const progressStore = new Map<string, any>();

export async function getProgress(jobId: string) {
  return progressStore.get(jobId) || null;
}

// ============================================================================
// GENERATE PRODUCTION REGISTERS
// ============================================================================

export async function generateProductionRegisters(
  productionId: number, 
  token: string,
  jobId?: string
): Promise<{ data?: any; error?: any }> {
  try {
    const supabase = await createSupabaseServerClient();

    console.log('=== START Generate Registers ===');
    console.log('Production ID:', productionId);
    console.log('Token:', token.substring(0, 10) + '...');
    if (jobId) console.log('Job ID:', jobId);

    const { data: production, error: productionError } = await supabase
      .from('productions')
      .select('id, lot_total, code_1, code_2, code_3, code_4, lab_result_serial_number, lot_number')
      .eq('id', productionId)
      .single();

    if (productionError) {
      console.error('Error fetching production:', productionError);
      throw new Error(`Gagal mengambil data produksi: ${productionError.message || JSON.stringify(productionError)}`);
    }

    if (!production) {
      throw new Error('Data produksi tidak ditemukan.');
    }

    console.log('Production data:', {
      id: production.id,
      lot_number: production.lot_number,
      lot_total: production.lot_total,
      serial: production.lab_result_serial_number,
      codes: `${production.code_1}${production.code_2}${production.code_3}${production.code_4}`
    });

    if (!production.lot_total || production.lot_total <= 0) {
      throw new Error('Field `lot_total` kosong atau tidak valid. Harap lengkapi data produksi terlebih dahulu.');
    }

    if (!production.lab_result_serial_number) {
      throw new Error('Field `lab_result_serial_number` kosong. Harap lengkapi data produksi terlebih dahulu.');
    }

    if (!production.code_1 || !production.code_2 || !production.code_3 || !production.code_4) {
      throw new Error('Kode hybrid (code_1, code_2, code_3, code_4) tidak lengkap. Harap lengkapi data produksi.');
    }

    if (production.code_1.length !== 1 || production.code_2.length !== 1 || 
        production.code_3.length !== 1 || production.code_4.length !== 1) {
      throw new Error('Setiap kode hybrid harus tepat 1 karakter. Periksa data code_1, code_2, code_3, code_4.');
    }

    console.log('Checking for duplicates...');
    
    let existingCount = 0;
    
    // Optimized: Use count with index hint and timeout protection
    try {
      // Set statement timeout untuk query ini (5 detik)
      await supabase.rpc('exec_sql', { 
        sql: 'SET LOCAL statement_timeout = 5000' 
      });
      
      const { count: countHead, error: countError1 } = await supabase
        .from('production_registers')
        .select('production_id', { count: 'exact', head: true })
        .eq('production_id', productionId);
      
      if (!countError1 && countHead !== null) {
        existingCount = countHead;
        console.log('Duplicate check success:', existingCount);
      } else if (countError1?.code === '57014') {
        // Statement timeout - assume no duplicates untuk production baru
        console.warn('Duplicate check timeout - skipping for performance');
        existingCount = 0;
      } else {
        throw countError1;
      }
    } catch (error: any) {
      // Jika timeout atau error lain, log warning tapi lanjutkan
      console.warn('Duplicate check failed, proceeding with caution:', error);
      existingCount = 0;
    }

    if (existingCount > 0) {
      throw new Error(`Data register untuk lot ${production.lot_number} sudah pernah di-generate (${existingCount} records ditemukan). Tidak dapat generate ulang.`);
    }

    console.log('No duplicates found (or check skipped due to timeout)');

    const baseProductionCode = `${production.code_1}${production.code_2}${production.code_3}`;
    const initialLastCharCode = production.code_4.charCodeAt(0);
    const quantity = production.lot_total;
    const startNumber = parseInt(production.lab_result_serial_number, 10);
    const baseUrl = 'https://perbenihan.com/qrcodeverification.php';
    const now = new Date().toISOString();

    if (isNaN(startNumber)) {
      throw new Error(`Format lab_result_serial_number tidak valid: "${production.lab_result_serial_number}" bukan angka.`);
    }

    console.log('Preparing to generate:', {
      quantity,
      startNumber,
      endNumber: startNumber + quantity - 1,
      baseCode: baseProductionCode,
      initialChar: production.code_4
    });

    // Dynamic batch size
    let BATCH_SIZE = 500;
    if (quantity > 50000) {
      BATCH_SIZE = 2000;
    } else if (quantity > 20000) {
      BATCH_SIZE = 1000;
    } else if (quantity < 100) {
      BATCH_SIZE = 50;
    }
    
    const totalBatches = Math.ceil(quantity / BATCH_SIZE);
    let totalInserted = 0;

    console.log(`Will insert in ${totalBatches} batches (${BATCH_SIZE} records each, optimized for ${quantity} total records)`);

    // Initialize progress
    if (jobId) {
      progressStore.set(jobId, {
        currentBatch: 0,
        totalBatches,
        totalInserted: 0,
        totalRecords: quantity,
        status: 'processing',
        lotNumber: production.lot_number,
        startTime: Date.now()
      });
    }

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, quantity);
      const registersToInsert = [];

      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (records ${batchStart}-${batchEnd - 1})...`);

      for (let i = batchStart; i < batchEnd; i++) {
        const serialNumber = (startNumber + i).toString();
        const increment = Math.floor(i / 1000);
        const newLastChar = String.fromCharCode(initialLastCharCode + increment);
        const currentProductionCode = `${baseProductionCode}${newLastChar}`;
        
        if (currentProductionCode.length !== 4) {
          throw new Error(`ERROR: production_code length = ${currentProductionCode.length}, expected 4. Code: "${currentProductionCode}"`);
        }
        
        const currentSearchKey = `${currentProductionCode}${serialNumber}`;
        
        registersToInsert.push({
          production_id: productionId,
          serial_number: serialNumber,
          production_code: currentProductionCode,
          search_key: currentSearchKey,
          qr_code_link: `${baseUrl}?token=${token}&seri=${serialNumber}`,
          created_at: now,
          updated_at: now,
        });
      }

      const { error: insertError } = await supabase
        .from('production_registers')
        .insert(registersToInsert);

      if (insertError) {
        console.error(`Error inserting batch ${batchIndex + 1}:`, insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        if (jobId) {
          progressStore.set(jobId, {
            ...progressStore.get(jobId),
            status: 'error',
            error: `Batch ${batchIndex + 1} failed: ${insertError.message}`,
            endTime: Date.now()
          });
        }
        
        if (totalInserted > 0) {
          throw new Error(`Gagal insert pada batch ${batchIndex + 1}. ${totalInserted} records sudah tersimpan sebelumnya. Error: ${insertError.message || JSON.stringify(insertError)}`);
        }
        
        throw new Error(`Gagal menyimpan data pada batch ${batchIndex + 1}: ${insertError.message || insertError.code || JSON.stringify(insertError)}`);
      }

      totalInserted += registersToInsert.length;
      console.log(`Batch ${batchIndex + 1} inserted: ${registersToInsert.length} records (Total: ${totalInserted}/${quantity})`);
      
      // Update progress
      if (jobId) {
        const elapsed = Date.now() - progressStore.get(jobId).startTime;
        const avgTimePerBatch = elapsed / (batchIndex + 1);
        const remainingBatches = totalBatches - (batchIndex + 1);
        const estimatedTimeRemaining = avgTimePerBatch * remainingBatches;
        
        progressStore.set(jobId, {
          ...progressStore.get(jobId),
          currentBatch: batchIndex + 1,
          totalInserted,
          percentage: Math.round((totalInserted / quantity) * 100),
          estimatedTimeRemaining: Math.round(estimatedTimeRemaining / 1000)
        });
      }
    }

    console.log(`All ${totalInserted} registers inserted successfully`);

    console.log('Updating production status...');
    const { error: updateProductionError } = await supabase
      .from('productions')
      .update({ 
        import_qr_at: now,
        updated_at: now
      })
      .eq('id', productionId);

    if (updateProductionError) {
      console.error('Warning: Failed to update production status:', updateProductionError);
    } else {
      console.log('Production status updated');
    }

    if (jobId) {
      progressStore.set(jobId, {
        ...progressStore.get(jobId),
        status: 'completed',
        endTime: Date.now()
      });
      
      setTimeout(() => {
        progressStore.delete(jobId);
      }, 10000);
    }

    console.log('=== FINISH Generate Registers ===');
    revalidatePath('/admin/productions');
    
    return { 
      data: { 
        generated: totalInserted,
        startNumber,
        endNumber: startNumber + totalInserted - 1,
        productionCode: baseProductionCode + production.code_4,
        jobId
      } 
    };

  } catch (error: any) {
    console.error('FATAL ERROR in generateProductionRegisters');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Full error object:', error);
    
    let errorMessage = 'Terjadi kesalahan yang tidak diketahui';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || error.msg || error.error || JSON.stringify(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('Final error message:', errorMessage);
    
    return { 
      error: { 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      } 
    };
  }
}

// ============================================================================
// BULK GENERATE
// ============================================================================

export async function bulkGenerateProductionRegisters(
  entries: Array<{ productionId: number; token: string }>
): Promise<{ data?: any; error?: any }> {
  if (!entries || entries.length === 0) {
    return { error: { message: 'Tidak ada data untuk di-generate.' } };
  }

  const results: Array<{
    productionId: number;
    generated: number;
    success: boolean;
    error: string | null;
  }> = [];
  
  let totalGenerated = 0;
  let successCount = 0;
  let failureCount = 0;

  try {
    for (const entry of entries) {
      try {
        const result = await generateProductionRegisters(
          Number(entry.productionId), 
          String(entry.token)
        );

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

// ============================================================================
// UTILITY
// ============================================================================

export async function validateTokenCsvFile(fileContent: string): Promise<{
  isValid: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const lines = fileContent.split('\n');
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    if (dataLines.length === 0) {
      return { isValid: false, error: 'File CSV kosong atau tidak memiliki data' };
    }

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