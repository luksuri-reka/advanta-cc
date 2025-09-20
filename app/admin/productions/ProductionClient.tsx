// app/admin/productions/ProductionClient.tsx (Performance Optimized)
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowDownOnSquareIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { formatDate } from '@/app/utils/dateFormat';
import ProductionForm from './ProductionForm';
import ProductionViewModal from './ProductionViewModal';
import ImportDataModal from './ImportDataModal';
import { deleteProduction } from './actions';
import GenerateRegistersModal from './GenerateRegistersModal';
import QrCodeIcon from '@heroicons/react/24/solid/QrCodeIcon';

// Types
interface RelationalData {
  id: number;
  name: string;
}

interface ProductionFull {
  id: number;
  group_number: string;
  code_1: string;
  code_2: string;
  code_3: string;
  code_4: string;
  clearance_number: string | null;
  product_id: number;
  product: any;
  company_id: number;
  company: any;
  target_certification_wide: number | null;
  target_kelas_benih_id: number | null;
  target_kelas_benih: any;
  target_seed_production: number | null;
  seed_source_company_id: number;
  seed_source_company: any;
  seed_source_male_varietas_id: number;
  seed_source_male_varietas: any;
  seed_source_female_varietas_id: number;
  seed_source_female_varietas: any;
  seed_source_kelas_benih_id: number;
  seed_source_kelas_benih: any;
  seed_source_serial_number: string | null;
  seed_source_male_lot_number: string;
  seed_source_female_lot_number: string;
  cert_realization_wide: number | null;
  cert_realization_seed_production: string | null;
  cert_realization_tanggal_panen: string | null;
  lot_number: string;
  lot_kelas_benih_id: number;
  lot_kelas_benih: any;
  lot_varietas_id: number;
  lot_varietas: any;
  lot_volume: number;
  lot_content: number;
  lot_total: number;
  lab_result_certification_number: string;
  lab_result_test_result: number;
  lab_result_incoming_date: string | null;
  lab_result_filing_date: string;
  lab_result_testing_date: string;
  lab_result_tested_date: string;
  lab_result_serial_number: string;
  lab_result_expired_date: string;
  test_param_kadar_air: number;
  test_param_benih_murni: number;
  test_param_campuran_varietas_lain: number;
  test_param_benih_tanaman_lain: number;
  test_param_kotoran_benih: number;
  test_param_daya_berkecambah: number;
  import_qr_at: string | null;
}

interface ProductionList {
  id: number;
  group_number: string;
  lot_number: string;
  product: { name: string } | null;
  company: { name: string } | null;
  lot_kelas_benih: { name: string } | null;
  lot_varietas: { name: string } | null;
  lot_volume: number;
  cert_realization_tanggal_panen: string;
  import_qr_at: string | null;
  code_1: string;
  code_2: string;
  code_3: string;
  code_4: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface ProductionClientProps {
  initialProductions: ProductionList[];
  products: RelationalData[];
  companies: RelationalData[];
  varietas: RelationalData[];
  kelasBenih: RelationalData[];
  pagination: Pagination;
}

// Memoized components untuk performance
const ProductionRow = ({ 
  prod, 
  onView, 
  onEdit, 
  onDelete, 
  isLoadingView, 
  isLoadingEdit 
}: {
  prod: ProductionList;
  onView: (prod: ProductionList) => void;
  onEdit: (prod: ProductionList) => void;
  onDelete: (id: number) => void;
  isLoadingView: boolean;
  isLoadingEdit: boolean;
}) => {
  const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

  return (
    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
      <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6">
        <div className='font-semibold'>{prod.product?.name || 'N/A'}</div>
        <div className='text-gray-500'>{prod.lot_varietas?.name || 'N/A'}</div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-500 font-mono">
        {`${prod.code_1}${prod.code_2}${prod.code_3}${prod.code_4}`}
      </td>
      <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">{prod.lot_volume} kg</td>
      <td className="px-3 py-4 text-sm text-gray-500">{formatDate(prod.cert_realization_tanggal_panen)}</td>
      <td className="px-3 py-4 text-sm text-gray-500">
        <span
          className={classNames(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
            prod.import_qr_at
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
              : 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
          )}
        >
          {prod.import_qr_at ? 'Sudah Impor' : 'Belum Impor'}
        </span>
      </td>
      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap">
        <button 
          onClick={() => onView(prod)}
          disabled={isLoadingView}
          className="text-gray-500 hover:text-gray-800 p-1 disabled:opacity-50"
          title="Lihat Detail"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onEdit(prod)} 
          disabled={isLoadingEdit}
          className="text-emerald-600 hover:text-emerald-900 p-1 ml-2 disabled:opacity-50"
          title="Edit"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onDelete(prod.id)} 
          className="text-red-600 hover:text-red-900 p-1 ml-2"
          title="Hapus"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};

