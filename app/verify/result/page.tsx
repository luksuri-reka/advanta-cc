// app/verify/result/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductResult from '@/app/components/ProductResult';
import { verifyProduct, ApiResponse } from '@/app/utils/api';
import { 
  ShieldCheckIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/solid';

function VerifyResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ApiResponse | null>(null);

  const type = searchParams.get('type') as 'serial' | 'lot' | null;
  const code = searchParams.get('code');

  useEffect(() => {
    const fetchProduct = async () => {
      // Validasi parameter
      if (!type || !code) {
        setError('Parameter verifikasi tidak lengkap');
        setLoading(false);
        return;
      }

      if (type !== 'serial' && type !== 'lot') {
        setError('Jenis verifikasi tidak valid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Panggil API untuk verifikasi
        const response = await verifyProduct(code, type);
        setProductData(response);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memverifikasi produk');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [type, code]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
            <ShieldCheckIcon className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Memverifikasi Produk
          </h2>
          <p className="text-slate-600">
            {type === 'serial' 
              ? 'Sedang memeriksa nomor seri...' 
              : 'Sedang memeriksa nomor lot...'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            <span>Mohon tunggu sebentar</span>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
              <ExclamationCircleIcon className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Verifikasi Gagal
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 font-semibold text-sm">
                {error || 'Produk tidak ditemukan'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Coba Verifikasi Lagi</span>
              </button>

              <p className="text-xs text-slate-500">
                Pastikan kode yang Anda masukkan benar
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Tampilkan ProductResult
  return (
    <ProductResult 
      data={productData.data} 
      modelType={productData.meta.model_type}
      verificationType={productData.meta.verification_type}
    />
  );
}

export default function VerifyResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    }>
      <VerifyResultContent />
    </Suspense>
  );
}