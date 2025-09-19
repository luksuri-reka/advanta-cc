// app/admin/jenis-tanaman/actions.ts
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
export interface PlantTypeFormData {
  name: string;
  description: string;
}

// Aksi untuk membuat jenis tanaman baru
export async function createPlantType(formData: PlantTypeFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('jenis_tanaman').insert(formData).select().single();
  
  if (error) {
    console.error('Error creating plant type:', error);
    return { error };
  }
  
  revalidatePath('/admin/jenis-tanaman');
  return { data };
}

// Aksi untuk memperbarui jenis tanaman
export async function updatePlantType(id: number, formData: PlantTypeFormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('jenis_tanaman').update(formData).eq('id', id).select().single();

  if (error) {
    console.error('Error updating plant type:', error);
    return { error };
  }
  
  revalidatePath('/admin/jenis-tanaman');
  return { data };
}

// Aksi untuk menghapus jenis tanaman
export async function deletePlantType(id: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('jenis_tanaman').delete().eq('id', id);

  if (error) {
    console.error('Error deleting plant type:', error);
    return { error };
  }

  revalidatePath('/admin/jenis-tanaman');
  return { data: { success: true } };
}