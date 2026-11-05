import { requireSuperAdminPage } from '../../access';
import RoleForm from '../RoleForm';
import { loadRolePermissions } from '../permissions';

export default async function AddRolePage() {
  await requireSuperAdminPage();
  return <RoleForm permissions={await loadRolePermissions()} />;
}
