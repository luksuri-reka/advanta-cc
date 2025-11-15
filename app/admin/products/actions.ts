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

// PERBAIKAN: Upload foto dengan nama SKU
async function uploadPhoto(photo: File, sku: string) {
  if (!photo || photo.size === 0) return { data: null, error: null };
  
  const supabase = await createSupabaseServerClient();
  
  // Ambil extension dari file original
  const ext = path.extname(photo.name);
  // Format: SKU.ext (contoh: U00000000164000942.png)
  const fileName = `${sku}${ext}`;
  
  const { data, error } = await supabase.storage
    .from('product-photos')
    .upload(fileName, photo, {
      upsert: true // Timpa jika file sudah ada
    });

  if (error) return { data: null, error };
  
  return { data: { path: fileName }, error: null };
}

// CREATE PRODUCT
export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const photoFile = formData.get('photo') as File;
  const sku = formData.get('sku') as string;
  const bahanAktifIds = formData.getAll('bahan_aktif_ids') as string[];
  
  if (!sku) {
    return { error: { message: 'SKU wajib diisi.' } };
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
    sku: sku,
    photo: photoFileName, // Simpan nama file (SKU.ext)
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

// UPDATE PRODUCT
export async function updateProduct(id: number, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const photoFile = formData.get('photo') as File;
  const newSku = formData.get('sku') as string;
  const bahanAktifIds = formData.getAll('bahan_aktif_ids') as string[];
  
  if (!newSku) {
    return { error: { message: 'SKU wajib diisi.' } };
  }
  
  const { data: existingProduct, error: fetchError } = await supabase
    .from('products')
    .select('photo, sku')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError };

  let photoFileName = existingProduct.photo;

  // Jika ada foto baru
  if (photoFile && photoFile.size > 0) {
    const { data: photoData, error: photoError } = await uploadPhoto(photoFile, newSku);
    if (photoError) return { error: { message: `Gagal upload foto: ${photoError.message}` } };
    photoFileName = photoData?.path || existingProduct.photo;

    // Hapus foto lama HANYA jika SKU berubah
    if (existingProduct.photo && existingProduct.sku !== newSku && photoData?.path) {
      await supabase.storage
        .from('product-photos')
        .remove([existingProduct.photo]);
    }
  } 
  // Jika SKU berubah tapi tidak upload foto baru, rename file lama
  else if (existingProduct.sku !== newSku && existingProduct.photo) {
    const oldExt = path.extname(existingProduct.photo);
    const newFileName = `${newSku}${oldExt}`;
    
    // Download foto lama
    const { data: oldFileData } = await supabase.storage
      .from('product-photos')
      .download(existingProduct.photo);
    
    if (oldFileData) {
      // Upload dengan nama baru
      await supabase.storage
        .from('product-photos')
        .upload(newFileName, oldFileData, { upsert: true });
      
      // Hapus file lama
      await supabase.storage
        .from('product-photos')
        .remove([existingProduct.photo]);
      
      photoFileName = newFileName;
    }
  }

  const updateData = {
    name: formData.get('name') as string,
    sku: newSku,
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

// DELETE PRODUCT (tetap sama)
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