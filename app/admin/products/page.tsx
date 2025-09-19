// app/admin/products/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ProductClient from './ProductClient';

async function fetchInitialData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value },
    }
  );
  
  // Ambil semua data dalam satu Promise.all untuk efisiensi
  const [
    productsRes, 
    jenisTanamanRes, 
    kelasBenihRes, 
    varietasRes, 
    bahanAktifRes
  ] = await Promise.all([
    // PERBAIKAN: Ambil SEMUA field dari products untuk keperluan edit
    supabase.from('products').select(`
      id, 
      photo, 
      sku, 
      name,
      jenis_tanaman_id,
      kelas_benih_id,
      varietas_id,
      benih_murni,
      daya_berkecambah,
      kadar_air,
      kotoran_benih,
      campuran_varietas_lain,
      benih_tanaman_lain,
      pack_capacity,
      bag_capacity,
      qr_color,
      varietas!inner ( name ),
      kelas_benih!inner ( name ),
      jenis_tanaman!inner ( name ),
      product_bahan_aktif ( bahan_aktif_id )
    `).order('name', { ascending: true }),
    supabase.from('jenis_tanaman').select('id, name').order('name'),
    supabase.from('kelas_benih').select('id, name').order('name'),
    supabase.from('varietas').select('id, name').order('name'),
    supabase.from('bahan_aktif').select('id, name').order('name')
  ]);
  
  // Cek error untuk setiap query
  if (productsRes.error) throw new Error(`Gagal memuat produk: ${productsRes.error.message}`);
  if (jenisTanamanRes.error) throw new Error(`Gagal memuat jenis tanaman: ${jenisTanamanRes.error.message}`);
  if (kelasBenihRes.error) throw new Error(`Gagal memuat kelas benih: ${kelasBenihRes.error.message}`);
  if (varietasRes.error) throw new Error(`Gagal memuat varietas: ${varietasRes.error.message}`);
  if (bahanAktifRes.error) throw new Error(`Gagal memuat bahan aktif: ${bahanAktifRes.error.message}`);

  // Transform products data to match the expected interface
  const transformedProducts = productsRes.data?.map(product => ({
    id: product.id,
    photo: product.photo, // Sekarang hanya nama file, akan dinormalisasi di client
    sku: product.sku,
    name: product.name,
    // Data untuk form edit - pastikan semua field ada
    jenis_tanaman_id: product.jenis_tanaman_id,
    kelas_benih_id: product.kelas_benih_id,
    varietas_id: product.varietas_id,
    benih_murni: product.benih_murni,
    daya_berkecambah: product.daya_berkecambah,
    kadar_air: product.kadar_air,
    kotoran_benih: product.kotoran_benih,
    campuran_varietas_lain: product.campuran_varietas_lain,
    benih_tanaman_lain: product.benih_tanaman_lain,
    pack_capacity: product.pack_capacity,
    bag_capacity: product.bag_capacity,
    qr_color: product.qr_color,
    // Data relasi untuk tampilan tabel
    varietas: Array.isArray(product.varietas) ? product.varietas[0] : product.varietas,
    kelas_benih: Array.isArray(product.kelas_benih) ? product.kelas_benih[0] : product.kelas_benih,
    jenis_tanaman: Array.isArray(product.jenis_tanaman) ? product.jenis_tanaman[0] : product.jenis_tanaman,
    // Extract bahan_aktif IDs from the pivot table
    bahan_aktif_ids: product.product_bahan_aktif?.map((item: any) => item.bahan_aktif_id) || []
  })) || [];

  return {
    products: transformedProducts,
    allJenisTanaman: jenisTanamanRes.data || [],
    allKelasBenih: kelasBenihRes.data || [],
    allVarietas: varietasRes.data || [],
    allBahanAktif: bahanAktifRes.data || [],
  };
}

export default async function ProductsPage() {
  try {
    const { products, allJenisTanaman, allKelasBenih, allVarietas, allBahanAktif } = await fetchInitialData();
    
    return (
      <ProductClient 
        initialProducts={products}
        allJenisTanaman={allJenisTanaman}
        allKelasBenih={allKelasBenih}
        allVarietas={allVarietas}
        allBahanAktif={allBahanAktif}
      />
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
          </p>
        </div>
      </div>
    );
  }
}