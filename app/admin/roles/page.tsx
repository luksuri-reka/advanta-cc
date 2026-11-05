// app/admin/roles/page.tsx
import { createServiceClient } from '@/app/utils/supabase/service';
import { requireSuperAdminPage } from '../access';
import RoleClient from './RoleClient';

// Fungsi ini sekarang mengambil data asli di server
async function fetchRoles() {
    const { data, error } = await createServiceClient().from('roles').select('*');
    if (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
    return data;
}

export default async function RolesPage() {
  await requireSuperAdminPage();
  const initialRoles = await fetchRoles();
  return (
    <RoleClient initialRoles={initialRoles} />
  );
}
