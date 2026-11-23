import Navbar from './Navbar';
import { getAdminIdentity, getProductionAccess } from './access';
import { getComplaintAccess } from './complaintAccess';
import { ComplaintAccessProvider } from './ComplaintAccessProvider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, isSuperAdmin } = await getAdminIdentity();
  if (!user) return children;

  const [{ actor }, productionAccess] = await Promise.all([
    getComplaintAccess(),
    getProductionAccess(),
  ]);

  const displayUser = {
    name: user.user_metadata?.name || 'Admin',
    roles: roles.length ? roles : ['User'],
    isSuperAdmin,
    canViewProduction: productionAccess.view,
    department: actor?.department,
    complaint_permissions: actor?.complaint_permissions,
  };

  return (
    <ComplaintAccessProvider value={actor}>
      <Navbar user={displayUser} />
      {children}
    </ComplaintAccessProvider>
  );
}
