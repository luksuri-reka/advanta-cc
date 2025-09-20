// app/admin/bags/BagClient.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { formatDate, formatDateTime } from '@/app/utils/dateFormat';
import BagForm from './BagForm';
import BagDetailModal from './BagDetailModal';
import GenerateQRModal from './GenerateQRModal';
import { deleteBag } from './actions';

interface BagPiece {
  id: number;
  serial_number: string;
  qr_code: string;
  qr_expired_date: string | null;
}

interface Bag {
  id: number;
  qr_code: string;
  production_id: number;
  production: any;
  capacity: number;
  quantity: number;
  packs: number;
  type: string;
  downloaded_at: string | null;
  created_at: string;
  updated_at: string;
  bag_pieces?: BagPiece[];
}

interface Production {
  id: number;
  group_number: string;
  lot_number: string;
  product_name: string;
  company_name: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface BagClientProps {
  initialBags: Bag[];
  productions: Production[];
  pagination: Pagination;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function BagClient({ 
  initialBags,
  productions,
  pagination
}: BagClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const handleLogout = async () => {
    console.log('Logout clicked');
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to page 1 on new search
    router.push(`?${params.toString()}`);
  }, [searchQuery, router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleAdd = () => {
    setSelectedBag(null);
    setIsFormOpen(true);
  };

  const handleEdit = (bag: Bag) => {
    setSelectedBag(bag);
    setIsFormOpen(true);
  };

  const handleView = (bag: Bag) => {
    setSelectedBag(bag);
    setIsDetailOpen(true);
  };

  const handleGenerateQR = () => {
    setIsQRModalOpen(true);
  };

  const handleDownloadQR = async (bagId: number) => {
    try {
      // Download CSV file
      const response = await fetch(`/api/bags/export/${bagId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `bag_${bagId}_export.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('QR Codes berhasil didownload!');
      
      // Refresh to update download status
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal download QR Codes');
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data bag ini? Semua QR code pieces yang terkait juga akan dihapus.')) {
      const promise = deleteBag(id);
      
      toast.promise(promise, {
        loading: 'Menghapus data...',
        success: (result) => {
          if (result.error) throw new Error(result.error.message);
          router.refresh();
          return 'Data bag berhasil dihapus!';
        },
        error: (err) => `Gagal menghapus: ${err.message}`,
      });
    }
  }, [router]);

  const getTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'b': return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      case 'p': return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
    }
  };

  const getTypeName = (type: string) => {
    switch(type.toLowerCase()) {
      case 'b': return 'Bag';
      case 'p': return 'Pack';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Bag Management</h1>
            <p className="mt-1 text-md text-gray-600">
              Kelola data kantong dan QR code untuk tracking produk. 
              Total: {pagination.totalCount} bags
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <button
              type="button"
              onClick={handleGenerateQR}
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <QrCodeIcon className="-ml-0.5 h-5 w-5" />
              Generate QR
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Bag
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan QR Code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Cari
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  router.push('/admin/bags');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="mt-8 flow-root">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      QR Code
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Produksi
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tipe
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Kapasitas
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Pieces
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {initialBags.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-sm text-gray-500 text-center">
                        <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="font-medium text-gray-900">Belum ada data bag</p>
                        <p className="text-gray-500 mt-1">Klik tombol "Tambah Bag" untuk memulai</p>
                      </td>
                    </tr>
                  ) : (
                    initialBags.map((bag) => (
                      <tr key={bag.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <QrCodeIcon className="h-5 w-5 text-gray-400" />
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {bag.qr_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 font-medium">
                            {bag.production?.product?.name || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Lot: {bag.production?.lot_number || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={classNames(
                            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                            getTypeColor(bag.type)
                          )}>
                            {getTypeName(bag.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {bag.capacity} kg
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {bag.bag_pieces?.length || 0}
                          </span>
                          <span className="text-gray-500"> / {bag.quantity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={classNames(
                            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                            bag.downloaded_at
                              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                              : 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                          )}>
                            {bag.downloaded_at ? 'Downloaded' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button 
                            onClick={() => handleView(bag)}
                            className="text-gray-500 hover:text-gray-800 p-1"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleEdit(bag)} 
                            className="text-emerald-600 hover:text-emerald-900 p-1 ml-2"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDownloadQR(bag.id)} 
                            className="text-blue-600 hover:text-blue-900 p-1 ml-2"
                            title="Download QR"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(bag.id)} 
                            className="text-red-600 hover:text-red-900 p-1 ml-2"
                            title="Hapus"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((pagination.currentPage - 1) * 50) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.currentPage * 50, pagination.totalCount)}</span> of{' '}
                        <span className="font-medium">{pagination.totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const page = i + Math.max(1, pagination.currentPage - 2);
                          if (page > pagination.totalPages) return null;
                          
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === pagination.currentPage
                                  ? 'z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
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
      <BagForm 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBag(null);
        }}
        bagToEdit={selectedBag}
        productions={productions}
      />

      <BagDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBag(null);
        }}
        bag={selectedBag}
      />

      <GenerateQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        productions={productions}
      />
    </div>
  );
}