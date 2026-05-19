export const COMPLAINT_STATUS_OPTIONS = [
  'submitted',
  'acknowledged',
  'observation',
  'investigation',
  'decision',
  'pending_response',
  'resolved',
  'closed',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUS_OPTIONS)[number];

export type ComplaintStatusGroup = 'Pending' | 'In Progress' | 'Resolved';

export type ComplaintMatrixStage =
  | 'confirmed'
  | 'observasi'
  | 'investigation'
  | 'labTest'
  | 'waitingDecision'
  | 'pendingResponse'
  | 'closedTotal';

export const COMPLAINT_STATUS_GROUPS: Record<ComplaintStatusGroup, readonly string[]> = {
  Pending: ['submitted', 'pending_response'],
  'In Progress': [
    'assigned',
    'acknowledged',
    'observation',
    'observasi',
    'investigating',
    'investigation',
    'lab_test',
    'lab_testing',
    'decision',
    'waiting_decision',
  ],
  Resolved: ['resolved', 'closed', 'rejected'],
};

const COMPLAINT_MATRIX_STAGE_BY_STATUS: Record<string, ComplaintMatrixStage> = {
  submitted: 'confirmed',
  assigned: 'confirmed',
  acknowledged: 'confirmed',
  observation: 'observasi',
  observasi: 'observasi',
  investigating: 'investigation',
  investigation: 'investigation',
  lab_test: 'labTest',
  lab_testing: 'labTest',
  decision: 'waitingDecision',
  waiting_decision: 'waitingDecision',
  pending_response: 'pendingResponse',
  resolved: 'closedTotal',
  closed: 'closedTotal',
  rejected: 'closedTotal',
};

export const normalizeComplaintStatus = (status: string | null | undefined) =>
  (status || '').trim().toLowerCase();

export const isValidComplaintStatus = (status: string | null | undefined): status is ComplaintStatus =>
  COMPLAINT_STATUS_OPTIONS.includes(normalizeComplaintStatus(status) as ComplaintStatus);

export const getComplaintStatusGroup = (
  status: string | null | undefined,
): ComplaintStatusGroup | null => {
  const normalized = normalizeComplaintStatus(status);
  if (COMPLAINT_STATUS_GROUPS.Pending.includes(normalized)) return 'Pending';
  if (COMPLAINT_STATUS_GROUPS['In Progress'].includes(normalized)) return 'In Progress';
  if (COMPLAINT_STATUS_GROUPS.Resolved.includes(normalized)) return 'Resolved';
  return null;
};

export const getStatusesForComplaintGroup = (
  group: string | null | undefined,
): readonly string[] => {
  if (group === 'Pending') return COMPLAINT_STATUS_GROUPS.Pending;
  if (group === 'In Progress') return COMPLAINT_STATUS_GROUPS['In Progress'];
  if (group === 'Resolved') return COMPLAINT_STATUS_GROUPS.Resolved;
  return [];
};

export const getComplaintMatrixStage = (
  status: string | null | undefined,
): ComplaintMatrixStage | null =>
  COMPLAINT_MATRIX_STAGE_BY_STATUS[normalizeComplaintStatus(status)] || null;

export const isClosedComplaintStatus = (status: string | null | undefined) =>
  getComplaintMatrixStage(status) === 'closedTotal';
