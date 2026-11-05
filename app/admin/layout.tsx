import Navbar from './Navbar';
import { getAdminIdentity, getAdminUser, getProductionAccess } from './access';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, supabase } = await getAdminUser();
  if (!user) return children;

  const [{ data: profile }, { roles, isSuperAdmin }, productionAccess] = await Promise.all([
    supabase
      .from('user_complaint_profiles')
      .select('department, complaint_permissions')
      .eq('user_id', user.id)
      .single(),
    getAdminIdentity(),
    getProductionAccess(),
  ]);

  const displayUser = {
    name: user.user_metadata?.name || 'Admin',
    roles: roles.length ? roles : ['User'],
    isSuperAdmin,
    canViewProduction: productionAccess.view,
    department: profile?.department,
    complaint_permissions: profile?.complaint_permissions || {},
  };

  return (
    <>
      <Navbar user={displayUser} />
      {children}
    </>
  );
}
