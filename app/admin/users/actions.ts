// app/admin/users/actions.ts - Updated version
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
  department: string;
  complaint_permissions: Record<string, boolean>;
}

export async function createUser(formData: UserFormData) {
  const supabase = await createSupabaseServerClient();

  if (!formData.password) {
    return { error: { message: 'Password wajib diisi untuk pengguna baru.' } };
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      name: formData.name,
      department: formData.department,
      complaint_permissions: formData.complaint_permissions,
    },
    app_metadata: { 
      role: formData.role,
      roles: [formData.role] // Add roles array for compatibility
    }
  });

  if (authError) { 
    return { error: authError }; 
  }

  // Create user complaint profile
  if (authUser.user) {
    const { error: profileError } = await supabase
      .from('user_complaint_profiles')
      .insert({
        user_id: authUser.user.id,
        full_name: formData.name,
        department: formData.department,
        complaint_permissions: formData.complaint_permissions,
        created_by: authUser.user.id
      });

    if (profileError) {
      console.warn('Failed to create user complaint profile:', profileError);
      // Don't fail the user creation if profile creation fails
    }
  }

  revalidatePath('/admin/users');
  return { data: authUser };
}

export async function updateUser(userId: string, formData: UserFormData) {
  const supabase = await createSupabaseServerClient();

  const updateData: any = {
    user_metadata: {
      name: formData.name,
      department: formData.department,
      complaint_permissions: formData.complaint_permissions,
    },
    app_metadata: { 
      role: formData.role,
      roles: [formData.role] // Add roles array for compatibility
    }
  };

  if (formData.password) {
    updateData.password = formData.password;
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(userId, updateData);

  if (authError) {
    return { error: authError };
  }

  // Update user complaint profile
  const { error: profileError } = await supabase
    .from('user_complaint_profiles')
    .upsert({
      user_id: userId,
      full_name: formData.name,
      department: formData.department,
      complaint_permissions: formData.complaint_permissions,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.warn('Failed to update user complaint profile:', profileError);
  }

  revalidatePath('/admin/users');
  return { data: authUser };
}

export async function deleteUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Delete user complaint profile first
  await supabase
    .from('user_complaint_profiles')
    .delete()
    .eq('user_id', userId);

  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { error };
  }
  
  revalidatePath('/admin/users');
  return { data };
}