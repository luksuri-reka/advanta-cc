// app/admin/bahan-aktif/ActiveIngredientForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createActiveIngredient, updateActiveIngredient, ActiveIngredientFormData } from './actions';

interface ActiveIngredient {
  id: number;
  name: string;
  description: string;
}

interface ActiveIngredientFormProps {
  isOpen: boolean;
  onClose: () => void;
  activeIngredientToEdit?: ActiveIngredient | null;
}

export default function ActiveIngredientForm({ isOpen, onClose, activeIngredientToEdit }: ActiveIngredientFormProps) {
  const [formData, setFormData] = useState<ActiveIngredientFormData>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!activeIngredientToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && activeIngredientToEdit) {
        setFormData({
          name: activeIngredientToEdit.name,
          description: activeIngredientToEdit.description || '',
        });
      } else {
        setFormData({ name: '', description: '' });
      }
    }
  }, [isOpen, activeIngredientToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let result;
      if (isEditMode && activeIngredientToEdit) {
        result = await updateActiveIngredient(activeIngredientToEdit.id, formData);
      } else {
        result = await createActiveIngredient(formData);
      }
      
      // --- PERBAIKAN ---
      // Cek jika ada error, bukan jika success
      if (result.error) {
        toast.error(result.error.message || 'Gagal menyimpan data.');
      } else {
        toast.success(isEditMode ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
        onClose();
        // Refresh halaman untuk melihat perubahan
        window.location.reload();
      }
      // --- AKHIR PERBAIKAN ---

    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                          {isEditMode ? 'Edit Bahan Aktif' : 'Tambah Bahan Aktif'}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Isi detail untuk bahan aktif.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                        Nama Bahan Aktif
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors"
                          placeholder="cth: Abamektin"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                        Deskripsi
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors"
                        placeholder="Deskripsi singkat mengenai bahan aktif..."
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