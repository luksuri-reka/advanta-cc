// app/admin/bags/BagForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createBag, updateBag } from './actions';

interface Production {
  id: number;
  group_number: string;
  lot_number: string;
  product_name: string;
  company_name: string;
}

interface Bag {
  id: number;
  qr_code: string;
  production_id: number;
  production: any;
  capacity: number;
  quantity: number;
  packs: number;
  type: string;
}

interface BagFormProps {
  isOpen: boolean;
  onClose: () => void;
  bagToEdit?: Bag | null;
  productions: Production[];
}

export default function BagForm({ 
  isOpen, 
  onClose, 
  bagToEdit,
  productions 
}: BagFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!bagToEdit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = isEditMode && bagToEdit
        ? await updateBag(bagToEdit.id, formData)
        : await createBag(formData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success(`Bag berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title 
                  as="h3" 
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>{isEditMode ? 'Edit Data Bag' : 'Tambah Data Bag'}</span>
                  <button 
                    onClick={onClose} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* QR Code */}
                    <div>
                      <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700">
                        QR Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="qr_code"
                        id="qr_code"
                        defaultValue={bagToEdit?.qr_code}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        placeholder="e.g., BAG-001"
                      />
                    </div>

                    {/* Production */}
                    <div>
                      <label htmlFor="production_id" className="block text-sm font-medium text-gray-700">
                        Produksi <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="production_id"
                        id="production_id"
                        defaultValue={bagToEdit?.production_id}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      >
                        <option value="">Pilih Produksi</option>
                        {productions.map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.product_name} - Lot: {prod.lot_number} ({prod.company_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Tipe <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        id="type"
                        defaultValue={bagToEdit?.type || 'B'}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      >
                        <option value="B">Bag</option>
                        <option value="P">Pack</option>
                      </select>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                        Kapasitas (kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        id="capacity"
                        step="0.01"
                        min="0"
                        defaultValue={bagToEdit?.capacity || 20}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Jumlah Pieces <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        min="1"
                        defaultValue={bagToEdit?.quantity || 1}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>

                    {/* Packs */}
                    <div>
                      <label htmlFor="packs" className="block text-sm font-medium text-gray-700">
                        Jumlah Pack <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="packs"
                        id="packs"
                        min="1"
                        defaultValue={bagToEdit?.packs || 1}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> QR Code harus unik. Sistem akan generate bag pieces sesuai dengan jumlah quantity yang diisi.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-end gap-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>{isEditMode ? 'Perbarui' : 'Simpan'} Bag</span>
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