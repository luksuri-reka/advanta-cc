// app/admin/users/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import UserClient from './UserClient';

// 1. Jadikan fungsi ini 'async'
const createSupabaseServerClient = () => {
    const cookieStore = cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
        },
      }
    );
};

async function fetchInitialData() {
    // 2. Tambahkan 'await' saat memanggil helper
    const supabase = createSupabaseServerClient();
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const { data: roles, error: rolesError } = await supabase.from('roles').select('name');
    
    if (usersError) throw new Error(`Gagal memuat pengguna: ${usersError.message}`);
    if (rolesError) throw new Error(`Gagal memuat peran: ${rolesError.message}`);

    const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.user_metadata?.name || 'N/A',
        email: user.email || 'N/A',
        role: user.app_metadata?.role || 'N/A',
        last_sign_in_at: user.last_sign_in_at,
    }));
    
    const roleNames = roles.map(r => r.name);
    
    return { users: formattedUsers, roles: roleNames };
}

export default async function UsersPage() {
    const { users, roles } = await fetchInitialData();
    return <UserClient initialUsers={users} availableRoles={roles} />;
}