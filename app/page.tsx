'use client';

import { useState, useEffect } from 'react';
import { QrCodeIcon, ArrowLeftIcon, ArrowRightIcon, ShieldExclamationIcon, SparklesIcon, CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { searchProduct, ApiResponse } from './utils/api';
import ProductResult from './components/ProductResult';

export default function VerificationPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isReportable: boolean } | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError({ message: 'Silakan masukkan nomor seri produk.', isReportable: false });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setReportSuccess(false);
    try {
      const response = await searchProduct(serialNumber);
      setResult(response);
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memverifikasi produk. Periksa kembali nomor seri Anda.';
      const isNotFoundError = errorMessage.includes('Produk dengan nomor seri');
      setError({ message: errorMessage, isReportable: isNotFoundError });
      console.error('Error:', err);
    } finally {
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

  const handleReset = () => {
    setSerialNumber('');
    setResult(null);
    setError(null);
    setReportSuccess(false);
  };

  const handleQuickFill = (sampleSerial: string) => {
    setSerialNumber(sampleSerial);
    setError(null);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Enhanced Background with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-white/40 to-emerald-50/60 backdrop-blur-[2px]"></div>
        
        {/* Floating Elements for Premium Feel */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {result ? (
          /* Result Display */
          <div className="flex flex-col w-full flex-grow animate-fade-in">
            <header className="w-full p-4 sm:p-6 flex items-center justify-between backdrop-blur-lg bg-white/10 border-b border-white/20">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-8 sm:h-10 w-auto drop-shadow-lg" />
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl text-sm font-semibold text-gray-800 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center gap-2 border border-white/50 shadow-lg hover:scale-105"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Verifikasi Lagi
              </button>
            </header>
            <div className="flex-grow flex items-center justify-center">
              <ProductResult data={result.data} modelType={result.meta.model_type} />
            </div>
          </div>
        ) : (
          /* Enhanced Verification Form */
          <div className="w-full max-w-7xl mx-auto flex-grow flex items-center p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
              
              {/* Left Column - Enhanced Hero Section */}
              <div className={`text-slate-800 text-center md:text-left transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="mb-8 hidden md:flex items-center gap-3">
                  <img src="/advanta-logo.png" alt="Advanta Logo" className="w-44 drop-shadow-xl" />
                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100/80 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <SparklesIcon className="w-3 h-3" />
                    Terpercaya
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-emerald-800 via-slate-800 to-emerald-700 bg-clip-text text-transparent drop-shadow-sm">
                  Jaminan Keaslian di Ujung Jari Anda
                </h1>
                
                <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed [text-shadow:_0_1px_2px_rgb(255_255_255_/_50%)]">
                  Verifikasi produk benih unggul Advanta Anda dalam hitungan detik untuk memastikan kualitas dan hasil panen terbaik.
                </p>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <ShieldCheckIcon className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">100% Aman</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <CheckBadgeIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Tersertifikasi</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <SparklesIcon className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">Instan</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Premium Form */}
              <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/80 relative overflow-hidden">
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-emerald-400/10 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10">
                    {/* Mobile Logo */}
                    <div className="md:hidden mb-8 text-center">
                      <img src="/advanta-logo.png" alt="Advanta Logo" className="w-36 mx-auto mb-4 drop-shadow-lg" />
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 rounded-full text-xs font-semibold text-emerald-800">
                        <SparklesIcon className="w-3 h-3" />
                        Verifikasi Premium
                      </div>
                    </div>

                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-slate-900 mb-3">
                        Verifikasi Produk Anda
                      </h2>
                      <p className="text-slate-500 leading-relaxed">
                        Masukkan nomor seri yang tertera pada label produk untuk memulai verifikasi instant
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      
                      {/* Enhanced Input Field */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Nomor Seri Produk
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <QrCodeIcon className={`h-5 w-5 transition-colors duration-200 ${inputFocused ? 'text-emerald-500' : 'text-slate-400'}`} />
                          </div>
                          <input
                            type="text"
                            name="serial_number"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            className="block w-full rounded-2xl border-slate-200 py-4 pl-12 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-200 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
                            placeholder="Contoh: HDBa900001"
                            disabled={loading}
                          />
                        </div>
                        
                        {/* Quick Fill Examples */}
                        {/* <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500 mr-2">Contoh cepat:</span>
                          {['LCAa200806', 'HDBr917800', 'HDAa900001'].map((sample) => (
                            <button
                              key={sample}
                              type="button"
                              onClick={() => handleQuickFill(sample)}
                              className="text-xs px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors duration-200 hover:scale-105"
                            >
                              {sample}
                            </button>
                          ))}
                        </div> */}
                      </div>

                      {/* Enhanced Error Display */}
                      {error && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-2xl shadow-sm">
                          <div className="flex items-start gap-3">
                            <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="text-sm text-red-700 font-medium">{error.message}</p>
                              
                              {error.isReportable && !reportSuccess && (
                                <button
                                  type="button"
                                  onClick={handleReport}
                                  disabled={isReporting}
                                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105"
                                >
                                  <ShieldExclamationIcon className="h-4 w-4" />
                                  {isReporting ? 'Mengirim...' : 'Laporkan Masalah Ini'}
                                </button>
                              )}

                              {reportSuccess && (
                                <div className="mt-3 flex items-center gap-2 text-emerald-700">
                                  <CheckBadgeIcon className="w-4 h-4" />
                                  <span className="text-sm font-semibold">Terima kasih! Laporan Anda telah kami terima.</span>
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
                        className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 text-base font-bold text-white shadow-2xl shadow-emerald-500/30 hover:shadow-3xl hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden"
                      >
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex items-center gap-3">
                          {loading ? (
                            <>
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Memverifikasi...</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                              <span>Verifikasi Sekarang</span>
                              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </div>
                      </button>

                      {/* Trust Badge */}
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                        <span>Verifikasi aman dan terpercaya oleh PT Advanta Seeds Indonesia</span>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}