const PaginationComponent = ({ pagination, onPageChange }: { 
  pagination: Pagination; 
  onPageChange: (page: number) => void;
}) => {
  const { currentPage, totalPages, totalCount } = pagination;
  
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * 50) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 50, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default function ProductionClient({ 
  initialProductions,
  products,
  companies,
  varietas,
  kelasBenih,
  pagination
}: ProductionClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<ProductionFull | null>(null);
  const [viewingProduction, setViewingProduction] = useState<ProductionFull | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Memoized productions untuk mencegah re-render yang tidak perlu
  const memoizedProductions = useMemo(() => initialProductions, [initialProductions]);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const handleLogout = async () => {
    console.log('Logout clicked');
  };

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleAdd = useCallback(() => {
    setSelectedProduction(null);
    setIsModalOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    setIsImportModalOpen(true);
  }, []);

  const handleImportSuccess = useCallback(() => {
    router.refresh(); // Refresh page untuk menampilkan data baru
  }, [router]);

  const handleView = useCallback(async (production: ProductionList) => {
    setIsLoadingView(true);
    try {
      const response = await fetch(`/api/productions/${production.id}`);
      if (!response.ok) throw new Error('Failed to fetch production data');
      const fullData = await response.json();
      setViewingProduction(fullData);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Gagal memuat data produksi');
      console.error('Error fetching production:', error);
    } finally {
      setIsLoadingView(false);
    }
  }, []);
  
  const handleEdit = useCallback(async (production: ProductionList) => {
    setIsLoadingEdit(true);
    try {
      const response = await fetch(`/api/productions/${production.id}`);
      if (!response.ok) throw new Error('Failed to fetch production data');
      const fullData = await response.json();
      setSelectedProduction(fullData);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Gagal memuat data produksi untuk edit');
      console.error('Error fetching production:', error);
    } finally {
      setIsLoadingEdit(false);
    }
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduction(null);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingProduction(null);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data produksi ini? Tindakan ini tidak dapat dibatalkan.')) {
      const promise = deleteProduction(id);
      
      toast.promise(promise, {
        loading: 'Menghapus data...',
        success: (result) => {
          if (result.error) throw new Error(result.error.message);
          router.refresh();
          return 'Data produksi berhasil dihapus!';
        },
        error: (err) => `Gagal menghapus: ${err.message}`,
      });
    }
  }, [router]);

  const productionsForDropdown = useMemo(() => initialProductions.map(p => ({
        id: p.id,
        product: p.product,
        company: p.company,
        lot_number: p.lot_number
    })), [initialProductions]);

  const handleGenerateRegisters = useCallback(() => {
    setIsGenerateModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Data Produksi</h1>
            <p className="mt-1 text-md text-gray-600">
              Kelola semua data produksi benih dari hulu ke hilir. 
              Total: {pagination.totalCount} data
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <button
                type="button"
                onClick={handleGenerateRegisters}
                className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
                <QrCodeIcon className="-ml-0.5 h-5 w-5" />
                Generate Registers
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ArrowDownOnSquareIcon className="-ml-0.5 h-5 w-5" />
              Impor Data
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Produksi
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Produk</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Kode Produksi</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Volume</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal Panen</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status QR</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {memoizedProductions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-sm text-gray-500 text-center">
                        Belum ada data produksi. Klik tombol "Tambah Produksi" untuk memulai.
                      </td>
                    </tr>
                  ) : (
                    memoizedProductions.map((prod) => (
                      <ProductionRow
                        key={prod.id}
                        prod={prod}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isLoadingView={isLoadingView}
                        isLoadingEdit={isLoadingEdit}
                      />
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <PaginationComponent 
                  pagination={pagination} 
                  onPageChange={handlePageChange} 
                />
              )}
            </div>
          </div>
        </div>
        <GenerateRegistersModal
            isOpen={isGenerateModalOpen}
            onClose={() => setIsGenerateModalOpen(false)}
            productions={initialProductions} // Kirim data produksi ke modal
        />
      </main>

      <GenerateRegistersModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                productions={productionsForDropdown} // Kirim data yang sudah disederhanakan
            />

      {/* Modal Form untuk Add/Edit */}
      <ProductionForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        productionToEdit={selectedProduction}
        products={products}
        companies={companies}
        varietas={varietas}
        kelasBenih={kelasBenih}
      />

      {/* Modal View untuk melihat detail */}
      <ProductionViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        production={viewingProduction}
      />

      {/* Modal Import Data */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}