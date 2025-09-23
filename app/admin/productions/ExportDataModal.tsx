// app/admin/productions/ExportDataModal.tsx
'use client';

import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ProductionForDropdown {
  id: number;
  product: { name: string } | null;
  company: { name: string } | null;
  lot_number: string;
  import_qr_at: string | null;
  cert_realization_tanggal_panen: string;
}

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  productions: ProductionForDropdown[];
}

interface ExportFilter {
  status: 'all' | 'not_generated' | 'generated';
  lotNumbers: string[];
  dateFrom: string;
  dateTo: string;
  selectedCompany: string;
  selectedProduct: string;
}

export default function ExportDataModal({ 
  isOpen, 
  onClose, 
  productions 
}: ExportDataModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState<ExportFilter>({
    status: 'not_generated',
    lotNumbers: [],
    dateFrom: '',
    dateTo: '',
    selectedCompany: '',
    selectedProduct: ''
  });
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Extract unique companies and products for filter
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    productions.forEach(prod => {
      if (prod.company?.name) companies.add(prod.company.name);
    });
    return Array.from(companies).sort();
  }, [productions]);

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    productions.forEach(prod => {
      if (prod.product?.name) products.add(prod.product.name);
    });
    return Array.from(products).sort();
  }, [productions]);

  // Filter productions based on criteria
  const filteredProductions = useMemo(() => {
    return productions.filter(prod => {
      // Status filter
      if (exportFilter.status === 'generated' && !prod.import_qr_at) return false;
      if (exportFilter.status === 'not_generated' && prod.import_qr_at) return false;

      // Lot numbers filter
      if (exportFilter.lotNumbers.length > 0) {
        if (!exportFilter.lotNumbers.includes(prod.lot_number)) return false;
      }

      // Date range filter
      if (exportFilter.dateFrom || exportFilter.dateTo) {
        const harvestDate = new Date(prod.cert_realization_tanggal_panen);
        
        if (exportFilter.dateFrom) {
          const fromDate = new Date(exportFilter.dateFrom);
          if (harvestDate < fromDate) return false;
        }
        
        if (exportFilter.dateTo) {
          const toDate = new Date(exportFilter.dateTo);
          if (harvestDate > toDate) return false;
        }
      }

      // Company filter
      if (exportFilter.selectedCompany && prod.company?.name !== exportFilter.selectedCompany) {
        return false;
      }

      // Product filter
      if (exportFilter.selectedProduct && prod.product?.name !== exportFilter.selectedProduct) {
        return false;
      }

      return true;
    });
  }, [productions, exportFilter]);

  const handleLotNumberSelection = (lotNumber: string, isChecked: boolean) => {
    setExportFilter(prev => ({
      ...prev,
      lotNumbers: isChecked 
        ? [...prev.lotNumbers, lotNumber]
        : prev.lotNumbers.filter(ln => ln !== lotNumber)
    }));
  };

  const handleSelectAllLots = () => {
    const availableLots = filteredProductions.map(p => p.lot_number);
    setExportFilter(prev => ({
      ...prev,
      lotNumbers: availableLots
    }));
  };

  const handleClearAllLots = () => {
    setExportFilter(prev => ({
      ...prev,
      lotNumbers: []
    }));
  };

  const handleExport = async () => {
    if (filteredProductions.length === 0) {
      toast.error('Tidak ada data untuk diekspor berdasarkan filter yang dipilih.');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare export parameters
      const exportParams = {
        status: exportFilter.status,
        lotNumbers: exportFilter.lotNumbers.length > 0 ? exportFilter.lotNumbers : undefined,
        dateFrom: exportFilter.dateFrom || undefined,
        dateTo: exportFilter.dateTo || undefined,
        selectedCompany: exportFilter.selectedCompany || undefined,
        selectedProduct: exportFilter.selectedProduct || undefined,
        productionIds: filteredProductions.map(p => p.id)
      };

      const response = await fetch('/api/productions/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengekspor data');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp and filter info
      const timestamp = new Date().toISOString().slice(0, 10);
      const statusText = exportFilter.status === 'not_generated' ? 'belum_generate' : 
                        exportFilter.status === 'generated' ? 'sudah_generate' : 'semua';
      link.download = `export_produksi_${statusText}_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Berhasil mengekspor ${filteredProductions.length} data produksi!`);
      onClose();

    } catch (error: any) {
      toast.error(`Gagal mengekspor data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setExportFilter({
      status: 'not_generated',
      lotNumbers: [],
      dateFrom: '',
      dateTo: '',
      selectedCompany: '',
      selectedProduct: ''
    });
  };

  const handleClose = () => {
    if (!isExporting) {
      resetFilters();
      onClose();
    }
  };

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
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-6 text-white relative overflow-hidden">
                  <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30' aria-hidden="true" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <DocumentArrowDownIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-2xl font-bold text-white">
                          Export Data Produksi
                        </Dialog.Title>
                        <p className="text-blue-100 mt-1 text-sm">
                          Export data ke format Excel sesuai template sertifikasi
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleClose} 
                      disabled={isExporting}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200 text-white/80 hover:text-white disabled:opacity-50"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    
                    {/* Status Filter */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-blue-600" />
                        Filter Status Generate
                      </h4>
                      <div className="flex gap-4">
                        {[
                          { value: 'not_generated', label: 'Belum Generate', icon: ExclamationTriangleIcon, color: 'amber' },
                          { value: 'generated', label: 'Sudah Generate', icon: CheckCircleIcon, color: 'emerald' },
                          { value: 'all', label: 'Semua Data', icon: DocumentTextIcon, color: 'blue' }
                        ].map(status => (
                          <label 
                            key={status.value} 
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              exportFilter.status === status.value
                                ? `border-${status.color}-500 bg-${status.color}-50`
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="status"
                              value={status.value}
                              checked={exportFilter.status === status.value}
                              onChange={(e) => setExportFilter(prev => ({ ...prev, status: e.target.value as any }))}
                              className="sr-only"
                            />
                            <status.icon className={`h-5 w-5 ${
                              exportFilter.status === status.value 
                                ? `text-${status.color}-600` 
                                : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              exportFilter.status === status.value 
                                ? `text-${status.color}-800` 
                                : 'text-gray-700'
                            }`}>
                              {status.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FunnelIcon className="h-4 w-4" />
                        {showAdvancedFilter ? 'Sembunyikan' : 'Tampilkan'} Filter Lanjutan
                      </button>
                      
                      {(exportFilter.dateFrom || exportFilter.dateTo || exportFilter.selectedCompany || exportFilter.selectedProduct) && (
                        <button
                          onClick={resetFilters}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilter && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/50">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Filter Lanjutan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Date Range */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rentang Tanggal Panen
                            </label>
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={exportFilter.dateFrom}
                                onChange={(e) => setExportFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Dari tanggal"
                              />
                              <input
                                type="date"
                                value={exportFilter.dateTo}
                                onChange={(e) => setExportFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sampai tanggal"
                              />
                            </div>
                          </div>

                          {/* Company Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Perusahaan
                            </label>
                            <select
                              value={exportFilter.selectedCompany}
                              onChange={(e) => setExportFilter(prev => ({ ...prev, selectedCompany: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Semua Perusahaan</option>
                              {uniqueCompanies.map(company => (
                                <option key={company} value={company}>{company}</option>
                              ))}
                            </select>
                          </div>

                          {/* Product Filter */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Produk
                            </label>
                            <select
                              value={exportFilter.selectedProduct}
                              onChange={(e) => setExportFilter(prev => ({ ...prev, selectedProduct: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Semua Produk</option>
                              {uniqueProducts.map(product => (
                                <option key={product} value={product}>{product}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lot Selection */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                          Pilih Lot Number ({filteredProductions.length} tersedia)
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAllLots}
                            className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                          >
                            Pilih Semua
                          </button>
                          <button
                            onClick={handleClearAllLots}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Hapus Semua
                          </button>
                        </div>
                      </div>

                      {filteredProductions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>Tidak ada data yang sesuai dengan filter yang dipilih.</p>
                          <p className="text-sm mt-1">Silakan ubah kriteria filter.</p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredProductions.map(prod => (
                              <label 
                                key={prod.id} 
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  exportFilter.lotNumbers.includes(prod.lot_number)
                                    ? 'border-emerald-500 bg-emerald-100'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={exportFilter.lotNumbers.includes(prod.lot_number)}
                                  onChange={(e) => handleLotNumberSelection(prod.lot_number, e.target.checked)}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {prod.lot_number}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {prod.product?.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {prod.company?.name}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      prod.import_qr_at
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {prod.import_qr_at ? 'Generated' : 'Not Generated'}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Export Summary */}
                    {exportFilter.lotNumbers.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Export</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white/80 rounded-lg p-3">
                            <p className="text-gray-600">Data Terpilih</p>
                            <p className="text-xl font-bold text-blue-600">
                              {exportFilter.lotNumbers.length}
                            </p>
                          </div>
                          <div className="bg-white/80 rounded-lg p-3">
                            <p className="text-gray-600">Status</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {exportFilter.status === 'not_generated' ? 'Belum Generate' :
                               exportFilter.status === 'generated' ? 'Sudah Generate' : 'Semua Status'}
                            </p>
                          </div>
                        </div>
                        
                        {(exportFilter.dateFrom || exportFilter.dateTo) && (
                          <div className="mt-3 p-3 bg-white/60 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <strong>Rentang Tanggal:</strong> 
                              {exportFilter.dateFrom && ` Dari ${new Date(exportFilter.dateFrom).toLocaleDateString('id-ID')}`}
                              {exportFilter.dateTo && ` Sampai ${new Date(exportFilter.dateTo).toLocaleDateString('id-ID')}`}
                            </p>
                          </div>
                        )}

                        {(exportFilter.selectedCompany || exportFilter.selectedProduct) && (
                          <div className="mt-2 p-3 bg-white/60 rounded-lg">
                            <p className="text-sm text-gray-600">
                              {exportFilter.selectedCompany && <><strong>Perusahaan:</strong> {exportFilter.selectedCompany}<br /></>}
                              {exportFilter.selectedProduct && <><strong>Produk:</strong> {exportFilter.selectedProduct}</>}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Template Info */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200/50">
                      <div className="flex items-start gap-3">
                        <DocumentTextIcon className="h-6 w-6 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-800 mb-2">Informasi Template Export</h4>
                          <ul className="text-sm text-amber-700 space-y-1">
                            <li>• Format sesuai Template Sertifikasi V4 dari Kementerian Pertanian</li>
                            <li>• File Excel (.xlsx) dengan struktur header multi-level</li>
                            <li>• Mencakup semua data produksi, sertifikasi, dan parameter uji</li>
                            <li>• Siap untuk upload ke sistem pemerintah</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/50 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {filteredProductions.length > 0 
                      ? `${filteredProductions.length} data tersedia untuk export`
                      : 'Tidak ada data yang sesuai filter'
                    }
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      disabled={isExporting}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || filteredProductions.length === 0}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Mengekspor...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Export ke Excel
                        </>
                      )}
                    </button>
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