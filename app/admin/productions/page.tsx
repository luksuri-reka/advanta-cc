// app/admin/productions/page.tsx (Optimized)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ProductionClient from './ProductionClient';

// Menandai halaman ini sebagai dinamis untuk memastikan data terbaru selalu diambil
export const dynamic = "force-dynamic";

// Fungsi untuk mengambil data dengan pagination dan optimasi
async function fetchInitialData(page = 1, limit = 50) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const offset = (page - 1) * limit;

  try {
    // Query yang dioptimasi dengan pagination dan select minimal
    const [productionsRes, productsRes, companiesRes, varietasRes, kelasBenihRes] = await Promise.all([
      // Query productions dengan pagination dan field minimal
      supabase
        .from('productions')
        .select(`
          id, 
          group_number, 
          lot_number, 
          product_id,
          company_id,
          lot_kelas_benih_id,
          lot_varietas_id,
          lot_volume, 
          cert_realization_tanggal_panen, 
          import_qr_at, 
          code_1, 
          code_2, 
          code_3, 
          code_4
        `)
        .order('cert_realization_tanggal_panen', { ascending: false })
        .range(offset, offset + limit - 1),
      
      // Query reference data (cached di client)
      supabase
        .from('products')
        .select('id, name')
        .order('name'),
      
      supabase
        .from('companies')
        .select('id, name')
        .order('name'),
      
      supabase
        .from('varietas')
        .select('id, name')
        .order('name'),
      
      supabase
        .from('kelas_benih')
        .select('id, name')
        .order('name')
    ]);

    if (productionsRes.error) throw new Error(`Gagal memuat produksi: ${productionsRes.error.message}`);
    if (productsRes.error) throw new Error(`Gagal memuat produk: ${productsRes.error.message}`);
    if (companiesRes.error) throw new Error(`Gagal memuat perusahaan: ${companiesRes.error.message}`);
    if (varietasRes.error) throw new Error(`Gagal memuat varietas: ${varietasRes.error.message}`);
    if (kelasBenihRes.error) throw new Error(`Gagal memuat kelas benih: ${kelasBenihRes.error.message}`);

    // Buat lookup maps untuk efisiensi
    const productMap = new Map(productsRes.data?.map(p => [p.id, p]) || []);
    const companyMap = new Map(companiesRes.data?.map(c => [c.id, c]) || []);
    const varietasMap = new Map(varietasRes.data?.map(v => [v.id, v]) || []);
    const kelasBenihMap = new Map(kelasBenihRes.data?.map(kb => [kb.id, kb]) || []);

    // Transform data dengan lookup yang efisien
    const transformedProductions = productionsRes.data?.map(prod => ({
      id: prod.id,
      group_number: prod.group_number,
      lot_number: prod.lot_number,
      product: productMap.get(prod.product_id) || null,
      company: companyMap.get(prod.company_id) || null,
      lot_kelas_benih: kelasBenihMap.get(prod.lot_kelas_benih_id) || null,
      lot_varietas: varietasMap.get(prod.lot_varietas_id) || null,
      lot_volume: prod.lot_volume,
      cert_realization_tanggal_panen: prod.cert_realization_tanggal_panen,
      import_qr_at: prod.import_qr_at,
      code_1: prod.code_1,
      code_2: prod.code_2,
      code_3: prod.code_3,
      code_4: prod.code_4,
    })) || [];

    // Get total count untuk pagination
    const { count } = await supabase
      .from('productions')
      .select('*', { count: 'exact', head: true });

    return {
      productions: transformedProductions,
      products: productsRes.data || [],
      companies: companiesRes.data || [],
      varietas: varietasRes.data || [],
      kelasBenih: kelasBenihRes.data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default async function ProductionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  try {
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1');
    const data = await fetchInitialData(page);
    
    return (
      <ProductionClient 
        initialProductions={data.productions} 
        products={data.products}
        companies={data.companies}
        varietas={data.varietas}
        kelasBenih={data.kelasBenih}
        pagination={{
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCount: data.totalCount
        }}
      />
    );
  } catch (error: any) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-700">Terjadi Kesalahan</h1>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
}