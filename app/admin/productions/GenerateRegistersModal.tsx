// app/admin/productions/GenerateRegistersModal.tsx
'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateProductionRegisters } from './actions';

interface ProductionForDropdown {
  id: number;
  product: { name: string } | null;
  company: { name: string } | null;
  lot_number: string;
}

interface FullProductionData extends ProductionForDropdown {
    lot_total: number;
    lab_result_serial_number: string;
    code_1: string;
    code_2: string;
    code_3: string;
    code_4: string;
}

interface GenerateRegistersModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: ProductionForDropdown[]; // Hanya butuh data untuk list
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
  
  // State ini akan menampung data LENGKAP setelah di-fetch
  const [selectedProduction, setSelectedProduction] = useState<FullProductionData | null>(null);

  // **LOGIKA BARU: Ambil data lengkap saat dropdown berubah**
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

  const handleSubmit = async () => {
    if (!selectedProductionId || !qrToken || !selectedProduction) {
      toast.error('Silakan pilih produksi dan isi token QR.');
      return;
    }
    
    const confirmationText = `Anda akan men-generate ${selectedProduction.lot_total} data register dengan nomor seri mulai dari ${selectedProduction.lab_result_serial_number}. Lanjutkan?`;

    if (window.confirm(confirmationText)) {
        setIsGenerating(true);
        const promise = generateProductionRegisters(
            parseInt(selectedProductionId),
            qrToken
        );

        toast.promise(promise, {
            loading: 'Sedang men-generate data...',
            success: (result) => {
                if (result.error) throw new Error(result.error.message);
                onClose();
                return `${result.data?.generated || 0} data register berhasil di-generate!`;
            },
            error: (err) => `Gagal: ${err.message}`,
        });

        promise.finally(() => setIsGenerating(false));
    }
  };

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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                <span><QrCodeIcon className="h-6 w-6 inline-block mr-2 text-emerald-600"/>Generate Production Registers</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
              </Dialog.Title>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="production_id" className="block text-sm font-medium text-zinc-700">Pilih Data Induk Produksi *</label>
                  <select 
                    id="production_id" 
                    value={selectedProductionId} 
                    onChange={e => setSelectedProductionId(e.target.value)}
                    className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Produksi --</option>
                    {productions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.product?.name} - Lot: {p.lot_number} ({p.company?.name})
                      </option>
                    ))}
                  </select>
                </div>

                {isLoadingDetails && <p className="text-sm text-gray-500 text-center">Memuat detail produksi...</p>}

                {selectedProduction && !isLoadingDetails && (
                  <div className="p-4 bg-gray-50 rounded-lg border animate-fade-in space-y-2">
                    <h4 className="font-semibold text-gray-800">Detail & Konfirmasi Data</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><strong>Kode Hybrid:</strong> 
                        <span className="font-mono bg-gray-200 px-1 rounded">{startProductionCode}</span>
                        {startProductionCode !== endProductionCode && (
                          <>
                            <span className="mx-1">s/d</span>
                            <span className="font-mono bg-gray-200 px-1 rounded">{endProductionCode}</span>
                          </>
                        )}
                      </li>
                      <li><strong>Total Generate:</strong> <span className="font-bold">{selectedProduction.lot_total}</span> item</li>
                      <li><strong>Nomor Seri Awal:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{!isNaN(startNumber) ? startNumber : 'Error: lab_result_serial_number tidak valid'}</span></li>
                      <li><strong>Nomor Seri Akhir:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{!isNaN(endNumber) && endNumber > 0 ? endNumber : 'Error'}</span></li>
                    </ul>
                  </div>
                )}
                
                <div>
                    <label htmlFor="qr_token" className="block text-sm font-medium text-zinc-700">Token QR-Code Verification Perbenihan.com *</label>
                    <input 
                        type="text" 
                        name="qr_token" 
                        id="qr_token" 
                        value={qrToken} 
                        onChange={e => setQrToken(e.target.value)} 
                        required 
                        className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm"
                        placeholder="Contoh: cdeb515aa5711813b5dae88829e69531" 
                    />
                </div>

                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p>Pastikan data yang dipilih sudah benar. Proses ini akan men-generate **{selectedProduction?.lot_total || 0}** data baru dan tidak dapat dibatalkan.</p>
                </div>

              </div>
              
              <div className="mt-8 flex justify-end gap-x-4">
                <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                <button type="button" onClick={handleSubmit} disabled={isGenerating || !selectedProductionId || isLoadingDetails} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50">
                  {isGenerating ? 'Memproses...' : (
                    <>
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Generate Data</span>
                    </>
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}