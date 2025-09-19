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
    
    // Coba dengan join query dulu
    const { data: companiesWithJoin, error: joinError } = await supabase
        .from('companies')
        .select(`
            id,
            name,
            type,
            address,
            province_id,
            provinces!inner(name)
        `)
        .order('id', { ascending: true });

    const { data: provinces, error: provincesError } = await supabase
        .from('provinces')
        .select('id, name')
        .order('name');
    
    if (provincesError) {
        console.error('Provinces error:', provincesError);
        throw new Error(`Gagal memuat provinsi: ${provincesError.message}`);
    }

    let companies;

    // Jika join berhasil, gunakan hasil join
    if (!joinError && companiesWithJoin) {
        console.log('Using join query result:', companiesWithJoin);
        companies = companiesWithJoin.map(company => ({
            ...company,
            provinces: Array.isArray(company.provinces) ? company.provinces : [company.provinces]
        }));
    } else {
        // Fallback: ambil companies terpisah dan gabungkan manual
        console.log('Join failed, using fallback. Error:', joinError);
        
        const { data: companiesRaw, error: companiesError } = await supabase
            .from('companies')
            .select('id, name, type, address, province_id')
            .order('id', { ascending: true });
        
        if (companiesError) {
            console.error('Companies error:', companiesError);
            throw new Error(`Gagal memuat perusahaan: ${companiesError.message}`);
        }

        // Gabungkan data companies dengan provinces secara manual
        companies = companiesRaw?.map(company => {
            const matchedProvince = provinces?.find(p => p.id === company.province_id);
            console.log(`Company ${company.name}: province_id=${company.province_id}, matched=`, matchedProvince);
            return {
                ...company,
                provinces: matchedProvince ? [{ name: matchedProvince.name }] : []
            };
        }) || [];
    }

    console.log('Final companies data:', companies);
    return { companies, provinces: provinces || [] };
}

export default async function CompaniesPage() {
    try {
        const { companies, provinces } = await fetchInitialData();
        return <CompanyClient initialCompanies={companies} availableProvinces={provinces} />;
    } catch (error) {
        console.error('Page error:', error);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
                    <p className="text-gray-600">Gagal memuat data perusahaan. Silakan refresh halaman.</p>
                </div>
            </div>
        );
    }
}