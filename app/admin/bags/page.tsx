// app/admin/bags/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import BagClient from './BagClient';

// Mark sebagai dynamic untuk fresh data
export const dynamic = "force-dynamic";

interface BagData {
  id: number;
  qr_code: string;
  production_id: number;
  production: any;
  capacity: number;
  quantity: number;
  packs: number;
  type: string;
  downloaded_at: string | null;
  created_at: string;
  updated_at: string;
  // Relasi dengan bag_pieces
  bag_pieces?: {
    id: number;
    serial_number: string;
    qr_code: string;
    qr_expired_date: string | null;
  }[];
}

interface ProductionSummary {
  id: number;
  group_number: string;
  lot_number: string;
  product_name: string;
  company_name: string;
}

async function fetchBags(page = 1, limit = 50, searchQuery?: string) {
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
    // Base query
    let query = supabase
      .from('bags')
      .select(`
        *,
        bag_pieces!bag_pieces_bag_id_foreign (
          id,
          serial_number,
          qr_code,
          qr_expired_date
        )
      `, { count: 'exact' });

    // Add search if provided
    if (searchQuery) {
      query = query.or(`qr_code.ilike.%${searchQuery}%`);
    }

    // Add pagination and ordering
    const { data: bags, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get productions for dropdown (simplified)
    const { data: productions } = await supabase
      .from('productions')
      .select('id, group_number, lot_number, product, company')
      .order('created_at', { ascending: false })
      .limit(100);

    // Transform productions untuk dropdown
    const productionOptions = productions?.map(p => ({
      id: p.id,
      group_number: p.group_number,
      lot_number: p.lot_number,
      product_name: p.product?.name || 'N/A',
      company_name: p.company?.name || 'N/A'
    })) || [];

    return {
      bags: bags || [],
      productions: productionOptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalCount: count || 0
      }
    };
  } catch (error) {
    console.error('Error fetching bags:', error);
    throw error;
  }
}

export default async function BagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  try {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const search = params.search;
    
    const data = await fetchBags(page, 50, search);
    
    return (
      <BagClient 
        initialBags={data.bags}
        productions={data.productions}
        pagination={data.pagination}
      />
    );
  } catch (error: any) {
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