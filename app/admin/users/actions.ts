// app/admin/users/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// 1. Jadikan fungsi ini 'async'
const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export async function createUser(formData: UserFormData) {
  // 2. Tambahkan 'await' saat memanggil helper
  const supabase = await createSupabaseServerClient();
  
  if (!formData.password) {
    return { error: { message: 'Password wajib diisi untuk pengguna baru.' } };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: { name: formData.name },
    app_metadata: { role: formData.role }
  });

  if (error) { return { error }; }
  
  revalidatePath('/admin/users');
  return { data };
}

// SERVER ACTION: Memperbarui pengguna
export async function updateUser(userId: string, formData: UserFormData) {
    const supabase = await createSupabaseServerClient();

    const updateData: any = {
        user_metadata: { name: formData.name },
        app_metadata: { role: formData.role }
    };
    
    if (formData.password) {
        updateData.password = formData.password;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData);

    if (error) {
        return { error };
    }

    revalidatePath('/admin/users');
    return { data };
}

// SERVER ACTION: Menghapus pengguna
export async function deleteUser(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        return { error };
    }
    
    revalidatePath('/admin/users');
    return { data };
}