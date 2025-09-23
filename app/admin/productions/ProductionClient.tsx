// app/admin/productions/ProductionClient.tsx - Enhanced with Filters and Sorting
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowDownOnSquareIcon, 
  ChevronLeftIcon, ChevronRightIcon, FunnelIcon, XMarkIcon,
  ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
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

// Types (same as before)
interface RelationalData {
  id: number;
  name: string;
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

// Filter and Sort Types
type SortField = 'product' | 'hybrid_code' | 'volume' | 'harvest_date' | 'status';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  product: string;
  company: string;
  status: string; // 'all' | 'generated' | 'not_generated'
  dateFrom: string;
  dateTo: string;
  search: string;
}

// Filter Component
const FilterPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  products,
  companies
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  products: RelationalData[];
  companies: RelationalData[];
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      product: '',
      company: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          Filter & Pencarian
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pencarian (Lot Number)
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Cari nomor lot..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Product Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produk
          </label>
          <select
            value={filters.product}
            onChange={(e) => handleFilterChange('product', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Produk</option>
            {products.map(product => (
              <option key={product.id} value={product.id.toString()}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Company Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perusahaan
          </label>
          <select
            value={filters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Perusahaan</option>
            {companies.map(company => (
              <option key={company.id} value={company.id.toString()}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Registers
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="generated">Sudah Generate</option>
            <option value="not_generated">Belum Generate</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Panen Dari
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Panen Sampai
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset Filter
        </button>
      </div>
    </div>
  );
};

// Sort Header Component
const SortableHeader = ({ 
  field, 
  children, 
  sortField, 
  sortDirection, 
  onSort 
}: {
  field: SortField;
  children: React.ReactNode;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) => {
  const isActive = sortField === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left w-full hover:bg-gray-50 px-3 py-3.5 text-sm font-semibold text-gray-900 transition-colors"
    >
      {children}
      {isActive ? (
        sortDirection === 'asc' ? (
          <ChevronUpIcon className="h-4 w-4 text-emerald-600" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-emerald-600" />
        )
      ) : (
        <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );
};

// Main Component
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
  
  // Existing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any>(null);
  const [viewingProduction, setViewingProduction] = useState<any>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Filter and Sort state
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({
    product: '',
    company: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort logic
  const filteredAndSortedProductions = useMemo(() => {
    let result = [...initialProductions];

    // Apply filters
    result = result.filter(prod => {
      // Search filter
      if (filters.search && !prod.lot_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Product filter
      if (filters.product && prod.product?.name) {
        // Find product ID by name (since we're filtering by product ID)
        const selectedProduct = products.find(p => p.id.toString() === filters.product);
        if (selectedProduct && prod.product.name !== selectedProduct.name) {
          return false;
        }
      }

      // Company filter - similar logic
      if (filters.company && prod.company?.name) {
        const selectedCompany = companies.find(c => c.id.toString() === filters.company);
        if (selectedCompany && prod.company.name !== selectedCompany.name) {
          return false;
        }
      }

      // Status filter
      if (filters.status === 'generated' && !prod.import_qr_at) {
        return false;
      }
      if (filters.status === 'not_generated' && prod.import_qr_at) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const harvestDate = new Date(prod.cert_realization_tanggal_panen);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (harvestDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (harvestDate > toDate) return false;
        }
      }

      return true;
    });

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'product':
            aValue = a.product?.name || '';
            bValue = b.product?.name || '';
            break;
          case 'hybrid_code':
            aValue = `${a.code_1}${a.code_2}${a.code_3}${a.code_4}`;
            bValue = `${b.code_1}${b.code_2}${b.code_3}${b.code_4}`;
            break;
          case 'volume':
            aValue = a.lot_volume;
            bValue = b.lot_volume;
            break;
          case 'harvest_date':
            aValue = new Date(a.cert_realization_tanggal_panen);
            bValue = new Date(b.cert_realization_tanggal_panen);
            break;
          case 'status':
            aValue = a.import_qr_at ? 1 : 0; // Generated = 1, Not generated = 0
            bValue = b.import_qr_at ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [initialProductions, filters, sortField, sortDirection, products, companies]);

  // Pagination logic
  const totalFilteredItems = filteredAndSortedProductions.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductions = filteredAndSortedProductions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset pagination when filters change
  useMemo(() => {
    resetPagination();
  }, [filters, sortField, sortDirection, resetPagination]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.product) count++;
    if (filters.company) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  // Existing handlers (unchanged)
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
    router.refresh();
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

  const handleGenerateRegisters = useCallback(() => {
    setIsGenerateModalOpen(true);
  }, []);

  // Production Row Component (updated)
  const ProductionRow = ({ prod }: { prod: ProductionList }) => {
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
            {prod.import_qr_at ? 'Sudah Generate' : 'Belum Generate'}
          </span>
        </td>
        <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap">
          <button 
            onClick={() => handleView(prod)}
            disabled={isLoadingView}
            className="text-gray-500 hover:text-gray-800 p-1 disabled:opacity-50"
            title="Lihat Detail"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleEdit(prod)} 
            disabled={isLoadingEdit}
            className="text-emerald-600 hover:text-emerald-900 p-1 ml-2 disabled:opacity-50"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleDelete(prod.id)} 
            className="text-red-600 hover:text-red-900 p-1 ml-2"
            title="Hapus"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>
    );
  };
  
  const productionsForDropdown = useMemo(() => filteredAndSortedProductions.map(p => ({
    id: p.id,
    product: p.product,
    company: p.company,
    lot_number: p.lot_number,
    import_qr_at: p.import_qr_at
  })), [filteredAndSortedProductions]);

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
              Menampilkan: {paginatedProductions.length} dari {totalFilteredItems} hasil filter (Total: {pagination.totalCount} data)
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {activeFiltersCount} filter aktif
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-x-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600 hover:bg-emerald-100'
                  : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="-ml-0.5 h-5 w-5" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
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

        {/* Filter Panel */}
        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
          products={products}
          companies={companies}
        />

        <div className="mt-8 flow-root">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-0 pl-4 pr-3 text-left sm:pl-6">
                      <SortableHeader
                        field="product"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        Produk
                      </SortableHeader>
                    </th>
                    <th scope="col" className="px-3 py-0 text-left">
                      <SortableHeader
                        field="hybrid_code"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        Kode Hybrid
                      </SortableHeader>
                    </th>
                    <th scope="col" className="px-3 py-0 text-left">
                      <SortableHeader
                        field="volume"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        Volume
                      </SortableHeader>
                    </th>
                    <th scope="col" className="px-3 py-0 text-left">
                      <SortableHeader
                        field="harvest_date"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        Tanggal Panen
                      </SortableHeader>
                    </th>
                    <th scope="col" className="px-3 py-0 text-left">
                      <SortableHeader
                        field="status"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        Status Registers
                      </SortableHeader>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedProductions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-sm text-gray-500 text-center">
                        {activeFiltersCount > 0 
                          ? "Tidak ada data yang sesuai dengan filter yang dipilih."
                          : "Belum ada data produksi. Klik tombol \"Tambah Produksi\" untuk memulai."
                        }
                      </td>
                    </tr>
                  ) : (
                    paginatedProductions.map((prod) => (
                      <ProductionRow key={prod.id} prod={prod} />
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Enhanced Pagination Component */}
              {totalFilteredItems > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-md border border-gray-300 py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={totalFilteredItems}>Semua ({totalFilteredItems})</option>
                    </select>
                    <span className="text-sm text-gray-700">per halaman</span>
                  </div>

                  {/* Mobile pagination */}
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop pagination */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, totalFilteredItems)}</span> of{' '}
                        <span className="font-medium">{totalFilteredItems}</span> results
                        {totalFilteredItems !== pagination.totalCount && (
                          <span className="text-gray-500"> (filtered from {pagination.totalCount} total)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Jump to page input */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Halaman:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                            setCurrentPage(page);
                          }}
                          className="w-16 rounded-md border border-gray-300 py-1 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <span className="text-sm text-gray-700">dari {totalPages}</span>
                      </div>
                      
                      {/* Pagination navigation */}
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage <= 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          <span className="sr-only">First</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06-.02L10 10.25 5.27 14.75a.75.75 0 11-1.04-1.08l5.25-5a.75.75 0 011.04 0l5.25 5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                          </svg>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06-.02L10 10.25 5.27 14.75a.75.75 0 11-1.04-1.08l5.25-5a.75.75 0 011.04 0l5.25 5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                          className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                          let page;
                          if (totalPages <= 7) {
                            page = i + 1;
                          } else if (currentPage <= 4) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            page = totalPages - 6 + i;
                          } else {
                            page = currentPage - 3 + i;
                          }
                          
                          if (page < 1 || page > totalPages) return null;
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
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
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage >= totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          <span className="sr-only">Last</span>
                          <svg className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06-.02L10 10.25 5.27 14.75a.75.75 0 11-1.04-1.08l5.25-5a.75.75 0 011.04 0l5.25 5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                          </svg>
                          <svg className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06-.02L10 10.25 5.27 14.75a.75.75 0 11-1.04-1.08l5.25-5a.75.75 0 011.04 0l5.25 5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <GenerateRegistersModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        productions={productionsForDropdown}
      />

      <ProductionForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        productionToEdit={selectedProduction}
        products={products}
        companies={companies}
        varietas={varietas}
        kelasBenih={kelasBenih}
      />

      <ProductionViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        production={viewingProduction}
      />

      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}