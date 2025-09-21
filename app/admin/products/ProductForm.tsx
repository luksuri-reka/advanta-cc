// app/admin/products/ProductForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  PhotoIcon,
  CubeIcon,
  BeakerIcon,
  CogIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
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

// Initial form data
const initialFormData = {
  name: '',
  sku: '',
  jenis_tanaman_id: '',
  kelas_benih_id: '',
  varietas_id: '',
  benih_murni: '',
  daya_berkecambah: '',
  kadar_air: '',
  kotoran_benih: '',
  campuran_varietas_lain: '',
  benih_tanaman_lain: '',
  pack_capacity: '',
  bag_capacity: '',
  qr_color: 'FFFFFF',
  qr_color_picker: '#FFFFFF'
};

// Components outside main function
const FormInput = ({ 
  label, 
  name, 
  formData, 
  onChange, 
  required = false, 
  description,
  icon: Icon,
  ...props 
}: any) => (
  <div className="space-y-3">
    <label className="block text-sm font-semibold text-gray-800 tracking-wide">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
        {label} 
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>
    </label>
    <input
      name={name}
      value={formData[name as keyof typeof formData] || ''}
      onChange={onChange}
      required={required}
      {...props}
      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white hover:border-gray-300 hover:shadow-md"
    />
    {description && (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <InformationCircleIcon className="h-3 w-3" />
        {description}
      </p>
    )}
  </div>
);

const FormSelect = ({ 
  label, 
  name, 
  children, 
  formData, 
  onChange, 
  required = false, 
  description,
  icon: Icon,
  ...props 
}: any) => (
  <div className="space-y-3">
    <label className="block text-sm font-semibold text-gray-800 tracking-wide">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
        {label} 
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>
    </label>
    <select
      name={name}
      value={formData[name as keyof typeof formData] || ''}
      onChange={onChange}
      required={required}
      {...props}
      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-gray-800 bg-white hover:border-gray-300 hover:shadow-md appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e')] pr-12"
    >
      {children}
    </select>
    {description && (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <InformationCircleIcon className="h-3 w-3" />
        {description}
      </p>
    )}
  </div>
);

