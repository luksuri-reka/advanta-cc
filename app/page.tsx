// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheckIcon,
  QrCodeIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  LockClosedIcon,
  ChartBarIcon,
  UsersIcon,
  BeakerIcon,
  GlobeAltIcon,
  XMarkIcon,
  ShieldExclamationIcon, // Ditambahkan dari form verifikasi
} from '@heroicons/react/24/outline';
import { searchProduct, verifyProduct } from './utils/api'; // Ditambahkan dari form verifikasi

// Type ini dibutuhkan oleh form verifikasi
type ProductType = 'hybrid' | 'sweetcorn';

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // --- State dari Form Verifikasi (Menggantikan state modal lama) ---
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isReportable: boolean } | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [productType, setProductType] = useState<ProductType>('hybrid');
  // -----------------------------------------------------------------

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // --- Fungsi dari Form Verifikasi (Menggantikan handleVerifyQR) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError({ 
        message: productType === 'hybrid' 
          ? 'Silakan masukkan nomor seri produk.' 
          : 'Silakan masukkan nomor lot produk.', 
        isReportable: false 
      });
      return;
    }
    setLoading(true);
    setError(null);
    setReportSuccess(false);
    
    try {
      // Gunakan fungsi API yang sesuai berdasarkan tipe produk
      const verificationType = productType === 'hybrid' ? 'serial' : 'lot';
      const response = productType === 'hybrid' 
        ? await searchProduct(serialNumber)
        : await verifyProduct(serialNumber, 'lot');
      
      // Navigasi ke halaman hasil dengan parameter yang benar
      const params = new URLSearchParams({
        type: verificationType,
        code: serialNumber.trim()
      });
      
      router.push(`/verify/result?${params.toString()}`);
      
    } catch (err: any) {
      const errorMessage = err.message || `Gagal memverifikasi produk. Periksa kembali ${productType === 'hybrid' ? 'nomor seri' : 'nomor lot'} Anda.`;
      const isNotFoundError = errorMessage.includes('tidak ditemukan');
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
                productType: productType,
                verificationType: productType === 'hybrid' ? 'serial' : 'lot'
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
  // ---------------------------------------------------------------

  // Fungsi baru untuk menutup modal dan me-reset state form
  const closeModal = () => {
    setShowVerifyModal(false);
    setSerialNumber('');
    setError(null);
    setLoading(false);
    setReportSuccess(false);
    setIsReporting(false);
    setProductType('hybrid'); // Reset ke default
  };

  const features = [
    {
      icon: QrCodeIcon,
      title: 'Scan & Verifikasi',
      description: 'Scan QR Code untuk memverifikasi keaslian benih dalam hitungan detik'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Terjamin Sertifikat',
      description: 'Setiap produk dilengkapi dengan sertifikasi resmi dan terverifikasi'
    },
    {
      icon: ChartBarIcon,
      title: 'Tracking Produksi',
      description: 'Pantau seluruh proses produksi dari awal hingga distribusi'
    }
  ];

  const stats = [
    { label: 'Produk Terverifikasi', value: '50K+', icon: CheckBadgeIcon },
    { label: 'Pengguna Aktif', value: '10K+', icon: UsersIcon },
    { label: 'Batch Produksi', value: '1K+', icon: BeakerIcon },
    { label: 'Tingkat Akurasi', value: '99.9%', icon: GlobeAltIcon }
  ];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-200/10 to-blue-200/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header/Navbar */}
      <nav className={`relative z-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-white rounded-2xl p-3 shadow-lg">
                  <img src="/advanta-logo.png" alt="Advanta Seeds" className="h-10 w-auto" />
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
                  Advanta Seeds Indonesia
                </h1>
                <p className="text-xs text-slate-600">Sistem Verifikasi Benih Terpercaya</p>
              </div>
            </div>

            {/* Login Button - Desktop */}
            <Link href="/admin/login">
              <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 group">
                <LockClosedIcon className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                <span>Admin Login</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            {/* Login Button - Mobile */}
            <Link href="/admin/login">
              <button className="md:hidden flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:bg-emerald-700 transition-all">
                <LockClosedIcon className="h-5 w-5" />
                <span>Login</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-emerald-100 mb-6">
              <SparklesIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Teknologi Verifikasi Terdepan</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Verifikasi Benih
              </span>
              <br />
              <span className="text-slate-800">
                Mudah & Cepat
              </span>
            </h2>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Pastikan keaslian benih bersertifikat Advanta Seeds Indonesia dengan sistem verifikasi QR Code yang aman, cepat, dan terpercaya.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              
              {/* Primary CTA - Admin Login */}
              <Link href="/admin/login" className="group">
                <button className="relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 transition-all duration-300 overflow-hidden">
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <ShieldCheckIcon className="relative h-6 w-6 group-hover:rotate-12 transition-transform" />
                  <span className="relative">Masuk Admin Console</span>
                  <ArrowRightIcon className="relative h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              {/* Secondary CTA - Scan QR */}
              <button 
                onClick={() => setShowVerifyModal(true)} // Ini memicu modal
                className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-white text-emerald-700 font-bold rounded-2xl shadow-xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <QrCodeIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span>Verifikasi QR Code</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Bersertifikat Resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <LockClosedIcon className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Aman & Terpercaya</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-semibold text-slate-700">Verifikasi Instant</span>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative">
              
              {/* Main Card with Rotating Features */}
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-8 backdrop-blur-xl">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-emerald-400/20 rounded-full blur-2xl"></div>

                {/* Feature Display */}
                <div className="relative z-10 min-h-[320px] flex flex-col justify-between">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        activeFeature === index 
                          ? 'opacity-100 scale-100 translate-y-0' 
                          : 'opacity-0 scale-95 translate-y-4 absolute inset-0'
                      }`}
                    >
                      <div className="mb-6">
                        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg mb-4">
                          <feature.icon className="h-12 w-12" />
                        </div>
                      </div>
                      
                      <h3 className="text-3xl font-bold text-slate-800 mb-4">
                        {feature.title}
                      </h3>
                      
                      <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        {feature.description}
                      </p>
                      
                      {/* Feature Indicators */}
                      <div className="flex gap-2">
                        {features.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveFeature(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              activeFeature === idx 
                                ? 'w-12 bg-emerald-600' 
                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-2xl animate-bounce-slow">
                <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-2xl animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <QrCodeIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`relative z-10 max-w-7xl mx-auto px-6 py-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-blue-100 mb-3">
                  <stat.icon className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className={`relative z-10 max-w-4xl mx-auto px-6 py-16 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-600 rounded-3xl p-12 shadow-2xl text-center relative overflow-hidden">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
              <ShieldCheckIcon className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white">Sistem Administrator</span>
            </div>

            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Kelola Sistem Verifikasi Anda
            </h3>
            
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Akses dashboard admin untuk mengelola produk, produksi, dan verifikasi benih secara real-time
            </p>

            <Link href="/admin/login">
              <button className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-700 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
                <LockClosedIcon className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                <span>Masuk ke Admin Console</span>
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- MODAL VERIFIKASI (Telah Diperbarui) --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          {/* Ukuran diubah ke max-w-xl agar form muat 
          */}
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 lg:p-12 animate-scale-in">
            
            {/* Close Button (Gunakan fungsi closeModal baru) */}
            <button
              onClick={closeModal} // Diubah ke closeModal
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-20"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>

            {/* Isi modal (header dan form) sekarang diambil dari 
              file 'VerificationPage.tsx' untuk konsistensi fungsionalitas.
            */}

            {/* Form Header dari VerificationPage.tsx */}
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                Verifikasi Produk Anda
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                Pilih kategori produk dan masukkan nomor seri untuk verifikasi
              </p>
            </div>

            {/* Form dari VerificationPage.tsx */}
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              {/* Product Type Toggle Switch */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Kategori Produk
                </label>
                <div className="relative bg-slate-100 rounded-2xl p-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setProductType('hybrid')}
                    className={`flex-1 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                      productType === 'hybrid'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {productType === 'hybrid' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                    <div className="relative flex flex-col items-center gap-2">
                      <span className="text-2xl">🌽</span>
                      <div className="text-center">
                        <div className="font-bold">Jagung Hibrida</div>
                        <div className={`text-xs mt-0.5 ${productType === 'hybrid' ? 'text-white/90' : 'text-slate-500'}`}>
                          Nomor Seri
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('sweetcorn')}
                    className={`flex-1 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                      productType === 'sweetcorn'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {productType === 'sweetcorn' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                    <div className="relative flex flex-col items-center gap-2">
                      <span className="text-2xl">🥕</span>
                      <div className="text-center">
                        <div className="font-bold">Sweetcorn & Sayuran</div>
                        <div className={`text-xs mt-0.5 ${productType === 'sweetcorn' ? 'text-white/90' : 'text-slate-500'}`}>
                          Nomor Lot
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Field */}
              <div className="relative group">
                <label className="block text-sm font-bold text-slate-800 mb-3">
                  {productType === 'hybrid' ? 'Nomor Seri Label' : 'Nomor Lot Produksi'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <QrCodeIcon className={`h-5 w-5 transition-all duration-300 ${
                      inputFocused 
                        ? (productType === 'hybrid' ? 'text-emerald-500' : 'text-amber-500') + ' scale-110' 
                        : 'text-slate-400'
                    }`} />
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
                        ? productType === 'hybrid'
                          ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-500/20'
                          : 'ring-2 ring-amber-500 border-amber-500 shadow-amber-500/20'
                        : 'ring-slate-200 hover:ring-slate-300 hover:border-slate-300'
                    }`}
                    placeholder={productType === 'hybrid' ? "Contoh: HDBa900001" : "Contoh: LOT123456"}
                    disabled={loading}
                    autoFocus // Ditambahkan agar fokus saat modal terbuka
                  />
                </div>
                <p className="mt-2 text-xs font-medium flex items-center gap-1" style={{
                  color: productType === 'hybrid' ? 'rgb(5 150 105)' : 'rgb(217 119 6)'
                }}>
                  <SparklesIcon className="w-3 h-3" />
                  {productType === 'hybrid' 
                    ? 'Nomor seri tertera pada label benih jagung hibrida'
                    : 'Nomor lot tertera pada kemasan sweetcorn dan sayuran'
                  }
                </p>
              </div>

              {/* Error Display */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-base font-bold text-white shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden transform ${
                  productType === 'hybrid'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400'
                    : 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/35 hover:from-amber-500 hover:via-orange-400 hover:to-orange-500'
                }`}
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

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4">
                <div className="p-1 bg-emerald-100 rounded-full">
                  <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="font-medium">Verifikasi aman dan terpercaya oleh PT Advanta Seeds Indonesia</span>
              </div>
            </form>

          </div>
        </div>
      )}
      {/* --- AKHIR MODAL VERIFIKASI --- */}


      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-600 font-medium mb-1">
                © 2025 Advanta Seeds Indonesia
              </p>
              <p className="text-sm text-slate-500">
                Sistem Verifikasi Benih Bersertifikat Terpercaya
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
              <span>Secure</span>
              <span>•</span>
              <span>Reliable</span>
              <span>•</span>
              <span>Trusted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        
        /* CSS untuk animasi gradient shift dari form verifikasi */
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        /* CSS untuk animasi shimmer dari form verifikasi */
        @keyframes shimmer {
          0% { 
            transform: translateX(-100%); 
          }
          100% { 
            transform: translateX(100%); 
          }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}