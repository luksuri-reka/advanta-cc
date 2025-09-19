// app/admin/bahan-aktif/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Fungsi helper untuk membuat Supabase client di server
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

// Tipe data untuk form
export interface ActiveIngredientFormData {
  name: string;
  description: string;
}

// Aksi untuk membuat bahan aktif baru
export async function createActiveIngredient(formData: ActiveIngredientFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('bahan_aktif').insert(formData).select().single();
  
  if (error) {
    console.error('Error creating active ingredient:', error);
    return { error };
  }
  
  revalidatePath('/admin/bahan-aktif');
  return { data };
}

// Aksi untuk memperbarui bahan aktif
export async function updateActiveIngredient(id: number, formData: ActiveIngredientFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('bahan_aktif').update(formData).eq('id', id).select().single();

  if (error) {
    console.error('Error updating active ingredient:', error);
    return { error };
  }
  
  revalidatePath('/admin/bahan-aktif');
  return { data };
}

// Aksi untuk menghapus bahan aktif
export async function deleteActiveIngredient(id: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('bahan_aktif').delete().eq('id', id);

  if (error) {
    console.error('Error deleting active ingredient:', error);
    return { error };
  }

  revalidatePath('/admin/bahan-aktif');
  return { data: { success: true } };
}