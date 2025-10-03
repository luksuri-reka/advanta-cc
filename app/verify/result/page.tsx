'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProductResult from '../../components/ProductResult';
import { searchProduct, ApiResponse } from '../../utils/api';

function VerifyResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const serial = searchParams?.get('serial') || '';
  const product = searchParams?.get('product') || '';

  useEffect(() => {
    // Jika tidak ada serial, redirect ke homepage
    if (!serial) {
      router.push('/');
      return;
    }

    // Fetch data berdasarkan serial
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await searchProduct(serial);
        setResult(response);
      } catch (err: any) {
        setError(err.message || 'Gagal memverifikasi produk.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [serial, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Memuat data produk...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Produk Tidak Ditemukan
            </h1>
            <p className="text-red-100">
              Serial: {serial}
            </p>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-8 leading-relaxed">
              {error || 'Data produk tidak dapat ditemukan. Pastikan nomor seri yang Anda masukkan benar.'}
            </p>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl mx-auto"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Kembali ke Verifikasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show ProductResult
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full p-4 sm:p-6 backdrop-blur-md bg-white/93 border-b border-emerald-100/60 shadow-xl shadow-emerald-500/5 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <img 
              src="/advanta-logo.png" 
              alt="Advanta Logo" 
              className="h-8 md:h-12 w-auto drop-shadow-md transition-transform duration-300 hover:scale-105" 
            />
            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-emerald-300/60 to-transparent" />
            <div className="hidden sm:block">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                Sistem Verifikasi
              </h2>
              <p className="text-xs md:text-sm text-emerald-600 font-semibold">
                PT Advanta Seeds Indonesia
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/90 text-emerald-800 rounded-full text-sm font-bold border border-emerald-200/80 shadow-sm backdrop-blur-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              HASIL VERIFIKASI
            </div>
            
            {/* Back Button */}
            <button
              onClick={() => router.push('/')}
              className="group px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-white to-slate-50/95 hover:from-slate-50 hover:to-white rounded-xl md:rounded-2xl text-sm md:text-base font-semibold text-slate-800 hover:text-slate-900 border border-slate-200/90 hover:border-emerald-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="hidden sm:inline">Verifikasi Lagi</span>
                <span className="sm:hidden">Kembali</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Mobile Status */}
        <div className="lg:hidden flex justify-center mt-4 pt-4 border-t border-emerald-100/60 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/90 text-emerald-800 rounded-full text-sm font-bold border border-emerald-200/80">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            HASIL VERIFIKASI
          </div>
        </div>
      </header>

      {/* Product Result Content */}
      <ProductResult data={result.data} modelType={result.meta.model_type} />
    </div>
  );
}

export default function VerifyResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Memuat halaman...</p>
        </div>
      </div>
    }>
      <VerifyResultContent />
    </Suspense>
  );
}