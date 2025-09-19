// app/admin/roles/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import RoleClient from './RoleClient';

// Fungsi ini sekarang mengambil data asli di server
async function fetchRoles() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) { 
                    return cookieStore.get(name)?.value; 
                },
            },
        }
    );
    
    const { data, error } = await supabase.from('roles').select('*');
    if (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
    return data;
}

export default async function RolesPage() {
  const initialRoles = await fetchRoles();
  return (
    <RoleClient initialRoles={initialRoles} />
  );
}