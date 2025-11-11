// app/admin/companies/CompanyForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createCompany, updateCompany, CompanyFormData } from './actions';

interface Province {
  id: number;
  name: string;
}

// Interface yang diperbaiki untuk mencocokkan struktur dari CompanyClient
interface Company {
  id: number;
  name: string;
  type: string;
  address: string;
  province_id: number;
  provinces: { name: string }[]; // Sesuaikan dengan hasil join
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
            type: companyToEdit.type, // Tipe sudah dalam format yang benar (cth: 'Distributor')
            address: companyToEdit.address || '',
            province_id: companyToEdit.province_id,
          });
        } else {
          // Reset form
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
    
    try {
      let result;
      if (isEditMode && companyToEdit) {
        result = await updateCompany(companyToEdit.id, formData);
      } else {
        result = await createCompany(formData);
      }
      
      // Perbaikan: Cek 'result.error'
      if (result.error) {
        toast.error(result.error.message || 'Gagal menyimpan data.');
      } else {
        toast.success(isEditMode ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-2 block w-full rounded-xl border-0 py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors";

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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                
                <div className="absolute top-0 right-0 pt-4 pr-4 block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 sm:mx-0 sm:h-10 sm:w-10">
                        <BuildingOfficeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                          {isEditMode ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Isi detail perusahaan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
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
                      <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
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
                      <label htmlFor="province_id" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
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
                      <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
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
                  
                  <div className="mt-8 px-6 py-4 flex justify-end gap-x-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
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