// app/admin/products/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

// Fungsi untuk upload foto
async function uploadPhoto(photo: File) {
  if (!photo || photo.size === 0) return { data: null, error: null };
  
  const supabase = await createSupabaseServerClient();
  const fileName = `${uuidv4()}-${photo.name}`;
  const { data, error } = await supabase.storage
    .from('product-photos')
    .upload(fileName, photo);

  if (error) return { data: null, error };
  
  const { data: { publicUrl } } = supabase.storage
    .from('product-photos')
    .getPublicUrl(data.path);
    
  return { data: { path: publicUrl }, error: null };
}

// Aksi untuk membuat produk baru
export async function createProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const photoFile = formData.get('photo') as File;
  const bahanAktifIds = formData.getAll('bahan_aktif_ids') as string[];
  
  let photoUrl = '';
  if (photoFile && photoFile.size > 0) {
    const { data: photoData, error: photoError } = await uploadPhoto(photoFile);
    if (photoError) return { error: { message: `Gagal upload foto: ${photoError.message}` } };
    photoUrl = photoData?.path || '';
  } else {
    return { error: { message: 'Foto produk wajib diisi.' } };
  }

  const productData = {
    name: formData.get('name') as string,
    sku: formData.get('sku') as string,
    photo: photoUrl,
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

  // Handle relasi many-to-many dengan bahan_aktif
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

// Aksi untuk memperbarui produk
export async function updateProduct(id: number, formData: FormData) {
  // Mirip dengan create, tapi dengan logika update
  // (Untuk mempersingkat, logika ini bisa Anda kembangkan dari `createProduct`)
  // Intinya:
  // 1. Cek apakah ada foto baru. Jika ada, upload dan dapatkan URL baru.
  // 2. Buat objek `updateData`.
  // 3. Update tabel `products`.
  // 4. Hapus semua relasi di `product_bahan_aktif` untuk product_id ini.
  // 5. Insert kembali relasi `bahan_aktif` yang baru.
  // 6. Revalidate path.
  return { error: { message: "Update logic not yet implemented." } }; // Placeholder
}

// Aksi untuk menghapus produk
export async function deleteProduct(id: number) {
  const supabase = await createSupabaseServerClient();
  
  // Hapus relasi di pivot table terlebih dahulu
  await supabase.from('product_bahan_aktif').delete().eq('product_id', id);

  // Hapus produk utama
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error };

  revalidatePath('/admin/products');
  return { data: { success: true } };
}