// app/admin/productions/GenerateRegistersModal.tsx - Clean Implementation
'use client';

import ProgressModal from './ProgressModal';
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
  DocumentArrowUpIcon,
  FolderOpenIcon,
  TrashIcon,
  PlusIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateProductionRegisters, getProgress } from './actions';
import XCircleIcon from '@heroicons/react/16/solid/XCircleIcon';

// Types
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

interface ImportedFile {
  id: string;
  fileName: string;
  token: string;
  matchedProduction: ProductionForDropdown | null;
  status: 'matched' | 'pending' | 'error';
  error?: string;
}

interface ManualEntry {
  id: string;
  productionId: number;
  token: string;
  production?: ProductionForDropdown;
}

interface BulkResult {
  success: boolean;
  results: Array<{
    productionId: number;
    lotNumber: string;
    generated: number;
    success: boolean;
    error?: string;
  }>;
  totalGenerated: number;
  successCount: number;
  failureCount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productions: ProductionForDropdown[];
}

interface ProgressData {
  currentBatch: number;
  totalBatches: number;
  totalInserted: number;
  totalRecords: number;
  status: 'processing' | 'completed' | 'error';
  percentage?: number;
  estimatedTimeRemaining?: number;
  error?: string;
  lotNumber?: string;
}

type Mode = 'single' | 'bulk';
type Step = 'select' | 'confirm' | 'processing' | 'success';

