// app/admin/roles/[id]/edit/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import RoleForm from '../../RoleForm';
import Link from 'next/link';

// Fungsi untuk mengambil data peran tunggal di server
async function getRoleData(id: number) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Gunakan service key untuk akses admin
        {
            cookies: {
                async get(name: string) { return (await cookieStore).get(name)?.value; },
            },
        }
    );

    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
    if (roleError) throw new Error(`Gagal mengambil peran: ${roleError.message}`);
    if (!role) return null;
    
    // Asumsi tabel penghubung Anda 'role_has_permissions'
    const { data: permissions, error: permError } = await supabase
        .from('role_has_permissions')
        .select('permission_id') // Pastikan nama kolom ini benar
        .eq('role_id', id);
        
    if (permError) throw new Error(`Gagal mengambil izin: ${permError.message}`);
    
    return { ...role, permissions: permissions.map(p => p.permission_id) };
}


export default async function EditRolePage({ params }: { params: { id: string } }) {
  const roleId = parseInt(params.id, 10);
  const roleData = await getRoleData(roleId);

  if (!roleData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Peran Tidak Ditemukan</h2>
          <p className="text-gray-500 mt-2">
            Peran dengan ID {roleId} tidak dapat ditemukan. Mungkin sudah dihapus.
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

  return (
    <RoleForm initialData={roleData} />
  );
}