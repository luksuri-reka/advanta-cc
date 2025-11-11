// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface AnalyticsData {
  summary: {
    total: number;
    resolved: number;
    pending: number;
    resolution_rate: number;
    avg_resolution_time: number;
    avg_first_response_time: number;
    avg_csat: number;
    escalated_count: number;
    escalation_rate: number;
    first_response_sla_compliance: number;
    resolution_sla_compliance: number;
    product_related_rate: number;
  };
  distributions: {
    status: Record<string, number>;
    priority: Record<string, number>;
    department: Record<string, number>;
    type: Record<string, number>;
    csat: Record<string, number>;
  };
  trends: Array<{
    date: string;
    total: number;
    resolved: number;
    pending: number;
    escalated: number;
    critical: number;
  }>;
  team_performance: Array<{
    user_id: string;
    name: string;
    department: string;
    total_assigned: number;
    total_resolved: number;
    avg_resolution_time: string;
    csat_score: number;
    current_load: number;
    max_load: number;
    escalated_count: number;
    critical_handled: number;
    sla_breaches: number;
  }>;
  assignment_metrics: {
    total_assigned: number;
    total_unassigned: number;
    avg_time_to_assign: number;
  };
  sla_metrics: {
    first_response_breaches: number;
    resolution_breaches: number;
    first_response_compliance: number;
    resolution_compliance: number;
  };
  response_time_by_priority: Record<string, number>;
  top_problematic_products: Array<{
    product: string;
    count: number;
  }>;
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

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
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, period]);

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/complaints/analytics?period=${period}`);
      const result = await response.json();

      if (response.ok && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return '-';
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return `${hours}h ${minutes}m`;
    }
    return interval;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: 'Submitted',
      acknowledged: 'Acknowledged',
      investigating: 'Investigating',
      pending_response: 'Pending Response',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getDepartmentLabel = (dept: string) => {
    const labels: Record<string, string> = {
      customer_service: 'Customer Service',
      quality_assurance: 'Quality Assurance',
      technical: 'Technical',
      management: 'Management',
      unassigned: 'Unassigned'
    };
    return labels[dept] || dept;
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canViewComplaintAnalytics')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-emerald-600" />
                Analytics & Reports
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Complaint system performance insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 dark:text-gray-200 text-sm font-medium"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>

              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {analytics.summary.total}
                </p>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {analytics.summary.resolved} resolved
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {analytics.summary.resolution_rate}%
                </p>
                <div className="mt-2 flex items-center text-sm">
                  {analytics.summary.resolution_rate >= 80 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-orange-600 mr-1" />
                  )}
                  <span className={analytics.summary.resolution_rate >= 80 ? 'text-green-600' : 'text-orange-600'}>
                    {analytics.summary.resolution_rate >= 80 ? 'Excellent' : 'Needs improvement'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {analytics.summary.avg_resolution_time}h
                </p>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Target: 24h
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
                    <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {analytics.summary.avg_csat.toFixed(1)}/5
                </p>
                <div className="mt-2 flex">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-lg ${
                      star <= Math.round(analytics.summary.avg_csat)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* SLA Compliance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">SLA Compliance</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                {analytics.sla_metrics.resolution_compliance}%
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Response: {analytics.sla_metrics.first_response_compliance}%
                </div>
            </div>

            {/* Escalation Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Escalation Rate</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                {analytics.summary.escalation_rate}%
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {analytics.summary.escalated_count} escalated
                </div>
            </div>

            {/* Assignment Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg Time to Assign</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                {analytics.assignment_metrics.avg_time_to_assign}h
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {analytics.assignment_metrics.total_unassigned} unassigned
                </div>
            </div>

            {/* Product Related */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Product Related</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                {analytics.summary.product_related_rate}%
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                With product serial
                </div>
            </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Status Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Status Distribution</h2>
                <div className="space-y-3">
                  {Object.entries(analytics.distributions.status).map(([status, count]) => {
                    const percentage = (count / analytics.summary.total) * 100;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{getStatusLabel(status)}</span>
                          <span className="text-gray-500 dark:text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Priority Distribution</h2>
                <div className="space-y-3">
                  {Object.entries(analytics.distributions.priority).map(([priority, count]) => {
                    const percentage = (count / analytics.summary.total) * 100;
                    const colors: Record<string, string> = {
                      critical: 'bg-red-500',
                      high: 'bg-orange-500',
                      medium: 'bg-blue-500',
                      low: 'bg-gray-500'
                    };
                    return (
                      <div key={priority}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{getPriorityLabel(priority)}</span>
                          <span className="text-gray-500 dark:text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${colors[priority]} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Complaint Trends</h2>
              <div className="overflow-x-auto">
                <div className="min-w-full flex items-end gap-2 h-64">
                  {analytics.trends.map((day, index) => {
                    const maxValue = Math.max(...analytics.trends.map(d => d.total));
                    const height = (day.total / maxValue) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col gap-1">
                          <div
                            className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                            style={{ height: `${(day.resolved / maxValue) * 256}px` }}
                            title={`Resolved: ${day.resolved}`}
                          ></div>
                          <div
                            className="w-full bg-yellow-500 transition-all hover:bg-yellow-600"
                            style={{ height: `${(day.pending / maxValue) * 256}px` }}
                            title={`Pending: ${day.pending}`}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical transform rotate-0">
                          {new Date(day.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Resolved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Analytics Sections */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  {/* Top Problematic Products */}
  {analytics.top_problematic_products && analytics.top_problematic_products.length > 0 && (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Problematic Products</h2>
      <div className="space-y-3">
        {analytics.top_problematic_products.map((item, index) => {
          const maxCount = analytics.top_problematic_products[0].count;
          const percentage = (item.count / maxCount) * 100;
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{item.product}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Response Time by Priority */}
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Avg Response Time by Priority</h2>
    <div className="space-y-3">
      {Object.entries(analytics.response_time_by_priority).map(([priority, time]) => {
        const colors: Record<string, string> = {
          critical: 'bg-red-500',
          high: 'bg-orange-500',
          medium: 'bg-blue-500',
          low: 'bg-gray-500'
        };
        const maxTime = Math.max(...Object.values(analytics.response_time_by_priority));
        const percentage = maxTime > 0 ? (time / maxTime) * 100 : 0;
        
        return (
          <div key={priority}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
              <span className="text-gray-500 dark:text-gray-400">{time.toFixed(1)}h</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${colors[priority]} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>

{/* CSAT Distribution */}
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">CSAT Score Distribution</h2>
  <div className="flex items-end justify-around h-48">
    {Object.entries(analytics.distributions.csat).map(([rating, count]) => {
      const maxCount = Math.max(...Object.values(analytics.distributions.csat));
      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
      
      return (
        <div key={rating} className="flex flex-col items-center gap-2">
          <div
            className={`w-16 ${
              parseInt(rating) >= 4 ? 'bg-green-500' : 
              parseInt(rating) === 3 ? 'bg-yellow-500' : 
              'bg-red-500'
            } rounded-t transition-all hover:opacity-80`}
            style={{ height: `${height}%` }}
            title={`${count} responses`}
          >
            <div className="text-white text-sm font-bold text-center mt-2">{count}</div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg text-yellow-500">{'★'.repeat(parseInt(rating))}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{rating} star</span>
          </div>
        </div>
      );
    })}
  </div>
</div>

            {/* Team Performance - Updated */}
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
    <UsersIcon className="h-6 w-6 text-emerald-600" />
    Team Performance
  </h2>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Name</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Department</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Assigned</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Resolved</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">CSAT</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Critical</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">SLA Breach</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Load</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {analytics.team_performance.map((member) => (
          <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
              {member.name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {getDepartmentLabel(member.department)}
            </td>
            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
              {member.total_assigned}
            </td>
            <td className="px-4 py-3 text-sm text-center">
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full font-bold">
                {member.total_resolved}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
              {formatInterval(member.avg_resolution_time)}
            </td>
            <td className="px-4 py-3 text-sm text-center">
              <span className="font-bold text-yellow-600">
                {member.csat_score ? member.csat_score.toFixed(1) : '-'}/5
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-center">
              <span className={`px-2 py-1 rounded-full font-bold ${
                member.critical_handled > 0 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {member.critical_handled}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-center">
              <span className={`px-2 py-1 rounded-full font-bold ${
                member.sla_breaches > 0 
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              }`}>
                {member.sla_breaches}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      member.current_load >= member.max_load
                        ? 'bg-red-500'
                        : member.current_load / member.max_load > 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((member.current_load / member.max_load) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {member.current_load}/{member.max_load}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
          </>
        )}
      </main>
    </div>
  );
}