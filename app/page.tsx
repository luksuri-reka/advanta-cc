// app/page.tsx - Versi Modifikasi dengan Dropdown Produk
'use client';

// ++ TAMBAHKAN import ini ++
import { createBrowserClient } from '@supabase/ssr';
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
  ShieldExclamationIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  CubeIcon, // ++ TAMBAHKAN
  ChevronDownIcon, // ++ TAMBAHKAN
} from '@heroicons/react/24/outline';
import { searchProduct, verifyProduct } from './utils/api';

type ProductType = 'hybrid' | 'sweetcorn';
type ActionType = 'verify' | 'survey' | 'complaint' | null;

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);

  // Form States
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isReportable: boolean } | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [productType, setProductType] = useState<ProductType>('hybrid');

  // Quick Form States
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ++ TAMBAHKAN State untuk Daftar Produk ++
  const [allProducts, setAllProducts] = useState<{ id: number; name: string }[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(''); // Untuk dropdown

  // ++ TAMBAHKAN Instance Supabase Client (memoized) ++
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    
    // ++ TAMBAHKAN: Fetch data produk saat komponen dimuat ++
    const fetchProducts = async () => {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (data) {
        setAllProducts(data);
      }
      if (error) {
        console.error("Gagal memuat produk:", error.message);
      }
      setProductsLoading(false);
    };
    
    fetchProducts();
    // ++ AKHIR TAMBAHAN ++
    
    return () => clearInterval(interval);
  }, [supabase]); // ++ UBAH: Tambahkan dependency

  const openActionModal = (action: ActionType) => {
    setSelectedAction(action);
    setShowActionModal(true);
    // Reset state lama
    setSerialNumber('');
    setError(null);
    setQuickName('');
    setQuickEmail('');
    setQuickPhone('');
    setPhoneError('');
    setSelectedProductId(''); // ++ TAMBAHKAN: Reset product ID
  };

  const closeModal = () => {
    setShowActionModal(false);
    setSelectedAction(null);
    setSerialNumber('');
    setError(null);
    setLoading(false);
    setReportSuccess(false);
    setIsReporting(false);
    setProductType('hybrid');
    setQuickName('');
    setQuickEmail('');
    setQuickPhone('');
    setPhoneError('');
    setSelectedProductId(''); // ++ TAMBAHKAN: Reset product ID
  };

  const handleVerify = async (e: React.FormEvent) => {
    // ... (Fungsi ini tidak berubah)
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
    
    try {
      const verificationType = productType === 'hybrid' ? 'serial' : 'lot';
      const response = productType === 'hybrid' 
        ? await searchProduct(serialNumber)
        : await verifyProduct(serialNumber, 'lot');
      
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

  // ++ FUNGSI VALIDASI BARU ++
  const validatePhoneNumber = (phone: string) => {
    // 1. Cek karakter yang tidak valid (hanya boleh angka dan +)
    if (!/^[0-9+]+$/.test(phone)) return "Hanya boleh berisi angka";

    // 2. Cek Awalan (0, 62, atau +62)
    const validPrefix = /^(\+62|62|0)/.test(phone);
    if (!validPrefix) return "Nomor harus diawali 0, 62, atau +62";

    // 3. Cek Jumlah Digit (ambil hanya angkanya)
    const digitCount = phone.replace(/\D/g, '').length;
    if (digitCount < 11) return "Nomor minimal 11 angka";

    return ""; // Valid
  };

  const handleQuickSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ++ VALIDASI PHONE ++
    const pError = validatePhoneNumber(quickPhone);
    if (pError) {
      setPhoneError(pError);
      return;
    }

    const params = new URLSearchParams();
    if (selectedProductId) params.append('product_id', selectedProductId);
    if (quickName) params.append('name', quickName);
    if (quickEmail) params.append('email', quickEmail);
    if (quickPhone) params.append('phone', quickPhone);
    router.push(`/survey?${params.toString()}`);
  };

  // ++ UBAH: Gunakan selectedProductId, bukan serialNumber ++
  const handleQuickComplaint = (e: React.FormEvent) => {
    e.preventDefault();

    // ++ VALIDASI PHONE ++
    const pError = validatePhoneNumber(quickPhone);
    if (pError) {
      setPhoneError(pError);
      return;
    }

    const params = new URLSearchParams();
    if (selectedProductId) params.append('product_id', selectedProductId);
    if (quickName) params.append('name', quickName);
    if (quickEmail) params.append('email', quickEmail);
    if (quickPhone) params.append('phone', quickPhone);
    router.push(`/complaint?${params.toString()}`);
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
    <main className="relative min-h-screen w-full overflow-hidden">
      
      {/* ... (Background, Header, Hero, Stats Section) ... */}
      
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-200/10 to-blue-200/10 dark:from-emerald-800/5 dark:to-blue-800/5 rounded-full blur-3xl"></div>
      </div>

      <nav className={`relative z-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src="/advanta-logo.png" 
                alt="Advanta Seeds" 
                className="h-8 md:h-12"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Advanta Seeds Indonesia
                </h1>
                <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  Sistem Verifikasi Benih Terpercaya
                </p>
              </div>
            </div>

            <Link href="/admin/login">
              <button className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-bold rounded-lg md:rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 group">
                <LockClosedIcon className="h-4 md:h-5 w-4 md:w-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline">Admin Login</span>
                <span className="md:hidden">Login</span>
                <ArrowRightIcon className="hidden md:inline h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/admin/login">
              <button className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:bg-emerald-700 transition-all">
                <LockClosedIcon className="h-4 w-4" />
                <span>Login</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-emerald-100 dark:border-emerald-900 mb-4 sm:mb-6">
              <SparklesIcon className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">Teknologi Verifikasi Terdepan</span>
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-blue-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-blue-400 bg-clip-text text-transparent">
                Verifikasi Benih
              </span>
              <br />
              <span className="text-slate-800 dark:text-slate-100">
                Mudah & Cepat
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed max-w-xl">
              Pastikan keaslian benih bersertifikat Advanta Seeds Indonesia dengan sistem verifikasi QR Code yang aman, cepat, dan terpercaya.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
              
              <button 
                onClick={() => openActionModal('verify')}
                className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                  <QrCodeIcon className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Verifikasi Produk</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Cek keaslian produk</p>
                </div>
              </button>

              <button 
                onClick={() => openActionModal('survey')}
                className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <FaceSmileIcon className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Survei Pelanggan</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Beri rating produk</p>
                </div>
              </button>

              <button 
                onClick={() => openActionModal('complaint')}
                className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Layanan Pelanggan</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Feedback dari pelanggan</p>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckBadgeIcon className="h-4 sm:h-6 w-4 sm:w-6 text-emerald-600" />
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Bersertifikat Resmi</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <LockClosedIcon className="h-4 sm:h-6 w-4 sm:w-6 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Aman & Terpercaya</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ClockIcon className="h-4 sm:h-6 w-4 sm:w-6 text-purple-600" />
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Verifikasi Instant</span>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative">
              
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8">
                
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-tr from-purple-400/20 to-emerald-400/20 dark:from-purple-500/10 dark:to-emerald-500/10 rounded-full blur-2xl"></div>

                <div className="relative z-10 min-h-[280px] sm:min-h-[320px] flex flex-col justify-between">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        activeFeature === index 
                          ? 'opacity-100 scale-100 translate-y-0' 
                          : 'opacity-0 scale-95 translate-y-4 absolute inset-0'
                      }`}
                    >
                      <div className="mb-4 sm:mb-6">
                        <div className="inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg mb-3 sm:mb-4">
                          <feature.icon className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4">
                        {feature.title}
                      </h3>
                      
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 sm:mb-8">
                        {feature.description}
                      </p>
                      
                      <div className="flex gap-2">
                        {features.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveFeature(idx)}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              activeFeature === idx 
                                ? 'w-8 sm:w-12 bg-emerald-600' 
                                : 'w-1.5 sm:w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl animate-bounce-slow">
                <DevicePhoneMobileIcon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
              </div>
              
              <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <QrCodeIcon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 mb-2 sm:mb-3">
                  <stat.icon className="h-4 sm:h-6 w-4 sm:w-6 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ACTION MODAL */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 animate-scale-in max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            
            <button
              onClick={closeModal}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-20"
            >
              <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6 text-gray-500 dark:text-slate-400" />
            </button>

            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex p-4 rounded-2xl mb-4" style={{
                background: selectedAction === 'verify' ? 'linear-gradient(135deg, #10b981, #059669)' :
                           selectedAction === 'survey' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                           'linear-gradient(135deg, #f97316, #ea580c)'
              }}>
                {selectedAction === 'verify' && <QrCodeIcon className="h-10 w-10 text-white" />}
                {selectedAction === 'survey' && <FaceSmileIcon className="h-10 w-10 text-white" />}
                {selectedAction === 'complaint' && <ExclamationTriangleIcon className="h-10 w-10 text-white" />}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {selectedAction === 'verify' && 'Verifikasi Produk'}
                {selectedAction === 'survey' && 'Berikan Rating Anda'}
                {selectedAction === 'complaint' && 'Laporkan Masalah'}
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                {selectedAction === 'verify' && 'Masukkan nomor seri/lot untuk verifikasi'}
                {selectedAction === 'survey' && 'Bantu kami tingkatkan kualitas produk'}
                {selectedAction === 'complaint' && 'Sampaikan keluhan Anda kepada kami'}
              </p>
            </div>

            {/* Form Content */}
            <form onSubmit={
              selectedAction === 'verify' ? handleVerify :
              selectedAction === 'survey' ? handleQuickSurvey :
              handleQuickComplaint
            } className="space-y-5 sm:space-y-6">
              
              {/* ++ UBAH: Product Type Toggle - HANYA TAMPIL di 'verify' ++ */}
              {selectedAction === 'verify' && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Kategori Produk
                  </label>
                  <div className="relative bg-slate-100 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setProductType('hybrid')}
                      className={`flex-1 px-2 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                        productType === 'hybrid'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">🌽</span>
                        <span className="text-[11px] sm:text-sm">Jagung Hibrida</span>
                        <span className="text-[9px] sm:text-xs opacity-75">Nomor Seri</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('sweetcorn')}
                      className={`flex-1 px-2 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                        productType === 'sweetcorn'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">🍅</span>
                        <span className="text-[11px] sm:text-sm">Sweetcorn & Sayuran</span>
                        <span className="text-[9px] sm:text-xs opacity-75">Nomor Lot</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ++ UBAH: Serial/Lot Input - HANYA TAMPIL di 'verify' ++ */}
              {selectedAction === 'verify' && (
                <div className="relative group">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                    {productType === 'hybrid' ? 'Nomor Seri Label' : 'Nomor Lot Produksi'}
                    {selectedAction === 'verify' && <span className="text-red-500 ml-1">*</span>}
                    {selectedAction !== 'verify' && <span className="text-slate-400 text-xs ml-1">(Opsional)</span>}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                      <QrCodeIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${ // ...
                        inputFocused 
                          ? (productType === 'hybrid' ? 'text-emerald-500' : 'text-amber-500') + ' scale-110' 
                          : 'text-slate-400'
                      }`} />
                    </div>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      className={`block w-full rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-600 py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 ring-1 ring-inset transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-lg hover:shadow-xl focus:shadow-xl focus:scale-[1.02] ${
                        inputFocused 
                          ? productType === 'hybrid'
                            ? 'ring-2 ring-emerald-500 border-emerald-500'
                            : 'ring-2 ring-amber-500 border-amber-500'
                          : 'ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600'
                      }`}
                      placeholder={productType === 'hybrid' ? "Contoh: HDBa900001" : "Contoh: LOT123456"}
                      disabled={loading}
                      required={selectedAction === 'verify'}
                    />
                  </div>
                  <p className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    {productType === 'hybrid' 
                      ? 'Nomor seri tertera pada label benih jagung hibrida'
                      : 'Nomor lot tertera pada kemasan sweetcorn dan sayuran'
                    }
                  </p>
                </div>
              )}

              {/* Premium Product Dropdown - Survey & Complaint */}
              {(selectedAction === 'survey' || selectedAction === 'complaint') && (
                <div className="relative group">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                    <CubeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Pilih Produk
                    <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="relative">
                    {/* Icon Container with Animation */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 z-10">
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                        selectedProductId 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' 
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <CubeIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${
                          selectedProductId 
                            ? 'text-emerald-600 dark:text-emerald-400 scale-110' 
                            : 'text-slate-400'
                        }`} />
                      </div>
                    </div>

                    {/* Custom Select with Premium Styling */}
                    <div className="relative">
                      <select
                        name="product_id"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        required
                        disabled={productsLoading}
                        className={`block w-full rounded-xl sm:rounded-2xl border-2 py-3.5 sm:py-4 pl-14 sm:pl-16 pr-12 text-sm sm:text-base font-medium transition-all duration-300 appearance-none cursor-pointer ${
                          selectedProductId
                            ? 'text-slate-900 dark:text-slate-100 bg-gradient-to-r from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-500 dark:border-emerald-600 ring-4 ring-emerald-500/10 shadow-xl shadow-emerald-500/20'
                            : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 shadow-lg hover:shadow-xl'
                        } focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="" className="text-slate-400">
                          {productsLoading ? '⏳ Memuat produk...' : '🌱 Pilih produk Anda'}
                        </option>
                        {allProducts.map((product, idx) => (
                          <option 
                            key={product.id} 
                            value={product.id.toString()}
                            className="text-slate-900 dark:text-slate-100 py-2"
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>

                      {/* Animated Chevron */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                          selectedProductId 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' 
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <ChevronDownIcon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-300 ${
                            selectedProductId 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-400'
                          }`} />
                        </div>
                      </div>

                      {/* Loading Spinner Overlay */}
                      {productsLoading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Memuat...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Floating Badge - Product Count */}
                    {allProducts.length > 0 && !productsLoading && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-lg">
                          <span className="text-[10px] font-bold text-white">{allProducts.length}</span>
                          <span className="text-[10px] font-medium text-white/90">produk</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Text with Animation */}
                  <div className={`mt-2 sm:mt-3 transition-all duration-300 ${
                    selectedProductId ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'
                  }`}>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <SparklesIcon className={`w-3 h-3 transition-all duration-300 ${
                        selectedProductId ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
                      }`} />
                      <span>
                        {selectedProductId 
                          ? `Produk dipilih - ${allProducts.find(p => p.id.toString() === selectedProductId)?.name || ''}`
                          : 'Pilih produk yang ingin Anda beri survey atau komplain'
                        }
                      </span>
                    </p>
                  </div>
                </div>
              )}


              {/* Quick Form untuk Survey & Complaint */}
              {(selectedAction === 'survey' || selectedAction === 'complaint') && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Informasi Kontak {selectedAction === 'survey' ? '' : '(Untuk follow-up)'}
                  </p>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={quickEmail}
                        onChange={(e) => setQuickEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon className={`h-4 w-4 ${phoneError ? 'text-red-500' : 'text-slate-400'}`} />
                      </div>
                      <input
                        type="tel"
                        value={quickPhone}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Hanya izinkan angka dan + di awal
                          if (/^[0-9+]*$/.test(val)) {
                            setQuickPhone(val);
                            if (phoneError) setPhoneError(''); // Hapus error saat mengetik
                          }
                        }}
                        required
                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                          phoneError 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-slate-200 dark:border-slate-600 focus:ring-emerald-500 dark:focus:ring-emerald-400'
                        }`}
                        placeholder="Contoh: 081234567890"
                      />
                    </div>
                    {/* Pesan Error */}
                    {phoneError && (
                      <p className="mt-1 text-[10px] text-red-500 font-medium flex items-center gap-1 animate-pulse">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {phoneError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display -- Hanya tampil di 'verify' */}
              {error && selectedAction === 'verify' && (
                <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/10 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl shadow-sm animate-slide-in-bottom">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <ShieldExclamationIcon className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-semibold">{error.message}</p>
                      
                      {error.isReportable && !reportSuccess && (
                        <button
                          type="button"
                          onClick={async () => {
                            setIsReporting(true);
                            try {
                              const response = await fetch('/api/report-failure', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  serialNumber,
                                  errorMessage: error.message,
                                  productType,
                                  verificationType: productType === 'hybrid' ? 'serial' : 'lot'
                                }),
                              });
                              if (response.ok) {
                                setReportSuccess(true);
                              }
                            } catch (err) {
                              console.error('Report Error:', err);
                            } finally {
                              setIsReporting(false);
                            }
                          }}
                          disabled={isReporting}
                          className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                        >
                          <ShieldExclamationIcon className="h-3 sm:h-4 w-3 sm:w-4" />
                          {isReporting ? 'Mengirim...' : 'Laporkan Masalah Ini'}
                        </button>
                      )}

                      {reportSuccess && (
                        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-emerald-700 dark:text-emerald-400">
                          <CheckBadgeIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="text-[10px] sm:text-sm font-bold">Terima kasih! Laporan Anda telah kami terima.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                // ++ UBAH: Sesuaikan logic disabled ++
                disabled={loading || (selectedAction === 'verify' && !serialNumber.trim())}
                className={`group relative flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-bold text-white shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden transform ${
                  selectedAction === 'verify'
                    ? productType === 'hybrid'
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/35'
                      : 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/35'
                    : selectedAction === 'survey'
                      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/35'
                      : 'bg-gradient-to-r from-orange-600 via-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/35'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      {selectedAction === 'verify' && <QrCodeIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                      {selectedAction === 'survey' && <StarIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                      {selectedAction === 'complaint' && <ChatBubbleLeftRightIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
                      <span>
                        {selectedAction === 'verify' && 'Verifikasi Sekarang'}
                        {selectedAction === 'survey' && 'Lanjut ke Survey'}
                        {selectedAction === 'complaint' && 'Lanjut ke Form Komplain'}
                      </span>
                      <ArrowRightIcon className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              {/* Info Text */}
              <div className="text-center pt-2">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheckIcon className="w-3 h-3" />
                  <span>
                    {selectedAction === 'verify' && 'Data Anda aman dan terenkripsi'}
                    {selectedAction === 'survey' && 'Feedback Anda membantu kami lebih baik'}
                    {selectedAction === 'complaint' && 'Tim kami akan merespon dalam 24 jam'}
                  </span>
                </p>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-700 mt-12 sm:mt-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium mb-1">
                © 2025 Advanta Seeds Indonesia
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sistem Verifikasi Benih Bersertifikat Terpercaya
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheckIcon className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Secure</span>
              <span>•</span>
              <span>Reliable</span>
              <span>•</span>
              <span>Trusted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
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

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        @keyframes slide-in-bottom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}