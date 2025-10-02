// app/admin/users/permissions.ts

export const complaintPermissions = {
  canViewComplaints: 'Lihat Semua Komplain',
  canRespondToComplaints: 'Balas Komplain',
  canAssignComplaints: 'Tetapkan Komplain ke Pengguna/Departemen',
  canManageComplaintUsers: 'Kelola Tim Komplain',
  canViewComplaintAnalytics: 'Lihat Analitik Komplain',
  canExportComplaintData: 'Ekspor Data Komplain',
  canConfigureComplaintSystem: 'Konfigurasi Sistem Komplain (SLA, dll.)',
};

export type ComplaintPermissionKey = keyof typeof complaintPermissions;

export const departments = [
  'admin',
  'customer_service',
  'quality_assurance',
  'technical',
  'management',
];