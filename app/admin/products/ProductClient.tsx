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

// --- PERBAIKI INTERFACE DI BAWAH INI ---
interface Product {
  id: number;
  photo: string;
  sku: string;
  name: string;
  // Hapus tanda array `[]` dari tipe data relasi
  varietas: { name: string } | null;
  kelas_benih: { name: string } | null;
  jenis_tanaman: { name: string } | null;
  // Tambah field untuk edit form
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

export default function ProductClient({ 
  initialProducts, allJenisTanaman, allKelasBenih, allVarietas, allBahanAktif 
}: ProductClientProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      toast.promise(deleteProduct(id), {
         loading: 'Menghapus produk...',
         success: 'Produk berhasil dihapus!',
         error: (err) => `Gagal: ${err.message}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Data Produk</h1>
            <p className="mt-1 text-md text-gray-600">Kelola semua data master produk benih.</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button type="button" onClick={handleAdd} className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Tambah Produk
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-16 px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Foto</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Produk</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Varietas</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {initialProducts.map((product) => {
                    // Normalize image URL untuk setiap produk
                    const imageUrl = normalizeImageUrl(product.photo);
                    
                    return (
                      <tr key={product.id} className="even:bg-gray-50">
                        <td className="px-6 py-4">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={product.name} 
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                console.error('Failed to load image:', imageUrl);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs ${imageUrl ? 'hidden' : ''}`}>
                            No Img
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.varietas?.name || '-'}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button 
                            onClick={() => handleEdit(product)} 
                            className="text-emerald-600 hover:text-emerald-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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