// app/admin/roles/[id]/edit/page.tsx
import RoleForm from '../../RoleForm';
import { getRoleById } from '@/app/utils/rolesApi';
import Link from 'next/link';

export default async function EditRolePage({ params }: { params: { id: string } }) {
  const roleId = parseInt(params.id, 10);
  const roleData = await getRoleById(roleId);

  // BARU: Tampilkan pesan jika peran tidak ditemukan
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