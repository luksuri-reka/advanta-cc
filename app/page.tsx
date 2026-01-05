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
import Image from 'next/image';
import ActionModal from './ActionModal';

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

  // ++ UBAH: Gunakan selectedProductId, bukan serialNumber ++
  const handleQuickSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedProductId) params.append('product_id', selectedProductId); // ++ UBAH
    if (quickName) params.append('name', quickName);
    if (quickEmail) params.append('email', quickEmail);
    if (quickPhone) params.append('phone', quickPhone);
    router.push(`/survey?${params.toString()}`);
  };

  // ++ UBAH: Gunakan selectedProductId, bukan serialNumber ++
  const handleQuickComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedProductId) params.append('product_id', selectedProductId); // ++ UBAH
    if (quickName) params.append('name', quickName);
    if (quickEmail) params.append('email', quickEmail);
    if (quickPhone) params.append('phone', quickPhone);
    router.push(`/complaint?${params.toString()}`);
  };

  const features = [
    // ... (Tidak berubah)
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
    // ... (Tidak berubah)
    { label: 'Produk Terverifikasi', value: '50K+', icon: CheckBadgeIcon },
    { label: 'Pengguna Aktif', value: '10K+', icon: UsersIcon },
    { label: 'Batch Produksi', value: '1K+', icon: BeakerIcon },
    { label: 'Tingkat Akurasi', value: '99.9%', icon: GlobeAltIcon }
  ];

  const handleReportFailure = async () => {
    setIsReporting(true);
      try {
        const response = await fetch('/api/report-failure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serialNumber,
            errorMessage: error?.message,
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
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      
      {/* ... (Background, Header, Hero, Stats Section tidak berubah) ... */}
      
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
              <div className="relative h-8 w-auto md:h-12">
                <Image 
                  src="/advanta-logo.png" 
                  alt="Advanta Seeds"
                  height={48} // Sesuaikan dengan h-12 (48px)
                  width={150} // Estimasi aspect ratio
                  className="object-contain h-full w-auto"
                  priority // Karena ini di header (LCP), kita load prioritas
                />
              </div>
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
        <ActionModal 
          selectedAction={selectedAction}
          closeModal={closeModal}
          handleVerify={handleVerify}
          handleQuickSurvey={handleQuickSurvey}
          handleQuickComplaint={handleQuickComplaint}
          productType={productType}
          setProductType={setProductType}
          serialNumber={serialNumber}
          setSerialNumber={setSerialNumber}
          inputFocused={inputFocused}
          setInputFocused={setInputFocused}
          loading={loading}
          error={error}
          reportSuccess={reportSuccess}
          isReporting={isReporting}
          handleReportFailure={handleReportFailure}
          quickName={quickName}
          setQuickName={setQuickName}
          quickEmail={quickEmail}
          setQuickEmail={setQuickEmail}
          quickPhone={quickPhone}
          setQuickPhone={setQuickPhone}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          allProducts={allProducts}
          productsLoading={productsLoading}
        />
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