// app/admin/companies/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const createSupabaseServerClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { get: async (name: string) => (await cookieStore).get(name)?.value },
        }
    );
};

export interface CompanyFormData {
  name: string;
  type: string;
  address: string;
  province_id: number;
}

export async function createCompany(formData: CompanyFormData) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('companies').insert(formData).select().single();
  if (error) return { error };
  
  revalidatePath('/admin/companies');
  return { data };
}

export async function updateCompany(id: number, formData: CompanyFormData) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from('companies').update(formData).eq('id', id).select().single();
    if (error) return { error };
    
    revalidatePath('/admin/companies');
    return { data };
}

export async function deleteCompany(id: number) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) return { error };

    revalidatePath('/admin/companies');
    return { data: { success: true } };
}