// Utility functions
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main component
export default function GenerateRegistersModal({ isOpen, onClose, productions }: Props) {

  // State variables
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Core state
  const [mode, setMode] = useState<Mode>('single');
  const [step, setStep] = useState<Step>('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  // Single mode state
  const [selectedProductionId, setSelectedProductionId] = useState<string>('');
  const [qrToken, setQrToken] = useState('');
  const [selectedProduction, setSelectedProduction] = useState<FullProductionData | null>(null);

  // Bulk mode state
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available productions (not yet generated)
  const availableProductions = useMemo(() => {
    return productions.filter(prod => !prod.import_qr_at);
  }, [productions]);

  // Valid bulk entries
  const validBulkEntries = useMemo(() => {
    const fileEntries = importedFiles
      .filter(file => file.status === 'matched' && file.matchedProduction && file.token)
      .map(file => ({
        productionId: file.matchedProduction!.id,
        token: file.token,
        lotNumber: file.matchedProduction!.lot_number,
        source: 'file' as const
      }));

    const manualValidEntries = manualEntries
      .filter(entry => entry.productionId && entry.token && entry.production)
      .map(entry => ({
        productionId: entry.productionId,
        token: entry.token,
        lotNumber: entry.production!.lot_number,
        source: 'manual' as const
      }));

    return [...fileEntries, ...manualValidEntries];
  }, [importedFiles, manualEntries]);

  // Production code calculation
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

  // Serial number calculation
  const startNumber = selectedProduction ? parseInt(selectedProduction.lab_result_serial_number, 10) : 0;
  const quantity = selectedProduction ? selectedProduction.lot_total : 0;
  const endNumber = (startNumber && quantity) ? startNumber + quantity - 1 : 0;

  // Effects
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setMode('single');
      setStep('select');
      setSelectedProductionId('');
      setQrToken('');
      setSelectedProduction(null);
      setImportedFiles([]);
      setManualEntries([]);
      setIsProcessingFiles(false);
      setBulkResult(null);
      setGeneratedCount(0);
      setIsGenerating(false);
      setIsLoadingDetails(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Hanya jalankan jika kita berada di step 'processing' dan punya job ID
    if (step !== 'processing' || !currentJobId) {
      setProgress(null); // Reset progress jika keluar dari step processing
      return;
    }

    let isPolling = true;

    const pollProgress = async () => {
      if (!isPolling) return;
      
      try {
        const data = await getProgress(currentJobId);
        
        if (data) {
          setProgress(data);
          
          if (data.status === 'completed' || data.status === 'error') {
            isPolling = false;
            
            // Pindah ke step success setelah jeda singkat
            if (data.status === 'completed') {
              setGeneratedCount(data.totalInserted);
              toast.success(`Berhasil! ${data.totalInserted} data register telah di-generate!`);
              setTimeout(() => {
                setStep('success');
              }, 1500); // Jeda agar user bisa melihat status 100%
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        isPolling = false; // Stop polling jika ada error
      }
    };

    const intervalId = setInterval(pollProgress, 300); // Poll setiap 300ms

    // Cleanup function untuk menghentikan interval saat komponen unmount atau step berubah
    return () => {
      isPolling = false;
      clearInterval(intervalId);
    };
  }, [step, currentJobId]); // <-- Dependensi diubah

  useEffect(() => {
    // Fetch production details when selection changes in single mode
    async function fetchProductionDetails() {
      if (!selectedProductionId || mode !== 'single') {
        setSelectedProduction(null);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const response = await fetch(`/api/productions/${selectedProductionId}`);
        if (!response.ok) throw new Error('Gagal mengambil detail produksi.');
        
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
  }, [selectedProductionId, mode]);

  // File handling functions
  const handleFileImport = async (files: FileList) => {
    if (files.length === 0) return;

    const csvFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      toast.error('Hanya file CSV yang didukung');
      return;
    }

    if (csvFiles.length !== files.length) {
      toast(`${files.length - csvFiles.length} file diabaikan karena bukan CSV`);
    }

    setIsProcessingFiles(true);
    const newFiles: ImportedFile[] = [];

    for (const file of csvFiles) {
      try {
        const text = await file.text();
        const lines = text.split('\n');
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        if (dataLines.length === 0) {
          throw new Error('File CSV kosong');
        }

        const firstRow = dataLines[0].split(',');
        if (firstRow.length < 2) {
          throw new Error('Format CSV tidak valid');
        }

        const token = firstRow[1]?.replace(/"/g, '').trim();
        if (!token) {
          throw new Error('Token tidak ditemukan');
        }

        const fileName = file.name.replace('.csv', '');
        const matchedProduction = availableProductions.find(prod => 
          prod.lot_number.toLowerCase() === fileName.toLowerCase()
        );

        newFiles.push({
          id: generateId(),
          fileName,
          token,
          matchedProduction: matchedProduction || null,
          status: matchedProduction ? 'matched' : 'pending'
        });

      } catch (error: any) {
        newFiles.push({
          id: generateId(),
          fileName: file.name.replace('.csv', ''),
          token: '',
          matchedProduction: null,
          status: 'error',
          error: error.message
        });
      }
    }

    setImportedFiles(prev => [...prev, ...newFiles]);
    setIsProcessingFiles(false);

    const successCount = newFiles.filter(f => f.status === 'matched').length;
    if (successCount > 0) {
      toast.success(`${successCount} file berhasil diimpor`);
    }
  };

  const removeImportedFile = (id: string) => {
    setImportedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllImports = () => {
    setImportedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Manual entry functions
  const addManualEntry = () => {
    setManualEntries(prev => [...prev, {
      id: generateId(),
      productionId: 0,
      token: ''
    }]);
  };

  const updateManualEntry = (id: string, field: keyof ManualEntry, value: string | number) => {
    setManualEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { 
            ...entry, 
            [field]: value,
            production: field === 'productionId' 
              ? availableProductions.find(p => p.id === Number(value)) || undefined
              : entry.production
          }
        : entry
    ));
  };

  const removeManualEntry = (id: string) => {
    setManualEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const clearAllManualEntries = () => {
    setManualEntries([]);
  };

  // Generation handlers
  const handleNext = () => {
    if (step !== 'select') return;

    if (mode === 'single') {
      if (!selectedProductionId || !qrToken || !selectedProduction) {
        toast.error('Silakan pilih produksi dan isi token QR');
        return;
      }
      
      // TAMBAHKAN: Client-side check untuk status import_qr_at
      const selectedProd = availableProductions.find(p => p.id === parseInt(selectedProductionId));
      if (selectedProd?.import_qr_at) {
        toast.error(`Produksi ${selectedProd.lot_number} sudah pernah di-generate pada ${new Date(selectedProd.import_qr_at).toLocaleString()}`);
        return;
      }
    } else {
      if (validBulkEntries.length === 0) {
        toast.error('Silakan tambahkan minimal satu data untuk generate');
        return;
      }
    }
    
    setStep('confirm');
  };

  const handleGenerate = async () => {
    setStep('processing');
    setIsGenerating(true);
    
    try {
      if (mode === 'single') {
        await handleSingleGenerate();
      } else {
        await handleBulkGenerate();
      }
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
      setStep('confirm');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSingleGenerate = async () => {
    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentJobId(jobId);
    
    // Pindah ke step processing, useEffect akan mengambil alih dari sini
    setStep('processing'); 

    // Panggil server action tanpa 'await' (fire-and-forget)
    // Server akan memproses di background, dan kita akan memantau via polling
    generateProductionRegisters(
      parseInt(selectedProductionId),
      qrToken,
      jobId // Pass job ID untuk progress tracking
    ).then(result => {
      // Kita bisa menangani error awal di sini jika server action langsung gagal
      if (result.error) {
        toast.error(`Gagal memulai proses: ${result.error.message}`);
        setProgress(prev => prev ? { ...prev, status: 'error', error: result.error.message } : {
            currentBatch: 0, totalBatches: 0, totalInserted: 0, totalRecords: 0,
            status: 'error', error: result.error.message
        });
        setStep('confirm'); // Kembali ke konfirmasi jika gagal mulai
      }
    });
  };

  const handleBulkGenerate = async () => {
    const results = [];
    let totalGenerated = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const entry of validBulkEntries) {
      try {
        const result = await generateProductionRegisters(entry.productionId, entry.token);

        if (result.error) {
          throw new Error(result.error.message);
        }

        const generated = result.data?.generated || 0;
        totalGenerated += generated;
        successCount++;

        results.push({
          productionId: entry.productionId,
          lotNumber: entry.lotNumber,
          generated,
          success: true
        });

      } catch (error: any) {
        failureCount++;
        results.push({
          productionId: entry.productionId,
          lotNumber: entry.lotNumber,
          generated: 0,
          success: false,
          error: error.message
        });
      }
    }

    setBulkResult({
      success: successCount > 0,
      results,
      totalGenerated,
      successCount,
      failureCount
    });

    setStep('success');

    if (successCount > 0) {
      toast.success(`Berhasil generate ${successCount} produksi dengan total ${totalGenerated} registers!`);
    }
    if (failureCount > 0) {
      toast.error(`${failureCount} produksi gagal di-generate`);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      window.location.reload();
    }
    onClose();
  };

  // UI Components
  const StepIndicator = ({ stepNum, active, completed }: { stepNum: number; active: boolean; completed: boolean }) => (
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
        <span className="font-semibold">{stepNum}</span>
      )}
    </div>
  );

  const ModeSelector = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CpuChipIcon className="h-5 w-5 text-blue-600" />
        Mode Generate
      </h4>
      <div className="flex gap-4">
        <label className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex-1 ${
          mode === 'single'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="mode"
            value="single"
            checked={mode === 'single'}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="sr-only"
          />
          <QrCodeIcon className={`h-6 w-6 ${mode === 'single' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div>
            <span className={`font-medium ${mode === 'single' ? 'text-blue-800' : 'text-gray-700'}`}>
              Single Generate
            </span>
            <p className="text-sm text-gray-600 mt-1">Generate satu produksi</p>
          </div>
        </label>
        
        <label className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex-1 ${
          mode === 'bulk'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="mode"
            value="bulk"
            checked={mode === 'bulk'}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="sr-only"
          />
          <DocumentDuplicateIcon className={`h-6 w-6 ${mode === 'bulk' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div>
            <span className={`font-medium ${mode === 'bulk' ? 'text-blue-800' : 'text-gray-700'}`}>
              Bulk Generate
            </span>
            <p className="text-sm text-gray-600 mt-1">Generate multiple produksi</p>
          </div>
        </label>
      </div>
    </div>
  );

  const SingleModeContent = () => (
    <>
      {availableProductions.length === 0 ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-amber-800 mb-2">Tidak Ada Data Tersedia</h4>
              <p className="text-amber-700">
                Semua data produksi sudah pernah di-generate atau belum ada data produksi yang dapat di-generate.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
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
              >
                <option value="">-- Pilih Produksi --</option>
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
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <InformationCircleIcon className="h-4 w-4" />
                Token dari sistem perbenihan.com untuk verifikasi QR
              </p>
            </div>
          </div>

          {/* Preview Section */}
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
    </>
  );

  const BulkModeContent = () => (
    <div className="space-y-6">
      {/* File Import Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CloudArrowUpIcon className="h-5 w-5 text-purple-600" />
          Import Multiple CSV Files
        </h4>
        
        <div className="mb-4 p-4 bg-purple-100/50 rounded-xl border border-purple-200">
          <h5 className="font-medium text-purple-800 mb-2">Cara Kerja Bulk Import:</h5>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Upload multiple file CSV sekaligus (drag & drop atau browse)</li>
            <li>• Nama file CSV akan dicocokkan dengan Nomor Lot produksi</li>
            <li>• Token diambil dari kolom kedua pada baris pertama data</li>
            <li>• Format file: [NomorLot].csv (contoh: NLH1A1056.csv)</li>
          </ul>
        </div>

        <div className="relative">
          <input 
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={(e) => e.target.files && handleFileImport(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isProcessingFiles}
          />
          
          <div className="relative border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">
                {isProcessingFiles ? 'Memproses file...' : 'Klik untuk upload atau drag & drop multiple file CSV'}
              </p>
              <p className="text-xs text-gray-500">
                Multiple CSV files, Max: 10MB per file
              </p>
              {isProcessingFiles && (
                <div className="flex justify-center mt-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Imported Files List */}
        {importedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-800">File yang Diimpor ({importedFiles.length})</h5>
              <button
                onClick={clearAllImports}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <TrashIcon className="h-3 w-3" />
                Hapus Semua
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {importedFiles.map(file => (
                <div key={file.id} className={`p-3 rounded-lg border ${
                  file.status === 'matched' ? 'bg-green-50 border-green-200' :
                  file.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{file.fileName}.csv</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          file.status === 'matched' ? 'bg-green-100 text-green-800' :
                          file.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {file.status === 'matched' ? 'Matched' :
                           file.status === 'error' ? 'Error' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {file.status === 'matched' && file.matchedProduction && (
                          <>Produksi: {file.matchedProduction.product?.name} | Token: {file.token.substring(0, 10)}...</>
                        )}
                        {file.status === 'error' && (
                          <span className="text-red-600">Error: {file.error}</span>
                        )}
                        {file.status === 'pending' && (
                          <span className="text-yellow-600">Produksi dengan lot "{file.fileName}" tidak ditemukan</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeImportedFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-emerald-600" />
            Input Manual
          </h4>
          <button
            onClick={addManualEntry}
            className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Entry
          </button>
        </div>

        <div className="mb-4 p-3 bg-emerald-100/50 rounded-lg border border-emerald-200">
          <p className="text-sm text-emerald-700">
            Tambahkan data secara manual jika tidak ingin menggunakan file CSV. Pilih produksi dan masukkan token untuk setiap entry.
          </p>
        </div>

        {manualEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <PlusIcon className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">Belum ada entry manual. Klik "Tambah Entry" untuk mulai.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Entry Manual ({manualEntries.length})</span>
              <button
                onClick={clearAllManualEntries}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <TrashIcon className="h-3 w-3" />
                Hapus Semua
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {manualEntries.map(entry => (
                <div key={entry.id} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Produksi
                      </label>
                      <select
                        value={entry.productionId}
                        onChange={(e) => updateManualEntry(entry.id, 'productionId', Number(e.target.value))}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value={0}>-- Pilih Produksi --</option>
                        {availableProductions.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.product?.name} - {p.lot_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Token
                      </label>
                      <input
                        type="text"
                        value={entry.token}
                        onChange={(e) => updateManualEntry(entry.id, 'token', e.target.value)}
                        placeholder="Token QR..."
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {entry.production && (
                        <>Perusahaan: {entry.production.company?.name}</>
                      )}
                    </div>
                    <button
                      onClick={() => removeManualEntry(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Summary */}
      {validBulkEntries.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Summary Generate</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{validBulkEntries.length}</div>
              <div className="text-sm text-gray-600">Total Siap Generate</div>
            </div>
            <div className="bg-white/80 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-gray-800">
                {importedFiles.filter(f => f.status === 'matched').length} File + {manualEntries.filter(e => e.productionId && e.token).length} Manual
              </div>
              <div className="text-sm text-gray-600">Sumber Data</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h5 className="font-medium text-gray-700">Data yang akan di-generate:</h5>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validBulkEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center text-sm bg-white/60 px-3 py-2 rounded">
                  <span className="font-medium">{entry.lotNumber}</span>
                  <span className="text-gray-500 text-xs">
                    {entry.source === 'file' ? 'CSV' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ConfirmContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-amber-800 mb-2">Konfirmasi Generate</h4>
            
            {mode === 'single' && selectedProduction ? (
              <div>
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
                </div>
              </div>
            ) : (
              <div>
                <p className="text-amber-700 mb-4">
                  Anda akan men-generate <strong>{validBulkEntries.length}</strong> produksi secara bersamaan:
                </p>
                <div className="bg-white/70 rounded-xl p-4 max-h-60 overflow-y-auto">
                  {validBulkEntries.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <span className="font-medium">{entry.lotNumber}</span>
                        <span className="text-xs text-gray-500 ml-2">({entry.source})</span>
                      </div>
                      <span className="text-xs font-mono text-gray-600">
                        {entry.token.substring(0, 8)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-amber-600 text-sm mt-3 font-medium">
              ⚠️ Proses ini tidak dapat dibatalkan setelah dimulai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  

  const ProcessingContent = () => (
    <div className="py-8 px-4">
      {progress ? (
        <div className="max-w-2xl mx-auto">
          {/* Premium Header with Animated Background */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"></div>
            <div className="relative text-center py-6 px-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {progress.status === 'processing' && 'Generating Production Registers'}
                {progress.status === 'completed' && 'Generation Completed'}
                {progress.status === 'error' && 'Generation Failed'}
              </h3>
              {progress.lotNumber && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-600 font-medium">Lot Number:</span>
                  <span className="font-mono font-bold text-emerald-600">{progress.lotNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Progress Display */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-6">
            
            {/* Spinner with Percentage in Center */}
            <div className="flex justify-center mb-8">
              {progress.status === 'processing' && (
                <div className="relative">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  {/* Main spinner */}
                  <div className="relative w-32 h-32 border-[6px] border-gray-200 rounded-full">
                    <div className="absolute inset-0 border-[6px] border-transparent border-t-emerald-500 border-r-blue-500 rounded-full animate-spin"></div>
                    {/* Percentage Display in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                          {progress.percentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {progress.status === 'completed' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-emerald-200">
                    <CheckCircleIcon className="h-20 w-20 text-emerald-600 animate-bounce" />
                  </div>
                </div>
              )}
              {progress.status === 'error' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-40"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-red-200">
                    <XCircleIcon className="h-20 w-20 text-red-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Batch Counter and Records Counter */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-sm font-bold text-gray-700 mb-3">
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Batch {progress.currentBatch}/{progress.totalBatches}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                  <span className="font-mono">{progress.totalInserted.toLocaleString()} / {progress.totalRecords.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Real-time Progress Bar with Smooth Animation */}
              <div className="relative">
                <div className="w-full h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full shadow-inner overflow-hidden border-2 border-gray-300">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 rounded-full relative overflow-hidden transition-all duration-700 ease-out shadow-lg"
                    style={{ width: `${progress.percentage || 0}%` }}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-shimmer-progress"></div>
                  </div>
                </div>
                {/* Percentage label overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {progress.percentage || 0}% Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Time Remaining - Dynamic Estimation */}
            {progress.status === 'processing' && progress.estimatedTimeRemaining !== undefined && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Time Remaining</div>
                      <div className="text-2xl font-bold text-purple-900">{formatTime(progress.estimatedTimeRemaining)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-600 font-medium">Est. Completion</div>
                    <div className="text-sm font-mono text-purple-800">
                      {new Date(Date.now() + progress.estimatedTimeRemaining * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {progress.totalInserted.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Records Inserted</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border-2 border-emerald-200/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {progress.currentBatch}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Current Batch</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {progress.totalBatches}
                  </div>
                  <div className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Total Batches</div>
                </div>
              </div>
            </div>

            {/* Status Indicators with Icons */}
            <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border-2 ${
              progress.status === 'processing' 
                ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-blue-200' :
              progress.status === 'completed' 
                ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-200' :
                'bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-red-200'
            }`}>
              {progress.status === 'processing' && (
                <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-shimmer-progress"></div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  progress.status === 'processing' ? 'bg-blue-100 border-2 border-blue-300' :
                  progress.status === 'completed' ? 'bg-emerald-100 border-2 border-emerald-300' :
                  'bg-red-100 border-2 border-red-300'
                }`}>
                  {progress.status === 'processing' && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                  {progress.status === 'completed' && (
                    <CheckCircleIcon className="h-7 w-7 text-emerald-600" />
                  )}
                  {progress.status === 'error' && (
                    <XCircleIcon className="h-7 w-7 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 ${
                    progress.status === 'processing' ? 'text-blue-900' :
                    progress.status === 'completed' ? 'text-emerald-900' :
                    'text-red-900'
                  }`}>
                    {progress.status === 'processing' && `Processing Batch ${progress.currentBatch} of ${progress.totalBatches}`}
                    {progress.status === 'completed' && "All Registers Generated Successfully!"}
                    {progress.status === 'error' && "Generation Failed"}
                  </p>
                  <p className={`text-xs ${
                    progress.status === 'processing' ? 'text-blue-700' :
                    progress.status === 'completed' ? 'text-emerald-700' :
                    'text-red-700'
                  }`}>
                    {progress.status === 'processing' && `${progress.totalInserted.toLocaleString()} records inserted, estimated ${formatTime(progress.estimatedTimeRemaining || 0)} remaining`}
                    {progress.status === 'completed' && "Auto-closing in 2 seconds and reloading page..."}
                    {progress.status === 'error' && progress.error}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-optimization Info */}
            {progress.status === 'processing' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CpuChipIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Auto-Optimization</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    Optimized batch size for {progress.totalRecords.toLocaleString()} records
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="font-mono font-bold text-gray-900 text-base">
                      {progress.totalRecords > 50000 ? '2,000' :
                       progress.totalRecords > 20000 ? '1,000' :
                       progress.totalRecords < 100 ? '50' : '500'}
                    </span>
                    <span className="text-xs text-gray-600">records/batch</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Enhanced initial loading state
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl border border-blue-200/50 p-12">
            <div className="text-center">
              {/* Animated logo/icon */}
              <div className="relative inline-flex mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-gray-200 rounded-full relative">
                    <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCodeIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Initializing Generation Process
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Setting up batch processor and preparing database connections...
              </p>
              
              {/* Loading steps */}
              <div className="space-y-3 text-left max-w-sm mx-auto">
                {['Validating production data', 'Checking for duplicates', 'Optimizing batch size', 'Starting generation'].map((step, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 animate-pulse"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const SuccessContent = () => (
    <div className="text-center py-12">
      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-100"></div>
        <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Generate Berhasil!</h3>
      
      {mode === 'single' ? (
        <>
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
        </>
      ) : bulkResult && (
        <>
          <p className="text-gray-600 mb-6">
            <strong>{bulkResult.successCount}</strong> dari <strong>{validBulkEntries.length}</strong> produksi berhasil di-generate
            dengan total <strong>{bulkResult.totalGenerated}</strong> records
          </p>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50 max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{bulkResult.successCount}</div>
                <div className="text-gray-600">Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{bulkResult.failureCount}</div>
                <div className="text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bulkResult.totalGenerated}</div>
                <div className="text-gray-600">Total Records</div>
              </div>
            </div>
            
            {bulkResult.failureCount > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-medium text-red-800 mb-2">Produksi yang Gagal:</h5>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {bulkResult.results
                    .filter(r => !r.success)
                    .map((result, index) => (
                      <div key={index} className="text-xs text-red-700">
                        • {result.lotNumber}: {result.error}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50/30 shadow-2xl transition-all border border-white/60">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-blue-600 px-8 py-6 text-white relative overflow-hidden">
                  <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30' />
                  <div className="relative flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <QrCodeIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-2xl font-bold text-white">
                          Generate Production Registers
                        </Dialog.Title>
                        <p className="text-emerald-100 mt-1 text-sm">
                          {mode === 'single' 
                            ? 'Generate QR code untuk satu produksi'
                            : 'Generate QR code untuk multiple produksi sekaligus'
                          }
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
                    <div className="flex space-x-3">
                      <StepIndicator 
                        stepNum={1} 
                        active={step === 'select'} 
                        completed={['confirm', 'processing', 'success'].includes(step)} 
                      />
                      <span className={`text-sm font-medium ${
                        ['confirm', 'processing', 'success'].includes(step) ? 'text-emerald-600' : 
                        step === 'select' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {mode === 'single' ? 'Pilih Data' : 'Setup Data'}
                      </span>
                    </div>
                    <div className={`w-16 h-0.5 ${
                      ['confirm', 'processing', 'success'].includes(step) ? 'bg-emerald-500' : 'bg-gray-300'
                    } transition-colors duration-300`}></div>
                    <div className="flex items-center space-x-3">
                      <StepIndicator 
                        stepNum={2} 
                        active={step === 'confirm'} 
                        completed={['processing', 'success'].includes(step)} 
                      />
                      <span className={`text-sm font-medium ${
                        ['processing', 'success'].includes(step) ? 'text-emerald-600' : 
                        step === 'confirm' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Konfirmasi
                      </span>
                    </div>
                    <div className={`w-16 h-0.5 ${
                      ['success'].includes(step) ? 'bg-emerald-500' : 'bg-gray-300'
                    } transition-colors duration-300`}></div>
                    <div className="flex items-center space-x-3">
                      <StepIndicator 
                        stepNum={3} 
                        active={step === 'processing'} 
                        completed={step === 'success'} 
                      />
                      <span className={`text-sm font-medium ${
                        step === 'success' ? 'text-emerald-600' : 
                        step === 'processing' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Selesai
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {step === 'select' && (
                    <div className="space-y-8">
                      <ModeSelector />
                      {mode === 'single' ? <SingleModeContent /> : <BulkModeContent />}
                    </div>
                  )}
                  
                  {step === 'confirm' && <ConfirmContent />}
                  {step === 'processing' && <ProcessingContent />}
                  {step === 'success' && <SuccessContent />}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/50 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {step === 'select' && `Langkah 1 dari 3 - ${mode === 'single' ? 'Mode Single' : 'Mode Bulk'}`}
                    {step === 'confirm' && 'Langkah 2 dari 3'}
                    {step === 'processing' && 'Memproses...'}
                    {step === 'success' && 'Selesai'}
                  </div>
                  
                  <div className="flex gap-3">
                    {step === 'select' && (
                      <>
                        <button
                          onClick={handleClose}
                          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={
                            mode === 'single' 
                              ? (!selectedProductionId || !qrToken || isLoadingDetails || availableProductions.length === 0)
                              : (validBulkEntries.length === 0)
                          }
                          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                          Lanjutkan
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {step === 'confirm' && (
                      <>
                        <button
                          onClick={() => setStep('select')}
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
                          {mode === 'single' ? 'Generate Sekarang' : `Generate ${validBulkEntries.length} Produksi`}
                        </button>
                      </>
                    )}
                    
                    {step === 'success' && (
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
      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setCurrentJobId(null);
        }}
        jobId={currentJobId}
        lotNumber={selectedProduction?.lot_number}
      />
    </Transition>
  );
}