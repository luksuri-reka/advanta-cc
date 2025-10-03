'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCodeIcon, ArrowRightIcon, ShieldExclamationIcon, SparklesIcon, CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { searchProduct } from './utils/api';

export default function VerificationPage() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isReportable: boolean } | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 150);
    const timer2 = setTimeout(() => setIsFormReady(true), 400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError({ message: 'Silakan masukkan nomor seri produk.', isReportable: false });
      return;
    }
    setLoading(true);
    setError(null);
    setReportSuccess(false);
    
    try {
      const response = await searchProduct(serialNumber);
      
      // Redirect ke halaman result dengan parameter serial dan product
      const productName = response.data.product_name || 'Unknown Product';
      router.push(`/verify/result?serial=${encodeURIComponent(serialNumber)}&product=${encodeURIComponent(productName)}`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memverifikasi produk. Periksa kembali nomor seri Anda.';
      const isNotFoundError = errorMessage.includes('Produk dengan nomor seri');
      setError({ message: errorMessage, isReportable: isNotFoundError });
      console.error('Error:', err);
      setLoading(false);
    }
  };

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

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Optimized Background with CSS-only effects */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center bg-fixed"
          style={{ 
            backgroundImage: "url('/background-field.jpg')",
            filter: 'brightness(1.05) contrast(1.02)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/15 via-white/65 to-emerald-50/85" />
        
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/8 rounded-full blur-2xl opacity-60" 
             style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/6 rounded-full blur-3xl opacity-50" 
             style={{ animation: 'pulse 6s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="w-full max-w-7xl mx-auto flex-grow flex items-center p-4 md:p-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
            
            {/* Left Column - Enhanced Hero */}
            <div className={`text-slate-800 text-center md:text-left transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="mb-8 hidden md:flex items-center gap-4">
                <img src="/advanta-logo.png" alt="Advanta Logo" className="w-44 drop-shadow-xl" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-100/90 to-emerald-50 backdrop-blur-sm rounded-full text-xs font-bold text-emerald-800 border border-emerald-200/70 shadow-sm">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Terpercaya
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black leading-tight mb-6">
                <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm">
                  Jaminan Keaslian
                </span>
                <br />
                <span className="text-slate-900 text-shadow">
                  di Ujung Jari Anda
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed font-medium [text-shadow:_0_1px_2px_rgb(255_255_255_/_70%)]">
                Verifikasi produk benih unggul Advanta Anda dalam hitungan detik untuk memastikan kualitas dan hasil panen terbaik.
              </p>

              {/* Enhanced Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="group flex flex-col items-center p-4 bg-white/85 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">100% Aman</span>
                </div>
                <div className="group flex flex-col items-center p-4 bg-white/85 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <CheckBadgeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Tersertifikasi</span>
                </div>
                <div className="group flex flex-col items-center p-4 bg-white/85 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Instan</span>
                </div>
              </div>
            </div>

            {/* Right Column - Premium Form Card */}
            <div className={`transition-all duration-700 ease-out delay-300 ${isFormReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="relative bg-white/96 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 p-8 lg:p-12 border border-white/90 overflow-hidden">
                
                {/* Premium decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/8 to-blue-400/6 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/6 to-emerald-400/8 rounded-full blur-xl" />
                
                <div className="relative z-10">
                  {/* Mobile Logo */}
                  <div className="md:hidden mb-8 text-center">
                    <img src="/advanta-logo.png" alt="Advanta Logo" className="w-36 mx-auto mb-4 drop-shadow-lg" />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-full text-xs font-bold text-emerald-800 border border-emerald-200/70">
                      <SparklesIcon className="w-3.5 h-3.5" />
                      Verifikasi Premium
                    </div>
                  </div>

                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                      Verifikasi Produk Anda
                    </h2>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Masukkan nomor seri yang tertera pada label produk untuk memulai verifikasi instant
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Enhanced Input Field */}
                    <div className="relative group">
                      <label className="block text-sm font-bold text-slate-800 mb-3">
                        Nomor Seri Label
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <QrCodeIcon className={`h-5 w-5 transition-all duration-300 ${inputFocused ? 'text-emerald-500 scale-110' : 'text-slate-400'}`} />
                        </div>
                        <input
                          type="text"
                          name="serial_number"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          className={`block w-full rounded-2xl border-slate-200 py-4 pl-12 pr-4 text-slate-900 ring-1 ring-inset transition-all duration-300 placeholder:text-slate-400 bg-white shadow-lg hover:shadow-xl focus:shadow-xl focus:scale-[1.02] ${
                            inputFocused 
                              ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-500/20' 
                              : 'ring-slate-200 hover:ring-slate-300 hover:border-slate-300'
                          }`}
                          placeholder="Contoh: HDBa900001"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Enhanced Error Display */}
                    {error && (
                      <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50/80 border border-red-200/80 rounded-2xl shadow-sm animate-slide-in-bottom">
                        <div className="flex items-start gap-3">
                          <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-grow">
                            <p className="text-sm text-red-700 font-semibold">{error.message}</p>
                            
                            {error.isReportable && !reportSuccess && (
                              <button
                                type="button"
                                onClick={handleReport}
                                disabled={isReporting}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                              >
                                <ShieldExclamationIcon className="h-4 w-4" />
                                {isReporting ? 'Mengirim...' : 'Laporkan Masalah Ini'}
                              </button>
                            )}

                            {reportSuccess && (
                              <div className="mt-3 flex items-center gap-2 text-emerald-700">
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span className="text-sm font-bold">Terima kasih! Laporan Anda telah kami terima.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Premium Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 text-base font-bold text-white shadow-2xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/35 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden transform"
                      style={{ 
                        backgroundSize: loading ? '200% 200%' : '100% 100%',
                        animation: loading ? 'gradientShift 2s ease infinite' : 'none'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                      
                      <div className="relative z-10 flex items-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Memverifikasi...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="h-5 w-5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                            <span>Verifikasi Sekarang</span>
                            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300" />
                          </>
                        )}
                      </div>
                    </button>

                    {/* Enhanced Trust Badge */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4">
                      <div className="p-1 bg-emerald-100 rounded-full">
                        <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="font-medium">Verifikasi aman dan terpercaya oleh PT Advanta Seeds Indonesia</span>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}