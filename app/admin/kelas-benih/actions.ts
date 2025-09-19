// app/admin/kelas-benih/actions.ts
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
export interface SeedClassFormData {
  name: string;
  description: string;
}

// Aksi untuk membuat kelas benih baru
export async function createSeedClass(formData: SeedClassFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('kelas_benih').insert(formData).select().single();
  
  if (error) {
    console.error('Error creating seed class:', error);
    return { error };
  }
  
  revalidatePath('/admin/kelas-benih');
  return { data };
}

// Aksi untuk memperbarui kelas benih
export async function updateSeedClass(id: number, formData: SeedClassFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('kelas_benih').update(formData).eq('id', id).select().single();

  if (error) {
    console.error('Error updating seed class:', error);
    return { error };
  }
  
  revalidatePath('/admin/kelas-benih');
  return { data };
}

// Aksi untuk menghapus kelas benih
export async function deleteSeedClass(id: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('kelas_benih').delete().eq('id', id);

  if (error) {
    console.error('Error deleting seed class:', error);
    return { error };
  }

  revalidatePath('/admin/kelas-benih');
  return { data: { success: true } };
}