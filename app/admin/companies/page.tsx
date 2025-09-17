// app/admin/companies/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CompanyClient from './CompanyClient';

async function fetchInitialData() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { get: async (name: string) => (await cookieStore).get(name)?.value },
        }
    );
    
    // Ambil data perusahaan beserta nama provinsinya melalui join
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
            id,
            name,
            type,
            address,
            province_id,
            provinces ( name )
        `);

    const { data: provinces, error: provincesError } = await supabase.from('provinces').select('id, name');
    
    if (companiesError) throw new Error(`Gagal memuat perusahaan: ${companiesError.message}`);
    if (provincesError) throw new Error(`Gagal memuat provinsi: ${provincesError.message}`);

    return { companies, provinces };
}

export default async function CompaniesPage() {
    const { companies, provinces } = await fetchInitialData();
    return <CompanyClient initialCompanies={companies} availableProvinces={provinces} />;
}