// app/admin/companies/CompanyForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast'; // Impor toast
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
  // State error lokal tidak lagi diperlukan karena kita pakai toast
  // const [error, setError] = useState<string | null>(null);

  const isEditMode = !!companyToEdit;

  useEffect(() => {
    if (isOpen) { // Hanya update form saat modal dibuka
        if (isEditMode && companyToEdit) {
          setFormData({
            name: companyToEdit.name,
            type: companyToEdit.type,
            address: companyToEdit.address,
            province_id: companyToEdit.province_id,
          });
        } else {
          // Reset form untuk entri baru
          setFormData({ name: '', type: '', address: '', province_id: 0 });
        }
    }
  }, [isOpen, companyToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'province_id' ? parseInt(value) : value }));
  };

  // Optimasi 2: Gunakan toast untuk notifikasi submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    const actionPromise = isEditMode && companyToEdit
      ? updateCompany(companyToEdit.id, formData)
      : createCompany(formData);

    await toast.promise(actionPromise, {
      loading: 'Menyimpan data...',
      success: (result) => {
        if (result.error) throw new Error(result.error.message);
        onClose(); // Tutup modal hanya jika berhasil
        return `Data perusahaan berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`;
      },
      error: (err) => `Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`,
    });
    
    setIsSubmitting(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ... Backdrop and Transition ... */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>{isEditMode ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* ... Input fields ... */}
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Perusahaan *</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe *</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">
                            <option value="" disabled>Pilih Tipe</option>
                            <option value="swasta">Swasta</option>
                            <option value="pemerintah">Pemerintah</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="province_id" className="block text-sm font-medium text-gray-700">Provinsi *</label>
                        <select id="province_id" name="province_id" value={formData.province_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">
                            <option value={0} disabled>Pilih Provinsi</option>
                            {availableProvinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
                        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"></textarea>
                    </div>
                  
                  <div className="mt-6 flex justify-end gap-x-4">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}