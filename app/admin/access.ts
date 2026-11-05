import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import { createServiceClient } from '@/app/utils/supabase/service';

export const getAdminUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
});

export const getAdminIdentity = cache(async () => {
  const { user } = await getAdminUser();
  const metadata = user?.app_metadata;
  const roles: string[] = Array.isArray(metadata?.roles)
    ? metadata.roles.filter((role): role is string => typeof role === 'string' && !!role)
    : [];
  if (roles.length === 0 && typeof metadata?.role === 'string') roles.push(metadata.role);

  return { user, roles, isSuperAdmin: roles.some(role => role.toLowerCase() === 'superadmin') };
});

export const getProductionAccess = cache(async () => {
  const { user, roles, isSuperAdmin } = await getAdminIdentity();
  const grants = new Set<string>();

  if (user && roles.length > 0 && !isSuperAdmin) {
    const { data, error } = await createServiceClient()
      .from('role_has_permissions')
      .select('role:roles!inner(name), permission:permissions!inner(name)')
      .in('role.name', roles)
      .like('permission.name', 'production.%');

    if (error) console.error('Gagal memuat izin produksi:', error.message);
    for (const row of data ?? []) {
      // Untyped Supabase clients infer embeds as arrays. These foreign keys return one row.
      const permission = row.permission as unknown as { name: string };
      grants.add(permission.name);
    }
  }

  const manage = isSuperAdmin || grants.has('production.manage');
  const view = manage || grants.has('production.view');
  return {
    authenticated: !!user,
    view,
    manage,
    download: view && (isSuperAdmin || grants.has('production.download')),
    uploadQr: view && (isSuperAdmin || grants.has('production.upload_qr')),
  };
});

export async function requireSuperAdminPage() {
  const { user, isSuperAdmin } = await getAdminIdentity();
  if (!user) redirect('/admin/login');
  if (!isSuperAdmin) redirect('/admin/complaints');
}
