// app/admin/products/ProductForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createProduct, updateProduct } from './actions';
import { normalizeImageUrl } from '../../utils/imageUtils';

// Definisikan tipe data untuk relasi
interface RelationalData {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  photo: string;
  jenis_tanaman_id?: number;
  kelas_benih_id?: number;
  varietas_id?: number;
  benih_murni?: number;
  daya_berkecambah?: number;
  kadar_air?: number;
  kotoran_benih?: number;
  campuran_varietas_lain?: number;
  benih_tanaman_lain?: number;
  pack_capacity?: number | null;
  bag_capacity?: number;
  qr_color?: string;
  bahan_aktif_ids?: number[];
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  // Data untuk dropdowns
  allJenisTanaman: RelationalData[];
  allKelasBenih: RelationalData[];
  allVarietas: RelationalData[];
  allBahanAktif: RelationalData[];
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProductForm({ 
  isOpen, onClose, productToEdit,
  allJenisTanaman, allKelasBenih, allVarietas, allBahanAktif 
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedBahanAktif, setSelectedBahanAktif] = useState<number[]>([]);

  const isEditMode = !!productToEdit;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBahanAktifToggle = (id: number) => {
    setSelectedBahanAktif(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Add selected bahan aktif to formData
    selectedBahanAktif.forEach(id => {
      formData.append('bahan_aktif_ids', id.toString());
    });

    try {
      const result = isEditMode && productToEdit
        ? await updateProduct(productToEdit.id, formData)
        : await createProduct(formData);

      if (result.error) {
        toast.error(`Gagal menyimpan: ${result.error.message}`);
      } else {
        toast.success(`Produk berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
        onClose();
        window.location.reload(); // Reload to show new data
      }
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhotoPreview(null);
      setSelectedBahanAktif([]);
    } else if (isEditMode && productToEdit) {
      // Normalize existing photo URL for preview
      const normalizedPhotoUrl = normalizeImageUrl(productToEdit.photo);
      setPhotoPreview(normalizedPhotoUrl);
      
      // Load existing bahan aktif if available
      if (productToEdit.bahan_aktif_ids) {
        setSelectedBahanAktif(productToEdit.bahan_aktif_ids);
      }
    }
  }, [isOpen, isEditMode, productToEdit]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center mb-4">
                  <span>{isEditMode ? 'Edit Data Produk' : 'Tambah Produk Baru'}</span>
                  <button 
                    type="button"
                    onClick={onClose} 
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </Dialog.Title>
                
                <form onSubmit={handleSubmit}>
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-emerald-900/20 p-1">
                      {['Info Dasar', 'Parameter Uji', 'Kapasitas & Lainnya'].map((category) => (
                        <Tab 
                          key={category} 
                          className={({ selected }) =>
                            classNames(
                              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                              'ring-white/60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2',
                              selected 
                                ? 'bg-white text-emerald-700 shadow' 
                                : 'text-gray-700 hover:bg-white/[0.3] hover:text-gray-900'
                            )
                          }
                        >
                          {category}
                        </Tab>
                      ))}
                    </Tab.List>
                    
                    <Tab.Panels className="mt-4">
                      {/* TAB 1: INFO DASAR */}
                      <Tab.Panel className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Foto Produk */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Foto Produk <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                              {photoPreview ? (
                                <img 
                                  src={photoPreview} 
                                  alt="Preview" 
                                  className="h-24 w-24 object-cover rounded-lg border-2 border-gray-300"
                                  onError={(e) => {
                                    console.error('Failed to load preview image:', photoPreview);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 ${photoPreview ? 'hidden' : ''}`}>
                                <PhotoIcon className="h-8 w-8" />
                              </div>
                              <input
                                type="file"
                                name="photo"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                required={!isEditMode}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                              />
                            </div>
                          </div>

                          {/* Nama Produk */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nama Produk <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              defaultValue={productToEdit?.name}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                              placeholder="Contoh: ADV BEJO"
                            />
                          </div>

                          {/* SKU */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="sku"
                              defaultValue={productToEdit?.sku}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                              placeholder="Contoh: U0000000163001307"
                            />
                          </div>

                          {/* Jenis Tanaman */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Jenis Tanaman <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="jenis_tanaman_id"
                              defaultValue={productToEdit?.jenis_tanaman_id}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            >
                              <option value="">Pilih Jenis Tanaman</option>
                              {allJenisTanaman.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Kelas Benih */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kelas Benih <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="kelas_benih_id"
                              defaultValue={productToEdit?.kelas_benih_id}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            >
                              <option value="">Pilih Kelas Benih</option>
                              {allKelasBenih.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Varietas */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Varietas <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="varietas_id"
                              defaultValue={productToEdit?.varietas_id}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            >
                              <option value="">Pilih Varietas</option>
                              {allVarietas.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Bahan Aktif (Multi-select) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bahan Aktif
                            </label>
                            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                              {allBahanAktif.map(item => (
                                <label key={item.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={selectedBahanAktif.includes(item.id)}
                                    onChange={() => handleBahanAktifToggle(item.id)}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-gray-700">{item.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* TAB 2: PARAMETER UJI */}
                      <Tab.Panel className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                        {/* Benih Murni */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Benih Murni (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="benih_murni"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.benih_murni || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>

                        {/* Daya Berkecambah */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daya Berkecambah (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="daya_berkecambah"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.daya_berkecambah || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>

                        {/* Kadar Air */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kadar Air (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="kadar_air"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.kadar_air || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>

                        {/* Kotoran Benih */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kotoran Benih (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="kotoran_benih"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.kotoran_benih || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>

                        {/* Campuran Varietas Lain */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Campuran Varietas Lain (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="campuran_varietas_lain"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.campuran_varietas_lain || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>

                        {/* Benih Tanaman Lain */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Benih Tanaman Lain (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="benih_tanaman_lain"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={productToEdit?.benih_tanaman_lain || 0}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          />
                        </div>
                      </Tab.Panel>

                      {/* TAB 3: KAPASITAS & LAINNYA */}
                      <Tab.Panel className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Pack Capacity */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kapasitas Pack (kg)
                            </label>
                            <input
                              type="number"
                              name="pack_capacity"
                              step="0.001"
                              min="0"
                              defaultValue={productToEdit?.pack_capacity || ''}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                              placeholder="Opsional"
                            />
                          </div>

                          {/* Bag Capacity */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kapasitas Bag (kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="bag_capacity"
                              step="0.001"
                              min="0"
                              defaultValue={productToEdit?.bag_capacity || 20}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            />
                          </div>

                          {/* QR Color */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warna QR Code <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                name="qr_color_picker"
                                defaultValue={`#${productToEdit?.qr_color || 'FFFFFF'}`}
                                onChange={(e) => {
                                  const colorInput = document.querySelector('input[name="qr_color"]') as HTMLInputElement;
                                  if (colorInput) {
                                    colorInput.value = e.target.value.substring(1).toUpperCase();
                                  }
                                }}
                                className="h-10 w-20 rounded-md border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                name="qr_color"
                                defaultValue={productToEdit?.qr_color || 'FFFFFF'}
                                required
                                pattern="[A-Fa-f0-9]{6}"
                                maxLength={6}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm uppercase"
                                placeholder="FFFFFF"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Format: Hex color tanpa #</p>
                          </div>
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 flex justify-end gap-x-3 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Tutup
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <span>Simpan Produk</span>
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