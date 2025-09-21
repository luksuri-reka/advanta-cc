// app/admin/productions/ProductionViewModal.tsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  CubeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
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

  const InfoCard = ({ 
    icon: Icon, 
    title, 
    children, 
    className = "" 
  }: { 
    icon: any; 
    title: string; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ 
    label, 
    value, 
    highlight = false 
  }: { 
    label: string; 
    value: any; 
    highlight?: boolean;
  }) => (
    <div className={`flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-50 last:border-b-0 ${
      highlight ? 'bg-emerald-50 -mx-2 px-2 rounded-lg' : ''
    }`}>
      <dt className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium sm:text-right max-w-xs">
        {value || <span className="text-gray-400 italic">Tidak ada data</span>}
      </dd>
    </div>
  );

  const StatusBadge = ({ 
    status, 
    trueText = 'Aktif', 
    falseText = 'Tidak Aktif' 
  }: { 
    status: boolean; 
    trueText?: string; 
    falseText?: string;
  }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
      status
        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
        : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    }`}>
      {status ? (
        <CheckCircleIcon className="h-3 w-3" />
      ) : (
        <ExclamationTriangleIcon className="h-3 w-3" />
      )}
      {status ? trueText : falseText}
    </span>
  );

  const DocumentLink = ({ 
    url, 
    label 
  }: { 
    url: string | null; 
    label: string;
  }) => {
    if (!url) {
      return (
        <span className="inline-flex items-center gap-2 text-sm text-gray-400">
          <DocumentTextIcon className="h-4 w-4" />
          Belum diupload
        </span>
      );
    }

    return (
      <a 
        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumen-pendukung/${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors group"
      >
        <ArrowDownTrayIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        Download {label}
      </a>
    );
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-gray-50 shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        Detail Data Produksi
                      </Dialog.Title>
                      <p className="text-emerald-100 mt-1">
                        {production.product?.name} • {production.company?.name}
                      </p>
                    </div>
                    <button 
                      onClick={onClose} 
                      className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[75vh] overflow-y-auto p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Data Produksi */}
                    <InfoCard icon={CubeIcon} title="Informasi Produksi" className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <InfoRow label="Nama Produk" value={production.product?.name} highlight />
                          <InfoRow label="Nama Perusahaan" value={production.company?.name} highlight />
                          <InfoRow label="Nomor Grup" value={production.group_number} />
                        </div>
                        <div>
                          <InfoRow label="Kode Hybrid" value={`${production.code_1}${production.code_2}${production.code_3}${production.code_4}`} />
                          <InfoRow label="Nomor Lot" value={production.lot_number} />
                          <InfoRow label="Nomor Clearance" value={production.clearance_number} />
                        </div>
                      </div>
                    </InfoCard>

                    {/* Target */}
                    <InfoCard icon={ChartBarIcon} title="Target Sertifikasi">
                      <InfoRow label="Luas Sertifikasi" value={production.target_certification_wide ? `${production.target_certification_wide} Ha` : null} />
                      <InfoRow label="Kelas Benih" value={production.target_kelas_benih?.name} />
                      <InfoRow label="Produksi Benih" value={production.target_seed_production} />
                    </InfoCard>

                    {/* Sumber Benih */}
                    <InfoCard icon={BuildingOfficeIcon} title="Asal Benih Sumber">
                      <InfoRow label="Produsen Benih" value={production.seed_source_company?.name} />
                      <InfoRow label="Varietas Jantan" value={production.seed_source_male_varietas?.name} />
                      <InfoRow label="Varietas Betina" value={production.seed_source_female_varietas?.name} />
                      <InfoRow label="Kelas Benih Sumber" value={production.seed_source_kelas_benih?.name} />
                      <InfoRow label="No. Seri Sumber" value={production.seed_source_serial_number} />
                      <InfoRow label="No. Lot Jantan" value={production.seed_source_male_lot_number} />
                      <InfoRow label="No. Lot Betina" value={production.seed_source_female_lot_number} />
                    </InfoCard>

                    {/* Info Lot */}
                    <InfoCard icon={CubeIcon} title="Informasi Lot">
                      <InfoRow label="Kelas Benih" value={production.lot_kelas_benih?.name} />
                      <InfoRow label="Varietas" value={production.lot_varietas?.name} />
                      <InfoRow label="Kemasan" value={production.lot_volume} />
                      <InfoRow label="Berat Bersih/Kemasan" value={production.lot_content} />
                      <InfoRow label="Jumlah Produk" value={production.lot_total} />
                    </InfoCard>

                    {/* Realisasi */}
                    <InfoCard icon={CalendarDaysIcon} title="Realisasi Sertifikasi">
                      <InfoRow label="Luas Sertifikasi" value={production.cert_realization_wide ? `${production.cert_realization_wide} Ha` : null} />
                      <InfoRow label="Produksi Calon Benih" value={production.cert_realization_seed_production} />
                      <InfoRow label="Tanggal Panen" value={formatDate(production.cert_realization_tanggal_panen)} />
                    </InfoCard>

                    {/* Hasil Lab */}
                    <InfoCard icon={BeakerIcon} title="Hasil Pemeriksaan Lab" className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <InfoRow label="No. Induk Sertifikasi" value={production.lab_result_certification_number} />
                          <InfoRow label="Hasil Uji (%)" value={production.lab_result_test_result} />
                          <InfoRow label="Tanggal Masuk Lab" value={formatDate(production.lab_result_incoming_date)} />
                          <InfoRow label="Tanggal Aju" value={formatDate(production.lab_result_filing_date)} />
                        </div>
                        <div>
                          <InfoRow label="Tanggal Uji" value={formatDate(production.lab_result_testing_date)} />
                          <InfoRow label="Tanggal Selesai Uji" value={formatDate(production.lab_result_tested_date)} />
                          <InfoRow label="No. Seri Label" value={production.lab_result_serial_number} />
                          <InfoRow label="Tanggal Berakhir Label" value={formatDate(production.lab_result_expired_date)} />
                        </div>
                      </div>
                    </InfoCard>

                    {/* Parameter Uji */}
                    <InfoCard icon={ClipboardDocumentCheckIcon} title="Parameter Uji" className="lg:col-span-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <InfoRow label="Kadar Air (%)" value={production.test_param_kadar_air} />
                          <InfoRow label="Benih Murni (%)" value={production.test_param_benih_murni} />
                        </div>
                        <div className="space-y-3">
                          <InfoRow label="Campuran Varietas Lain (%)" value={production.test_param_campuran_varietas_lain} />
                          <InfoRow label="Benih Tanaman Lain (%)" value={production.test_param_benih_tanaman_lain} />
                        </div>
                        <div className="space-y-3">
                          <InfoRow label="Kotoran Benih (%)" value={production.test_param_kotoran_benih} />
                          <InfoRow label="Daya Berkecambah (%)" value={production.test_param_daya_berkecambah} />
                        </div>
                      </div>
                    </InfoCard>

                    {/* Dokumen */}
                    <InfoCard icon={DocumentTextIcon} title="Dokumen Pendukung" className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Form Permohonan</p>
                            <DocumentLink url={production.docs_form_permohonan} label="Form Permohonan" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Pemeriksaan Pertamanan</p>
                            <DocumentLink url={production.docs_pemeriksaan_pertamanan} label="Laporan Pertamanan" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Hasil Uji Lab</p>
                            <DocumentLink url={production.docs_uji_lab} label="Hasil Lab" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Sertifikasi</p>
                            <DocumentLink url={production.docs_sertifikasi} label="Sertifikat" />
                          </div>
                        </div>
                      </div>
                    </InfoCard>

                    {/* Status QR */}
                    <InfoCard icon={CheckCircleIcon} title="Status Generate Registers">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status Registers</span>
                        <StatusBadge 
                          status={!!production.import_qr_at} 
                          trueText="Sudah Generate" 
                          falseText="Belum Generate" 
                        />
                      </div>
                      {production.import_qr_at && (
                        <InfoRow label="Tanggal Generate" value={formatDate(production.import_qr_at)} />
                      )}
                    </InfoCard>

                    {/* Audit Trail */}
                    <InfoCard icon={CalendarDaysIcon} title="Audit Trail">
                      <InfoRow label="Dibuat" value={formatDate(production.created_at)} />
                      <InfoRow label="Diperbarui" value={formatDate(production.updated_at)} />
                    </InfoCard>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-white px-8 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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