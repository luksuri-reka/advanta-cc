import { notFound } from 'next/navigation';
import { createServiceClient } from '@/app/utils/supabase/service';
import { requireSuperAdminPage } from '../../../access';
import RoleForm from '../../RoleForm';
import { loadRolePermissions } from '../../permissions';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();

  const supabase = createServiceClient();
  const { data: role, error } = await supabase
    .from('roles')
    .select('id, name, description')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat peran: ${error.message}`);
  if (!role) notFound();

  const [permissions, { data: grants, error: grantsError }] = await Promise.all([
    loadRolePermissions(),
    supabase.from('role_has_permissions').select('permission_id').eq('role_id', id),
  ]);
  if (grantsError) throw new Error(`Gagal memuat izin peran: ${grantsError.message}`);

  return (
    <RoleForm
      key={role.id}
      role={{ ...role, permissionIds: grants.map(grant => grant.permission_id) }}
      permissions={permissions}
    />
  );
}
