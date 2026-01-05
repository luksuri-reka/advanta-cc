// app/admin/productions/ProductionClient.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowDownOnSquareIcon, 
  ChevronLeftIcon, ChevronRightIcon, FunnelIcon, XMarkIcon,
  ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon,
  DocumentArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { formatDate } from '@/app/utils/dateFormat';
import ProductionForm from './ProductionForm';
import ProductionViewModal from './ProductionViewModal';
import ImportDataModal from './ImportDataModal';
import ExportDataModal from './ExportDataModal';
import { deleteProduction } from './actions';
import GenerateRegistersModal from './GenerateRegistersModal';
import QrCodeIcon from '@heroicons/react/24/solid/QrCodeIcon';

// --- TIPE DATA ---

interface RelationalData {
  id: number;
  name: string;
}

// UPDATE: Tambahkan 'id' pada product dan company
interface ProductionList {
  id: number;
  group_number: string;
  lot_number: string;
  product: { id: number; name: string } | null; // Fixed: Added id
  clearance_number: string;
  company: { id: number; name: string } | null; // Fixed: Added id
  lot_kelas_benih: { name: string } | null;
  lot_varietas: { name: string } | null;
  lot_volume: number;
  cert_realization_tanggal_panen: string;
  lab_result_expired_date: string | null;
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

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

type SortField = 'product' | 'hybrid_code' | 'clearance_number' | 'lot_number' | 'volume' | 'harvest_date' | 'expired_date' | 'status';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  product: string;
  company: string;
  status: string;
  expiration: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

// --- KOMPONEN FILTER ---

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
  if (!isOpen) return null;

