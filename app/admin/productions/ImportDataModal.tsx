// app/admin/productions/ImportDataModal.tsx
'use client';

import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  skipped: number;
}

export default function ImportDataModal({ 
  isOpen, 
  onClose, 
  onImportSuccess 
}: ImportDataModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validasi tipe file
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    // Validasi ukuran file (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setFile(selectedFile);
    previewFile(selectedFile);
  };

  const previewFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/productions/preview-import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Gagal memproses file');
      
      const data = await response.json();
      setPreviewData(data.preview || []);
    } catch (error) {
      toast.error('Gagal memproses file untuk preview');
      console.error('Preview error:', error);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/productions/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Gagal mengimpor data');
      
      const result = await response.json();
      setImportResult(result);
      
      if (result.success) {
        toast.success(`Berhasil mengimpor ${result.imported} data produksi!`);
        onImportSuccess();
      }
    } catch (error) {
      toast.error('Gagal mengimpor data');
      console.error('Import error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Download template Excel
    window.open('/api/productions/template', '_blank');
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title 
                  as="h3" 
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center mb-6"
                >
                  <span>Impor Data Produksi</span>
                  <button 
                    onClick={handleClose} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Template Download */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900">Template Excel</h4>
                        <p className="text-sm text-blue-700">
                          Download template untuk memastikan format data yang benar
                        </p>
                      </div>
                      <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  {!importResult && (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center ${
                        dragActive 
                          ? 'border-emerald-400 bg-emerald-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                      
                      {!file ? (
                        <>
                          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="font-medium text-emerald-600 hover:text-emerald-500"
                            >
                              Pilih file
                            </button>
                            <span className="text-gray-500"> atau drag & drop di sini</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Format: Excel (.xlsx, .xls) atau CSV, Maksimal 10MB
                          </p>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          
                          {previewData.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Preview Data (5 baris pertama):</h4>
                              <div className="overflow-x-auto max-h-48">
                                <table className="min-w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      {Object.keys(previewData[0] || {}).map((key) => (
                                        <th key={key} className="px-2 py-1 text-left font-medium text-gray-700">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {previewData.slice(0, 5).map((row, index) => (
                                      <tr key={index} className="border-t">
                                        {Object.values(row).map((value: any, i) => (
                                          <td key={i} className="px-2 py-1 text-gray-600">
                                            {String(value || '-')}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                Total {previewData.length} baris akan diimpor
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => setFile(null)}
                              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Ganti File
                            </button>
                            <button
                              onClick={handleImport}
                              disabled={isUploading}
                              className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isUploading ? 'Mengimpor...' : 'Mulai Import'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Import Result */}
                  {importResult && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${
                        importResult.success ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          {importResult.success ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          ) : (
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                          )}
                          <div>
                            <h4 className={`font-medium ${
                              importResult.success ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {importResult.success ? 'Import Berhasil!' : 'Import Gagal'}
                            </h4>
                            <div className="text-sm mt-1">
                              <p>Berhasil diimpor: {importResult.imported} data</p>
                              {importResult.skipped > 0 && (
                                <p>Dilewati: {importResult.skipped} data</p>
                              )}
                              {importResult.errors.length > 0 && (
                                <p>Error: {importResult.errors.length} data</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {importResult.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {importResult.errors.length > 10 && (
                              <li>... dan {importResult.errors.length - 10} error lainnya</li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={resetModal}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Import Lagi
                        </button>
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Selesai
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}