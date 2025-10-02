'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import SurveyCharts from './components/SurveyCharts';
import {
  DocumentTextIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  LightBulbIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface Survey {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  verification_serial: string | null;
  survey_type: string;
  ratings: {
    overall_satisfaction?: number;
    product_quality?: number;
    packaging?: number;
    delivery?: number;
  };
  product_performance_rating: number | null;
  packaging_quality_rating: number | null;
  comments: string | null;
  suggestions: string | null;
  would_recommend: boolean | null;
  created_at: string;
}

interface SurveyStats {
  total: number;
  thisMonth: number;
  avgOverallSatisfaction: number;
  avgProductQuality: number;
  avgProductPerformance: number;
  avgPackagingQuality: number;
  recommendationRate: number;
}

export default function SurveysPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommend, setFilterRecommend] = useState<'all' | 'yes' | 'no'>('all');
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showCharts, setShowCharts] = useState(true);
  const [stats, setStats] = useState<SurveyStats>({
    total: 0,
    thisMonth: 0,
    avgOverallSatisfaction: 0,
    avgProductQuality: 0,
    avgProductPerformance: 0,
    avgPackagingQuality: 0,
    recommendationRate: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const profile: User | null = await getProfile();
        if (profile) {
          setUser({
            name: profile.user_metadata?.name || 'Admin',
            roles: profile.app_metadata?.roles || ['Superadmin'],
            complaint_permissions: profile.user_metadata?.complaint_permissions || {}
          });
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (mounted) {
      loadSurveys();
    }
  }, [mounted]);

  useEffect(() => {
    applyFilters();
  }, [surveys, searchQuery, filterRecommend, filterRating]);

  const loadSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/surveys?limit=1000');
      const result = await response.json();

      if (result.success) {
        setSurveys(result.data || []);
        calculateStats(result.data || []);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (surveyData: Survey[]) => {
    const total = surveyData.length;
    
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const thisMonth = surveyData.filter(s => new Date(s.created_at) >= thisMonthStart).length;

    const overallSatisfactionRatings = surveyData
      .map(s => s.ratings?.overall_satisfaction)
      .filter((r): r is number => r !== undefined && r !== null);
    
    const productQualityRatings = surveyData
      .map(s => s.ratings?.product_quality)
      .filter((r): r is number => r !== undefined && r !== null);
    
    const productPerformanceRatings = surveyData
      .map(s => s.product_performance_rating)
      .filter((r): r is number => r !== null);
    
    const packagingQualityRatings = surveyData
      .map(s => s.packaging_quality_rating)
      .filter((r): r is number => r !== null);

    const recommendCount = surveyData.filter(s => s.would_recommend === true).length;
    const totalWithRecommendation = surveyData.filter(s => s.would_recommend !== null).length;

    setStats({
      total,
      thisMonth,
      avgOverallSatisfaction: overallSatisfactionRatings.length > 0 
        ? overallSatisfactionRatings.reduce((a, b) => a + b, 0) / overallSatisfactionRatings.length 
        : 0,
      avgProductQuality: productQualityRatings.length > 0
        ? productQualityRatings.reduce((a, b) => a + b, 0) / productQualityRatings.length
        : 0,
      avgProductPerformance: productPerformanceRatings.length > 0
        ? productPerformanceRatings.reduce((a, b) => a + b, 0) / productPerformanceRatings.length
        : 0,
      avgPackagingQuality: packagingQualityRatings.length > 0
        ? packagingQualityRatings.reduce((a, b) => a + b, 0) / packagingQualityRatings.length
        : 0,
      recommendationRate: totalWithRecommendation > 0
        ? (recommendCount / totalWithRecommendation) * 100
        : 0
    });
  };

  const applyFilters = () => {
    let filtered = [...surveys];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.customer_name.toLowerCase().includes(query) ||
        s.customer_email.toLowerCase().includes(query) ||
        s.verification_serial?.toLowerCase().includes(query)
      );
    }

    if (filterRecommend !== 'all') {
      filtered = filtered.filter(s => 
        filterRecommend === 'yes' ? s.would_recommend === true : s.would_recommend === false
      );
    }

    if (filterRating !== 'all') {
      const targetRating = parseInt(filterRating);
      filtered = filtered.filter(s => 
        s.ratings?.overall_satisfaction === targetRating
      );
    }

    setFilteredSurveys(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Tanggal',
      'Nama Customer',
      'Email',
      'Telepon',
      'Serial Verifikasi',
      'Kepuasan Keseluruhan',
      'Kualitas Produk',
      'Performa Produk',
      'Kualitas Kemasan',
      'Rekomendasi',
      'Komentar',
      'Saran'
    ];

    const rows = filteredSurveys.map(s => [
      new Date(s.created_at).toLocaleDateString('id-ID'),
      s.customer_name,
      s.customer_email,
      s.customer_phone || '-',
      s.verification_serial || '-',
      s.ratings?.overall_satisfaction || '-',
      s.ratings?.product_quality || '-',
      s.product_performance_rating || '-',
      s.packaging_quality_rating || '-',
      s.would_recommend ? 'Ya' : (s.would_recommend === false ? 'Tidak' : '-'),
      s.comments?.replace(/"/g, '""') || '-',
      s.suggestions?.replace(/"/g, '""') || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `surveys_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const RatingStars = ({ rating }: { rating: number | null | undefined }) => {
    if (!rating) return <span className="text-gray-400 text-sm">-</span>;
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <StarSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-emerald-600" />
                Survey Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Analisis feedback dan kepuasan pelanggan dari survey
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm"
              >
                <ChartPieIcon className="h-5 w-5" />
                {showCharts ? 'Sembunyikan' : 'Tampilkan'} Grafik
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredSurveys.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Survey</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Bulan ini</span>
              <span className="text-sm font-bold text-blue-600">{stats.thisMonth}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-100">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.avgOverallSatisfaction.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Rata-rata Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(star => (
                <StarSolid key={star} className={`h-4 w-4 ${star <= Math.round(stats.avgOverallSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100">
                <HandThumbUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.recommendationRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Rekomendasi</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.recommendationRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.avgProductPerformance.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Performa Produk</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex-1">
                <p className="text-gray-500">Kualitas</p>
                <p className="font-bold text-gray-900">{stats.avgProductQuality.toFixed(1)}</p>
              </div>
              <div className="flex-1">
                <p className="text-gray-500">Kemasan</p>
                <p className="font-bold text-gray-900">{stats.avgPackagingQuality.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {showCharts && surveys.length > 0 && (
          <div className="mb-8">
            <SurveyCharts surveys={surveys} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter & Pencarian</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <select
              value={filterRecommend}
              onChange={(e) => setFilterRecommend(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Semua Rekomendasi</option>
              <option value="yes">Merekomendasikan</option>
              <option value="no">Tidak Merekomendasikan</option>
            </select>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Semua Rating</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 bintang)</option>
              <option value="4">⭐⭐⭐⭐ (4 bintang)</option>
              <option value="3">⭐⭐⭐ (3 bintang)</option>
              <option value="2">⭐⭐ (2 bintang)</option>
              <option value="1">⭐ (1 bintang)</option>
            </select>
          </div>
        </div>

        {/* Survey List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Data Survey ({filteredSurveys.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data survey...</p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Tidak ada survey ditemukan</p>
              <p className="text-sm text-gray-500 mt-1">Coba ubah filter pencarian Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSurvey(survey)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{survey.customer_name}</h3>
                        {survey.would_recommend === true ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <HandThumbUpIcon className="h-3 w-3" />
                            Merekomendasikan
                          </span>
                        ) : survey.would_recommend === false ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <HandThumbDownIcon className="h-3 w-3" />
                            Tidak
                          </span>
                        ) : null}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          {survey.customer_email}
                        </div>
                        {survey.customer_phone && (
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="h-4 w-4" />
                            {survey.customer_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(survey.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <RatingStars rating={survey.ratings?.overall_satisfaction} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kualitas Produk</p>
                      <RatingStars rating={survey.ratings?.product_quality} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Performa Produk</p>
                      <RatingStars rating={survey.product_performance_rating} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kualitas Kemasan</p>
                      <RatingStars rating={survey.packaging_quality_rating} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pengiriman</p>
                      <RatingStars rating={survey.ratings?.delivery} />
                    </div>
                  </div>

                  {(survey.comments || survey.suggestions) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      {survey.comments && (
                        <div className="flex gap-2">
                          <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Komentar:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{survey.comments}</p>
                          </div>
                        </div>
                      )}
                      {survey.suggestions && (
                        <div className="flex gap-2">
                          <LightBulbIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Saran:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{survey.suggestions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedSurvey && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSurvey(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">Detail Survey</h2>
                <button
                  onClick={() => setSelectedSurvey(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Informasi Customer</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold">{selectedSurvey.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">{selectedSurvey.customer_email}</span>
                    </div>
                    {selectedSurvey.customer_phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm">{selectedSurvey.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">
                        {new Date(selectedSurvey.created_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Penilaian</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-700 mb-2">Kepuasan Keseluruhan</p>
                      <RatingStars rating={selectedSurvey.ratings?.overall_satisfaction} />
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Kualitas Produk</p>
                      <RatingStars rating={selectedSurvey.ratings?.product_quality} />
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-sm text-purple-700 mb-2">Performa Produk</p>
                      <RatingStars rating={selectedSurvey.product_performance_rating} />
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <p className="text-sm text-orange-700 mb-2">Kualitas Kemasan</p>
                      <RatingStars rating={selectedSurvey.packaging_quality_rating} />
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {selectedSurvey.would_recommend !== null && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Rekomendasi</h3>
                    <div className={`rounded-xl p-4 ${selectedSurvey.would_recommend ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        {selectedSurvey.would_recommend ? (
                          <>
                            <HandThumbUpIcon className="h-6 w-6 text-green-600" />
                            <span className="font-semibold text-green-700">Ya, merekomendasikan produk ini</span>
                          </>
                        ) : (
                          <>
                            <HandThumbDownIcon className="h-6 w-6 text-red-600" />
                            <span className="font-semibold text-red-700">Tidak merekomendasikan produk ini</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedSurvey.comments && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Komentar</h3>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600 mb-2" />
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSurvey.comments}</p>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {selectedSurvey.suggestions && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Saran Perbaikan</h3>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <LightBulbIcon className="h-5 w-5 text-yellow-600 mb-2" />
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSurvey.suggestions}</p>
                    </div>
                  </div>
                )}

                {/* Verification Serial */}
                {selectedSurvey.verification_serial && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Produk</h3>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-1">Serial Verifikasi</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedSurvey.verification_serial}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}