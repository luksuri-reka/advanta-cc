export const complaintPermissionLabels = {
  canViewComplaints: 'View Complaints',
  canEditComplaints: 'Edit Complaints',
  canAssignComplaints: 'Assign Complaints',
  canResolveComplaints: 'Resolve Complaints',
  canRespondToComplaints: 'Respond to Complaints',
  canConfigureComplaintSystem: 'Manage Settings',
  canViewComplaintAnalytics: 'View Analytics',
  canManageComplaintUsers: 'Manage Complaint Team',
} as const;

export type ComplaintPermission = keyof typeof complaintPermissionLabels
  | 'canDeleteComplaints'
  | 'canExportComplaintData';

export type ComplaintPermissions = Record<string, boolean>;

export interface ComplaintActor {
  id: string;
  name: string;
  isSuperAdmin: boolean;
  department?: string;
  complaint_permissions: ComplaintPermissions;
}

export const complaintAssigneeFields = [
  'assigned_to', 'assignee_observasi', 'assignee_investigasi_1',
  'assignee_investigasi_2', 'assignee_lab_testing', 'assignee_approval',
] as const;

type ComplaintAssignment = Partial<Record<(typeof complaintAssigneeFields)[number], string | null>>;

export function normalizeComplaintPermissions(permissions: unknown): ComplaintPermissions {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return {};
  const flags = Object.fromEntries(Object.entries(permissions).filter(([, value]) => typeof value === 'boolean'));
  if (flags.canEditComplaints === undefined && flags.canUpdateComplaintStatus !== undefined) {
    flags.canEditComplaints = flags.canUpdateComplaintStatus;
  }
  if (flags.canConfigureComplaintSystem === undefined && flags.canManageComplaintSettings !== undefined) {
    flags.canConfigureComplaintSystem = flags.canManageComplaintSettings;
  }
  return flags;
}

export function hasComplaintPermission(actor: ComplaintActor | null, permission: ComplaintPermission) {
  return !!(actor?.isSuperAdmin || actor?.complaint_permissions[permission] === true);
}

export function canWorkOnComplaint(
  actor: ComplaintActor,
  complaint: ComplaintAssignment,
  permission: 'canEditComplaints' | 'canResolveComplaints',
) {
  if (!hasComplaintPermission(actor, 'canViewComplaints')) return false;
  if (hasComplaintPermission(actor, permission)) return true;
  // Older team profiles have only view/respond. Keep their assigned workflow until a flag is set.
  return actor.complaint_permissions[permission] === undefined
    && (actor.department === 'management' || complaintAssigneeFields.some(field => complaint[field] === actor.id));
}
