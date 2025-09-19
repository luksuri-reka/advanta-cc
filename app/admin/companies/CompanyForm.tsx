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
            // Normalize tipe untuk form (title case untuk tampilan)
            type: companyToEdit.type.charAt(0).toUpperCase() + companyToEdit.type.slice(1).toLowerCase(),
            address: companyToEdit.address,
            province_id: companyToEdit.province_id,
          });
        } else {
          setFormData({ name: '', type: '', address: '', province_id: 0 });
        }
    }
  }, [isOpen, companyToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'province_id' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name || !formData.type || !formData.province_id) {
        toast.error("Harap isi semua kolom yang ditandai *");
        return;
    }

    setIsSubmitting(true);
    
    // Normalize tipe data untuk konsistensi (gunakan lowercase sesuai database)
    const normalizedFormData = {
      ...formData,
      type: formData.type.toLowerCase() // Simpan sebagai lowercase ke database
    };
    
    const actionPromise = isEditMode && companyToEdit
      ? updateCompany(companyToEdit.id, normalizedFormData)
      : createCompany(normalizedFormData);

    await toast.promise(actionPromise, {
      loading: 'Menyimpan data...',
      success: (result) => {
        if (result.error) throw new Error(result.error.message);
        onClose();
        return `Data perusahaan berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`;
      },
      error: (err) => `Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`,
    });
    
    setIsSubmitting(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>{isEditMode ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Nama Perusahaan *</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-zinc-700">Tipe *</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors">
                            <option value="" disabled>Pilih Tipe</option>
                            <option value="Swasta">Swasta</option>
                            <option value="Pemerintah">Pemerintah</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="province_id" className="block text-sm font-medium text-zinc-700">Provinsi *</label>
                        <select id="province_id" name="province_id" value={formData.province_id} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors">
                            <option value={0} disabled>Pilih Provinsi</option>
                            {availableProvinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-zinc-700">Alamat</label>
                        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors"></textarea>
                    </div>
                  
                  <div className="mt-8 flex justify-end gap-x-4">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95 disabled:opacity-50">
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
    </Transition>
  );
}