// app/admin/companies/CompanyClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import CompanyForm from './CompanyForm';
import { deleteCompany } from './actions';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface Province {
  id: number;
  name: string;
}

// Interface yang diperbaiki untuk mencocokkan struktur data dari Supabase join
interface Company {
  id: number;
  name: string;
  type: string;
  address: string;
  province_id: number;
  // Ubah menjadi array sesuai dengan hasil join Supabase
  provinces: { name: string }[];
}

interface CompanyClientProps {
  initialCompanies: Company[];
  availableProvinces: Province[];
}

export default function CompanyClient({ initialCompanies, availableProvinces }: CompanyClientProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

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
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Perusahaan
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <span className={classNames(
                              'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize',
                              company.type.toLowerCase() === 'swasta' 
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' 
                                : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            )}>
                            {/* Capitalize first letter untuk tampilan */}
                            {company.type.charAt(0).toUpperCase() + company.type.slice(1).toLowerCase()}
                          </span>
                        </td>
                        {/* Tampilkan nama provinsi dengan fallback */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(() => {
                            // Coba ambil dari joined data
                            if (company.provinces && company.provinces.length > 0) {
                              return company.provinces[0].name;
                            }
                            // Fallback: cari dari availableProvinces berdasarkan province_id
                            const province = availableProvinces.find(p => p.id === company.province_id);
                            return province ? province.name : '-';
                          })()}
                        </td>
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

      <CompanyForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        availableProvinces={availableProvinces}
        companyToEdit={selectedCompany}
      />
    </div>
  );
}