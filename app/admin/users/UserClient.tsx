// app/admin/users/UserClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import UserForm from './UserForm';
import { deleteUser } from './actions';
import { formatDateTime } from '@/app/utils/dateFormat'; // Impor fungsi baru

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  last_sign_in_at?: string;
}

interface UserClientProps {
  initialUsers: User[];
  availableRoles: string[];
}

export default function UserClient({ initialUsers, availableRoles }: UserClientProps) {
  const { user } = useAuth();
  // Optimasi: Gunakan satu state untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    setSelectedUser(null); // Reset user terpilih saat modal ditutup
  };
  
  const handleDelete = async (userId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
        const promise = deleteUser(userId);
        
        toast.promise(promise, {
            loading: 'Menghapus pengguna...',
            success: (result) => {
                if (result.error) throw new Error(result.error.message);
                return 'Pengguna berhasil dihapus!';
            },
            error: (err) => `Gagal menghapus: ${err.message}`,
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Pengguna & Hak Akses</h1>
            <p className="mt-1 text-md text-gray-600">Kelola semua akun yang memiliki akses ke admin console.</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Pengguna</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Peran</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Terakhir Masuk</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {initialUsers.map((user) => (
                      <tr key={user.id} className="even:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{user.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                           <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {user.role}
                           </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDateTime(user.last_sign_in_at)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button onClick={() => handleEdit(user)} className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1">
                            <PencilIcon className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
                            <TrashIcon className="h-4 w-4" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </main>

      {/* Render satu UserForm saja */}
      <UserForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        availableRoles={availableRoles}
        userToEdit={selectedUser}
      />
    </div>
  );
}