// app/admin/kelas-benih/SeedClassForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createSeedClass, updateSeedClass, SeedClassFormData } from './actions';

interface SeedClass {
  id: number;
  name: string;
  description: string;
}

interface SeedClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  seedClassToEdit?: SeedClass | null;
}

export default function SeedClassForm({ isOpen, onClose, seedClassToEdit }: SeedClassFormProps) {
  const [formData, setFormData] = useState<SeedClassFormData>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!seedClassToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && seedClassToEdit) {
        setFormData({
          name: seedClassToEdit.name,
          description: seedClassToEdit.description || '',
        });
      } else {
        setFormData({ name: '', description: '' });
      }
    }
  }, [isOpen, seedClassToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nama Kelas Benih wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    
    const actionPromise = isEditMode && seedClassToEdit
      ? updateSeedClass(seedClassToEdit.id, formData)
      : createSeedClass(formData);

    await toast.promise(actionPromise, {
      loading: 'Menyimpan data...',
      success: (result) => {
        if (result.error) throw new Error(result.error.message);
        onClose();
        return `Data berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`;
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
                  <span>{isEditMode ? 'Edit Kelas Benih' : 'Tambah Kelas Benih'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Nama Kelas Benih *</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" placeholder="Contoh: Benih Dasar" />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-700">Deskripsi</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" placeholder="Deskripsi singkat mengenai kelas benih..."></textarea>
                  </div>
                  
                  <div className="mt-8 pt-5 flex justify-end gap-x-4 border-t border-gray-200">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50">
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