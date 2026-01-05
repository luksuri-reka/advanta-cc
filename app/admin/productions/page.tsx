// app/admin/productions/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ProductionClient from './ProductionClient';

export const dynamic = "force-dynamic";

async function fetchAllDataInBatches() {
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

  try {
    const allProductions = [];
    let from = 0;
    const batchSize = 1000;
    
    console.log('Starting batch fetching...');
    
    while (true) {
      // TAMBAHKAN 'lab_result_expired_date' DI SINI
      const { data: batchData, error } = await supabase
        .from('productions')
        .select(`
          id, 
          group_number, 
          lot_number,
          clearance_number,
          product_id,
          company_id,
          lot_kelas_benih_id,
          lot_varietas_id,
          lot_volume, 
          cert_realization_tanggal_panen, 
          lab_result_expired_date, 
          import_qr_at, 
          code_1, 
          code_2, 
          code_3, 
          code_4
        `)
        .order('cert_realization_tanggal_panen', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) throw new Error(`Gagal memuat produksi: ${error.message}`);
      if (!batchData || batchData.length === 0) break;

      allProductions.push(...batchData);
      if (batchData.length < batchSize) break;
      from += batchSize;
    }

    // Fetch reference data
    const [productsRes, companiesRes, varietasRes, kelasBenihRes] = await Promise.all([
      supabase.from('products').select('id, name').order('name'),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('varietas').select('id, name').order('name'),
      supabase.from('kelas_benih').select('id, name').order('name')
    ]);

    // Mapping maps (unchanged)
    const productMap = new Map(productsRes.data?.map(p => [p.id, p]) || []);
    const companyMap = new Map(companiesRes.data?.map(c => [c.id, c]) || []);
    const varietasMap = new Map(varietasRes.data?.map(v => [v.id, v]) || []);
    const kelasBenihMap = new Map(kelasBenihRes.data?.map(kb => [kb.id, kb]) || []);

    const transformedProductions = allProductions.map(prod => ({
      id: prod.id,
      group_number: prod.group_number,
      lot_number: prod.lot_number,
      clearance_number: prod.clearance_number,
      product: productMap.get(prod.product_id) || null,
      company: companyMap.get(prod.company_id) || null,
      lot_kelas_benih: kelasBenihMap.get(prod.lot_kelas_benih_id) || null,
      lot_varietas: varietasMap.get(prod.lot_varietas_id) || null,
      lot_volume: prod.lot_volume,
      cert_realization_tanggal_panen: prod.cert_realization_tanggal_panen,
      lab_result_expired_date: prod.lab_result_expired_date, // Tambahkan ini
      import_qr_at: prod.import_qr_at,
      code_1: prod.code_1,
      code_2: prod.code_2,
      code_3: prod.code_3,
      code_4: prod.code_4,
    }));

    return {
      productions: transformedProductions,
      products: productsRes.data || [],
      companies: companiesRes.data || [],
      varietas: varietasRes.data || [],
      kelasBenih: kelasBenihRes.data || [],
      totalCount: transformedProductions.length,
      currentPage: 1,
      totalPages: 1
    };

  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default async function ProductionsPage() {
  try {
    const data = await fetchAllDataInBatches();
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
    return <div className="p-8 text-red-600">Error: {error.message}</div>;
  }
}