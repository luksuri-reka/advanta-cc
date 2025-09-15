'use client';

import { useState } from 'react';
import { QrCodeIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { searchProduct, ApiResponse } from './utils/api';
import ProductResult from './components/ProductResult';

export default function VerificationPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError('Silakan masukkan nomor seri produk.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await searchProduct(serialNumber);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi produk. Periksa kembali nomor seri Anda.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSerialNumber('');
    setResult(null);
    setError(null);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/30 to-white/50 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {result ? (
          /* Tampilan Hasil Verifikasi */
          <div className="flex flex-col w-full flex-grow animate-fade-in">
            {/* Header Halaman Hasil */}
            <header className="w-full p-4 sm:p-6 flex items-center justify-between">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-8 sm:h-10 w-auto" />
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/60 backdrop-blur-lg rounded-lg text-sm font-semibold text-gray-800 hover:bg-white transition-colors duration-200 flex items-center gap-2 shadow-sm border border-white/50"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Cek Lagi
              </button>
            </header>
            
            {/* Konten Hasil */}
            <div className="flex-grow flex items-center justify-center">
              <ProductResult data={result.data} modelType={result.meta.model_type} />
            </div>
          </div>

        ) : (
          /* Tampilan Form Verifikasi */
          <div className="w-full max-w-6xl mx-auto flex-grow flex items-center p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
              
              {/* Kolom Kiri: Branding & Teks */}
              <div className="text-slate-800 text-center md:text-left animate-fade-in">
                <img src="/advanta-logo.png" alt="Advanta Logo" className="w-40 mb-6 hidden md:block" />
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight [text-shadow:_0_2px_4px_rgb(0_0_0_/_10%)]">
                  Jaminan Keaslian di Ujung Jari Anda.
                </h1>
                <p className="text-lg text-slate-600 mt-4 [text-shadow:_0_1px_2px_rgb(255_255_255_/_50%)]">
                  Verifikasi produk benih unggul Advanta Anda sekarang untuk memastikan kualitas dan hasil panen terbaik.
                </p>
              </div>

              {/* Kolom Kanan: Kartu Form Verifikasi */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-white/80 animate-fade-in">
                <img src="/advanta-logo.png" alt="Advanta Logo" className="w-32 mb-6 mx-auto md:hidden" />
                <h2 className="text-2xl font-semibold text-slate-900 text-center">
                  Verifikasi Produk Anda
                </h2>
                <p className="text-center text-slate-500 mt-2 mb-8">
                  Masukkan nomor seri yang tertera pada label produk Anda.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <QrCodeIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="serial_number"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="block w-full rounded-xl border-slate-300 py-4 pl-12 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-all duration-200 shadow-sm"
                      placeholder="Contoh: HBFb300005"
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <span>Verifikasi Sekarang</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}