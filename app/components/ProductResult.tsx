// app/components/ProductResult.tsx - Enhanced with dual verification support
'use client';

import { useState, useEffect } from 'react';
import { ProductData } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { 
  ArrowRightIcon, 
  CheckBadgeIcon, 
  ShieldCheckIcon,
  DocumentCheckIcon,
  BeakerIcon,
  CalendarDaysIcon,
  QrCodeIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  StarIcon,
  ExclamationTriangleIcon,
  FaceSmileIcon
} from '@heroicons/react/24/solid';
import { 
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductResultProps {
  data: ProductData;
  modelType: 'bag' | 'production' | 'lot';
  verificationType: 'serial' | 'lot';
}

export default function ProductResult({ data, modelType, verificationType }: ProductResultProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const tabConfig = [
    {
      id: 'details',
      label: 'Detail Produk',
      icon: InformationCircleIcon,
      color: 'emerald'
    },
    {
      id: 'params',
      label: 'Parameter Uji',
      icon: BeakerIcon,
      color: 'blue'
    },
    {
      id: 'cert',
      label: 'Sertifikasi',
      icon: DocumentCheckIcon,
      color: 'purple'
    }
  ];

  // Determine identifier based on verification type
  const identifier = verificationType === 'serial' 
    ? data.serial_number || data.search_key 
    : data.lot_number || data.search_key;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="grid gap-3 md:gap-4">
            {[
              { 
                label: verificationType === 'serial' ? 'No. Seri Lengkap' : 'No. Lot Produksi', 
                value: identifier, 
                highlight: true 
              },
              { label: 'Jenis Tanaman', value: data.jenis_tanaman },
              { label: 'Kelas Benih', value: data.kelas_benih },
              { label: 'Kode Produksi', value: data.production_code },
              { 
                label: 'Bahan Aktif', 
                value: Array.isArray(data.bahan_bahan_aktif) && data.bahan_bahan_aktif.length > 0 
                  ? data.bahan_bahan_aktif.join(', ') 
                  : 'Tidak ada'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 p-3 md:p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  item.highlight ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-700/30 border border-gray-100 dark:border-slate-600'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base flex-shrink-0">
                  {item.label}
                </span>
                <span className={`font-semibold text-sm md:text-base break-words ${
                  item.highlight ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        );

      case 'params':
        return (
          <div className="grid gap-3 md:gap-4">
            {[
              { label: 'Benih Murni (Min)', value: `${data.benih_murni}%`, status: 'good' },
              { label: 'Daya Berkecambah (Min)', value: `${data.daya_berkecambah}%`, status: 'good' },
              { label: 'Kadar Air (Maks)', value: `${data.kadar_air}%`, status: 'neutral' },
              { label: 'Kotoran Benih (Maks)', value: `${data.kotoran_benih}%`, status: 'neutral' },
              { label: 'Campuran Varietas Lain (Maks)', value: `${data.campuran_varietas_lain}%`, status: 'neutral' },
              { label: 'Benih Tanaman Lain (Maks)', value: `${data.benih_tanaman_lain}%`, status: 'neutral' }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 md:p-4 bg-white dark:bg-slate-700/30 rounded-xl border border-gray-100 dark:border-slate-600 hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.status === 'good' ? 'bg-emerald-500' : 
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base md:text-lg ml-6 sm:ml-0">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        );

      case 'cert':
        return (
          <div className="grid gap-3 md:gap-4">
            {[
              { label: 'No. Sertifikasi', value: data.cert_number, icon: ClipboardDocumentCheckIcon },
              { label: 'No. Kelompok', value: data.group_number, icon: QrCodeIcon },
              { label: 'Tanggal Panen', value: formatDate(data.tanggal_panen), icon: CalendarDaysIcon },
              { label: 'Tanggal Selesai Uji', value: formatDate(data.tested_date), icon: BeakerIcon },
              { 
                label: 'Tanggal Kadaluarsa', 
                value: formatDate(data.expired_date), 
                icon: CalendarDaysIcon,
                highlight: true,
                isExpiry: true
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 md:p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  item.isExpiry 
                    ? 'bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800 hover:from-red-100 hover:to-red-100/50 dark:hover:from-red-900/30 dark:hover:to-red-900/20' 
                    : item.highlight 
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-700/30 border-gray-100 dark:border-slate-600'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
                    item.isExpiry ? 'text-red-500' : 
                    item.highlight ? 'text-emerald-500' : 'text-slate-500'
                  }`} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base">
                    {item.label}
                  </span>
                </div>
                <span className={`font-semibold text-sm md:text-base ml-7 sm:ml-0 break-words ${
                  item.isExpiry ? 'text-red-700 dark:text-red-400' : 
                  item.highlight ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/30 relative overflow-hidden">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src="/advanta-logo.png" 
                alt="Advanta Logo" 
                className="h-8 md:h-12"
              />
              <div className="hidden sm:block">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Sistem Verifikasi</h2>
                <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">PT Advanta Seeds Indonesia</p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Success Badge - Desktop Only */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckBadgeIcon className="w-5 h-5" />
                <span className="text-sm font-bold">HASIL VERIFIKASI</span>
              </div>

              {/* Back Button */}
              <Link
                href="/"
                className="group flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-xs md:text-base">Verifikasi Lagi</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile Success Badge */}
          <div className="lg:hidden mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckBadgeIcon className="w-4 h-4" />
              <span className="text-xs font-bold">HASIL VERIFIKASI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 md:w-72 md:h-72 bg-emerald-400/5 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 md:w-96 md:h-96 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 md:w-48 md:h-48 bg-purple-400/5 dark:bg-purple-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className={`relative z-10 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 pt-6 md:pt-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Premium Header */}
        <div className="relative">
          {/* Hero Success Section */}
          <div className="text-center mb-8 md:mb-12 animate-scale-in relative">
            {/* Floating Success Badge */}
            <div className="relative inline-block mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/40 relative overflow-hidden group">
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex items-center gap-2 md:gap-3">
                  <div className="relative">
                    <CheckBadgeIcon className="h-6 w-6 md:h-7 md:w-7" />
                    <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                  </div>
                  <span className="font-bold text-base md:text-lg lg:text-xl">
                    Produk Asli Terverifikasi
                  </span>
                  <SparklesIcon className="h-5 w-5 md:h-6 md:w-6 animate-bounce" />
                </div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            {/* Product Title with Enhanced Styling */}
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 md:mb-6 px-4">
                <span className="bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-800 bg-clip-text text-transparent leading-tight block">
                  {data.product_name}
                </span>
              </h1>
              
              {/* Subtitle with Premium Styling */}
              <div className="relative inline-block">
                <p className="text-xl md:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 font-semibold px-6 py-2 md:px-8 md:py-3 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  {data.varietas}
                </p>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-blue-500/10 to-purple-500/20 rounded-2xl blur-sm -z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12">
          
          {/* Left Column: Product Image */}
          <div className="lg:col-span-2 order-1">
            <div className="lg:sticky lg:top-8">
              <div className="relative group">
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white dark:bg-slate-800 shadow-xl md:shadow-2xl border border-white dark:border-slate-700 p-4 md:p-6 transition-all duration-300 hover:shadow-2xl md:hover:shadow-3xl hover:scale-[1.02] md:hover:scale-105">
                  {data.product_photo ? (
                    <div className="relative w-full h-full">
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-xl md:rounded-2xl"></div>
                      )}
                      <img 
                        src={data.product_photo} 
                        alt={data.product_name}
                        className={`w-full h-full object-contain rounded-xl md:rounded-2xl transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl md:rounded-2xl">
                      <QrCodeIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 opacity-50" />
                      <span className="text-base md:text-lg font-medium text-center">Gambar Tidak Tersedia</span>
                    </div>
                  )}
                  
                  {/* Premium Badge Overlay */}
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-3 h-3" />
                        VERIFIED
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <div className="flex items-center gap-1">
                        <DocumentCheckIcon className="w-3 h-3" />
                        CERTIFIED
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <div className="flex items-center gap-1">
                        <BeakerIcon className="w-3 h-3" />
                        TESTED
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex justify-center items-center gap-6 md:gap-8 mt-8 md:mt-10">
                  <div className="text-center group cursor-pointer">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200 mx-auto mb-2">
                      <ShieldCheckIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-400">100% Asli</span>
                  </div>
                  
                  <div className="text-center group cursor-pointer">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200 mx-auto mb-2">
                      <DocumentCheckIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-400">Bersertifikat</span>
                  </div>
                  
                  <div className="text-center group cursor-pointer">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-200 mx-auto mb-2">
                      <BeakerIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-400">Teruji Lab</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Tabs */}
          <div className="lg:col-span-3 order-2">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-white/80 dark:border-slate-700/80 overflow-hidden">
              
              {/* Enhanced Tab Navigation */}
              <div className="border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
                <nav className="flex" aria-label="Tabs">
                  {tabConfig.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 group relative px-3 md:px-6 py-4 md:py-6 text-xs md:text-sm font-semibold transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-700 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <tab.icon className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-200 ${
                          activeTab === tab.id ? 'text-emerald-500 dark:text-emerald-400 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`} />
                        <span className="text-center leading-tight">{tab.label}</span>
                      </div>
                      
                      {/* Active Tab Indicator */}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 md:w-12 h-0.5 md:h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content with consistent height */}
              <div className="p-4 md:p-6 lg:p-8">
                <div className="min-h-[400px] md:min-h-[480px]">
                  {renderTabContent()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 dark:border-slate-700 p-4 md:p-6 lg:p-8 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 space-y-4">
                {/* Official Certificate Button - only for production model */}
                {modelType === 'production' && data.qr_code_link && (
                  <>
                    <a
                      href={data.qr_code_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center w-full gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl md:rounded-2xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-lg md:shadow-xl shadow-emerald-500/30 hover:shadow-xl md:hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.02] md:hover:scale-105 overflow-hidden"
                    >
                      {/* Button Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      
                      <div className="relative z-10 flex items-center gap-2 md:gap-3">
                        <DocumentCheckIcon className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-sm md:text-base lg:text-lg text-center">
                          Lihat Sertifikat Resmi di Kementan
                        </span>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                      </div>
                    </a>
                    <p className="text-center text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-3 md:mt-4 flex items-center justify-center gap-2 px-4">
                      <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>Dokumen resmi dari Kementerian Pertanian RI</span>
                    </p>
                  </>
                )}

                {/* Customer Feedback Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {/* Survey CTA */}
                  <Link
                    href={`/survey?${verificationType === 'serial' ? 'serial' : 'lot'}=${identifier}&product=${encodeURIComponent(data.product_name)}`}
                    className="group relative flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <FaceSmileIcon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Berikan Rating</div>
                        <div className="text-xs opacity-90">Bantu kami tingkatkan kualitas</div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>

                  {/* Complaint CTA */}
                  <Link
                    href={`/complaint?${verificationType === 'serial' ? 'serial' : 'lot'}=${identifier}&product=${encodeURIComponent(data.product_name)}`}
                    className="group relative flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-400 hover:to-red-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Ada Kendala?</div>
                        <div className="text-xs opacity-90">Laporkan masalah produk</div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                </div>

                {/* Trust Message */}
                <p className="text-center text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-4 flex items-center justify-center gap-2 px-4">
                  <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  <span>Feedback Anda membantu kami memberikan layanan terbaik</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}