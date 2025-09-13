'use client';

import { ProductData } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface ProductResultProps {
  data: ProductData;
  modelType: 'bag' | 'production';
}

export default function ProductResult({ data, modelType }: ProductResultProps) {
  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6">
          <h3 className="text-2xl font-bold">Benih Unggul Bersertifikat</h3>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Product Image */}
            <div className="lg:col-span-1">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {data.product_photo ? (
                  <img 
                    src={data.product_photo} 
                    alt={data.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>No Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold mb-4 text-gray-900">Detail Produk</h4>
                <hr className="mb-6 border-gray-200" />

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {modelType === 'bag' && (
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">No. Seri Bag</label>
                        <p className="text-gray-900 font-medium">{data.serial_number}</p>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Nama Produk</label>
                      <p className="text-gray-900 font-medium">{data.product_name}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Jenis Tanaman</label>
                      <p className="text-gray-900 font-medium">{data.jenis_tanaman}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Kelas Benih</label>
                      <p className="text-gray-900 font-medium">{data.kelas_benih}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Varietas</label>
                      <p className="text-gray-900 font-medium">{data.varietas}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Kode Produksi</label>
                      <p className="text-gray-900 font-medium">{data.production_code}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Benih Tanaman Lain / Biji Gulma (Maks)</label>
                      <p className="text-gray-900 font-medium">{data.benih_tanaman_lain}%</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Campuran Varietas Lain (Maks)</label>
                      <p className="text-gray-900 font-medium">{data.campuran_varietas_lain}%</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Kotoran Benih (Maks)</label>
                      <p className="text-gray-900 font-medium">{data.kotoran_benih}%</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Benih Murni (Min)</label>
                      <p className="text-gray-900 font-medium">{data.benih_murni}%</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Kadar Air (Maks)</label>
                      <p className="text-gray-900 font-medium">{data.kadar_air}%</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Daya Berkecambah (Min)</label>
                      <p className="text-gray-900 font-medium">{data.daya_berkecambah}%</p>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Certification Info */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">No. Sertifikasi</label>
                    <p className="text-gray-900 font-medium">{data.cert_number}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">No. Kelompok</label>
                        <p className="text-gray-900 font-medium">{data.group_number}</p>
                      </div>
                      {modelType === 'production' && (
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-600 mb-1">No. Seri Label</label>
                          <p className="text-gray-900 font-medium">{data.serial_number}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Tgl. Selesai Uji</label>
                        <p className="text-gray-900 font-medium">{formatDate(data.tested_date)}</p>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Tgl. Kadaluarsa</label>
                        <p className="text-gray-900 font-medium">{formatDate(data.expired_date)}</p>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Tgl. Panen</label>
                        <p className="text-gray-900 font-medium">{formatDate(data.tanggal_panen)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">Bahan Aktif</label>
                    <p className="text-gray-900 font-medium">
                      {data.bahan_bahan_aktif && data.bahan_bahan_aktif.length > 0 
                        ? data.bahan_bahan_aktif.join(', ') 
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button for Production Type */}
          {modelType === 'production' && data.qr_code_link && (
            <div className="mt-8 flex justify-center">
              <a 
                href={data.qr_code_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors duration-200"
              >
                Lihat Sertifikasi Lengkap
                <ArrowRightIcon className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
