// app/admin/products/ProductClient.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import ProductForm from './ProductForm';
import { deleteProduct } from './actions';
import { normalizeImageUrl } from '../../utils/imageUtils';

interface Product {
  id: number;
  photo: string;
  sku: string;
  name: string;
  varietas: { name: string } | null;
  kelas_benih: { name: string } | null;
  jenis_tanaman: { name: string } | null;
  jenis_tanaman_id?: number;
  kelas_benih_id?: number;
  varietas_id?: number;
  benih_murni?: number;
  daya_berkecambah?: number;
  kadar_air?: number;
  kotoran_benih?: number;
  campuran_varietas_lain?: number;
  benih_tanaman_lain?: number;
  pack_capacity?: number | null;
  bag_capacity?: number;
  qr_color?: string;
  bahan_aktif_ids?: number[];
}

interface RelationalData {
  id: number;
  name: string;
}

interface ProductClientProps {
  initialProducts: Product[];
  allJenisTanaman: RelationalData[];
  allKelasBenih: RelationalData[];
  allVarietas: RelationalData[];
  allBahanAktif: RelationalData[];
}

// ++ 1. Definisikan interface DisplayUser ++
interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

export default function ProductClient({ 
  initialProducts, allJenisTanaman, allKelasBenih, allVarietas, allBahanAktif 
}: ProductClientProps) {
  const { user } = useAuth(); // User | null
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ++ 2. Transformasi 'user' Supabase menjadi 'displayUser' ++
  const displayUser: DisplayUser | null = user
    ? {
        name: user.user_metadata?.name || 'Admin',
        roles: user.app_metadata?.roles || [],
      }
    : null;

  const handleLogout = async () => { 
    // Implement logout logic
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      const toastId = toast.loading('Menghapus produk...');
      try {
        const result = await deleteProduct(id);
        if (result.error) {
          toast.error(`Gagal: ${result.error.message}`, { id: toastId });
        } else {
          toast.success('Produk berhasil dihapus!', { id: toastId });
          window.location.reload(); // ++ 3. Tambahkan reload untuk konsistensi ++
        }
      } catch (err: any) {
        toast.error(`Gagal: ${err.message}`, { id: toastId });
      }
    }
  };

  return (
    // ++ 4. Sesuaikan BG halaman ++
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Toaster position="top-center" />
      {/* ++ 5. Gunakan displayUser untuk Navbar ++ */}
      <Navbar user={displayUser} onLogout={handleLogout} />
      
      {/* ++ 6. Sesuaikan layout main dan header ++ */}
      <main className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Data Produk
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Kelola semua data master produk benih.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button 
              type="button" 
              onClick={handleAdd} 
              // ++ 7. Sesuaikan gaya tombol Tambah ++
              className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* ++ 8. Ganti wrapper tabel agar konsisten ++ */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              {/* ++ 9. Sesuaikan
               thead ++ */}
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  {/* ++ 10. Tambahkan kolom ID ++ */}
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-200 sm:pl-6">
                    ID
                  </th>
                  <th scope="col" className="w-16 px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Foto</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Nama Produk</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">SKU</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-slate-200">Varietas</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900 dark:text-slate-100">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {/* ++ 11. Tambahkan cek empty state ++ */}
                {initialProducts && initialProducts.length > 0 ? initialProducts.map((product) => {
                  const imageUrl = normalizeImageUrl(product.photo);
                  
                  return (
                    // Hapus 'even:bg-gray-50' untuk konsistensi
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      {/* ++ 12. Tambahkan sel ID ++ */}
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-100 sm:pl-6">
                        {product.id}
                      </td>
                      <td className="px-6 py-4">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={product.name} 
                            className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                            onError={(e) => {
                              console.error('Failed to load image:', imageUrl);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs ${imageUrl ? 'hidden' : ''}`}>
                          No Img
                        </div>
                      </td>
                      {/* ++ 13. Sesuaikan styling sel Nama ++ */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-200">{product.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{product.sku}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{product.varietas?.name || '-'}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {/* ++ 14. Sesuaikan tombol Aksi dengan ikon ++ */}
                        <button 
                          onClick={() => handleEdit(product)} 
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 inline-flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-4 inline-flex items-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" /> Hapus
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  // ++ 15. Tambahkan baris empty state ++
                  <tr>
                    <td colSpan={7} className="text-center py-16 px-6 text-gray-500 dark:text-slate-400">
                      <h3 className="text-lg font-semibold dark:text-slate-300">Belum ada data</h3>
                      <p className="mt-1 text-sm dark:text-slate-400">Mulai dengan menambahkan data produk baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ProductForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        productToEdit={selectedProduct}
        allJenisTanaman={allJenisTanaman}
        allKelasBenih={allKelasBenih}
        allVarietas={allVarietas}
        allBahanAktif={allBahanAktif}
      />
    </div>
  );
}