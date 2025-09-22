// app/admin/productions/GenerateRegistersModal.tsx
'use client';

import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  QrCodeIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  DocumentArrowUpIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateProductionRegisters } from './actions';

interface ProductionForDropdown {
  id: number;
  product: { name: string } | null;
  company: { name: string } | null;
  lot_number: string;
  import_qr_at: string | null;
}

interface FullProductionData extends ProductionForDropdown {
    lot_total: number;
    lab_result_serial_number: string;
    code_1: string;
    code_2: string;
    code_3: string;
    code_4: string;
}

interface ImportedFileData {
  fileName: string;
  token: string;
  matchedProduction: ProductionForDropdown | null;
}

interface GenerateRegistersModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: ProductionForDropdown[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GenerateRegistersModal({ 
  isOpen, 
  onClose, 
  productions 
}: GenerateRegistersModalProps) {
  const [selectedProductionId, setSelectedProductionId] = useState<string>('');
  const [qrToken, setQrToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [generatedCount, setGeneratedCount] = useState(0);
  
  // Import-related states
  const [importedFile, setImportedFile] = useState<ImportedFileData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State ini akan menampung data LENGKAP setelah di-fetch
  const [selectedProduction, setSelectedProduction] = useState<FullProductionData | null>(null);

  // Filter hanya produksi yang belum di-generate (import_qr_at adalah null)
  const availableProductions = useMemo(() => {
    return productions.filter(production => !production.import_qr_at);
  }, [productions]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedProductionId('');
      setQrToken('');
      setCurrentStep('select');
      setSelectedProduction(null);
      setGeneratedCount(0);
      setImportedFile(null);
      setIsProcessingFile(false);
    }
  }, [isOpen]);

  // Auto-select production and token when file is imported
  useEffect(() => {
    if (importedFile?.matchedProduction && importedFile?.token) {
      setSelectedProductionId(importedFile.matchedProduction.id.toString());
      setQrToken(importedFile.token);
    }
  }, [importedFile]);

  // Fetch production details when selection changes
  useEffect(() => {
    async function fetchProductionDetails() {
      if (!selectedProductionId) {
        setSelectedProduction(null);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const response = await fetch(`/api/productions/${selectedProductionId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil detail produksi.');
        }
        const data: FullProductionData = await response.json();
        setSelectedProduction(data);
      } catch (error: any) {
        toast.error(error.message);
        setSelectedProduction(null);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    fetchProductionDetails();
  }, [selectedProductionId]);

  const { startProductionCode, endProductionCode } = useMemo(() => {
    if (!selectedProduction) return { startProductionCode: null, endProductionCode: null };
    
    const baseCode = `${selectedProduction.code_1}${selectedProduction.code_2}${selectedProduction.code_3}`;
    const initialLastCharCode = selectedProduction.code_4.charCodeAt(0);
    const quantity = selectedProduction.lot_total;

    const startCode = `${baseCode}${String.fromCharCode(initialLastCharCode)}`;
    
    const endIncrement = quantity > 0 ? Math.floor((quantity - 1) / 1000) : 0;
    const endCode = `${baseCode}${String.fromCharCode(initialLastCharCode + endIncrement)}`;
    
    return { startProductionCode: startCode, endProductionCode: endCode };
  }, [selectedProduction]);
  
  const startNumber = selectedProduction ? parseInt(selectedProduction.lab_result_serial_number, 10) : 0;
  const quantity = selectedProduction ? selectedProduction.lot_total : 0;
  const endNumber = (startNumber && quantity) ? startNumber + quantity - 1 : 0;

  // Handle file import
  const handleFileImport = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Hanya file CSV yang didukung');
      return;
    }

    setIsProcessingFile(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Skip header and get first data row
      const dataLines = lines.slice(1).filter(line => line.trim());
      if (dataLines.length === 0) {
        throw new Error('File CSV kosong atau tidak memiliki data');
      }

      // Parse first row to get token
      const firstRow = dataLines[0].split(',');
      if (firstRow.length < 2) {
        throw new Error('Format CSV tidak valid. Minimal harus ada kolom Token');
      }

      const token = firstRow[1]?.replace(/"/g, '').trim(); // Remove quotes and trim
      if (!token) {
        throw new Error('Token tidak ditemukan di baris pertama');
      }

      // Extract lot number from filename (remove .csv extension)
      const fileName = file.name.replace('.csv', '');
      
      // Find matching production by lot_number
      const matchedProduction = availableProductions.find(prod => 
        prod.lot_number.toLowerCase() === fileName.toLowerCase()
      );

      const importData: ImportedFileData = {
        fileName,
        token,
        matchedProduction: matchedProduction || null
      };

      setImportedFile(importData);
      
      if (matchedProduction) {
        toast.success(`File berhasil diimpor! Produksi ${matchedProduction.product?.name} - ${matchedProduction.lot_number} terpilih otomatis.`);
      } else {
        toast(`File berhasil diimpor, tetapi tidak ada produksi dengan lot number "${fileName}". Silakan pilih manual.`, {
          icon: '⚠️',
          duration: 4000,
        });
      }

    } catch (error: any) {
      toast.error(`Gagal memproses file: ${error.message}`);
      setImportedFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const clearImport = () => {
    setImportedFile(null);
    setSelectedProductionId('');
    setQrToken('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNext = () => {
    if (currentStep === 'select') {
      if (!selectedProductionId || !qrToken || !selectedProduction) {
        toast.error('Silakan pilih produksi dan isi token QR.');
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handleGenerate = async () => {
    setCurrentStep('processing');
    setIsGenerating(true);
    
    try {
      const result = await generateProductionRegisters(
        parseInt(selectedProductionId),
        qrToken
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      setGeneratedCount(result.data?.generated || 0);
      setCurrentStep('success');
      toast.success(`${result.data?.generated || 0} data register berhasil di-generate!`);
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
      setCurrentStep('confirm');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (currentStep === 'success') {
      window.location.reload();
    }
    onClose();
  };

  const StepIndicator = ({ step, active, completed }: { step: number; active: boolean; completed: boolean }) => (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
      completed 
        ? 'bg-emerald-500 border-emerald-500 text-white' 
        : active 
          ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
          : 'bg-gray-100 border-gray-300 text-gray-400'
    }`}>
      {completed ? (
        <CheckCircleIcon className="w-6 h-6" />
      ) : (
        <span className="font-semibold">{step}</span>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50/30 shadow-2xl transition-all border border-white/60">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-blue-600 px-8 py-6 text-white relative overflow-hidden">
                  <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30' aria-hidden="true" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <QrCodeIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-2xl font-bold text-white">
                          Generate Production Registers
                        </Dialog.Title>
                        <p className="text-emerald-100 mt-1 text-sm">
                          Proses otomatis untuk membuat QR code verifikasi produk
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleClose} 
                      className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200 text-white/80 hover:text-white"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-6 border-b border-gray-200/50">
                  <div className="flex items-center justify-center space-x-8">
                    <div className="flex items-center space-x-3">
                      <StepIndicator 
                        step={1} 
                        active={currentStep === 'select'} 
                        completed={['confirm', 'processing', 'success'].includes(currentStep)} 
                      />
                      <span className={`text-sm font-medium ${
                        ['confirm', 'processing', 'success'].includes(currentStep) ? 'text-emerald-600' : 
                        currentStep === 'select' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Pilih Data
                      </span>
                    </div>
                    <div className={`w-16 h-0.5 ${
                      ['confirm', 'processing', 'success'].includes(currentStep) ? 'bg-emerald-500' : 'bg-gray-300'
                    } transition-colors duration-300`}></div>
                    <div className="flex items-center space-x-3">
                      <StepIndicator 
                        step={2} 
                        active={currentStep === 'confirm'} 
                        completed={['processing', 'success'].includes(currentStep)} 
                      />
                      <span className={`text-sm font-medium ${
                        ['processing', 'success'].includes(currentStep) ? 'text-emerald-600' : 
                        currentStep === 'confirm' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Konfirmasi
                      </span>
                    </div>
                    <div className={`w-16 h-0.5 ${
                      ['success'].includes(currentStep) ? 'bg-emerald-500' : 'bg-gray-300'
                    } transition-colors duration-300`}></div>
                    <div className="flex items-center space-x-3">
                      <StepIndicator 
                        step={3} 
                        active={currentStep === 'processing'} 
                        completed={currentStep === 'success'} 
                      />
                      <span className={`text-sm font-medium ${
                        currentStep === 'success' ? 'text-emerald-600' : 
                        currentStep === 'processing' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Selesai
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {currentStep === 'select' && (
                    <div className="space-y-8 animate-fade-in">
                      
                      {/* Tab untuk Manual vs Import */}
                      <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 p-2 shadow-inner">
                          <Tab className={({ selected }) => classNames(
                            'w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-200',
                            'ring-white/60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2',
                            selected 
                              ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-200/50 transform scale-105' 
                              : 'text-gray-600 hover:bg-white/60 hover:text-emerald-600'
                          )}>
                            Manual Input
                          </Tab>
                          <Tab className={({ selected }) => classNames(
                            'w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-200',
                            'ring-white/60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2',
                            selected 
                              ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-200/50 transform scale-105' 
                              : 'text-gray-600 hover:bg-white/60 hover:text-emerald-600'
                          )}>
                            Import CSV
                          </Tab>
                        </Tab.List>
                        
                        <Tab.Panels className="mt-6">
                          {/* Manual Tab */}
                          <Tab.Panel>
                            {/* Peringatan jika tidak ada data tersedia */}
                            {availableProductions.length === 0 && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                                <div className="flex items-start gap-4">
                                  <div className="p-2 bg-amber-100 rounded-lg">
                                    <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-amber-800 mb-2">Tidak Ada Data Tersedia</h4>
                                    <p className="text-amber-700 mb-2">
                                      Semua data produksi sudah pernah di-generate atau belum ada data produksi yang dapat di-generate.
                                    </p>
                                    <p className="text-amber-600 text-sm">
                                      Silakan tambahkan data produksi baru atau periksa kembali data yang ada.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {availableProductions.length > 0 && (
                              <div className="space-y-6">
                                {/* Left Column - Form */}
                                <div className="space-y-6">
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
                                    <div className="flex items-start gap-3">
                                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Informasi Penting</p>
                                        <p>Hanya data produksi yang belum pernah di-generate yang ditampilkan untuk menghindari duplikasi.</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                      <CpuChipIcon className="h-5 w-5 text-blue-600" />
                                      Pilih Data Produksi
                                    </h4>
                                    <select 
                                      value={selectedProductionId} 
                                      onChange={e => setSelectedProductionId(e.target.value)}
                                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-3 px-4"
                                      disabled={availableProductions.length === 0}
                                    >
                                      <option value="">
                                        {availableProductions.length === 0 
                                          ? "-- Tidak ada data tersedia --" 
                                          : "-- Pilih Produksi --"
                                        }
                                      </option>
                                      {availableProductions.map(p => (
                                        <option key={p.id} value={p.id}>
                                          {p.product?.name} - Lot: {p.lot_number} ({p.company?.name})
                                        </option>
                                      ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Tersedia {availableProductions.length} dari {productions.length} data produksi
                                    </p>
                                  </div>

                                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                      <SparklesIcon className="h-5 w-5 text-emerald-600" />
                                      Token QR Verification
                                    </h4>
                                    <input 
                                      type="text" 
                                      value={qrToken} 
                                      onChange={e => setQrToken(e.target.value)} 
                                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-3 px-4"
                                      placeholder="cdeb515aa5711813b5dae88829e69531" 
                                      disabled={availableProductions.length === 0}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                      <InformationCircleIcon className="h-4 w-4" />
                                      Token dari sistem perbenihan.com untuk verifikasi QR
                                    </p>
                                  </div>
                                </div>

                                {/* Right Column - Preview */}
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <ChartBarIcon className="h-5 w-5 text-gray-600" />
                                    Preview Data
                                  </h4>
                                  
                                  {isLoadingDetails ? (
                                    <div className="text-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                      <p className="text-sm text-gray-500 mt-2">Memuat detail...</p>
                                    </div>
                                  ) : selectedProduction ? (
                                    <div className="space-y-4">
                                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <h5 className="font-semibold text-gray-800 mb-3">Detail Produksi</h5>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Produk:</span>
                                            <span className="font-medium text-gray-800">{selectedProduction.product?.name}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Lot Number:</span>
                                            <span className="font-medium text-gray-800">{selectedProduction.lot_number}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Kode Hybrid:</span>
                                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                              {startProductionCode}
                                              {startProductionCode !== endProductionCode && ` - ${endProductionCode}`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div className="text-center p-3 bg-white rounded-lg">
                                            <div className="text-2xl font-bold text-emerald-600">{quantity}</div>
                                            <div className="text-gray-500">Total Records</div>
                                          </div>
                                          <div className="text-center p-3 bg-white rounded-lg">
                                            <div className="text-lg font-bold text-gray-800">{startNumber} - {endNumber}</div>
                                            <div className="text-gray-500">Serial Range</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-400">
                                      <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-3" />
                                      <p className="text-sm">Pilih produksi untuk melihat preview</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Tab.Panel>
                          
                          {/* Import Tab */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {/* File Upload Area */}
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                  <FolderOpenIcon className="h-5 w-5 text-purple-600" />
                                  Import Token dari CSV
                                </h4>
                                
                                <div className="mb-4 p-4 bg-purple-100/50 rounded-xl border border-purple-200">
                                  <h5 className="font-medium text-purple-800 mb-2">Cara Kerja Import:</h5>
                                  <ul className="text-sm text-purple-700 space-y-1">
                                    <li>• Nama file CSV akan dicocokkan dengan Nomor Lot produksi</li>
                                    <li>• Token diambil dari kolom kedua (Token) pada baris pertama data</li>
                                    <li>• Format file: [NomorLot].csv (contoh: NLH1A1056.csv)</li>
                                  </ul>
                                </div>

                                {!importedFile ? (
                                  <div className="relative">
                                    <input 
                                      ref={fileInputRef}
                                      type="file"
                                      accept=".csv"
                                      onChange={handleFileInputChange}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      disabled={isProcessingFile}
                                    />
                                    
                                    <div className="relative border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200">
                                      <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">
                                          {isProcessingFile ? 'Memproses file...' : 'Klik untuk upload atau drag & drop file CSV'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Format: CSV dengan kolom Token, Max: 10MB
                                        </p>
                                        {isProcessingFile && (
                                          <div className="flex justify-center mt-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                        <div>
                                          <h5 className="font-semibold text-gray-800">File Berhasil Diimpor</h5>
                                          <p className="text-sm text-gray-600">{importedFile.fileName}.csv</p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={clearImport}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                      >
                                        <XMarkIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-500">Token:</span>
                                          <span className="font-mono text-gray-800 break-all">{importedFile.token}</span>
                                        </div>
                                      </div>
                                      
                                      {importedFile.matchedProduction ? (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                              <span className="font-medium text-green-800">Produksi Ditemukan</span>
                                            </div>
                                            <div className="ml-6 space-y-1">
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Produk:</span>
                                                <span className="font-medium">{importedFile.matchedProduction.product?.name}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Lot:</span>
                                                <span className="font-medium">{importedFile.matchedProduction.lot_number}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Perusahaan:</span>
                                                <span className="font-medium">{importedFile.matchedProduction.company?.name}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                          <div className="flex items-start gap-2">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <div className="text-sm">
                                              <span className="font-medium text-amber-800">Produksi Tidak Ditemukan</span>
                                              <p className="text-amber-700 mt-1">
                                                Tidak ada produksi dengan lot number "{importedFile.fileName}". 
                                                Silakan pilih manual di bawah.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Manual Selection (when imported file doesn't match) */}
                              {importedFile && !importedFile.matchedProduction && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CpuChipIcon className="h-5 w-5 text-blue-600" />
                                    Pilih Produksi Manual
                                  </h4>
                                  <select 
                                    value={selectedProductionId} 
                                    onChange={e => setSelectedProductionId(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-3 px-4"
                                  >
                                    <option value="">-- Pilih Produksi --</option>
                                    {availableProductions.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.product?.name} - Lot: {p.lot_number} ({p.company?.name})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Preview for Import */}
                              {importedFile && selectedProduction && (
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <ChartBarIcon className="h-5 w-5 text-gray-600" />
                                    Preview Generate
                                  </h4>
                                  
                                  {isLoadingDetails ? (
                                    <div className="text-center py-4">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                                      <p className="text-sm text-gray-500 mt-2">Memuat detail...</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <h5 className="font-semibold text-gray-800 mb-3">Detail Produksi</h5>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Produk:</span>
                                            <span className="font-medium text-gray-800">{selectedProduction.product?.name}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Lot Number:</span>
                                            <span className="font-medium text-gray-800">{selectedProduction.lot_number}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Token:</span>
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                                              {importedFile.token}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                        <h5 className="font-semibold text-emerald-800 mb-3">Statistik Generate</h5>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div className="text-center p-3 bg-white rounded-lg">
                                            <div className="text-2xl font-bold text-emerald-600">{quantity}</div>
                                            <div className="text-gray-500">Total Records</div>
                                          </div>
                                          <div className="text-center p-3 bg-white rounded-lg">
                                            <div className="text-lg font-bold text-gray-800">{startNumber} - {endNumber}</div>
                                            <div className="text-gray-500">Serial Range</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  )}

                  {currentStep === 'confirm' && selectedProduction && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-amber-800 mb-2">Konfirmasi Generate</h4>
                            <p className="text-amber-700 mb-4">
                              Anda akan men-generate <strong>{quantity}</strong> data register dengan detail berikut:
                            </p>
                            <div className="bg-white/70 rounded-xl p-4 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Produk:</span>
                                <span className="font-medium">{selectedProduction.product?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Kode Hybrid:</span>
                                <span className="font-mono">{startProductionCode} - {endProductionCode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Serial Number:</span>
                                <span className="font-mono">{startNumber} - {endNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Token:</span>
                                <span className="font-mono text-xs break-all">{qrToken}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Generate:</span>
                                <span className="font-bold text-emerald-600">{quantity} records</span>
                              </div>
                              {importedFile && (
                                <div className="flex justify-between">
                                  <span>Sumber:</span>
                                  <span className="text-purple-600 font-medium">Import dari {importedFile.fileName}.csv</span>
                                </div>
                              )}
                            </div>
                            <p className="text-amber-600 text-sm mt-3 font-medium">
                              ⚠️ Proses ini tidak dapat dibatalkan setelah dimulai.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 'processing' && (
                    <div className="text-center py-12 animate-fade-in">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                        <QrCodeIcon className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Sedang Memproses...</h3>
                      <p className="text-gray-600">Membuat {quantity} production registers</p>
                      <div className="mt-6 bg-gray-100 rounded-full h-2 w-64 mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}

                  {currentStep === 'success' && (
                    <div className="text-center py-12 animate-fade-in">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                        <div className="absolute inset-0 rounded-full bg-emerald-100"></div>
                        <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Generate Berhasil!</h3>
                      <p className="text-gray-600 mb-6">
                        <strong>{generatedCount}</strong> production registers telah berhasil dibuat
                      </p>
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50 max-w-md mx-auto">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">{generatedCount}</div>
                            <div className="text-gray-600">Records Created</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">✓</div>
                            <div className="text-gray-600">Status Updated</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/50 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {currentStep === 'select' && 'Langkah 1 dari 3'}
                    {currentStep === 'confirm' && 'Langkah 2 dari 3'}
                    {currentStep === 'processing' && 'Memproses...'}
                    {currentStep === 'success' && 'Selesai'}
                  </div>
                  
                  <div className="flex gap-3">
                    {currentStep === 'select' && (
                      <>
                        <button
                          onClick={handleClose}
                          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!selectedProductionId || !qrToken || isLoadingDetails || availableProductions.length === 0}
                          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                          Lanjutkan
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {currentStep === 'confirm' && (
                      <>
                        <button
                          onClick={() => setCurrentStep('select')}
                          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Kembali
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                          Generate Sekarang
                        </button>
                      </>
                    )}
                    
                    {currentStep === 'success' && (
                      <button
                        onClick={handleClose}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}