// app/admin/productions/ProductionViewModal.tsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/app/utils/dateFormat';

interface ProductionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  production: any | null;
}

export default function ProductionViewModal({ 
  isOpen, 
  onClose, 
  production 
}: ProductionViewModalProps) {
  if (!production) return null;

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2">{value || '-'}</dd>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-emerald-200">
      {title}
    </h3>
  );

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title 
                  as="h3" 
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center mb-6"
                >
                  <span>Detail Data Produksi</span>
                  <button 
                    onClick={onClose} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="max-h-[70vh] overflow-y-auto">
                  {/* Info Umum */}
                  <SectionTitle title="Informasi Umum" />
                  <dl>
                    <InfoRow label="Produk" value={production.product?.name} />
                    <InfoRow label="Perusahaan" value={production.company?.name} />
                    <InfoRow label="Nomor Grup" value={production.group_number} />
                    <InfoRow label="Kode Produksi" value={`${production.code_1}${production.code_2}${production.code_3}${production.code_4}`} />
                    <InfoRow label="Nomor Lot" value={production.lot_number} />
                    <InfoRow label="Nomor Izin" value={production.clearance_number} />
                  </dl>

                  {/* Target Sertifikasi */}
                  <SectionTitle title="Target Sertifikasi" />
                  <dl>
                    <InfoRow label="Luas Target (Ha)" value={production.target_certification_wide} />
                    <InfoRow label="Kelas Benih Target" value={production.target_kelas_benih?.name} />
                    <InfoRow label="Target Produksi Benih (Kg)" value={production.target_seed_production} />
                  </dl>

                  {/* Sumber Benih */}
                  <SectionTitle title="Sumber Benih" />
                  <dl>
                    <InfoRow label="Perusahaan Sumber" value={production.seed_source_company?.name} />
                    <InfoRow label="Varietas Jantan" value={production.seed_source_male_varietas?.name} />
                    <InfoRow label="Varietas Betina" value={production.seed_source_female_varietas?.name} />
                    <InfoRow label="Kelas Benih Sumber" value={production.seed_source_kelas_benih?.name} />
                    <InfoRow label="Nomor Seri Sumber" value={production.seed_source_serial_number} />
                    <InfoRow label="Nomor Lot Jantan" value={production.seed_source_male_lot_number} />
                    <InfoRow label="Nomor Lot Betina" value={production.seed_source_female_lot_number} />
                  </dl>

                  {/* Info Lot */}
                  <SectionTitle title="Informasi Lot" />
                  <dl>
                    <InfoRow label="Kelas Benih Lot" value={production.lot_kelas_benih?.name} />
                    <InfoRow label="Varietas Lot" value={production.lot_varietas?.name} />
                    <InfoRow label="Volume (Kg)" value={production.lot_volume} />
                    <InfoRow label="Isi (Kg)" value={production.lot_content} />
                    <InfoRow label="Total" value={production.lot_total} />
                  </dl>

                  {/* Realisasi Sertifikasi */}
                  <SectionTitle title="Realisasi Sertifikasi" />
                  <dl>
                    <InfoRow label="Luas Realisasi (Ha)" value={production.cert_realization_wide} />
                    <InfoRow label="Produksi Benih Realisasi" value={production.cert_realization_seed_production} />
                    <InfoRow label="Tanggal Panen" value={formatDate(production.cert_realization_tanggal_panen)} />
                  </dl>

                  {/* Hasil Laboratorium */}
                  <SectionTitle title="Hasil Laboratorium" />
                  <dl>
                    <InfoRow label="Nomor Sertifikasi" value={production.lab_result_certification_number} />
                    <InfoRow label="Hasil Uji (%)" value={production.lab_result_test_result} />
                    <InfoRow label="Tanggal Masuk" value={formatDate(production.lab_result_incoming_date)} />
                    <InfoRow label="Tanggal Pengajuan" value={formatDate(production.lab_result_filing_date)} />
                    <InfoRow label="Tanggal Pengujian" value={formatDate(production.lab_result_testing_date)} />
                    <InfoRow label="Tanggal Selesai Uji" value={formatDate(production.lab_result_tested_date)} />
                    <InfoRow label="Nomor Seri" value={production.lab_result_serial_number} />
                    <InfoRow label="Tanggal Kadaluarsa" value={formatDate(production.lab_result_expired_date)} />
                  </dl>

                  {/* Parameter Uji */}
                  <SectionTitle title="Parameter Pengujian Mutu Benih" />
                  <dl>
                    <InfoRow label="Kadar Air (%)" value={production.test_param_kadar_air} />
                    <InfoRow label="Benih Murni (%)" value={production.test_param_benih_murni} />
                    <InfoRow label="Campuran Varietas Lain (%)" value={production.test_param_campuran_varietas_lain} />
                    <InfoRow label="Benih Tanaman Lain (%)" value={production.test_param_benih_tanaman_lain} />
                    <InfoRow label="Kotoran Benih (%)" value={production.test_param_kotoran_benih} />
                    <InfoRow label="Daya Berkecambah (%)" value={production.test_param_daya_berkecambah} />
                  </dl>

                  {/* Dokumen */}
                  <SectionTitle title="Dokumen Pendukung" />
                  <dl>
                    <InfoRow 
                      label="Form Permohonan" 
                      value={
                        production.docs_form_permohonan ? (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumen-pendukung/${production.docs_form_permohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Download File
                          </a>
                        ) : 'Belum diupload'
                      } 
                    />
                    <InfoRow 
                      label="Pemeriksaan Pertamanan" 
                      value={
                        production.docs_pemeriksaan_pertamanan ? (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumen-pendukung/${production.docs_pemeriksaan_pertamanan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Download File
                          </a>
                        ) : 'Belum diupload'
                      } 
                    />
                    <InfoRow 
                      label="Uji Lab" 
                      value={
                        production.docs_uji_lab ? (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumen-pendukung/${production.docs_uji_lab}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Download File
                          </a>
                        ) : 'Belum diupload'
                      } 
                    />
                    <InfoRow 
                      label="Sertifikasi" 
                      value={
                        production.docs_sertifikasi ? (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumen-pendukung/${production.docs_sertifikasi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Download File
                          </a>
                        ) : 'Belum diupload'
                      } 
                    />
                  </dl>

                  {/* Status QR */}
                  <SectionTitle title="Status Import QR" />
                  <dl>
                    <InfoRow 
                      label="Status QR" 
                      value={
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          production.import_qr_at
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                        }`}>
                          {production.import_qr_at ? 'Sudah Impor' : 'Belum Impor'}
                        </span>
                      } 
                    />
                    {production.import_qr_at && (
                      <InfoRow label="Tanggal Import QR" value={formatDate(production.import_qr_at)} />
                    )}
                  </dl>

                  {/* Audit Trail */}
                  <SectionTitle title="Audit Trail" />
                  <dl>
                    <InfoRow label="Tanggal Dibuat" value={formatDate(production.created_at)} />
                    <InfoRow label="Tanggal Diupdate" value={formatDate(production.updated_at)} />
                  </dl>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}