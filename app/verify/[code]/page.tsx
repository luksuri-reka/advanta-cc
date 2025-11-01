// app/verify/[code]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/utils/supabase';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  HashtagIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface VerificationResult {
  isValid: boolean;
  qrCode: string;
  productName?: string;
  productionDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  companyName?: string;
  seedType?: string;
  packagingWeight?: string;
  certificateNumber?: string;
  scannedAt: string;
}

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (code) {
      verifyQRCode(code);
    }
  }, [code]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [loading]);

  const verifyQRCode = async (qrCode: string) => {
    try {
      setLoading(true);

      // Query ke database untuk verifikasi QR Code
      const { data: qrData, error: qrError } = await supabase
        .from('qr_bags')
        .select(`
          qr_code,
          scanned_at,
          bag:bags (
            id,
            batch_number,
            packaging_weight,
            production:productions (
              id,
              production_date,
              expiry_date,
              certificate_number,
              product:products (
                name,
                seed_type
              ),
              company:companies (
                name
              )
            )
          )
        `)
        .eq('qr_code', qrCode)
        .single();

      if (qrError || !qrData) {
        // QR Code tidak ditemukan
        setResult({
          isValid: false,
          qrCode: qrCode,
          scannedAt: new Date().toISOString()
        });
      } else {
        // QR Code valid
        const bag = qrData.bag as any;
        const production = bag?.production;
        const product = production?.product;
        const company = production?.company;

        setResult({
          isValid: true,
          qrCode: qrData.qr_code,
          productName: product?.name || 'N/A',
          productionDate: production?.production_date || 'N/A',
          expiryDate: production?.expiry_date || 'N/A',
          batchNumber: bag?.batch_number || 'N/A',
          companyName: company?.name || 'Advanta Seeds Indonesia',
          seedType: product?.seed_type || 'N/A',
          packagingWeight: bag?.packaging_weight ? `${bag.packaging_weight} kg` : 'N/A',
          certificateNumber: production?.certificate_number || 'N/A',
          scannedAt: qrData.scanned_at || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        isValid: false,
        qrCode: qrCode,
        scannedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex p-6 rounded-3xl bg-white shadow-2xl border border-emerald-100 mb-6">
            <ArrowPathIcon className="h-16 w-16 text-emerald-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Memverifikasi QR Code</h2>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-6">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className={`relative z-10 max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Back Button */}
        <Link href="/">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-emerald-600 font-semibold mb-6 transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Kembali ke Beranda</span>
          </button>
        </Link>

        {/* Result Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          
          {/* Header */}
          <div className={`p-8 ${result?.isValid ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            <div className="text-center text-white">
              <div className="inline-flex p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
                {result?.isValid ? (
                  <CheckCircleIcon className="h-16 w-16" />
                ) : (
                  <XCircleIcon className="h-16 w-16" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {result?.isValid ? 'Produk Terverifikasi!' : 'Produk Tidak Terverifikasi'}
              </h1>
              <p className="text-white/90 text-lg">
                {result?.isValid 
                  ? 'Produk ini adalah benih bersertifikat asli dari Advanta Seeds Indonesia' 
                  : 'Kode QR tidak ditemukan dalam sistem kami'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            
            {result?.isValid ? (
              <>
                {/* QR Code Info */}
                <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <QrCodeIcon className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Kode QR</p>
                      <p className="text-lg font-bold text-emerald-900">{result.qrCode}</p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                    Informasi Produk
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Product Name */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <BeakerIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Nama Produk</p>
                          <p className="font-bold text-gray-900">{result.productName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Seed Type */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <BeakerIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Jenis Benih</p>
                          <p className="font-bold text-gray-900">{result.seedType}</p>
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Perusahaan</p>
                          <p className="font-bold text-gray-900">{result.companyName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Batch Number */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <HashtagIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Nomor Batch</p>
                          <p className="font-bold text-gray-900">{result.batchNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Production Date */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal Produksi</p>
                          <p className="font-bold text-gray-900">{formatDate(result.productionDate || '')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal Kadaluarsa</p>
                          <p className="font-bold text-gray-900">{formatDate(result.expiryDate || '')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Number */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">No. Sertifikat</p>
                          <p className="font-bold text-gray-900">{result.certificateNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Packaging Weight */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <BeakerIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Berat Kemasan</p>
                          <p className="font-bold text-gray-900">{result.packagingWeight}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center">
                        <CheckCircleIcon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">Produk Bersertifikat Resmi</h4>
                      <p className="text-sm text-emerald-700">
                        Produk ini telah diverifikasi dan terdaftar dalam sistem Advanta Seeds Indonesia
                      </p>
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <>
                {/* Invalid QR Code Info */}
                <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
                  <div className="flex items-center gap-3">
                    <QrCodeIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Kode QR</p>
                      <p className="text-lg font-bold text-red-900">{result?.qrCode}</p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-200 mb-6">
                  <div className="flex items-start gap-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-900 mb-2">Produk Tidak Terverifikasi</h4>
                      <p className="text-red-700 mb-4">
                        Kode QR yang Anda masukkan tidak ditemukan dalam database kami. Ini bisa berarti:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-red-700">
                        <li>Kode QR tidak valid atau salah ketik</li>
                        <li>Produk bukan dari Advanta Seeds Indonesia</li>
                        <li>Produk mungkin palsu atau tidak resmi</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* What to Do */}
                <div className="p-6 bg-gray-50 rounded-2xl">
                  <h4 className="font-bold text-gray-900 mb-3">Apa yang harus dilakukan?</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Periksa kembali kode QR yang Anda masukkan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Pastikan QR Code tidak rusak atau terhapus</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Hubungi distributor atau penjual produk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Laporkan produk mencurigakan ke customer service kami</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Verifikasi Lagi</span>
                </button>
              </Link>
              
              {result?.isValid && (
                <button 
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-emerald-700 font-bold rounded-xl shadow-lg border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-xl hover:scale-105 transition-all"
                >
                  <span>Cetak Hasil</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Waktu Verifikasi: {formatDate(result?.scannedAt || '')} {new Date(result?.scannedAt || '').toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>
    </main>
  );
}