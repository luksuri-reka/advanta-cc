// app/utils/dateFormat.ts

/**
 * Format date to DD-MM-YYYY (EXISTING - KEEP THIS)
 * Format existing yang sudah digunakan di sistem
 */
export function formatDate(dateString: string): string {
  if (!dateString || dateString === '') {
    return '-';
  }
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format datetime to DD-MM-YYYY HH:MM (EXISTING - KEEP THIS)
 * Format existing yang sudah digunakan di sistem
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) {
    return 'Belum pernah';
  }
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
}

// ============================================================
// ADDITIONAL HELPER FUNCTIONS (NEW - for dual verification)
// ============================================================

/**
 * Check if a date is expired
 * Berguna untuk highlight tanggal kadaluarsa
 */
export function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    return false;
  }
}

/**
 * Get days until expiry
 * Menghitung berapa hari lagi sampai kadaluarsa
 */
export function getDaysUntilExpiry(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    return null;
  }
}

/**
 * Format relative time (e.g., "2 hari yang lalu")
 * Untuk display waktu relatif
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  } catch (error) {
    return '-';
  }
}

/**
 * Format date with Indonesian month names (optional - untuk display yang lebih friendly)
 * Contoh: "15 Oktober 2024"
 */
export function formatDateIndonesian(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting Indonesian date:', error);
    return '-';
  }
}

/**
 * Get expiry status with color indicator
 * Untuk styling based on expiry status
 */
export function getExpiryStatus(dateString: string | null | undefined): {
  status: 'expired' | 'warning' | 'valid';
  message: string;
  color: 'red' | 'yellow' | 'green';
} {
  const days = getDaysUntilExpiry(dateString);
  
  if (days === null) {
    return { status: 'valid', message: 'Tidak ada data', color: 'green' };
  }
  
  if (days < 0) {
    return { 
      status: 'expired', 
      message: `Kadaluarsa ${Math.abs(days)} hari yang lalu`, 
      color: 'red' 
    };
  }
  
  if (days <= 30) {
    return { 
      status: 'warning', 
      message: `${days} hari lagi`, 
      color: 'yellow' 
    };
  }
  
  return { 
    status: 'valid', 
    message: `${days} hari lagi`, 
    color: 'green' 
  };
}

/**
 * Validate if string is valid date
 * Untuk form validation
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}