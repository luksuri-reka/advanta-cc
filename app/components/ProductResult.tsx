// app/components/ProductResult.tsx
'use client';

import { useState } from 'react';
import { ProductData } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { ArrowRightIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

interface ProductResultProps {
  data: ProductData;
  modelType: 'bag' | 'production';
}

export default function ProductResult({ data, modelType }: ProductResultProps) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Kolom Utama: Gambar di Kiri, Info di Kanan */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Kolom Kiri: Gambar Produk */}
        <div className="lg:col-span-2">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-200/50 p-4">
            {data.product_photo ? (
              <img 
                src={data.product_photo} 
                alt={data.product_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Gambar Tidak Tersedia</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail & Tabs */}
        <div className="lg:col-span-3">
          {/* Header Verifikasi */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckBadgeIcon className="h-8 w-8 text-emerald-500" />
              <span className="text-xl font-semibold text-emerald-600">Produk Asli Terverifikasi</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">{data.product_name}</h1>
            <p className="text-lg text-gray-500 mt-1">{data.varietas}</p>
          </div>

          {/* Sistem Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            {/* Navigasi Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex gap-6 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`shrink-0 border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Rincian Produk
                </button>
                <button
                  onClick={() => setActiveTab('params')}
                  className={`shrink-0 border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === 'params'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Parameter Uji
                </button>
                <button
                  onClick={() => setActiveTab('cert')}
                  className={`shrink-0 border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === 'cert'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Sertifikasi
                </button>
              </nav>
            </div>

            {/* Konten Tabs */}
            <div className="p-6 space-y-4">
              {activeTab === 'details' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between"><span className="text-gray-500">No. Seri Lengkap</span><span className="font-medium text-gray-800">{data.search_key || data.serial_number}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Jenis Tanaman</span><span className="font-medium text-gray-800">{data.jenis_tanaman}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kelas Benih</span><span className="font-medium text-gray-800">{data.kelas_benih}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kode Produksi</span><span className="font-medium text-gray-800">{data.production_code}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Bahan Aktif</span><span className="font-medium text-gray-800 text-right">
                     {Array.isArray(data.bahan_bahan_aktif) && data.bahan_bahan_aktif.length > 0 ? data.bahan_bahan_aktif.join(', ') : '-'}
                  </span></div>
                </div>
              )}
              {activeTab === 'params' && (
                 <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between"><span className="text-gray-500">Benih Murni (Min)</span><span className="font-medium text-gray-800">{data.benih_murni}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Daya Berkecambah (Min)</span><span className="font-medium text-gray-800">{data.daya_berkecambah}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kadar Air (Maks)</span><span className="font-medium text-gray-800">{data.kadar_air}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kotoran Benih (Maks)</span><span className="font-medium text-gray-800">{data.kotoran_benih}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Campuran Varietas Lain (Maks)</span><span className="font-medium text-gray-800">{data.campuran_varietas_lain}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Benih Tanaman Lain (Maks)</span><span className="font-medium text-gray-800">{data.benih_tanaman_lain}%</span></div>
                </div>
              )}
              {activeTab === 'cert' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between"><span className="text-gray-500">No. Sertifikasi</span><span className="font-medium text-gray-800 text-right">{data.cert_number}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">No. Kelompok</span><span className="font-medium text-gray-800">{data.group_number}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tanggal Panen</span><span className="font-medium text-gray-800">{formatDate(data.tanggal_panen)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tanggal Selesai Uji</span><span className="font-medium text-gray-800">{formatDate(data.tested_date)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tanggal Kadaluarsa</span><span className="font-bold text-red-600">{formatDate(data.expired_date)}</span></div>
                </div>
              )}
            </div>
            
            {/* Tombol Aksi di Bawah Tabs */}
            {modelType === 'production' && data.qr_code_link && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <a
                  href={data.qr_code_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Lihat Sertifikat Resmi di Kementan
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tambahkan ini di file globals.css Anda jika belum ada
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
*/