// app/admin/bahan-aktif/ActiveIngredientClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import ActiveIngredientForm from './ActiveIngredientForm';
import { deleteActiveIngredient } from './actions';
import { formatDate } from '@/app/utils/dateFormat';
import type { User } from '@supabase/supabase-js';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface ActiveIngredient {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface ActiveIngredientClientProps {
  initialActiveIngredients: ActiveIngredient[];
}

export default function ActiveIngredientClient({ initialActiveIngredients }: ActiveIngredientClientProps) {
  const { user: authUser } = useAuth();
  const user = authUser as DisplayUser | null; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<ActiveIngredient | null>(null);

  const handleLogout = async () => {
    // Logika logout Anda
    console.log('User logged out');
  };

  const handleEdit = (activeIngredient: ActiveIngredient) => {
    setSelectedActiveIngredient(activeIngredient);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedActiveIngredient(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActiveIngredient(null);
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await deleteActiveIngredient(id);
        
        // --- PERBAIKAN ---
        // Cek jika ada error, bukan jika success
        if (result.error) {
          toast.error(result.error.message || 'Gagal menghapus data.');
        } else {
          toast.success('Data berhasil dihapus.');
          // Refresh halaman atau update state
          window.location.reload(); 
        }
        // --- AKHIR PERBAIKAN ---

      } catch (error) {
        toast.error('Terjadi kesalahan saat menghapus data.');
        console.error(error);
      }
    }
  };

  // Sediakan user default jika null untuk Navbar
  const navbarUser = user || { name: 'Guest', roles: [], complaint_permissions: {} };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={navbarUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Master Bahan Aktif
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Kelola daftar bahan aktif yang tersedia dalam produk.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah Bahan Aktif
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nama
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dibuat Pada
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {initialActiveIngredients.length > 0 ? initialActiveIngredients.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 px-6 text-right text-sm font-medium">
                      <button onClick={() => handleEdit(item)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400 inline-flex items-center gap-1">
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400 ml-4 inline-flex items-center gap-1">
                        <TrashIcon className="h-4 w-4" /> Hapus
                      </button>
                    </td>
                  </tr>
                )) : (
                   <tr>
                    <td colSpan={4} className="text-center py-16 px-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Belum ada data</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Mulai dengan menambahkan data bahan aktif baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ActiveIngredientForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        activeIngredientToEdit={selectedActiveIngredient}
      />
    </div>
  );
}