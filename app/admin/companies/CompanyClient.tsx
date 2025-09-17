// app/admin/companies/CompanyClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast'; // Impor Toaster dan toast
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import CompanyForm from './CompanyForm';
import { deleteCompany } from './actions';

// Tipe data ini harus cocok dengan yang dikirim dari page.tsx
interface Province {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  type: string;
  address: string;
  province_id: number;
  provinces: { name: string }[] | null;
}

interface CompanyClientProps {
  initialCompanies: Company[];
  availableProvinces: Province[];
}

export default function CompanyClient({ initialCompanies, availableProvinces }: CompanyClientProps) {
  const { user } = useAuth();
  // Optimasi 1: Menggunakan satu state untuk mengelola modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleLogout = async () => {
    // Implementasikan fungsi logout jika diperlukan
  };

  // Fungsi untuk membuka modal edit
  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka modal tambah
  const handleAdd = () => {
    setSelectedCompany(null); // Pastikan tidak ada data terpilih
    setIsModalOpen(true);
  };
  
  // Fungsi untuk menutup modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  }

  // Optimasi 2: Menggunakan toast untuk notifikasi hapus
  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus perusahaan ini?')) {
      const promise = deleteCompany(id);

      toast.promise(promise, {
         loading: 'Menghapus data...',
         success: 'Perusahaan berhasil dihapus!',
         error: (err) => `Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tempatkan Toaster di level atas komponen */}
      <Toaster position="top-center" reverseOrder={false} />

      <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Perusahaan</h1>
            <p className="mt-1 text-md text-gray-600">Kelola data perusahaan mitra dan internal.</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={handleAdd} // Panggil handleAdd
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Perusahaan
            </button>
          </div>
        </div>

        {/* Tabel Perusahaan */}
        <div className="mt-8 flow-root">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  {/* ... thead ... */}
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Perusahaan</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Tipe</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Provinsi</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {initialCompanies.map((company) => (
                      <tr key={company.id} className="even:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{company.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{company.type}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{company.provinces?.[0]?.name || '-'}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button onClick={() => handleEdit(company)} className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1">
                            <PencilIcon className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDelete(company.id)} className="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
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

      {/* Render satu CompanyForm saja */}
      <CompanyForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        availableProvinces={availableProvinces}
        companyToEdit={selectedCompany}
      />
    </div>
  );
}