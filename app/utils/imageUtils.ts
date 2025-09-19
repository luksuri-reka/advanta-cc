// utils/imageUtils.ts
const SUPABASE_STORAGE_BASE = 'https://bstxdyyglxrrfqgohllz.supabase.co/storage/v1/object/public/product-photos/';

export function normalizeImageUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  
  // Jika sudah URL lengkap dan tidak dobel, return as is
  if (photoUrl.startsWith('https://') && !photoUrl.includes(SUPABASE_STORAGE_BASE + 'https://')) {
    return photoUrl;
  }
  
  // Jika URL dobel, ambil nama file saja
  if (photoUrl.includes(SUPABASE_STORAGE_BASE + 'https://')) {
    const fileName = photoUrl.split('/').pop();
    return fileName ? SUPABASE_STORAGE_BASE + fileName : null;
  }
  
  // Jika hanya nama file, tambahkan base URL
  if (!photoUrl.startsWith('https://')) {
    return SUPABASE_STORAGE_BASE + photoUrl;
  }
  
  return photoUrl;
}