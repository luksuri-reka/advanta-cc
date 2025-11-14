// app/admin/companies/CompanyForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createCompany, updateCompany, CompanyFormData } from './actions';

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

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableProvinces: Province[];
  companyToEdit?: Company | null;
}

export default function CompanyForm({ isOpen, onClose, availableProvinces, companyToEdit }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({ name: '', type: '', address: '', province_id: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!companyToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && companyToEdit) {
          setFormData({
            name: companyToEdit.name,
            type: companyToEdit.type,
            address: companyToEdit.address || '',
            province_id: companyToEdit.province_id,
          });
        } else {
          setFormData({ name: '', type: '', address: '', province_id: 0 });
        }
    }
  }, [isOpen, companyToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'province_id' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.province_id === 0) {
        toast.error('Silakan pilih provinsi.');
        return;
    }
    if (formData.type === '') {
        toast.error('Silakan pilih tipe perusahaan.');
        return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Memperbarui data...' : 'Menyimpan data...');
    
    try {
      let result;
      if (isEditMode && companyToEdit) {
        result = await updateCompany(companyToEdit.id, formData);
      } else {
        result = await createCompany(formData);
      }
      
      if (result.error) {
        toast.error(result.error.message || 'Gagal menyimpan data.', { id: toastId });
      } else {
        toast.success(isEditMode ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.', { id: toastId });
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data.', { id: toastId });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kelas CSS yang diselaraskan dengan SeedClassForm
  const inputClass = "mt-2 block w-full rounded-xl border-0 py-3 px-4 dark:bg-slate-700 text-zinc-900 dark:text-slate-100 ring-1 ring-inset ring-zinc-300 dark:ring-slate-600 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Latar belakang overlay disesuaikan */}
          <div className="fixed inset-0 bg-black/60 dark:bg-black/70 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          {/* Penempatan modal disesuaikan (selalu di tengah) */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Panel modal disesuaikan (warna, shadow, ukuran) */}
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                
                <div className="absolute top-0 right-0 pt-4 pr-4 block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Header Form disederhanakan */}
                  <div className="px-6 pt-6 pb-4">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-slate-100">
                      {isEditMode ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
                    </Dialog.Title>
                  </div>

                  {/* Konten Form */}
                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Nama Perusahaan
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="cth: PT Jaya Makmur"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Tipe
                      </label>
                      <select
                        name="type"
                        id="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      >
                        <option value="" disabled>Pilih tipe</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Sub-distributor">Sub-distributor</option>
                        <option value="Kios">Kios</option>
                        <option value="Petani">Petani</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="province_id" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Provinsi
                      </label>
                      <select
                        name="province_id"
                        id="province_id"
                        value={formData.province_id}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      >
                        <option value={0} disabled>Pilih provinsi</option>
                        {availableProvinces.map(province => (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Alamat
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className={inputClass}
                        placeholder="Alamat lengkap..."
                      ></textarea>
                    </div>
                  </div>
                  
                  {/* Footer Form (Tombol) disesuaikan */}
                  <div className="mt-8 pt-5 flex justify-end gap-x-4 border-t border-gray-200 dark:border-slate-700 px-6 py-4 bg-gray-50 dark:bg-slate-800/50">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Menyimpan...' : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}