// app/admin/roles/[id]/edit/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import RoleForm from '../../RoleForm';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  // Await both cookies and params
  const cookieStore = await cookies();
  const resolvedParams = await params;
  
  // Now we can safely access the id
  const roleId = parseInt(resolvedParams.id, 10);

  if (isNaN(roleId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">ID Peran Tidak Valid</h2>
          <Link href="/admin/roles">
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-500">
              Kembali ke Daftar Peran
            </button>
          </Link>
        </div>
      </div>
    );
  }

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

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();

  const { data: permissions, error: permError } = await supabase
    .from('role_has_permissions')
    .select('permission_id')
    .eq('role_id', roleId);

  console.log('Loaded permissions for role', roleId, ':', permissions);

  if (roleError || permError || !role) {
    console.error('Failed to fetch role data:', roleError || permError);
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Peran Tidak Ditemukan</h2>
          <p className="text-gray-500 mt-2">
            Peran dengan ID {roleId} tidak dapat ditemukan atau terjadi kesalahan.
          </p>
          <Link href="/admin/roles">
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-500">
              Kembali ke Daftar Peran
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const roleData = {
    ...role,
    permissions: permissions.map(p => String(p.permission_id)), // Ensure all IDs are strings
  };

  return <RoleForm initialData={roleData} />;
}