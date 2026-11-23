import 'server-only';
import { cache } from 'react';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/app/utils/supabase/service';
import {
  canWorkOnComplaint, complaintAssigneeFields, hasComplaintPermission, normalizeComplaintPermissions,
  type ComplaintActor, type ComplaintPermission,
} from '@/app/utils/complaintPermissions';
import { getAdminIdentity, getAdminUser } from './access';

export const getComplaintAccess = cache(async () => {
  const [{ user, isSuperAdmin }, { supabase }] = await Promise.all([getAdminIdentity(), getAdminUser()]);
  if (!user) return { actor: null, regions: [], supabase };

  const { data: profile, error } = await createServiceClient()
    .from('user_complaint_profiles')
    .select('full_name, department, is_active, complaint_permissions, assigned_regions')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) console.error('Gagal memuat profil Complaint Team:', error.message);

  const actor: ComplaintActor = {
    id: user.id,
    name: profile?.full_name || user.user_metadata?.name || 'Admin',
    isSuperAdmin,
    department: profile?.is_active ? profile.department : undefined,
    complaint_permissions: profile?.is_active ? normalizeComplaintPermissions(profile.complaint_permissions) : {},
  };
  return { actor, regions: !isSuperAdmin ? (profile?.assigned_regions ?? []) as string[] : [], supabase };
});

const forbidden = () => NextResponse.json({ error: 'Anda tidak memiliki izin untuk aksi ini.' }, { status: 403 });

export async function authorizeComplaintTeam(permission: ComplaintPermission) {
  const { actor, regions, supabase } = await getComplaintAccess();
  if (!actor) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!hasComplaintPermission(actor, permission)) return { denied: forbidden() };
  return { denied: null, actor, regions, supabase };
}

export async function authorizeComplaint(
  id: string,
  permission: ComplaintPermission | 'workflow' | 'resolveWorkflow' | 'approval',
) {
  const access = await authorizeComplaintTeam('canViewComplaints');
  if (access.denied) return access;
  const { actor, regions, supabase } = access;

  if (permission !== 'workflow' && permission !== 'resolveWorkflow' && permission !== 'approval'
      && !hasComplaintPermission(actor, permission)) return { denied: forbidden() };
  if (!/^[1-9]\d*$/.test(id)) return { denied: NextResponse.json({ error: 'ID komplain tidak valid' }, { status: 400 }) };

  const { data: complaint, error } = await supabase.from('complaints')
    .select(`customer_province, ${complaintAssigneeFields.join(', ')}`)
    .eq('id', id)
    .maybeSingle();
  if (error) return { denied: NextResponse.json({ error: 'Gagal memeriksa akses komplain' }, { status: 500 }) };
  const scope = complaint as (Parameters<typeof canWorkOnComplaint>[1] & { customer_province: string | null }) | null;
  if (!scope || (regions.length > 0 && !regions.includes(scope.customer_province ?? ''))) {
    return { denied: NextResponse.json({ error: 'Komplain tidak ditemukan atau tidak dapat diakses' }, { status: 404 }) };
  }
  if (permission === 'workflow' && !canWorkOnComplaint(actor, scope, 'canEditComplaints')) return { denied: forbidden() };
  if (permission === 'resolveWorkflow' && !canWorkOnComplaint(actor, scope, 'canResolveComplaints')) return { denied: forbidden() };
  if (permission === 'approval' && scope.assignee_approval !== actor.id) return { denied: forbidden() };
  return { denied: null, actor, supabase };
}
