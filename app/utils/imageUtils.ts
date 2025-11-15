// utils/imageUtils.ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bstxdyyglxrrfqgohllz.supabase.co';
const BUCKET_NAME = 'product-photos';
const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;

export function normalizeImageUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  
  // Jika sudah URL lengkap yang benar, return as is
  if (photoUrl.startsWith('https://') && photoUrl.includes('/storage/v1/object/public/')) {
    return photoUrl;
  }
  
  // Jika hanya nama file (termasuk UUID-filename.ext), tambahkan base URL
  return SUPABASE_STORAGE_BASE + photoUrl;
}

// Fungsi helper untuk extract filename dari URL (opsional, untuk keperluan delete/update)
export function getFilenameFromUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Jika bukan URL, return as-is (sudah filename)
  if (!url.startsWith('http')) return url;
  
  // Extract filename dari URL
  const parts = url.split('/');
  return parts[parts.length - 1];
}