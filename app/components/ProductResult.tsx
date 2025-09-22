// app/components/ProductResult.tsx
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
  StarIcon
} from '@heroicons/react/24/solid';
import { 
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface ProductResultProps {
  data: ProductData;
  modelType: 'bag' | 'production';
}

export default function ProductResult({ data, modelType }: ProductResultProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="grid gap-3 md:gap-4">
            {[
              { label: 'No. Seri Lengkap', value: data.search_key || data.serial_number, highlight: true },
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
                className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 p-3 md:p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 ${
                  item.highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-100'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-slate-600 font-medium text-sm md:text-base flex-shrink-0">
                  {item.label}
                </span>
                <span className={`font-semibold text-sm md:text-base break-words ${
                  item.highlight ? 'text-emerald-800' : 'text-slate-800'
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
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.status === 'good' ? 'bg-emerald-500' : 
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-slate-600 font-medium text-sm md:text-base">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-slate-800 text-base md:text-lg ml-6 sm:ml-0">
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
                    ? 'bg-gradient-to-r from-red-50 to-red-50/50 border-red-200 hover:from-red-100 hover:to-red-100/50' 
                    : item.highlight 
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200'
                      : 'bg-white border-gray-100'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
                    item.isExpiry ? 'text-red-500' : 
                    item.highlight ? 'text-emerald-500' : 'text-slate-500'
                  }`} />
                  <span className="text-slate-600 font-medium text-sm md:text-base">
                    {item.label}
                  </span>
                </div>
                <span className={`font-semibold text-sm md:text-base ml-7 sm:ml-0 break-words ${
                  item.isExpiry ? 'text-red-700' : 
                  item.highlight ? 'text-emerald-700' : 'text-slate-800'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 md:w-72 md:h-72 bg-emerald-400/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 md:w-96 md:h-96 bg-blue-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 md:w-48 md:h-48 bg-purple-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className={`relative z-10 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Success Header */}
        <div className="text-center mb-6 md:mb-8 animate-scale-in">
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 mb-3 md:mb-4">
            <CheckBadgeIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="font-bold text-sm md:text-base lg:text-lg">Produk Asli Terverifikasi</span>
            <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-800 via-slate-800 to-emerald-700 bg-clip-text text-transparent mb-2 px-4">
            {data.product_name}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium px-4">{data.varietas}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12">
          
          {/* Left Column: Product Image */}
          <div className="lg:col-span-2 order-1">
            <div className="lg:sticky lg:top-8">
              <div className="relative group">
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-xl md:shadow-2xl border border-white p-4 md:p-6 transition-all duration-300 hover:shadow-2xl md:hover:shadow-3xl hover:scale-[1.02] md:hover:scale-105">
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
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl md:rounded-2xl">
                      <QrCodeIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 opacity-50" />
                      <span className="text-base md:text-lg font-medium text-center">Gambar Tidak Tersedia</span>
                    </div>
                  )}
                  
                  {/* Premium Badge Overlay */}
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-3 h-3" />
                      VERIFIED
                    </div>
                  </div>
                </div>

                {/* Quality Indicators */}
                <div className="mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-3">
                  <div className="text-center p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-lg">
                    <ShieldCheckIcon className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mx-auto mb-1 md:mb-2" />
                    <div className="text-xs font-bold text-emerald-700">ASLI</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-lg">
                    <CheckBadgeIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mx-auto mb-1 md:mb-2" />
                    <div className="text-xs font-bold text-blue-700">BERSERTIFIKAT</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-lg">
                    <BeakerIcon className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mx-auto mb-1 md:mb-2" />
                    <div className="text-xs font-bold text-purple-700">TERUJI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Tabs */}
          <div className="lg:col-span-3 order-2">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-white/80 overflow-hidden">
              
              {/* Enhanced Tab Navigation */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                <nav className="flex" aria-label="Tabs">
                  {tabConfig.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 group relative px-3 md:px-6 py-4 md:py-6 text-xs md:text-sm font-semibold transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'text-emerald-600 bg-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <tab.icon className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-200 ${
                          activeTab === tab.id ? 'text-emerald-500 scale-110' : 'text-slate-400 group-hover:text-slate-600'
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

              {/* Action Button */}
              {modelType === 'production' && data.qr_code_link && (
                <div className="border-t border-gray-100 p-4 md:p-6 lg:p-8 bg-gradient-to-r from-gray-50/50 to-white">
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
                  
                  <p className="text-center text-slate-500 text-xs md:text-sm mt-3 md:mt-4 flex items-center justify-center gap-2 px-4">
                    <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 flex-shrink-0" />
                    <span>Dokumen resmi dari Kementerian Pertanian RI</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}