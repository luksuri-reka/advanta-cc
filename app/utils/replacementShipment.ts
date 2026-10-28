export const REPLACEMENT_SHIPMENT_OPTIONS = ['shipped', 'pending', 'not_required'] as const;

export type ReplacementShipmentStatus = (typeof REPLACEMENT_SHIPMENT_OPTIONS)[number];

export interface ReplacementShipment {
  replacement_shipment_status?: ReplacementShipmentStatus | null;
  replacement_shipped_date?: string | null;
}

export const REPLACEMENT_SHIPMENT_LABELS: Record<ReplacementShipmentStatus, string> = {
  shipped: 'Sudah',
  pending: 'Belum',
  not_required: 'Tidak Ada Penggantian Benih',
};

export const isReplacementShipmentStatus = (value: unknown): value is ReplacementShipmentStatus =>
  typeof value === 'string' && REPLACEMENT_SHIPMENT_OPTIONS.includes(value as ReplacementShipmentStatus);

export const getReplacementShipmentLabel = (value: unknown): string =>
  isReplacementShipmentStatus(value) ? REPLACEMENT_SHIPMENT_LABELS[value] : 'Belum diisi';

// A date-only value must round-trip unchanged; Date alone accepts e.g. 30 February.
export const isShipmentDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const formatShipmentDate = (value: unknown): string => {
  if (!isShipmentDate(value)) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export const validateReplacementShipment = (status: unknown, date: unknown): string | null => {
  if (!isReplacementShipmentStatus(status)) return 'Pilih status pengiriman benih pengganti';
  if (status === 'shipped' && !isShipmentDate(date)) {
    return 'Tanggal pengiriman wajib diisi dengan tanggal yang valid';
  }
  return null;
};

export const getReplacementShipmentExportFields = (shipment: ReplacementShipment) => ({
  'Status Pengiriman Benih Pengganti': getReplacementShipmentLabel(shipment.replacement_shipment_status),
  'Tanggal Pengiriman Benih Pengganti': shipment.replacement_shipment_status === 'shipped'
    ? formatShipmentDate(shipment.replacement_shipped_date)
    : '-',
});

export const canUpdateReplacementShipment = (
  roles: unknown,
  profile: { is_active?: boolean | null; complaint_permissions?: Record<string, unknown> | null } | null,
): boolean => {
  if (Array.isArray(roles) && (roles.includes('Superadmin') || roles.includes('superadmin'))) return true;
  return profile?.is_active === true && profile.complaint_permissions?.canUpdateComplaintStatus === true;
};
