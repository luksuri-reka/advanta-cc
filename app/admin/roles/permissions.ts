import 'server-only';
import { createServiceClient } from '@/app/utils/supabase/service';

export interface RolePermission {
  id: number;
  name: string;
  description: string | null;
}

export async function loadRolePermissions(): Promise<RolePermission[]> {
  const { data, error } = await createServiceClient()
    .from('permissions')
    .select('id, name, description')
    .order('id');

  if (error) throw new Error(`Gagal memuat daftar izin: ${error.message}`);
  return data;
}
