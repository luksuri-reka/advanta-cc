// app/admin/jenis-tanaman/PlantTypeClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext'; // Asumsi 'user' dari sini adalah tipe 'User | null' dari Supabase
import PlantTypeForm from './PlantTypeForm';
import { deletePlantType } from './actions';
import { formatDate } from '@/app/utils/dateFormat';

interface PlantType {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface PlantTypeClientProps {
  initialPlantTypes: PlantType[];
}

// ++ FIX 1: Definisikan interface DisplayUser yang dibutuhkan oleh Navbar ++
// (Atau impor jika sudah ada di file terpisah)
interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

export default function PlantTypeClient({ initialPlantTypes }: PlantTypeClientProps) {
  const { user } = useAuth(); // Ini adalah 'User | null' dari Supabase
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);

  // ++ FIX 2: Transformasi 'user' Supabase menjadi 'displayUser' ++
  // Kita buat objek baru yang sesuai dengan apa yang diharapkan Navbar.
  const displayUser: DisplayUser | null = user
    ? {
        name: user.user_metadata?.name || 'Admin', // Ambil 'name' dari metadata
        roles: user.app_metadata?.roles || [], // Ambil 'roles' jika ada
      }
    : null;

  const handleLogout = async () => {
    console.log("Logout triggered");
    // Logika logout Anda akan dipanggil di sini
  };

  const handleEdit = (plantType: PlantType) => {
    setSelectedPlantType(plantType);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPlantType(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlantType(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const toastId = toast.loading('Menghapus data...');
      try {
        await deletePlantType(id);
        toast.success('Data berhasil dihapus.', { id: toastId });
        window.location.reload();
      } catch (error) {
        toast.error('Gagal menghapus data.', { id: toastId });
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* ++ FIX 3: Berikan 'displayUser' (bukan 'user') ke Navbar ++ */}
      <Navbar user={displayUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Master Jenis Tanaman
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Kelola daftar jenis tanaman yang tersedia di sistem.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah Data
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-200 sm:pl-6">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Nama Jenis Tanaman
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
                {initialPlantTypes && initialPlantTypes.length > 0 ? initialPlantTypes.map((plantType) => (
                  <tr key={plantType.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6">
                      {plantType.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-200">
                      {plantType.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {plantType.description || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {formatDate(plantType.created_at)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button onClick={() => handleEdit(plantType)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 inline-flex items-center gap-1">
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(plantType.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-4 inline-flex items-center gap-1">
                        <TrashIcon className="h-4 w-4" /> Hapus
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-16 px-6 text-gray-500 dark:text-slate-400">
                      <h3 className="text-lg font-semibold dark:text-slate-300">Belum ada data</h3>
                      <p className="mt-1 text-sm dark:text-slate-400">Mulai dengan menambahkan data jenis tanaman baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PlantTypeForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plantTypeToEdit={selectedPlantType}
      />
    </div>
  );
}