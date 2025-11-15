// app/admin/products/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import path from 'path';

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

// BARU: Generate SKU otomatis
async function generateSKU(jenisTanamanId: number): Promise<string> {
  const supabase = await createSupabaseServerClient();
  
  // Mapping jenis tanaman ID ke kode 3 digit
  const jenisTanamanCodes: Record<number, string> = {
    1: '164', // Cabai
    4: '174', // Jagung
    // Tambahkan mapping lainnya sesuai kebutuhan
  };
  
  const code = jenisTanamanCodes[jenisTanamanId] || '000';
  
  // Panggil database function untuk generate SKU
  const { data, error } = await supabase.rpc('generate_product_sku', {
    jenis_tanaman_code: code
  });
  
  if (error) throw new Error(`Gagal generate SKU: ${error.message}`);
  
  return data as string;
}

async function uploadPhoto(photo: File, sku: string) {
  if (!photo || photo.size === 0) return { data: null, error: null };
  
  const supabase = await createSupabaseServerClient();
  const ext = path.extname(photo.name);
  const fileName = `${sku}${ext}`;
  
  const { data, error } = await supabase.storage
    .from('product-photos')
    .upload(fileName, photo, {
      upsert: true
    });

  if (error) return { data: null, error };
  return { data: { path: fileName }, error: null };
}

// CREATE PRODUCT dengan auto-generate SKU
export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const photoFile = formData.get('photo') as File;
  const jenisTanamanId = Number(formData.get('jenis_tanaman_id'));
  const bahanAktifIds = formData.getAll('bahan_aktif_ids') as string[];
  
  // PERBAIKAN: Auto-generate SKU berdasarkan jenis tanaman
  let sku: string;
  try {
    sku = await generateSKU(jenisTanamanId);
  } catch (error) {
    return { error: { message: error instanceof Error ? error.message : 'Gagal generate SKU' } };
  }
  
  let photoFileName = '';
  if (photoFile && photoFile.size > 0) {
    const { data: photoData, error: photoError } = await uploadPhoto(photoFile, sku);
    if (photoError) return { error: { message: `Gagal upload foto: ${photoError.message}` } };
    photoFileName = photoData?.path || '';
  } else {
    return { error: { message: 'Foto produk wajib diisi.' } };
  }

  const productData = {
    name: formData.get('name') as string,
    sku: sku, // Gunakan SKU yang auto-generated
    photo: photoFileName,
    jenis_tanaman_id: jenisTanamanId,
    kelas_benih_id: Number(formData.get('kelas_benih_id')),
    varietas_id: Number(formData.get('varietas_id')),
    benih_murni: Number(formData.get('benih_murni')),
    daya_berkecambah: Number(formData.get('daya_berkecambah')),
    kadar_air: Number(formData.get('kadar_air')),
    kotoran_benih: Number(formData.get('kotoran_benih')),
    campuran_varietas_lain: Number(formData.get('campuran_varietas_lain')),
    benih_tanaman_lain: Number(formData.get('benih_tanaman_lain')),
    pack_capacity: Number(formData.get('pack_capacity')) || null,
    bag_capacity: Number(formData.get('bag_capacity')),
    qr_color: formData.get('qr_color') as string,
  };

  const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();

  if (error) return { error };

  if (bahanAktifIds.length > 0) {
    const pivotData = bahanAktifIds.map(id => ({
      product_id: newProduct.id,
      bahan_aktif_id: Number(id),
    }));
    const { error: pivotError } = await supabase.from('product_bahan_aktif').insert(pivotData);
    if (pivotError) return { error: pivotError };
  }

  revalidatePath('/admin/products');
  return { data: newProduct };
}

// UPDATE PRODUCT (SKU tidak bisa diubah)
export async function updateProduct(id: number, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const photoFile = formData.get('photo') as File;
  const bahanAktifIds = formData.getAll('bahan_aktif_ids') as string[];
  
  const { data: existingProduct, error: fetchError } = await supabase
    .from('products')
    .select('photo, sku')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError };

  let photoFileName = existingProduct.photo;

  // Jika ada foto baru
  if (photoFile && photoFile.size > 0) {
    const { data: photoData, error: photoError } = await uploadPhoto(photoFile, existingProduct.sku);
    if (photoError) return { error: { message: `Gagal upload foto: ${photoError.message}` } };
    photoFileName = photoData?.path || existingProduct.photo;

    // Hapus foto lama jika berbeda
    if (existingProduct.photo && existingProduct.photo !== photoFileName) {
      await supabase.storage
        .from('product-photos')
        .remove([existingProduct.photo]);
    }
  }

  const updateData = {
    name: formData.get('name') as string,
    // SKU TIDAK BISA DIUBAH saat update
    photo: photoFileName,
    jenis_tanaman_id: Number(formData.get('jenis_tanaman_id')),
    kelas_benih_id: Number(formData.get('kelas_benih_id')),
    varietas_id: Number(formData.get('varietas_id')),
    benih_murni: Number(formData.get('benih_murni')),
    daya_berkecambah: Number(formData.get('daya_berkecambah')),
    kadar_air: Number(formData.get('kadar_air')),
    kotoran_benih: Number(formData.get('kotoran_benih')),
    campuran_varietas_lain: Number(formData.get('campuran_varietas_lain')),
    benih_tanaman_lain: Number(formData.get('benih_tanaman_lain')),
    pack_capacity: Number(formData.get('pack_capacity')) || null,
    bag_capacity: Number(formData.get('bag_capacity')),
    qr_color: formData.get('qr_color') as string,
  };

  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return { error: updateError };

  await supabase.from('product_bahan_aktif').delete().eq('product_id', id);

  if (bahanAktifIds.length > 0) {
    const pivotData = bahanAktifIds.map(bahanAktifId => ({
      product_id: id,
      bahan_aktif_id: Number(bahanAktifId),
    }));
    const { error: pivotError } = await supabase.from('product_bahan_aktif').insert(pivotData);
    if (pivotError) return { error: pivotError };
  }

  revalidatePath('/admin/products');
  return { data: updatedProduct };
}

export async function deleteProduct(id: number) {
  const supabase = await createSupabaseServerClient();
  
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('photo')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError };

  await supabase.from('product_bahan_aktif').delete().eq('product_id', id);

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error };

  if (product.photo) {
    await supabase.storage
      .from('product-photos')
      .remove([product.photo]);
  }

  revalidatePath('/admin/products');
  return { data: { success: true } };
}