// app/admin/users/UserClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import UserForm from './UserForm';
import { deleteUser } from './actions';
import { formatDateTime } from '@/app/utils/dateFormat';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  last_sign_in_at?: string;
  department?: string;
  complaint_permissions?: Record<string, boolean>;
}

interface UserClientProps {
  initialUsers: User[];
  availableRoles: string[];
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

export default function UserClient({ initialUsers, availableRoles }: UserClientProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const displayUser: DisplayUser | null = user
    ? {
        name: user.user_metadata?.name || 'Admin',
        roles: user.app_metadata?.roles || [],
      }
    : null;

  const handleLogout = () => { /* TODO: Implement logout logic */ };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.')) {
      const toastId = toast.loading('Menghapus user...');
      try {
        await deleteUser(id);
        toast.success('User berhasil dihapus.', { id: toastId });
        window.location.reload(); 
      } catch (error: any) {
        toast.error(`Gagal menghapus user: ${error.message}`, { id: toastId });
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
              User Management
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Kelola user, role, dan hak akses sistem.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah User
            </button>
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
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Nama
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Last Sign In
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {/* ++ CEK PANJANG DATA DITAMBAHKAN ++ */}
                {initialUsers && initialUsers.length > 0 ? initialUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    {/* ++ SEL ID DITAMBAHKAN (dengan truncate) ++ */}
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6 max-w-[100px] truncate" title={user.id}>
                      {user.id}
                    </td>
                    {/* -- Styling sel nama disesuaikan -- */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-200">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {formatDateTime(user.last_sign_in_at)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button onClick={() => handleEdit(user)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 inline-flex items-center gap-1">
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-4 inline-flex items-center gap-1">
                        <TrashIcon className="h-4 w-4" /> Hapus
                      </button>
                    </td>
                  </tr>
                )) : (
                  // ++ EMPTY STATE DITAMBAHKAN ++
                  <tr>
                    <td colSpan={6} className="text-center py-16 px-6 text-gray-500 dark:text-slate-400">
                      <h3 className="text-lg font-semibold dark:text-slate-300">Belum ada data</h3>
                      <p className="mt-1 text-sm dark:text-slate-400">Mulai dengan menambahkan user baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <UserForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        availableRoles={availableRoles}
        userToEdit={selectedUser}
      />
    </div>
  );
}