// app/utils/dateFormat.ts

// Fungsi ini tetap ada
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

// --- TAMBAHKAN FUNGSI BARU DI BAWAH INI ---
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