const TabSection = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  gradient,
  children 
}: {
  icon: any;
  title: string;
  subtitle: string;
  gradient: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-6">
    <div className={`${gradient} rounded-2xl p-6 border border-white/20 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white/80 rounded-xl shadow-sm">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-800">{title}</h4>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

export default function ProductForm({ 
  isOpen, onClose, productToEdit,
  allJenisTanaman, allKelasBenih, allVarietas, allBahanAktif 
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedBahanAktif, setSelectedBahanAktif] = useState<number[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isEditMode = !!productToEdit;

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Special handling for color picker
    if (name === 'qr_color_picker') {
      setFormData(prev => ({
        ...prev,
        qr_color: value.substring(1).toUpperCase()
      }));
    } else if (name === 'qr_color') {
      setFormData(prev => ({
        ...prev,
        qr_color_picker: '#' + value
      }));
    }
  };

  const handlePhotoChange = (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handlePhotoChange(file);
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
    
    const submitFormData = new FormData();
    
    // Add all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'qr_color_picker' && value !== '') {
        submitFormData.append(key, value);
      }
    });
    
    // Add photo file if exists
    if (photoFile) {
      submitFormData.append('photo', photoFile);
    }
    
    // Add selected bahan aktif
    selectedBahanAktif.forEach(id => {
      submitFormData.append('bahan_aktif_ids', id.toString());
    });

    try {
      const result = isEditMode && productToEdit
        ? await updateProduct(productToEdit.id, submitFormData)
        : await createProduct(submitFormData);

      if (result.error) {
        toast.error(`Gagal menyimpan: ${result.error.message}`);
      } else {
        toast.success(`Produk berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset/populate form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhotoPreview(null);
      setSelectedBahanAktif([]);
      setFormData(initialFormData);
      setPhotoFile(null);
    } else if (isEditMode && productToEdit) {
      // Populate form with existing data
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        jenis_tanaman_id: productToEdit.jenis_tanaman_id?.toString() || '',
        kelas_benih_id: productToEdit.kelas_benih_id?.toString() || '',
        varietas_id: productToEdit.varietas_id?.toString() || '',
        benih_murni: productToEdit.benih_murni?.toString() || '',
        daya_berkecambah: productToEdit.daya_berkecambah?.toString() || '',
        kadar_air: productToEdit.kadar_air?.toString() || '',
        kotoran_benih: productToEdit.kotoran_benih?.toString() || '',
        campuran_varietas_lain: productToEdit.campuran_varietas_lain?.toString() || '',
        benih_tanaman_lain: productToEdit.benih_tanaman_lain?.toString() || '',
        pack_capacity: productToEdit.pack_capacity?.toString() || '',
        bag_capacity: productToEdit.bag_capacity?.toString() || '',
        qr_color: productToEdit.qr_color || 'FFFFFF',
        qr_color_picker: '#' + (productToEdit.qr_color || 'FFFFFF')
      });
      
      // Set photo preview
      const normalizedPhotoUrl = normalizeImageUrl(productToEdit.photo);
      setPhotoPreview(normalizedPhotoUrl);
      
      // Set bahan aktif
      if (productToEdit.bahan_aktif_ids) {
        setSelectedBahanAktif(productToEdit.bahan_aktif_ids);
      }
    } else {
      // Reset to initial data for new product
      setFormData(initialFormData);
    }
  }, [isOpen, isEditMode, productToEdit]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <CubeIcon className="h-6 w-6" />
                        </div>
                        {isEditMode ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                      </Dialog.Title>
                      <p className="text-emerald-100 mt-1 ml-11">
                        {isEditMode ? 'Perbarui informasi produk yang sudah ada' : 'Lengkapi formulir untuk menambah produk baru'}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={onClose} 
                      className="p-2 rounded-full hover:bg-white/10 transition-colors text-white group"
                    >
                      <XMarkIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8">
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-2xl bg-gray-100 p-1 shadow-inner">
                      {[
                        { name: 'Info Dasar', icon: CubeIcon },
                        { name: 'Parameter Uji', icon: BeakerIcon },
                        { name: 'Kapasitas & Lainnya', icon: CogIcon }
                      ].map((category) => (
                        <Tab 
                          key={category.name} 
                          className={({ selected }) =>
                            classNames(
                              'flex-1 rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-200 flex items-center justify-center gap-2',
                              'focus:outline-none focus:ring-2 focus:ring-emerald-400/50',
                              selected 
                                ? 'bg-white text-emerald-700 shadow-md border border-emerald-100' 
                                : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 hover:shadow-sm'
                            )
                          }
                        >
                          <category.icon className="h-4 w-4" />
                          {category.name}
                        </Tab>
                      ))}
                    </Tab.List>
                    
                    <Tab.Panels className="mt-8">
                      {/* TAB 1: INFO DASAR */}
                      <Tab.Panel>
                        <TabSection
                          icon={CubeIcon}
                          title="Informasi Dasar Produk"
                          subtitle="Masukkan data utama produk dan upload foto"
                          gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
                        >
                          <div className="max-h-[450px] overflow-y-auto pr-2 space-y-6">
                            {/* Foto Produk */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 tracking-wide mb-3">
                                <div className="flex items-center gap-2">
                                  <PhotoIcon className="h-4 w-4 text-emerald-600" />
                                  Foto Produk <span className="text-red-500 ml-1">*</span>
                                </div>
                              </label>
                              <div 
                                className={`relative flex items-center gap-6 p-6 rounded-2xl border-2 border-dashed transition-all duration-200 ${
                                  isDragOver 
                                    ? 'border-emerald-400 bg-emerald-50' 
                                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-emerald-400'
                                }`}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                              >
                                {photoPreview ? (
                                  <div className="relative group">
                                    <img 
                                      src={photoPreview} 
                                      alt="Preview" 
                                      className="h-32 w-32 object-cover rounded-2xl border-2 border-emerald-200 shadow-lg"
                                      onError={(e) => {
                                        console.error('Failed to load preview image:', photoPreview);
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-xs font-medium">Klik untuk ganti</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                    <CloudArrowUpIcon className="h-8 w-8 mb-2" />
                                    <span className="text-xs">Upload Foto</span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    required={!isEditMode}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:shadow-sm file:transition-all file:duration-200 hover:file:scale-105"
                                  />
                                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                                    <InformationCircleIcon className="h-3 w-3" />
                                    PNG, JPG, JPEG hingga 5MB. Atau drag & drop file ke area ini
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <FormInput 
                                label="Nama Produk" 
                                name="name" 
                                type="text"
                                placeholder="Contoh: ADV BEJO"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Nama produk yang akan tampil di sistem"
                              />

                              <FormInput 
                                label="SKU" 
                                name="sku" 
                                type="text"
                                placeholder="Contoh: U0000000163001307"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Kode unik produk untuk identifikasi"
                              />

                              <FormSelect 
                                label="Jenis Tanaman" 
                                name="jenis_tanaman_id"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Kategori jenis tanaman"
                              >
                                <option value="">Pilih Jenis Tanaman</option>
                                {allJenisTanaman.map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </FormSelect>

                              <FormSelect 
                                label="Kelas Benih" 
                                name="kelas_benih_id"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Klasifikasi kelas benih"
                              >
                                <option value="">Pilih Kelas Benih</option>
                                {allKelasBenih.map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </FormSelect>

                              <FormSelect 
                                label="Varietas" 
                                name="varietas_id"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Jenis varietas tanaman"
                              >
                                <option value="">Pilih Varietas</option>
                                {allVarietas.map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </FormSelect>

                              {/* Bahan Aktif (Multi-select) */}
                              <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-800 tracking-wide">
                                  <div className="flex items-center gap-2">
                                    <BeakerIcon className="h-4 w-4 text-emerald-600" />
                                    Bahan Aktif
                                  </div>
                                </label>
                                <div className="border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-white shadow-sm">
                                  {selectedBahanAktif.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                      {selectedBahanAktif.map(id => {
                                        const item = allBahanAktif.find(b => b.id === id);
                                        return item ? (
                                          <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                            {item.name}
                                            <button
                                              type="button"
                                              onClick={() => handleBahanAktifToggle(id)}
                                              className="hover:bg-emerald-200 rounded-full p-0.5"
                                            >
                                              <XMarkIcon className="h-3 w-3" />
                                            </button>
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    {allBahanAktif.map(item => (
                                      <label key={item.id} className="flex items-center space-x-3 p-2 hover:bg-emerald-50 rounded-lg transition-colors duration-150 cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={selectedBahanAktif.includes(item.id)}
                                          onChange={() => handleBahanAktifToggle(item.id)}
                                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-0 transition-colors"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-emerald-700 font-medium">{item.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <InformationCircleIcon className="h-3 w-3" />
                                  Pilih satu atau lebih bahan aktif yang terkandung
                                </p>
                              </div>
                            </div>
                          </div>
                        </TabSection>
                      </Tab.Panel>

                      {/* TAB 2: PARAMETER UJI */}
                      <Tab.Panel>
                        <TabSection
                          icon={BeakerIcon}
                          title="Parameter Pengujian Mutu Benih"
                          subtitle="Masukkan nilai parameter sesuai dengan hasil pengujian laboratorium"
                          gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
                        >
                          <div className="max-h-[450px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                              <FormInput 
                                label="Benih Murni (%)" 
                                name="benih_murni" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Persentase kemurnian benih"
                              />

                              <FormInput 
                                label="Daya Berkecambah (%)" 
                                name="daya_berkecambah" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Tingkat kemampuan berkecambah"
                              />

                              <FormInput 
                                label="Kadar Air (%)" 
                                name="kadar_air" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Kandungan air dalam benih"
                              />

                              <FormInput 
                                label="Kotoran Benih (%)" 
                                name="kotoran_benih" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Persentase kotoran dalam benih"
                              />

                              <FormInput 
                                label="Campuran Varietas Lain (%)" 
                                name="campuran_varietas_lain" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Pencampuran dengan varietas berbeda"
                              />

                              <FormInput 
                                label="Benih Tanaman Lain (%)" 
                                name="benih_tanaman_lain" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                formData={formData}
                                onChange={handleChange}
                                required
                                description="Campuran benih jenis tanaman lain"
                              />
                            </div>
                          </div>
                        </TabSection>
                      </Tab.Panel>

                      {/* TAB 3: KAPASITAS & LAINNYA */}
                      <Tab.Panel>
                        <TabSection
                          icon={CogIcon}
                          title="Kapasitas & Konfigurasi"
                          subtitle="Tentukan kapasitas kemasan dan pengaturan visual"
                          gradient="bg-gradient-to-br from-purple-50 to-pink-50"
                        >
                          <div className="max-h-[450px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                <FormInput 
                                  label="Kapasitas Pack (kg)" 
                                  name="pack_capacity" 
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="Opsional - kosongkan jika tidak ada"
                                  formData={formData}
                                  onChange={handleChange}
                                  description="Kapasitas kemasan pack (opsional)"
                                />

                                <FormInput 
                                  label="Kapasitas Bag (kg)" 
                                  name="bag_capacity" 
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="Contoh: 20"
                                  formData={formData}
                                  onChange={handleChange}
                                  required
                                  description="Kapasitas kemasan bag (wajib diisi)"
                                />
                              </div>

                              {/* QR Color Configuration */}
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <label className="block text-sm font-semibold text-gray-800 tracking-wide">
                                    <div className="flex items-center gap-2">
                                      <SparklesIcon className="h-4 w-4 text-emerald-600" />
                                      Warna QR Code <span className="text-red-500 ml-1">*</span>
                                    </div>
                                  </label>
                                  
                                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-6">
                                      {/* Color Picker */}
                                      <div className="flex flex-col items-center gap-3">
                                        <input
                                          type="color"
                                          name="qr_color_picker"
                                          value={formData.qr_color_picker}
                                          onChange={handleChange}
                                          className="h-16 w-16 rounded-2xl border-2 border-gray-300 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                        />
                                        <span className="text-xs text-gray-500 font-medium">Preview</span>
                                      </div>
                                      
                                      {/* Hex Input */}
                                      <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                          Kode Hex (tanpa #)
                                        </label>
                                        <input
                                          type="text"
                                          name="qr_color"
                                          value={formData.qr_color}
                                          onChange={handleChange}
                                          required
                                          pattern="[A-Fa-f0-9]{6}"
                                          maxLength={6}
                                          className="w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white hover:border-gray-300 uppercase font-mono text-center text-lg tracking-wider"
                                          placeholder="FFFFFF"
                                        />
                                      </div>
                                      
                                      {/* QR Preview */}
                                      <div className="flex flex-col items-center gap-3">
                                        <div 
                                          className="h-16 w-16 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-xs font-bold shadow-sm"
                                          style={{ backgroundColor: formData.qr_color_picker }}
                                        >
                                          <span style={{ color: formData.qr_color_picker === '#FFFFFF' || formData.qr_color_picker === '#ffffff' ? '#000' : '#FFF' }}>
                                            QR
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">Hasil</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <InformationCircleIcon className="h-3 w-3" />
                                    Warna latar belakang untuk QR code yang akan digenerate
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabSection>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                  
                  {/* Action Buttons */}
                  <div className="mt-8 pt-6 flex justify-end gap-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>{isEditMode ? 'Perbarui Produk' : 'Simpan Produk'}</span>
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