// app/admin/bags/GenerateQRModal.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, QrCodeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateBagPieces } from './actions';

interface Production {
  id: number;
  group_number: string;
  lot_number: string;
  product_name: string;
  company_name: string;
}

interface GenerateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: Production[];
}

export default function GenerateQRModal({ 
  isOpen, 
  onClose, 
  productions 
}: GenerateQRModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form');
  const [formData, setFormData] = useState({
    bagId: '',
    prefix: '',
    startNumber: 1,
    quantity: 1,
    expiryMonths: 24
  });
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value.toString());
      });

      const res = await generateBagPieces(data);
      
      if (res.error) {
        throw new Error(res.error.message);
      }

      setResult(res.data);
      setStep('result');
      toast.success(`${res.data.generated} QR codes berhasil di-generate!`);
    } catch (error: any) {
      toast.error(`Gagal generate QR: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setFormData({
      bagId: '',
      prefix: '',
      startNumber: 1,
      quantity: 1,
      expiryMonths: 24
    });
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
    if (result) {
      window.location.reload();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title 
                  as="h3" 
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center mb-6"
                >
                  <div className="flex items-center gap-3">
                    <QrCodeIcon className="h-6 w-6 text-emerald-600" />
                    <span>Generate QR Codes</span>
                  </div>
                  <button 
                    onClick={handleClose} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                {step === 'form' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pilih Bag <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bagId}
                        onChange={(e) => setFormData(prev => ({ ...prev, bagId: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        required
                      >
                        <option value="">-- Pilih Bag --</option>
                        <optgroup label="Bags Tersedia">
                          {/* Note: In real implementation, you'd fetch bags here */}
                          <option value="1">BAG-001 - Jagung Manis</option>
                          <option value="2">BAG-002 - Padi Hibrida</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prefix QR Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.prefix}
                        onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        placeholder="e.g., ADV2025"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Awal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.startNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, startNumber: parseInt(e.target.value) }))}
                          min="1"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jumlah Generate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                          min="1"
                          max="1000"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Masa Berlaku (Bulan) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.expiryMonths}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryMonths: parseInt(e.target.value) }))}
                        min="1"
                        max="60"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Preview:</strong> QR akan di-generate dengan format:<br/>
                        {formData.prefix || '[PREFIX]'}-{String(formData.startNumber).padStart(6, '0')} 
                        sampai {formData.prefix || '[PREFIX]'}-{String(formData.startNumber + formData.quantity - 1).padStart(6, '0')}
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('confirm')}
                        disabled={!formData.bagId || !formData.prefix}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Lanjutkan
                      </button>
                    </div>
                  </div>
                )}

                {step === 'confirm' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800">Konfirmasi Generate</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Anda akan generate {formData.quantity} QR codes. Proses ini tidak dapat dibatalkan.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {isGenerating ? 'Generating...' : 'Generate QR'}
                      </button>
                    </div>
                  </div>
                )}

                {step === 'result' && result && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <QrCodeIcon className="h-8 w-8 text-green-400 mr-3" />
                        <div>
                          <h4 className="text-lg font-semibold text-green-800">Generate Berhasil!</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {result.generated} QR codes berhasil di-generate untuk Bag {result.bagCode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Generate Lagi
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}