// app/admin/users/page.tsx
import { createServiceClient } from '@/app/utils/supabase/service';
import { normalizeComplaintPermissions } from '@/app/utils/complaintPermissions';
import UserClient from './UserClient';
import { requireSuperAdminPage } from '../access';

async function fetchInitialData() {
  const supabase = createServiceClient();
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  const { data: roles, error: rolesError } = await supabase.from('roles').select('name');

  if (usersError) throw new Error(`Gagal memuat pengguna: ${usersError.message}`);
  if (rolesError) throw new Error(`Gagal memuat peran: ${rolesError.message}`);

  const { data: profiles, error: profilesError } = await supabase
    .from('user_complaint_profiles')
    .select('user_id, department, complaint_permissions');
  if (profilesError) throw new Error(`Gagal memuat profil Complaint Team: ${profilesError.message}`);
  const profilesByUser = new Map(profiles.map(profile => [profile.user_id, profile]));

  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.user_metadata?.name || 'N/A',
    email: user.email || 'N/A',
    role: user.app_metadata?.role || 'N/A',
    department: profilesByUser.get(user.id)?.department || user.user_metadata?.department || '-',
    complaint_permissions: normalizeComplaintPermissions(profilesByUser.get(user.id)?.complaint_permissions),
    last_sign_in_at: user.last_sign_in_at,
  }));

  const roleNames = roles.map(r => r.name);

  return { users: formattedUsers, roles: roleNames };
}

export default async function UsersPage() {
  await requireSuperAdminPage();
  const { users, roles } = await fetchInitialData();
  return <UserClient initialUsers={users} availableRoles={roles} />;
}
