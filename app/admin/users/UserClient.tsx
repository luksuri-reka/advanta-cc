// app/admin/users/UserClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import UserForm from './UserForm';
import { deleteUser } from './actions';

// Tipe data untuk user yang diterima dari server
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
  const [users, setUsers] = useState(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleLogout = () => { /* TODO: Implement logout logic */ };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = async (userId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
        const result = await deleteUser(userId);
        if (result.error) {
            alert(`Gagal menghapus: ${result.error.message}`);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user ? { name: user.user_metadata.name || 'Admin' } : null} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Pengguna</h1>
            <p className="mt-1 text-md text-gray-600">Anda bisa mengelola semua hak user di sini</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        {/* Tabel Pengguna */}
        <div className="mt-8 flow-root">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-12 px-6 py-3.5 text-left text-sm font-semibold text-gray-900">#</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Pengguna</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Peran</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((user, index) => (
                      <tr key={user.id} className="even:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-600">{index + 1}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{user.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.role}</td>
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

      {/* Modal untuk Tambah Pengguna */}
      <UserForm 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        availableRoles={availableRoles}
      />
      
      {/* Modal untuk Edit Pengguna */}
      <UserForm 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        availableRoles={availableRoles}
        userToEdit={selectedUser}
      />

    </div>
  );
}