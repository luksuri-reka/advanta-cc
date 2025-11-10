// app/survey/SurveyForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  StarIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface SurveyFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  verification_serial?: string;
  survey_type: string;
  ratings: {
    overall_satisfaction: number;
    product_quality: number;
    packaging: number;
    delivery: number;
  };
  product_performance_rating: number;
  packaging_quality_rating: number;
  comments: string;
  suggestions: string;
  would_recommend: boolean | null;
}

export default function SurveyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const serial = searchParams?.get('serial') || '';
  const lot = searchParams?.get('lot') || '';
  const product = searchParams?.get('product') || '';
  
  const [formData, setFormData] = useState<SurveyFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    verification_serial: serial || lot,
    survey_type: 'post_verification',
    ratings: {
      overall_satisfaction: 0,
      product_quality: 0,
      packaging: 0,
      delivery: 0
    },
    product_performance_rating: 0,
    packaging_quality_rating: 0,
    comments: '',
    suggestions: '',
    would_recommend: null
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRatingChange = (category: string, rating: number) => {
    if (category === 'product_performance_rating' || category === 'packaging_quality_rating') {
      setFormData(prev => ({
        ...prev,
        [category]: rating
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [category]: rating
        }
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecommendChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, would_recommend: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== 3) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert(result.error || 'Gagal mengirim survey. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const RatingStars = ({ rating, onRate, label }: { rating: number, onRate: (rating: number) => void, label: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            {star <= rating ? (
              <StarSolid className="h-8 w-8 text-yellow-400 dark:text-yellow-500" />
            ) : (
              <StarIcon className="h-8 w-8 text-gray-300 dark:text-slate-600 hover:text-yellow-200 dark:hover:text-yellow-300" />
            )}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 dark:text-slate-400">
        {rating === 0 ? 'Belum dinilai' : `${rating} dari 5 bintang`}
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/30">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/80 dark:border-slate-700/80 overflow-hidden">
            
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 px-8 py-12 text-center">
              <div className="relative inline-block mb-6">
                <CheckCircleIcon className="h-20 w-20 text-white mx-auto" />
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Terima Kasih!
              </h1>
              <p className="text-emerald-100 dark:text-emerald-200 text-lg">
                Survey Anda telah berhasil dikirim
              </p>
            </div>

            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
                Feedback Anda sangat berharga bagi kami untuk terus meningkatkan kualitas produk dan layanan. 
                Tim kami akan meninjau masukan Anda dengan seksama.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Kembali ke Beranda
                </Link>
                
                <Link
                  href="/complaint"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-300"
                >
                  Ada Masalah?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/30">
      
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-6 sm:h-8 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-slate-100 truncate">Survey Kepuasan Pelanggan</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 hidden sm:block">PT Advanta Seeds Indonesia</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step 
                    ? 'bg-emerald-500 dark:bg-emerald-600 text-white' 
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-2 mx-4 rounded-full transition-all ${
                    currentStep > step 
                      ? 'bg-emerald-500 dark:bg-emerald-600' 
                      : 'bg-gray-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Langkah {currentStep} dari 3: {
                currentStep === 1 ? 'Informasi Kontak' :
                currentStep === 2 ? 'Penilaian Produk' :
                'Feedback & Saran'
              }
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/80 dark:border-slate-700/80 overflow-hidden">
          
          {/* Form Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 px-8 py-8 text-center">
            <FaceSmileIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Bagikan Pengalaman Anda
            </h2>
            <p className="text-emerald-100 dark:text-emerald-200">
              Bantu kami memberikan produk dan layanan yang lebih baik
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Informasi Kontak</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                {formData.verification_serial && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Produk yang Disurvey</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-200">
                      Serial/Lot: {formData.verification_serial}
                    </p>
                    {product && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                        Produk: {product}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Product Rating */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Penilaian Produk</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <RatingStars
                    rating={formData.ratings.overall_satisfaction}
                    onRate={(rating) => handleRatingChange('overall_satisfaction', rating)}
                    label="Kepuasan Keseluruhan"
                  />
                  
                  <RatingStars
                    rating={formData.ratings.product_quality}
                    onRate={(rating) => handleRatingChange('product_quality', rating)}
                    label="Kualitas Produk"
                  />
                  
                  <RatingStars
                    rating={formData.product_performance_rating}
                    onRate={(rating) => handleRatingChange('product_performance_rating', rating)}
                    label="Performa Produk"
                  />
                  
                  <RatingStars
                    rating={formData.packaging_quality_rating}
                    onRate={(rating) => handleRatingChange('packaging_quality_rating', rating)}
                    label="Kualitas Kemasan"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    Apakah Anda akan merekomendasikan produk kami?
                  </h4>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleRecommendChange(true)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        formData.would_recommend === true
                          ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-lg'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      <HandThumbUpIcon className="h-5 w-5" />
                      Ya, Rekomendasikan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecommendChange(false)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        formData.would_recommend === false
                          ? 'bg-red-500 dark:bg-red-600 text-white shadow-lg'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      Tidak
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Feedback */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Feedback & Saran</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Komentar Anda
                  </label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Ceritakan pengalaman Anda menggunakan produk kami..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Saran Perbaikan
                  </label>
                  <textarea
                    name="suggestions"
                    value={formData.suggestions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Bagaimana kami bisa melakukan yang lebih baik?"
                  />
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                    Terima kasih atas waktu Anda!
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-200 text-sm">
                    Feedback Anda sangat berharga untuk membantu kami meningkatkan kualitas produk dan layanan.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Sebelumnya
                </button>
              ) : (
                <div /> 
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  disabled={
                    (currentStep === 1 && (!formData.customer_name || !formData.customer_email)) ||
                    (currentStep === 2 && formData.ratings.overall_satisfaction === 0)
                  }
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-600 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Selanjutnya
                  <ArrowLeftIcon className="h-5 w-5 rotate-180" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-600 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <FaceSmileIcon className="h-5 w-5" />
                      Kirim Survey
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Mengalami kesulitan? Hubungi kami di{' '}
            <a href={`mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
              {process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@advantaindonesia.com'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}