// app/admin/varietas/VarietyClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import VarietyForm from './VarietyForm';
import { deleteVariety } from './actions';
import { formatDate } from '@/app/utils/dateFormat';

interface Variety {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface VarietyClientProps {
  initialVarieties: Variety[];
}

export default function VarietyClient({ initialVarieties }: VarietyClientProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState<Variety | null>(null);

  const handleLogout = async () => { /* ... */ };

  const handleEdit = (variety: Variety) => {
    setSelectedVariety(variety);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedVariety(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVariety(null);
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const promise = deleteVariety(id);
      toast.promise(promise, {
         loading: 'Menghapus data...',
         success: 'Data berhasil dihapus!',
         error: (err) => `Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`,
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
            <h1 className="text-3xl font-bold text-gray-900">Data Varietas</h1>
            <p className="mt-1 text-md text-gray-600">Kelola semua varietas yang terdaftar dalam sistem.</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Data
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Varietas</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Deskripsi</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal Dibuat</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {initialVarieties.length > 0 ? initialVarieties.map((variety) => (
                      <tr key={variety.id} className="even:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{variety.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate" title={variety.description}>{variety.description || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(variety.created_at)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button onClick={() => handleEdit(variety)} className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1">
                            <PencilIcon className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDelete(variety.id)} className="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
                            <TrashIcon className="h-4 w-4" /> Hapus
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="text-center py-16 px-6 text-gray-500">
                          <h3 className="text-lg font-semibold">Belum ada data</h3>
                          <p className="mt-1 text-sm">Mulai dengan menambahkan data varietas baru.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </main>

      <VarietyForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        varietyToEdit={selectedVariety}
      />
    </div>
  );
}