// app/admin/varietas/actions.ts
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
export interface VarietyFormData {
  name: string;
  description: string;
}

// Aksi untuk membuat varietas baru
export async function createVariety(formData: VarietyFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('varietas').insert(formData).select().single();
  
  if (error) {
    console.error('Error creating variety:', error);
    return { error };
  }
  
  revalidatePath('/admin/varietas');
  return { data };
}

// Aksi untuk memperbarui varietas
export async function updateVariety(id: number, formData: VarietyFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('varietas').update(formData).eq('id', id).select().single();

  if (error) {
    console.error('Error updating variety:', error);
    return { error };
  }
  
  revalidatePath('/admin/varietas');
  return { data };
}

// Aksi untuk menghapus varietas
export async function deleteVariety(id: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('varietas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting variety:', error);
    return { error };
  }

  revalidatePath('/admin/varietas');
  return { data: { success: true } };
}