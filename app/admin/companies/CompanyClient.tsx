// app/admin/companies/CompanyClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import CompanyForm from './CompanyForm';
import { deleteCompany } from './actions';
import type { User } from '@supabase/supabase-js';

// Interface untuk user yang akan ditampilkan di Navbar
interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

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
  provinces: { name: string }[];
}

interface CompanyClientProps {
  initialCompanies: Company[];
  availableProvinces: Province[];
}

export default function CompanyClient({ initialCompanies, availableProvinces }: CompanyClientProps) {
  const { user } = useAuth(); // Ini adalah 'User | null' dari Supabase
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Transformasi 'user' Supabase menjadi 'displayUser'
  const displayUser: DisplayUser | null = user
    ? {
        name: user.user_metadata?.name || 'Admin',
        roles: user.app_metadata?.roles || [],
        complaint_permissions: user.app_metadata?.complaint_permissions || {},
      }
    : null;

  const handleLogout = async () => { /* ... */ };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const toastId = toast.loading('Menghapus data...');
      try {
        const result = await deleteCompany(id);
        
        if (result.error) {
          toast.error(result.error.message || 'Gagal menghapus data.', { id: toastId });
        } else {
          toast.success('Data berhasil dihapus.', { id: toastId });
          window.location.reload(); 
        }
      } catch (error) {
        toast.error('Terjadi kesalahan saat menghapus data.', { id: toastId });
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={displayUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <BuildingOfficeIcon className="h-8 w-8 text-emerald-600" />
              Master Perusahaan
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Kelola daftar perusahaan (distributor, sub-distributor, dll).
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah Perusahaan
            </button>
          </div>
        </div>

        {/* Table Section */}
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
                    Nama Perusahaan
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Tipe
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Alamat
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    Provinsi
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {initialCompanies.length > 0 ? initialCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    {/* ++ SEL ID DITAMBAHKAN (styling dari SeedClass ID) ++ */}
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6">
                      {company.id}
                    </td>
                    {/* -- Styling sel ini diubah (styling dari SeedClass Name) -- */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-200">
                      {company.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/20">
                        {company.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {company.address || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {((): string => {
                        if (company.provinces && company.provinces.length > 0) {
                          return company.provinces[0].name;
                        }
                        const province = availableProvinces.find(p => p.id === company.province_id);
                        return province ? province.name : '-';
                      })()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button onClick={() => handleEdit(company)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 inline-flex items-center gap-1">
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(company.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-4 inline-flex items-center gap-1">
                        <TrashIcon className="h-4 w-4" /> Hapus
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    {/* ++ COLSPAN DIPERBARUI ++ */}
                    <td colSpan={6} className="text-center py-16 px-6 text-gray-500 dark:text-slate-400">
                      <h3 className="text-lg font-semibold dark:text-slate-300">Belum ada data</h3>
                      <p className="mt-1 text-sm dark:text-slate-400">Mulai dengan menambahkan data perusahaan baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CompanyForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        availableProvinces={availableProvinces}
        companyToEdit={selectedCompany}
      />
    </div>
  );
}