  const resetFilters = () => {
    onFiltersChange({
      product: '',
      company: '',
      status: 'all',
      expiration: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          Filter & Pencarian
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 dark:text-slate-400">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Pencarian Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Pencarian</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Cari nomor lot..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
        </div>

        {/* Filter Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status Kedaluwarsa</label>
          <select
            value={filters.expiration}
            onChange={(e) => onFiltersChange({ ...filters, expiration: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="all">Semua</option>
            <option value="expired">⛔ Sudah Expired</option>
            <option value="expiring_soon">⚠️ Expired &lt; 1 Bulan</option>
            <option value="safe">✅ Masih Aman</option>
          </select>
        </div>

        {/* Filter Produk */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Produk</label>
          <select
            value={filters.product}
            onChange={(e) => onFiltersChange({ ...filters, product: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">Semua Produk</option>
            {products.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
          </select>
        </div>

        {/* Filter Status Generate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status Registers</label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="all">Semua Status</option>
            <option value="generated">Sudah Generate</option>
            <option value="not_generated">Belum Generate</option>
          </select>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Tanggal Panen (Dari)</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Tanggal Panen (Sampai)</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
          Reset Filter
        </button>
      </div>
    </div>
  );
};

// Komponen Header Tabel yang Bisa Disortir
const SortableHeader = ({ field, children, sortField, sortDirection, onSort }: any) => (
  <button onClick={() => onSort(field)} className="flex items-center gap-1 text-left w-full hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-3.5 text-sm font-semibold text-gray-900 dark:text-slate-200 transition-colors">
    {children}
    {sortField === field ? (
      sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 text-emerald-600" /> : <ChevronDownIcon className="h-4 w-4 text-emerald-600" />
    ) : <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />}
  </button>
);

// --- KOMPONEN UTAMA ---

export default function ProductionClient({ 
  initialProductions, products, companies, varietas, kelasBenih, pagination
}: ProductionClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // State untuk Data Terpilih
  const [selectedProduction, setSelectedProduction] = useState<any>(null);
  const [viewingProduction, setViewingProduction] = useState<any>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // State untuk Filter & Sorting
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({
    product: '',
    company: '',
    status: 'all',
    expiration: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // State Pagination Client-Side
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- EFEK: DETEKSI URL DARI DASHBOARD ---
  useEffect(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam === 'expired_asc') {
      setSortField('expired_date');
      setSortDirection('asc');
      setFilters(prev => ({ ...prev, expiration: 'expiring_soon' }));
      setShowFilters(true);
    }
  }, [searchParams]);

  const displayUser: DisplayUser | null = user ? {
    name: user.user_metadata?.name || 'Admin',
    roles: user.app_metadata?.roles || [],
  } : null;

  // --- LOGIKA FILTER & SORTING ---
  const filteredAndSortedProductions = useMemo(() => {
    let result = [...initialProductions];
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const oneMonthLater = new Date(now);
    oneMonthLater.setDate(now.getDate() + 30);

    // 1. Filtering
    result = result.filter(prod => {
      // Filter Expiration Logic
      if (filters.expiration !== 'all') {
        const expDate = prod.lab_result_expired_date ? new Date(prod.lab_result_expired_date) : null;
        
        if (!expDate) return false;

        if (filters.expiration === 'expired') {
          if (expDate >= now) return false;
        } else if (filters.expiration === 'expiring_soon') {
          if (expDate < now || expDate > oneMonthLater) return false;
        } else if (filters.expiration === 'safe') {
          if (expDate <= oneMonthLater) return false;
        }
      }

      if (filters.search && !prod.lot_number.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // Fixed: Now .id property exists on interface
      if (filters.product && prod.product?.id.toString() !== filters.product) return false;
      if (filters.company && prod.company?.id.toString() !== filters.company) return false;
      
      if (filters.status === 'generated' && !prod.import_qr_at) return false;
      if (filters.status === 'not_generated' && prod.import_qr_at) return false;

      if (filters.dateFrom || filters.dateTo) {
        const harvestDate = new Date(prod.cert_realization_tanggal_panen);
        if (filters.dateFrom && harvestDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && harvestDate > new Date(filters.dateTo)) return false;
      }

      return true;
    });

    // 2. Sorting
    if (sortField) {
      result.sort((a, b) => {
        let aValue: any, bValue: any;
        switch (sortField) {
          case 'expired_date': 
            aValue = a.lab_result_expired_date ? new Date(a.lab_result_expired_date).getTime() : 0;
            bValue = b.lab_result_expired_date ? new Date(b.lab_result_expired_date).getTime() : 0;
            break;
          case 'product': aValue = a.product?.name || ''; bValue = b.product?.name || ''; break;
          case 'hybrid_code': aValue = `${a.code_1}${a.code_2}`; bValue = `${b.code_1}${b.code_2}`; break;
          case 'clearance_number': aValue = a.clearance_number; bValue = b.clearance_number; break;
          case 'lot_number': aValue = a.lot_number; bValue = b.lot_number; break;
          case 'volume': aValue = a.lot_volume; bValue = b.lot_volume; break;
          case 'harvest_date': aValue = new Date(a.cert_realization_tanggal_panen); bValue = new Date(b.cert_realization_tanggal_panen); break;
          case 'status': aValue = a.import_qr_at ? 1 : 0; bValue = b.import_qr_at ? 1 : 0; break;
          default: return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [initialProductions, filters, sortField, sortDirection]);

  // --- LOGIKA PAGINATION ---
  const totalFilteredItems = filteredAndSortedProductions.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const paginatedProductions = filteredAndSortedProductions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFiltersCount = [filters.search, filters.product, filters.company, filters.dateFrom, filters.dateTo].filter(Boolean).length 
    + (filters.status !== 'all' ? 1 : 0) + (filters.expiration !== 'all' ? 1 : 0);

  // --- HANDLERS ---
  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortDirection(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
  };

  const handleAdd = () => { setSelectedProduction(null); setIsModalOpen(true); };
  
  const handleEdit = async (prod: ProductionList) => {
    setIsLoadingEdit(true);
    try {
      const res = await fetch(`/api/productions/${prod.id}`);
      if (!res.ok) throw new Error('Failed');
      setSelectedProduction(await res.json());
      setIsModalOpen(true);
    } catch (e) { toast.error('Gagal memuat data'); }
    finally { setIsLoadingEdit(false); }
  };

  const handleView = async (prod: ProductionList) => {
    setIsLoadingView(true);
    try {
      const res = await fetch(`/api/productions/${prod.id}`);
      setViewingProduction(await res.json());
      setIsViewModalOpen(true);
    } catch { toast.error('Gagal memuat data'); }
    finally { setIsLoadingView(false); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus?')) {
      await deleteProduction(id);
      router.refresh();
    }
  };

  const handleImportSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const productionsForDropdown = useMemo(() => initialProductions.map(p => ({
    id: p.id,
    product: p.product,
    company: p.company,
    lot_number: p.lot_number,
    import_qr_at: p.import_qr_at,
    cert_realization_tanggal_panen: p.cert_realization_tanggal_panen
  })), [initialProductions]);

  // --- KOMPONEN BARIS TABEL ---
  const ProductionRow = ({ prod }: { prod: ProductionList }) => {
    // Logic Pewarnaan Expired
    const expiredDate = prod.lab_result_expired_date ? new Date(prod.lab_result_expired_date) : null;
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const oneMonthLater = new Date(now);
    oneMonthLater.setDate(now.getDate() + 30);

    let expiredClass = "text-gray-500 dark:text-slate-400"; // Normal
    
    // Fixed: Handle null value for formatDate
    let expiredText = prod.lab_result_expired_date ? formatDate(prod.lab_result_expired_date) : '-';

    if (expiredDate) {
      if (expiredDate < now) {
        // Sudah Expired (Merah)
        expiredClass = "text-red-600 font-bold bg-red-50 px-2 py-1 rounded dark:bg-red-900/20 dark:text-red-400"; 
      } else if (expiredDate <= oneMonthLater) {
        // Akan Expired (Oranye)
        expiredClass = "text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded dark:bg-orange-900/20 dark:text-orange-400"; 
      }
    }

    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6">{prod.id}</td>
        
        <td className="py-4 px-3 text-sm text-gray-900 dark:text-slate-100">
          <div className='font-semibold'>{prod.product?.name || '-'}</div>
          <div className='text-xs text-gray-500'>{prod.lot_varietas?.name}</div>
        </td>
        
        <td className="px-3 py-4 text-sm font-mono text-gray-500 dark:text-slate-400">
          {`${prod.code_1}${prod.code_2}${prod.code_3}${prod.code_4}`}
        </td>
        
        <td className="px-3 py-4 text-sm text-gray-500 dark:text-slate-400">{prod.lot_number}</td>
        <td className="px-3 py-4 text-sm text-gray-500 dark:text-slate-400">{prod.lot_volume} kg</td>
        
        <td className="px-3 py-4 text-sm text-gray-500 dark:text-slate-400">
          {formatDate(prod.cert_realization_tanggal_panen)}
        </td>

        {/* KOLOM TANGGAL EXPIRED */}
        <td className="px-3 py-4 text-sm">
          <span className={expiredClass}>
            {expiredText}
          </span>
        </td>

        <td className="px-3 py-4 text-sm">
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            prod.import_qr_at 
              ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
              : 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20'
          }`}>
            {prod.import_qr_at ? 'Sudah Generate' : 'Belum'}
          </span>
        </td>

        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <button onClick={() => handleView(prod)} className="text-gray-500 hover:text-gray-800 p-1 mr-2" title="Lihat"><EyeIcon className="h-4 w-4"/></button>
          <button onClick={() => handleEdit(prod)} className="text-emerald-600 hover:text-emerald-900 p-1 mr-2" title="Edit"><PencilIcon className="h-4 w-4"/></button>
          <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:text-red-900 p-1" title="Hapus"><TrashIcon className="h-4 w-4"/></button>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Toaster position="top-center" />
      <Navbar user={displayUser} onLogout={() => {}} />

      <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Data Produksi</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Menampilkan {paginatedProductions.length} dari {totalFilteredItems} data 
              {activeFiltersCount > 0 && <span className="ml-2 font-bold text-emerald-600">({activeFiltersCount} Filter Aktif)</span>}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/30'
                  : 'bg-white text-gray-900 ring-gray-300'
              }`}
            >
              <FunnelIcon className="h-5 w-5" /> Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <button onClick={() => setIsExportModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
              <DocumentArrowDownIcon className="h-5 w-5" /> Export
            </button>
            <button onClick={() => setIsGenerateModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
              <QrCodeIcon className="h-5 w-5" /> Generate
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-4 py-2.5 text-sm font-semibold ring-1 ring-gray-300 hover:bg-gray-50">
              <ArrowDownOnSquareIcon className="h-5 w-5" /> Impor
            </button>
            <button onClick={handleAdd} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
              <PlusIcon className="h-5 w-5" /> Tambah
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

        {/* Tabel Data */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">ID</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    <SortableHeader field="product" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Produk</SortableHeader>
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Kode</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    <SortableHeader field="lot_number" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Lot</SortableHeader>
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Volume</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    <SortableHeader field="harvest_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Panen</SortableHeader>
                  </th>
                  
                  {/* Kolom Tgl Expired */}
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">
                    <SortableHeader field="expired_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Tgl Expired</SortableHeader>
                  </th>

                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Status</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900 dark:text-slate-200">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {paginatedProductions.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-gray-500">Tidak ada data ditemukan</td></tr>
                ) : (
                  paginatedProductions.map(prod => <ProductionRow key={prod.id} prod={prod} />)
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalFilteredItems > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6">
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-slate-300">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">
                Total {pagination.totalCount} Data
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProductionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} productionToEdit={selectedProduction} products={products} companies={companies} varietas={varietas} kelasBenih={kelasBenih} />
      <ProductionViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} production={viewingProduction} />
      <ImportDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={handleImportSuccess} />
      <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} productions={productionsForDropdown} />
      <GenerateRegistersModal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} productions={productionsForDropdown} />
    </div>
  );
}