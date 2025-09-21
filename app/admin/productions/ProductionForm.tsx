// app/admin/productions/ProductionForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createProduction, updateProduction } from './actions';

interface RelationalData {
  id: number;
  name: string;
}

interface ProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  productionToEdit?: any | null;
  products: RelationalData[];
  companies: RelationalData[];
  varietas: RelationalData[];
  kelasBenih: RelationalData[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Definisikan struktur state form
const initialFormData = {
    product_id: '',
    group_number: '',
    lot_number: '',
    company_id: '',
    clearance_number: '',
    code_1: '',
    code_2: '',
    code_3: '',
    code_4: '',
    target_certification_wide: '',
    target_kelas_benih_id: '',
    target_seed_production: '',
    seed_source_company_id: '',
    seed_source_male_varietas_id: '',
    seed_source_female_varietas_id: '',
    seed_source_kelas_benih_id: '',
    seed_source_serial_number: '',
    seed_source_male_lot_number: '',
    seed_source_female_lot_number: '',
    lot_kelas_benih_id: '',
    lot_varietas_id: '',
    lot_volume: '',
    lot_content: '',
    lot_total: '',
    cert_realization_wide: '',
    cert_realization_seed_production: '',
    cert_realization_tanggal_panen: '',
    lab_result_certification_number: '',
    lab_result_test_result: '',
    lab_result_incoming_date: '',
    lab_result_filing_date: '',
    lab_result_testing_date: '',
    lab_result_tested_date: '',
    lab_result_serial_number: '',
    lab_result_expired_date: '',
    test_param_kadar_air: '',
    test_param_benih_murni: '',
    test_param_campuran_varietas_lain: '',
    test_param_benih_tanaman_lain: '',
    test_param_kotoran_benih: '',
    test_param_daya_berkecambah: '',
    docs_form_permohonan: null,
    docs_pemeriksaan_pertamanan: null,
    docs_uji_lab: null,
    docs_sertifikasi: null,
};

type FormDataState = typeof initialFormData & {
  docs_form_permohonan: File | string | null;
  docs_pemeriksaan_pertamanan: File | string | null;
  docs_uji_lab: File | string | null;
  docs_sertifikasi: File | string | null;
};

// KOMPONEN FORM INPUT YANG DIPERBAIKI
const FormInput = ({ label, name, formData, onChange, required = false, ...props }: any) => (
  <div className="space-y-3">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input 
      id={name} 
      name={name} 
      value={formData[name as keyof typeof formData] as string || ''}
      onChange={onChange}
      required={required}
      {...props} 
      className="w-full px-4 py-3.5 text-sm border border-gray-300 rounded-xl shadow-sm 
                 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                 transition-all duration-200 ease-in-out
                 hover:border-gray-400 bg-white/90 backdrop-blur-sm
                 placeholder:text-gray-400" 
    />
  </div>
);

const FormSelect = ({ label, name, children, formData, onChange, required = false, ...props }: any) => (
  <div className="space-y-3">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select 
      id={name} 
      name={name} 
      value={formData[name as keyof typeof formData] as string || ''}
      onChange={onChange}
      required={required}
      {...props} 
      className="w-full px-4 py-3.5 text-sm border border-gray-300 rounded-xl shadow-sm 
                 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                 transition-all duration-200 ease-in-out
                 hover:border-gray-400 bg-white/90 backdrop-blur-sm"
    >
      {children}
    </select>
  </div>
);

const FormFileInput = ({ label, name, formData, onChange, required = false, ...props }: any) => {
  const fileOrPath = formData[name as keyof typeof formData];

  let displayFileName = 'Belum ada file dipilih';
  let hasFile = false;
  
  if (fileOrPath && (fileOrPath as any) instanceof File) {
    displayFileName = (fileOrPath as unknown as File).name;
    hasFile = true;
  } else if (typeof fileOrPath === 'string' && fileOrPath) {
    displayFileName = fileOrPath.split('/').pop() || '';
    hasFile = true;
  }

  return (
    <div className="space-y-3">
      <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input 
          id={name} 
          name={name} 
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={onChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          required={required}
          {...props}
        />
        
        <div className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${hasFile 
            ? 'border-emerald-300 bg-emerald-50/50' 
            : 'border-gray-300 bg-gray-50/50 hover:border-emerald-400 hover:bg-emerald-50/30'
          }
        `}>
          <div className="text-center">
            <DocumentArrowUpIcon className={`mx-auto h-12 w-12 mb-4 ${hasFile ? 'text-emerald-500' : 'text-gray-400'}`} />
            
            <div className="space-y-2">
              <p className={`text-sm font-medium ${hasFile ? 'text-emerald-700' : 'text-gray-600'}`}>
                {hasFile ? 'File berhasil dipilih' : 'Klik untuk upload atau drag & drop'}
              </p>
              
              <p className="text-xs text-gray-500">
                Format: PDF, DOC, DOCX, JPG, JPEG, PNG (Max: 5MB)
              </p>
              
              {hasFile && (
                <div className="mt-3 p-2 bg-white/80 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium truncate">
                    📄 {displayFileName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductionForm({ 
  isOpen, onClose, productionToEdit,
  products, companies, varietas, kelasBenih 
}: ProductionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataState>(initialFormData);

  const isEditMode = !!productionToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && productionToEdit) {
        const editData: { [key: string]: any } = {};
        for (const key in initialFormData) {
            editData[key] = productionToEdit[key] ?? '';
        }
        // Format tanggal untuk input type="date"
        if (productionToEdit.cert_realization_tanggal_panen) editData.cert_realization_tanggal_panen = productionToEdit.cert_realization_tanggal_panen.split('T')[0];
        if (productionToEdit.lab_result_incoming_date) editData.lab_result_incoming_date = productionToEdit.lab_result_incoming_date.split('T')[0];
        if (productionToEdit.lab_result_filing_date) editData.lab_result_filing_date = productionToEdit.lab_result_filing_date.split('T')[0];
        if (productionToEdit.lab_result_testing_date) editData.lab_result_testing_date = productionToEdit.lab_result_testing_date.split('T')[0];
        if (productionToEdit.lab_result_tested_date) editData.lab_result_tested_date = productionToEdit.lab_result_tested_date.split('T')[0];
        if (productionToEdit.lab_result_expired_date) editData.lab_result_expired_date = productionToEdit.lab_result_expired_date.split('T')[0];
        
        setFormData(editData as typeof initialFormData);
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, productionToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formPayload.append(key, value as string | Blob);
      }
    });

    const actionPromise = isEditMode && productionToEdit
      ? updateProduction(productionToEdit.id, formPayload)
      : createProduction(formPayload);

    toast.promise(actionPromise, {
        loading: 'Menyimpan data...',
        success: (result: any) => {
            if (result.error) throw new Error(result.error.message);
            onClose();
            window.location.reload(); 
            return `Data berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`;
        },
        error: (err) => `Gagal menyimpan: ${err.message}`,
    });

    actionPromise.finally(() => setIsSubmitting(false));
  };

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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all border border-white/20">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
                  <Dialog.Title as="h3" className="text-2xl font-bold flex justify-between items-center">
                    <span>{isEditMode ? '✏️ Edit Data Produksi' : '➕ Tambah Data Produksi'}</span>
                    <button 
                      onClick={onClose} 
                      className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </Dialog.Title>
                  <p className="text-emerald-100 mt-2">
                    {isEditMode ? 'Perbarui informasi produksi benih' : 'Lengkapi informasi untuk menambahkan data produksi baru'}
                  </p>
                </div>

                {/* Form Content */}
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tab.Group>
                      <Tab.List className="flex space-x-1 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 p-2 shadow-inner">
                        {[
                          { name: 'Data Produksi', icon: '📋' },
                          { name: 'Target & Sumber Benih', icon: '🎯' },
                          { name: 'Realisasi & Hasil Pemeriksaan', icon: '🔬' },
                          { name: 'Parameter Uji', icon: '📊' },
                          { name: 'Dokumen', icon: '📁' }
                        ].map((category) => (
                          <Tab 
                            key={category.name} 
                            className={({ selected }) => classNames(
                              'w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-200',
                              'ring-white/60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2',
                              selected 
                                ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-200/50 transform scale-105' 
                                : 'text-gray-600 hover:bg-white/60 hover:text-emerald-600'
                            )}
                          >
                            <span className="mr-2">{category.icon}</span>
                            {category.name}
                          </Tab>
                        ))}
                      </Tab.List>
                      
                      <Tab.Panels className="mt-8 max-h-[65vh] overflow-y-auto">
                        {/* Tab 1: Info Umum */}
                        <Tab.Panel className="space-y-8 focus:outline-none">
                          <div className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl p-8 border border-gray-200/50">
                            <h3 className="text-lg font-bold text-gray-800 mb-8 border-b border-gray-200 pb-4 flex items-center">
                              <span className="mr-3">📋</span>
                              Data Produksi
                            </h3>
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                              <FormSelect label="Nama Produk" name="product_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Produk</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </FormSelect>
                              
                              <FormInput 
                                label="Nomor Grup" 
                                name="group_number" 
                                type="text" 
                                placeholder="Contoh: NLH1A1001" 
                                formData={formData} 
                                onChange={handleChange} 
                                required 
                              />
                              
                              <FormInput 
                                label="Nomor Lot" 
                                name="lot_number" 
                                type="text" 
                                placeholder="Contoh: NLH1A1001" 
                                formData={formData} 
                                onChange={handleChange} 
                                required 
                              />
                              
                              <FormSelect label="Nama Perusahaan" name="company_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Perusahaan</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </FormSelect>
                              
                              <FormInput 
                                label="Nomor Clearance" 
                                name="clearance_number" 
                                type="text" 
                                placeholder="Contoh: 40" 
                                formData={formData} 
                                onChange={handleChange} 
                              />
                            </div>
                            
                            <div className="mt-8">
                              <label className="block text-sm font-semibold text-gray-800 mb-4">
                                Kode Hybrid (4 Digit) <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-3">
                                {[1, 2, 3, 4].map(i => (
                                  <input 
                                    key={i}
                                    type="text" 
                                    name={`code_${i}`} 
                                    maxLength={1} 
                                    value={formData[`code_${i}` as keyof typeof formData] as string} 
                                    onChange={handleChange} 
                                    className="w-16 h-16 text-center text-xl font-bold rounded-xl border-2 border-gray-300 
                                             focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                                             transition-all duration-200 bg-white/90" 
                                    required 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </Tab.Panel>

                        {/* Tab 2: Target & Sumber Benih */}
                        <Tab.Panel className="space-y-8 focus:outline-none">
                          {/* Target Sertifikasi */}
                          <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-8 border border-blue-200/50">
                            <h4 className="text-lg font-bold text-blue-800 mb-8 border-b border-blue-200 pb-4 flex items-center">
                              <span className="mr-3">🎯</span>
                              Target
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                              <FormInput label="Luas Sertifikasi (Ha)" name="target_certification_wide" type="number" step="0.01" formData={formData} onChange={handleChange} />
                              <FormSelect label="Kelas Benih" name="target_kelas_benih_id" formData={formData} onChange={handleChange}>
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormInput label="Produksi Benih" name="target_seed_production" type="number" step="0.01" formData={formData} onChange={handleChange} />
                            </div>
                          </div>
                          
                          {/* Sumber Benih */}
                          <div className="bg-gradient-to-br from-green-50/80 to-white rounded-2xl p-8 border border-green-200/50">
                            <h4 className="text-lg font-bold text-green-800 mb-8 border-b border-green-200 pb-4 flex items-center">
                              <span className="mr-3">🌱</span>
                              Asal Benih Sumber
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <FormSelect label="Produsen Benih" name="seed_source_company_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Perusahaan</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Jantan" name="seed_source_male_varietas_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Betina" name="seed_source_female_varietas_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Kelas Benih" name="seed_source_kelas_benih_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormInput label="Nomor Seri Sumber" name="seed_source_serial_number" type="text" formData={formData} onChange={handleChange} />
                              <FormInput label="Nomor Lot Jantan" name="seed_source_male_lot_number" type="text" formData={formData} onChange={handleChange} required />
                              <FormInput label="Nomor Lot Betina" name="seed_source_female_lot_number" type="text" formData={formData} onChange={handleChange} required />
                            </div>
                          </div>

                          {/* Info Lot */}
                          <div className="bg-gradient-to-br from-purple-50/80 to-white rounded-2xl p-8 border border-purple-200/50">
                            <h4 className="text-lg font-bold text-purple-800 mb-8 border-b border-purple-200 pb-4 flex items-center">
                              <span className="mr-3">📦</span>
                              Lot
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <FormSelect label="Kelas Benih" name="lot_kelas_benih_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Lot" name="lot_varietas_id" formData={formData} onChange={handleChange} required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormInput label="Kemasan" name="lot_volume" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Berat Bersih Per Kemasan" name="lot_content" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Jumlah Produk" name="lot_total" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                            </div>
                          </div>
                        </Tab.Panel>
                        
                        {/* Tab 3: Realisasi & Lab */}
                        <Tab.Panel className="space-y-8 focus:outline-none">
                          {/* Realisasi Sertifikasi */}
                          <div className="bg-gradient-to-br from-orange-50/80 to-white rounded-2xl p-8 border border-orange-200/50">
                            <h4 className="text-lg font-bold text-orange-800 mb-8 border-b border-orange-200 pb-4 flex items-center">
                              <span className="mr-3">📈</span>
                              Realisasi
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                              <FormInput label="Luas Sertifikasi (Ha)" name="cert_realization_wide" type="number" step="0.01" formData={formData} onChange={handleChange} />
                              <FormInput label="Produksi Calon Benih" name="cert_realization_seed_production" type="text" formData={formData} onChange={handleChange} />
                              <FormInput label="Tanggal Panen" name="cert_realization_tanggal_panen" type="date" formData={formData} onChange={handleChange} />
                            </div>
                          </div>

                          {/* Hasil Laboratorium */}
                          <div className="bg-gradient-to-br from-cyan-50/80 to-white rounded-2xl p-8 border border-cyan-200/50">
                            <h4 className="text-lg font-bold text-cyan-800 mb-8 border-b border-cyan-200 pb-4 flex items-center">
                              <span className="mr-3">🔬</span>
                              Hasil Pemeriksaan
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <FormInput label="Nomor Induk Sertifikasi" name="lab_result_certification_number" type="text" formData={formData} onChange={handleChange} required />
                              <FormInput label="Hasil Uji (%)" name="lab_result_test_result" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Tanggal Masuk Lab" name="lab_result_incoming_date" type="date" formData={formData} onChange={handleChange} />
                              <FormInput label="Tanggal Aju" name="lab_result_filing_date" type="date" formData={formData} onChange={handleChange} required />
                              <FormInput label="Tanggal Uji" name="lab_result_testing_date" type="date" formData={formData} onChange={handleChange} required />
                              <FormInput label="Tanggal Selesai Uji" name="lab_result_tested_date" type="date" formData={formData} onChange={handleChange} required />
                              <FormInput label="Nomor Seri Label" name="lab_result_serial_number" type="text" formData={formData} onChange={handleChange} required />
                              <FormInput label="Tanggal Berakhir Label" name="lab_result_expired_date" type="date" formData={formData} onChange={handleChange} required />
                            </div>
                          </div>
                        </Tab.Panel>

                        {/* Tab 4: Parameter Uji */}
                        <Tab.Panel className="space-y-8 focus:outline-none">
                          <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl p-8 border border-indigo-200/50">
                            <h4 className="text-lg font-bold text-indigo-800 mb-8 border-b border-indigo-200 pb-4 flex items-center">
                              <span className="mr-3">📊</span>
                              Parameter Uji
                            </h4>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <FormInput label="Kadar Air (%)" name="test_param_kadar_air" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Benih Murni (%)" name="test_param_benih_murni" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Campuran Varietas Lain (%)" name="test_param_campuran_varietas_lain" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Benih Tanaman Lain (%)" name="test_param_benih_tanaman_lain" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Kotoran Benih (%)" name="test_param_kotoran_benih" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                              <FormInput label="Daya Berkecambah (%)" name="test_param_daya_berkecambah" type="number" step="0.01" formData={formData} onChange={handleChange} required />
                            </div>
                            
                            <div className="mt-8 p-6 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-xl border border-blue-200">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">💡</span>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-blue-800 mb-2">Catatan Penting</h5>
                                  <p className="text-sm text-blue-700 leading-relaxed">
                                    Pastikan semua parameter uji sesuai dengan standar mutu benih yang berlaku dan hasil pengujian laboratorium terakreditasi.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Tab.Panel>
                        
                        {/* Tab 5: Dokumen */}
                        <Tab.Panel className="space-y-8 focus:outline-none">
                          <div className="bg-gradient-to-br from-amber-50/80 to-white rounded-2xl p-8 border border-amber-200/50">
                            <h4 className="text-lg font-bold text-amber-800 mb-8 border-b border-amber-200 pb-4 flex items-center">
                              <span className="mr-3">📁</span>
                              Dokumen Pendukung
                            </h4>
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                              <FormFileInput 
                                label="Form Permohonan" 
                                name="docs_form_permohonan"
                                formData={formData}
                                onChange={handleChange}
                              />
                              
                              <FormFileInput 
                                label="Pemeriksaan Pertamanan" 
                                name="docs_pemeriksaan_pertamanan"
                                formData={formData}
                                onChange={handleChange}
                              />
                              
                              <FormFileInput 
                                label="Uji Lab" 
                                name="docs_uji_lab"
                                formData={formData}
                                onChange={handleChange}
                              />
                              
                              <FormFileInput 
                                label="Sertifikasi" 
                                name="docs_sertifikasi"
                                formData={formData}
                                onChange={handleChange}
                              />
                            </div>
                            
                            <div className="mt-8 p-6 bg-gradient-to-r from-amber-100/80 to-yellow-100/80 rounded-xl border border-amber-200">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">⚠️</span>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-amber-800 mb-2">Persyaratan Dokumen</h5>
                                  <ul className="text-sm text-amber-700 space-y-1">
                                    <li>• Format file yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG</li>
                                    <li>• Maksimal ukuran file: 5MB per dokumen</li>
                                    <li>• Pastikan dokumen dapat dibaca dengan jelas</li>
                                    <li>• Upload dokumen asli atau scan berkualitas tinggi</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-200/50">
                      <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl 
                                   shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 
                                   focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        ❌ Batal
                      </button>
                      
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="inline-flex items-center justify-center gap-3 px-8 py-3 text-sm font-semibold text-white 
                                   bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg 
                                   hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl 
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                                   transition-all duration-200 transform hover:scale-105 active:scale-95
                                   focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>{isEditMode ? '💾 Perbarui' : '✅ Simpan'} Produksi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}