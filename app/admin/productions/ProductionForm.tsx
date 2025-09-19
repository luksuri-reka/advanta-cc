// app/admin/productions/ProductionForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

export default function ProductionForm({ 
  isOpen, onClose, productionToEdit,
  products, companies, varietas, kelasBenih 
}: ProductionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!productionToEdit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const actionPromise = isEditMode && productionToEdit
      ? updateProduction(productionToEdit.id, formData)
      : createProduction(formData);

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
  
  const FormInput = ({ label, name, defaultValue, ...props }: any) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input 
        id={name} 
        name={name} 
        defaultValue={defaultValue || (isEditMode ? productionToEdit?.[name] : '')}
        {...props} 
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" 
      />
    </div>
  );

  const FormSelect = ({ label, name, defaultValue, children, ...props }: any) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <select 
        id={name} 
        name={name} 
        defaultValue={defaultValue || (isEditMode ? productionToEdit?.[name] : '')}
        {...props} 
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
      >
        {children}
      </select>
    </div>
  );

  const FormFileInput = ({ label, name, currentFile, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
            <label htmlFor={name} className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                <span>Upload file</span>
                <input 
                id={name} 
                name={name} 
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                {...props}
                />
            </label>
            <p className="pl-1">atau drag dan drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC sampai 5MB</p>
            {currentFile && (
            <p className="text-xs text-emerald-600 mt-2">File saat ini: {currentFile}</p>
            )}
        </div>
        </div>
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center">
                  <span>{isEditMode ? 'Edit Data Produksi' : 'Tambah Data Produksi'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4">
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-emerald-900/10 p-1">
                      {['Info Umum', 'Target & Sumber Benih', 'Realisasi & Lab', 'Parameter Uji', 'Dokumen'].map((category) => (
                        <Tab key={category} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'ring-white/60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-emerald-700 shadow' : 'text-gray-600 hover:bg-white/[0.5]')}>
                          {category}
                        </Tab>
                      ))}
                    </Tab.List>
                    <Tab.Panels className="mt-4 max-h-[60vh] overflow-y-auto p-2">
                      {/* Tab 1: Info Umum */}
                      <Tab.Panel>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <FormSelect label="Produk" name="product_id" required>
                            <option value="">Pilih Produk</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </FormSelect>
                          <FormInput label="Nomor Grup" name="group_number" type="text" placeholder="e.g., A-123" required />
                          <FormInput label="Nomor Lot" name="lot_number" type="text" placeholder="e.g., LOT-456" required />
                          <FormSelect label="Perusahaan" name="company_id" required>
                            <option value="">Pilih Perusahaan</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </FormSelect>
                          <FormInput label="Nomor Izin" name="clearance_number" type="text" placeholder="e.g., CLR-789" />
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Kode Produksi (4 Digit)</label>
                            <div className="mt-1 flex gap-2">
                              <input type="text" name="code_1" maxLength={1} defaultValue={productionToEdit?.code_1 || ''} className="w-12 text-center rounded-md border-gray-300" required />
                              <input type="text" name="code_2" maxLength={1} defaultValue={productionToEdit?.code_2 || ''} className="w-12 text-center rounded-md border-gray-300" required />
                              <input type="text" name="code_3" maxLength={1} defaultValue={productionToEdit?.code_3 || ''} className="w-12 text-center rounded-md border-gray-300" required />
                              <input type="text" name="code_4" maxLength={1} defaultValue={productionToEdit?.code_4 || ''} className="w-12 text-center rounded-md border-gray-300" required />
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* Tab 2: Target & Sumber Benih */}
                      <Tab.Panel>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Target Sertifikasi</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormInput label="Luas Target (Ha)" name="target_certification_wide" type="number" step="0.01" />
                              <FormSelect label="Kelas Benih Target" name="target_kelas_benih_id">
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormInput label="Target Produksi Benih (Kg)" name="target_seed_production" type="number" step="0.01" />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Sumber Benih</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormSelect label="Perusahaan Sumber" name="seed_source_company_id" required>
                                <option value="">Pilih Perusahaan</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Jantan" name="seed_source_male_varietas_id" required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Betina" name="seed_source_female_varietas_id" required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Kelas Benih Sumber" name="seed_source_kelas_benih_id" required>
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormInput label="Nomor Seri Sumber" name="seed_source_serial_number" type="text" />
                              <FormInput label="Nomor Lot Jantan" name="seed_source_male_lot_number" type="text" required />
                              <FormInput label="Nomor Lot Betina" name="seed_source_female_lot_number" type="text" required />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Info Lot</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormSelect label="Kelas Benih Lot" name="lot_kelas_benih_id" required>
                                <option value="">Pilih Kelas Benih</option>
                                {kelasBenih.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                              </FormSelect>
                              <FormSelect label="Varietas Lot" name="lot_varietas_id" required>
                                <option value="">Pilih Varietas</option>
                                {varietas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </FormSelect>
                              <FormInput label="Volume (Kg)" name="lot_volume" type="number" step="0.01" required />
                              <FormInput label="Isi (Kg)" name="lot_content" type="number" step="0.01" required />
                              <FormInput label="Total" name="lot_total" type="number" step="0.01" required />
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* Tab 3: Realisasi & Lab */}
                      <Tab.Panel>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Realisasi Sertifikasi</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormInput label="Luas Realisasi (Ha)" name="cert_realization_wide" type="number" step="0.01" />
                              <FormInput label="Produksi Benih Realisasi" name="cert_realization_seed_production" type="text" />
                              <FormInput label="Tanggal Panen" name="cert_realization_tanggal_panen" type="date" />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Hasil Laboratorium</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormInput label="Nomor Sertifikasi" name="lab_result_certification_number" type="text" required />
                              <FormInput label="Hasil Uji (%)" name="lab_result_test_result" type="number" step="0.01" required />
                              <FormInput label="Tanggal Masuk" name="lab_result_incoming_date" type="date" />
                              <FormInput label="Tanggal Pengajuan" name="lab_result_filing_date" type="date" required />
                              <FormInput label="Tanggal Pengujian" name="lab_result_testing_date" type="date" required />
                              <FormInput label="Tanggal Selesai Uji" name="lab_result_tested_date" type="date" required />
                              <FormInput label="Nomor Seri" name="lab_result_serial_number" type="text" required />
                              <FormInput label="Tanggal Kadaluarsa" name="lab_result_expired_date" type="date" required />
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* Tab 4: Parameter Uji */}
                      <Tab.Panel>
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Parameter Pengujian Mutu Benih</h4>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormInput label="Kadar Air (%)" name="test_param_kadar_air" type="number" step="0.01" required />
                            <FormInput label="Benih Murni (%)" name="test_param_benih_murni" type="number" step="0.01" required />
                            <FormInput label="Campuran Varietas Lain (%)" name="test_param_campuran_varietas_lain" type="number" step="0.01" required />
                            <FormInput label="Benih Tanaman Lain (%)" name="test_param_benih_tanaman_lain" type="number" step="0.01" required />
                            <FormInput label="Kotoran Benih (%)" name="test_param_kotoran_benih" type="number" step="0.01" required />
                            <FormInput label="Daya Berkecambah (%)" name="test_param_daya_berkecambah" type="number" step="0.01" required />
                          </div>
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Catatan:</strong> Pastikan semua parameter uji sesuai dengan standar mutu benih yang berlaku.
                            </p>
                          </div>
                        </div>
                      </Tab.Panel>
                      
                      {/* Tab 5: Dokumen */}
                        <Tab.Panel>
                            <div className="space-y-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Dokumen Pendukung</h4>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormFileInput 
                                    label="Form Permohonan" 
                                    name="docs_form_permohonan"
                                    currentFile={isEditMode ? productionToEdit?.docs_form_permohonan : null}
                                />
                                
                                <FormFileInput 
                                    label="Pemeriksaan Pertamanan" 
                                    name="docs_pemeriksaan_pertamanan"
                                    currentFile={isEditMode ? productionToEdit?.docs_pemeriksaan_pertamanan : null}
                                />
                                
                                <FormFileInput 
                                    label="Uji Lab" 
                                    name="docs_uji_lab"
                                    currentFile={isEditMode ? productionToEdit?.docs_uji_lab : null}
                                />
                                
                                <FormFileInput 
                                    label="Sertifikasi" 
                                    name="docs_sertifikasi"
                                    currentFile={isEditMode ? productionToEdit?.docs_sertifikasi : null}
                                />
                                </div>
                                
                                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                                <p className="text-sm text-amber-700">
                                    <strong>Catatan:</strong> Format file yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG. Maksimal ukuran file 5MB per dokumen.
                                </p>
                                </div>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>

                  <div className="mt-8 pt-5 flex justify-end gap-x-4 border-t border-gray-200">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                      Batal
                    </button>
                    <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Menyimpan...' : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>{isEditMode ? 'Perbarui' : 'Simpan'} Produksi</span>
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