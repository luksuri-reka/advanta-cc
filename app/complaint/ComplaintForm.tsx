// app/complaint/ComplaintForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ComplaintFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  complaint_type: string;
  priority: string;
  subject: string;
  description: string;
  related_product_serial?: string;
  related_product_name?: string;
}

export default function ComplaintForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  
  // Get serial and product from URL params
  const serial = searchParams?.get('serial') || '';
  const product = searchParams?.get('product') || '';
  
  const [formData, setFormData] = useState<ComplaintFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    complaint_type: 'other',
    priority: 'medium',
    subject: '',
    description: '',
    related_product_serial: serial,
    related_product_name: product
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const complaintTypes = [
    { value: 'product_defect', label: 'Cacat Produk' },
    { value: 'packaging_issue', label: 'Masalah Kemasan' },
    { value: 'performance_issue', label: 'Masalah Performa Produk' },
    { value: 'labeling_issue', label: 'Masalah Label' },
    { value: 'delivery_issue', label: 'Masalah Pengiriman' },
    { value: 'customer_service', label: 'Layanan Pelanggan' },
    { value: 'other', label: 'Lainnya' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Rendah', description: 'Tidak mendesak' },
    { value: 'medium', label: 'Sedang', description: 'Perlu perhatian' },
    { value: 'high', label: 'Tinggi', description: 'Segera ditangani' },
    { value: 'critical', label: 'Kritis', description: 'Sangat mendesak' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setComplaintNumber(result.complaint_number);
        setIsSubmitted(true);
      } else {
        alert(result.error || 'Gagal mengirim komplain. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-12 text-center">
              <div className="relative inline-block mb-6">
                <CheckCircleIcon className="h-20 w-20 text-white mx-auto" />
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Komplain Berhasil Dikirim
              </h1>
              <p className="text-emerald-100 text-lg">
                Terima kasih atas laporan Anda
              </p>
            </div>

            {/* Success Content */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-200 mb-6">
                  <span className="text-sm font-medium text-emerald-700">Nomor Komplain Anda:</span>
                  <span className="text-xl font-bold text-emerald-800">{complaintNumber}</span>
                </div>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Komplain Anda telah diterima dan akan ditindaklanjuti oleh tim kami dalam waktu maksimal 24 jam. 
                  Anda akan mendapat email konfirmasi sebentar lagi. Cek folder spam Anda jika email belum diterima.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link
                  href={`/complaint/${complaintNumber}/status`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Lacak Status
                </Link>
                
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Kembali ke Beranda
                </Link>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4">Langkah Selanjutnya:</h3>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Tim kami akan mengirim email konfirmasi dalam beberapa menit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Anda dapat melacak status komplain menggunakan nomor referensi di atas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Tim customer care akan menghubungi Anda jika diperlukan informasi tambahan</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-6 sm:h-8 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">Formulir Komplain</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">PT Advanta Seeds Indonesia</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
          
          {/* Form Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-12 text-center">
            <div className="relative inline-block mb-6">
              <ExclamationTriangleIcon className="h-16 w-16 text-white mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Sampaikan Komplain Anda
            </h2>
            <p className="text-red-100 text-lg max-w-2xl mx-auto">
              Kami menghargai feedback Anda dan berkomitmen untuk menyelesaikan setiap masalah dengan cepat dan profesional.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="h-6 w-6 text-emerald-600" />
                  Informasi Kontak
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                {/* Product Info (if from verification) */}
                {formData.related_product_serial && (
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-3">Produk Terkait</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Serial:</strong> {formData.related_product_serial}</p>
                      {formData.related_product_name && (
                        <p><strong>Produk:</strong> {formData.related_product_name}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Complaint Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  Detail Komplain
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Komplain *
                  </label>
                  <select
                    name="complaint_type"
                    value={formData.complaint_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    {complaintTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Prioritas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {priorityLevels.map(priority => (
                      <label key={priority.value} className="relative">
                        <input
                          type="radio"
                          name="priority"
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.priority === priority.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-sm font-semibold">{priority.label}</div>
                          <div className="text-xs text-gray-500">{priority.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subjek Komplain *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Ringkasan singkat masalah Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi Detail *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Jelaskan masalah Anda secara detail. Sertakan informasi seperti kapan masalah terjadi, langkah-langkah yang sudah dilakukan, dan dampak yang dialami."
                  />
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-gray-600">
                  Dengan mengirim formulir ini, Anda menyetujui bahwa informasi yang diberikan akurat dan dapat diverifikasi.
                </p>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:from-red-400 hover:to-orange-400 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      Kirim Komplain
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}