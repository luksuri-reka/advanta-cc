'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/app/utils/supabase/service';
import { getAdminIdentity } from '../access';

interface RoleData {
  name: string;
  description: string;
}

const forbidden = { error: { message: 'Hanya Superadmin yang dapat mengelola peran.' } };

async function saveRole(id: number | null, role: RoleData, permissions: number[]) {
  if (!(await getAdminIdentity()).isSuperAdmin) return forbidden;

  const { data, error } = await createServiceClient().rpc('save_admin_role', {
    p_role_id: id,
    p_name: role.name,
    p_description: role.description,
    p_permission_ids: permissions,
  });
  if (error) return { error };

  revalidatePath('/admin', 'layout');
  return { data, error: null };
}

export async function createRole(role: RoleData, permissions: number[]) {
  return saveRole(null, role, permissions);
}

export async function updateRole(id: number, role: RoleData, permissions: number[]) {
  if (!Number.isSafeInteger(id) || id <= 0) return { error: { message: 'ID peran tidak valid.' } };
  return saveRole(id, role, permissions);
}

export async function deleteRole(id: number) {
  if (!(await getAdminIdentity()).isSuperAdmin) return forbidden;

  const { data, error } = await createServiceClient().rpc('delete_admin_role', { p_role_id: id });
  if (error) return { error };

  revalidatePath('/admin', 'layout');
  return { data, error: null };
}
