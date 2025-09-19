'use client';

import { useState } from 'react';
// Tambahkan ShieldExclamationIcon untuk ikon laporan
import { QrCodeIcon, ArrowLeftIcon, ArrowRightIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { searchProduct, ApiResponse } from './utils/api';
import ProductResult from './components/ProductResult';

export default function VerificationPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // --- PERUBAHAN 1: Ubah state error menjadi object ---
  const [error, setError] = useState<{ message: string; isReportable: boolean } | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  // --- PENAMBAHAN 1: State baru untuk proses pelaporan ---
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      // --- PERUBAHAN 2: Sesuaikan cara set error ---
      setError({ message: 'Silakan masukkan nomor seri produk.', isReportable: false });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setReportSuccess(false); // Reset status laporan setiap kali submit baru
    try {
      const response = await searchProduct(serialNumber);
      setResult(response);
    } catch (err: any) {
      // --- PERUBAHAN 3: Logika untuk mendeteksi error yang bisa dilaporkan ---
      const errorMessage = err.message || 'Gagal memverifikasi produk. Periksa kembali nomor seri Anda.';
      const isNotFoundError = errorMessage.includes('Produk dengan nomor seri');
      setError({ message: errorMessage, isReportable: isNotFoundError });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- PENAMBAHAN 2: Fungsi baru untuk menangani pengiriman laporan ---
  const handleReport = async () => {
    if (!error || !serialNumber) return;
    
    setIsReporting(true);
    try {
        const response = await fetch('/api/report-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serialNumber: serialNumber,
                errorMessage: error.message,
            }),
        });

        if (!response.ok) {
            throw new Error('Gagal mengirim laporan.');
        }

        setReportSuccess(true);
    } catch (reportError: any) {
        alert('Gagal mengirim laporan. Silakan coba lagi nanti.');
        console.error('Report Error:', reportError);
    } finally {
        setIsReporting(false);
    }
  };

  const handleReset = () => {
    setSerialNumber('');
    setResult(null);
    setError(null);
    setReportSuccess(false); // Reset juga status laporan
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background tidak berubah */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/30 to-white/50 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {result ? (
          /* Tampilan Hasil (tidak berubah) */
          <div className="flex flex-col w-full flex-grow animate-fade-in">
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
            <div className="flex-grow flex items-center justify-center">
              <ProductResult data={result.data} modelType={result.meta.model_type} />
            </div>
          </div>
        ) : (
          /* Tampilan Form Verifikasi */
          <div className="w-full max-w-6xl mx-auto flex-grow flex items-center p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
              {/* Kolom Kiri (tidak berubah) */}
              <div className="text-slate-800 text-center md:text-left animate-fade-in">
                <img src="/advanta-logo.png" alt="Advanta Logo" className="w-40 mb-6 hidden md:block" />
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight [text-shadow:_0_2px_4px_rgb(0_0_0_/_10%)]">
                  Jaminan Keaslian di Ujung Jari Anda.
                </h1>
                <p className="text-lg text-slate-600 mt-4 [text-shadow:_0_1px_2px_rgb(255_255_255_/_50%)]">
                  Verifikasi produk benih unggul Advanta Anda sekarang untuk memastikan kualitas dan hasil panen terbaik.
                </p>
              </div>

              {/* Kolom Kanan: Form */}
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

                  {/* --- PERUBAHAN 4: Tampilan Blok Error Baru --- */}
                  {error && (
                    <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error.message}</p>
                      
                      {/* Tombol Lapor hanya muncul jika errornya sesuai dan laporan belum sukses */}
                      {error.isReportable && !reportSuccess && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={handleReport}
                                disabled={isReporting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                            >
                                <ShieldExclamationIcon className="h-4 w-4" />
                                {isReporting ? 'Mengirim...' : 'Laporkan Masalah Ini'}
                            </button>
                        </div>
                      )}

                      {/* Pesan Sukses setelah laporan terkirim */}
                      {reportSuccess && (
                        <p className="mt-2 text-sm font-semibold text-emerald-700">
                          Terima kasih! Laporan Anda telah kami terima.
                        </p>
                      )}
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