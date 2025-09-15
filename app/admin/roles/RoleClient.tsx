// app/admin/roles/RoleClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar'; // Asumsi Navbar sudah ada dan siap dipakai
import { useAuth } from '@/app/AuthContext';

// Tipe data untuk Peran (sesuaikan dengan tabel 'roles' Anda)
interface Role {
  id: number;
  name: string;
  description: string;
  guard_name: string; // 'sanctum' atau lainnya
}

export default function RoleClient() {
  const { user } = useAuth(); // Mengambil data user dari context
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // TODO: Ganti dengan data asli dari Supabase
  useEffect(() => {
    // Simulasi pengambilan data
    const fetchRoles = async () => {
      setLoading(true);
      // Gantilah ini dengan panggilan Supabase Anda, contoh:
      // const { data, error } = await supabase.from('roles').select('*');
      // if (data) setRoles(data);
      
      // Data dummy untuk desain
      const dummyData: Role[] = [
        { id: 1, name: 'Superadmin', description: 'Akses penuh ke semua fitur', guard_name: 'sanctum' },
        { id: 2, name: 'Operator Produksi', description: 'Hanya bisa mengelola data produksi', guard_name: 'sanctum' },
      ];
      setRoles(dummyData);

      setLoading(false);
    };
    fetchRoles();
  }, []);

  const handleLogout = () => { /* TODO: Implement logout logic */ };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user ? { name: user.user_metadata.name || 'Admin' } : null} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Halaman */}
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Peran & Izin</h1>
            <p className="mt-1 text-md text-gray-600">Kelola semua hak akses pengguna di sini.</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link href="/admin/roles/add">
              <button
                type="button"
                className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" />
                Tambah Peran Baru
              </button>
            </Link>
          </div>
        </div>

        {/* Konten Tabel */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-12 px-6 py-3.5 text-left text-sm font-semibold text-gray-900">#</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Peran</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Deskripsi</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr><td colSpan={4} className="text-center p-6 text-gray-500">Memuat data...</td></tr>
                    ) : roles.length > 0 ? (
                      roles.map((role, index) => (
                        <tr key={role.id} className="even:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-600">{index + 1}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{role.name}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{role.description}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/admin/roles/${role.id}/edit`} className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1">
                              <PencilIcon className="h-4 w-4" /> Edit
                            </Link>
                            <button className="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
                              <TrashIcon className="h-4 w-4" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-16 px-6">
                          <div className="mx-auto max-w-md">
                             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                               <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                             </svg>
                             <h3 className="mt-2 text-lg font-semibold text-gray-900">Belum ada data peran</h3>
                             <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan peran baru untuk mengatur hak akses pengguna.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}