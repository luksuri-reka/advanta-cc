// app/admin/roles/RoleClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { deleteRole } from './actions';
import { toast, Toaster } from 'react-hot-toast'; 
import { formatDate } from '@/app/utils/dateFormat'; 

interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string; 
}

interface RoleClientProps {
    initialRoles: Role[];
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

export default function RoleClient({ initialRoles }: RoleClientProps) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>(initialRoles);

  const displayUser: DisplayUser | null = user
    ? {
        name: user.user_metadata?.name || 'Admin',
        roles: user.app_metadata?.roles || [],
      }
    : null;
    
  const handleLogout = () => { /* ... */ };

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const handleDelete = async (roleId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus peran ini? Ini tidak bisa dibatalkan.')) {
      const toastId = toast.loading('Menghapus peran...');
      try {
        const result = await deleteRole(roleId);
        if (result.error) {
          toast.error(`Gagal menghapus peran: ${result.error.message}`, { id: toastId });
        } else {
          setRoles(prev => prev.filter(role => role.id !== roleId));
          toast.success('Peran berhasil dihapus!', { id: toastId });
        }
      } catch (error: any) {
        toast.error(`Gagal menghapus peran: ${error.message || error}`, { id: toastId });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={displayUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Manajemen Peran (Roles)
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Kelola peran dan hak akses untuk pengguna admin.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/admin/roles/add"
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah Peran
            </Link>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  {/* ++ KOLOM ID DITAMBAHKAN ++ */}
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-200 sm:pl-6">
                    ID
                  </th>
                  {/* -- Styling kolom ini diubah -- */}
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Nama Peran
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Deskripsi
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Dibuat Pada
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      {/* ++ SEL ID DITAMBAHKAN ++ */}
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6">
                        {role.id}
                      </td>
                      {/* -- Styling sel ini diubah -- */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-200">
                        {role.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">
                        {role.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {formatDate(role.created_at)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/admin/roles/${role.id}/edit`} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 inline-flex items-center gap-1">
                          <PencilIcon className="h-4 w-4" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(role.id)}
                          disabled={role.name === 'Superadmin'} 
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-4 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="h-4 w-4" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    {/* ++ COLSPAN DIPERBARUI ++ */}
                    <td colSpan={5} className="text-center py-16 px-6 text-gray-500 dark:text-slate-400">
                       <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-300">Belum ada data peran</h3>
                       <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Mulai dengan menambahkan peran baru untuk mengatur hak akses.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}