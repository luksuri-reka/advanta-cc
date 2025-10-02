'use client';

import { useMemo } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Survey {
  id: string;
  ratings: {
    overall_satisfaction?: number;
    product_quality?: number;
    packaging?: number;
    delivery?: number;
  };
  product_performance_rating: number | null;
  packaging_quality_rating: number | null;
  would_recommend: boolean | null;
  created_at: string;
}

interface SurveyChartsProps {
  surveys: Survey[];
}

export default function SurveyCharts({ surveys }: SurveyChartsProps) {
  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    surveys.forEach(s => {
      const rating = s.ratings?.overall_satisfaction;
      if (rating && rating >= 1 && rating <= 5) {
        dist[rating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [surveys]);

  // Calculate monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      const monthSurveys = surveys.filter(s => {
        const surveyDate = new Date(s.created_at);
        return surveyDate.getFullYear() === date.getFullYear() &&
               surveyDate.getMonth() === date.getMonth();
      });

      const avgRating = monthSurveys.length > 0
        ? monthSurveys.reduce((acc, s) => acc + (s.ratings?.overall_satisfaction || 0), 0) / monthSurveys.length
        : 0;

      months.push({
        month: monthName,
        count: monthSurveys.length,
        avgRating: avgRating
      });
    }
    
    return months;
  }, [surveys]);

  // Calculate recommendation percentage
  const recommendStats = useMemo(() => {
    const total = surveys.filter(s => s.would_recommend !== null).length;
    const yes = surveys.filter(s => s.would_recommend === true).length;
    const no = surveys.filter(s => s.would_recommend === false).length;
    
    return {
      yes,
      no,
      yesPercent: total > 0 ? (yes / total) * 100 : 0,
      noPercent: total > 0 ? (no / total) * 100 : 0
    };
  }, [surveys]);

  const maxRatingCount = Math.max(...Object.values(ratingDistribution));
  const maxMonthlyCount = Math.max(...monthlyTrend.map(m => m.count));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Rating Distribution Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ChartBarIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Distribusi Rating</h3>
        </div>
        
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-semibold text-gray-700">{rating}</span>
                <span className="text-yellow-400">★</span>
              </div>
              
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                  style={{ 
                    width: maxRatingCount > 0 
                      ? `${(ratingDistribution[rating as keyof typeof ratingDistribution] / maxRatingCount) * 100}%` 
                      : '0%'
                  }}
                >
                  {ratingDistribution[rating as keyof typeof ratingDistribution] > 0 && (
                    <span className="text-xs font-bold text-white">
                      {ratingDistribution[rating as keyof typeof ratingDistribution]}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-12 text-right">
                <span className="text-sm text-gray-600">
                  {surveys.length > 0 
                    ? Math.round((ratingDistribution[rating as keyof typeof ratingDistribution] / surveys.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Tren Bulanan</h3>
        </div>
        
        <div className="space-y-4">
          {monthlyTrend.map((month, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{month.month}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{month.count} survey</span>
                  {month.avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-yellow-600">{month.avgRating.toFixed(1)}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: maxMonthlyCount > 0 
                      ? `${(month.count / maxMonthlyCount) * 100}%` 
                      : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Statistik Rekomendasi</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Merekomendasikan</span>
              <span className="text-2xl font-bold text-green-600">{recommendStats.yesPercent.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${recommendStats.yesPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{recommendStats.yes} dari {recommendStats.yes + recommendStats.no} responden</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Tidak Merekomendasikan</span>
              <span className="text-2xl font-bold text-red-600">{recommendStats.noPercent.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${recommendStats.noPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{recommendStats.no} dari {recommendStats.yes + recommendStats.no} responden</p>
          </div>
        </div>
      </div>
    </div>
  );
}