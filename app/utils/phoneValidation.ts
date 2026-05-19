export const normalizeIndonesianMobileNumber = (phone: string) => {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+62')) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith('62')) {
    return `0${digits.slice(2)}`;
  }

  return digits;
};

export const validateIndonesianMobileNumber = (phone: string) => {
  const trimmed = phone.trim();

  if (!trimmed) return 'Nomor WhatsApp wajib diisi';
  if (!/^\+?\d+$/.test(trimmed)) return 'Nomor hanya boleh berisi angka dan tanda + di awal';
  if (trimmed.includes('+') && !trimmed.startsWith('+')) return 'Tanda + hanya boleh di awal nomor';
  if (!/^(\+628|628|08)/.test(trimmed)) return 'Nomor HP Indonesia harus diawali 08, 628, atau +628';

  const localNumber = normalizeIndonesianMobileNumber(trimmed);
  if (localNumber.length < 11 || localNumber.length > 13) {
    return 'Nomor HP Indonesia harus 11-13 digit';
  }

  return '';
};
