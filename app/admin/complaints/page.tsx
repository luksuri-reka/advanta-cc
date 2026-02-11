// app/admin/complaints/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../Navbar';
import * as XLSX from 'xlsx';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  TrashIcon,
  MapPinIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarsArrowUpIcon,
  ArrowDownTrayIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Interface sesuai Database
interface Complaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_province?: string;
  customer_city?: string;
  customer_address?: string;
  complaint_type: string;
  priority?: string;
  department?: string;
  subject: string;
  description?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  related_product_name?: string;
  related_product_serial?: string;
  lot_number?: string;
  problematic_quantity?: string;
  complaint_case_type_names?: string[];
  resolution_summary?: string;
  customer_satisfaction_rating?: number;
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof Complaint | 'location' | null;
  direction: SortDirection;
}

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // STATE FILTER
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // STATE SORTING
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/complaints/mark-as-read', { method: 'POST' });
      } catch (error) {
        console.error('Failed to mark complaints as read:', error);
      }
    })();
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
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      loadComplaints();
    }
    setMounted(true);
  }, [user]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.data || []);
      } else {
        console.error('Failed to load complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const handleDelete = async (id: number, complaintNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus keluhan ${complaintNumber}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id));
        alert('Keluhan berhasil dihapus');
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal menghapus keluhan');
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Terjadi kesalahan saat menghapus keluhan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- FUNGSI EXPORT KE EXCEL ---
  const handleExport = () => {
    setIsExporting(true);
    try {
      const dataToExport = complaints.map(item => ({
        'No. Tiket': item.complaint_number,
        'Tanggal Masuk': formatDate(item.created_at),
        'Status': getStatusLabel(item.status),
        'Prioritas': item.priority || '-',
        'Departemen': item.department || '-',
        'Nama Pelanggan': item.customer_name,
        'Email': item.customer_email,
        'No. Telepon': item.customer_phone || '-',
        'Provinsi': item.customer_province || '-',
        'Kota': item.customer_city || '-',
        'Alamat Lengkap': item.customer_address || '-',
        'Subjek': item.subject,
        'Deskripsi': item.description || '-',
        'Kategori': item.complaint_type || '-',
        'Jenis Kasus (Tags)': item.complaint_case_type_names?.join(', ') || '-',
        'Nama Produk': item.related_product_name || '-',
        'Nomor Lot': item.lot_number || '-',
        'Quantity Bermasalah': item.problematic_quantity || '-',
        'Serial Number': item.related_product_serial || '-',
        'Tanggal Selesai': item.resolved_at ? formatDate(item.resolved_at) : '-',
        'Ringkasan Solusi': item.resolution_summary || '-',
        'Rating Kepuasan': item.customer_satisfaction_rating || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 30 }, { wch: 25 }, { wch: 40 },
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Keluhan");

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      XLSX.writeFile(workbook, `Rekap_Complaint_${timestamp}.xlsx`);

    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (key: keyof Complaint | 'location') => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else {
      direction = key === 'created_at' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'acknowledged': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'observation': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case 'investigation':
      case 'investigating': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'decision': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'pending_response': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'resolved':
      case 'closed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: 'Dikirim',
      acknowledged: 'Dikonfirmasi',
      observation: 'Observasi',
      investigation: 'Investigasi',
      investigating: 'Investigasi',
      decision: 'Keputusan',
      pending_response: 'Menunggu Respons',
      resolved: 'Selesai',
      closed: 'Ditutup'
    };
    return labels[status] || status;
  };

  // --- STATS LOGIC ---
  const timeStats = useMemo(() => {
    const resolvedComplaints = complaints.filter(c => c.resolved_at);
    const totalResolutionHours = resolvedComplaints.reduce((acc, c) => {
      const start = new Date(c.created_at).getTime();
      const end = new Date(c.resolved_at!).getTime();
      return acc + (end - start);
    }, 0);
    const avgResolution = resolvedComplaints.length > 0
      ? Math.round((totalResolutionHours / resolvedComplaints.length) / (1000 * 60 * 60 * 24)) : 0;

    const calculateAvgAge = (statusList: string[]) => {
      const active = complaints.filter(c => statusList.includes(c.status));
      if (active.length === 0) return 0;
      const totalAge = active.reduce((acc, c) => {
        return acc + (new Date().getTime() - new Date(c.created_at).getTime());
      }, 0);
      return Math.round((totalAge / active.length) / (1000 * 60 * 60 * 24));
    };

    return {
      avgResolution,
      avgObservationAge: calculateAvgAge(['observation']),
      avgInvestigationAge: calculateAvgAge(['investigation', 'investigating']),
      avgLabAge: calculateAvgAge(['decision'])
    };
  }, [complaints]);

  const productStats = useMemo(() => {
    const stats: Record<string, { observation: number; investigation: number; lab_test: number; closed: number; total: number }> = {};
    complaints.forEach(c => {
      const product = c.related_product_name || 'Tanpa Produk';
      if (!stats[product]) stats[product] = { observation: 0, investigation: 0, lab_test: 0, closed: 0, total: 0 };
      stats[product].total++;
      if (c.status === 'observation') stats[product].observation++;
      else if (['investigation', 'investigating'].includes(c.status)) stats[product].investigation++;
      else if (c.status === 'decision') stats[product].lab_test++;
      else if (['resolved', 'closed'].includes(c.status)) stats[product].closed++;
    });
    return stats;
  }, [complaints]);

  // UPDATE: Logic untuk Case Types sekarang mengambil SEMUA, tidak hanya top 5
  const caseTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    complaints.forEach(c => {
      const types = c.complaint_case_type_names || [];
      // Jika kosong, abaikan atau masukkan ke Lainnya jika perlu
      if (types.length > 0) {
        types.forEach(t => {
          const key = t.trim();
          if (key) stats[key] = (stats[key] || 0) + 1;
        });
      }
    });
    // Sort terbanyak ke terendah, tanpa slice (tampilkan semua)
    return Object.entries(stats).sort(([, a], [, b]) => b - a);
  }, [complaints]);

  const locationStats = useMemo(() => {
    const getRegion = (province: string | undefined) => {
      if (!province) return 'Unknown';
      const p = province.toLowerCase();
      if (p.includes('nusa tenggara barat')) return 'NTB';
      if (p.includes('jawa timur')) return 'EJ';
      if (p.includes('jawa tengah')) return 'CJ';
      if (p.includes('jawa barat') || p.includes('banten') || p.includes('jakarta')) return 'WJ';
      if (p.includes('sulawesi') || p.includes('gorontalo')) return 'Sulawesi';
      if (p.includes('sumatera') || p.includes('aceh') || p.includes('riau') || p.includes('jambi') || p.includes('bengkulu') || p.includes('lampung')) return 'Sumatera';
      return 'Other';
    };
    const stats: Record<string, number> = { 'NTB': 0, 'EJ': 0, 'CJ': 0, 'WJ': 0, 'Sulawesi': 0, 'Sumatera': 0 };
    complaints.forEach(c => {
      const region = getRegion(c.customer_province);
      if (stats[region] !== undefined) stats[region]++;
    });
    return stats;
  }, [complaints]);

  const sortedAndFilteredComplaints = useMemo(() => {
    let data = complaints.filter(c => {
      return (
        (filters.status === '' || c.status === filters.status) &&
        (filters.search === '' ||
          c.complaint_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.customer_email.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
          (c.customer_province && c.customer_province.toLowerCase().includes(filters.search.toLowerCase())) ||
          (c.customer_city && c.customer_city.toLowerCase().includes(filters.search.toLowerCase()))
        )
      );
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue: any, bValue: any;
        if (sortConfig.key === 'location') {
          aValue = `${a.customer_city || ''} ${a.customer_province || ''}`.toLowerCase();
          bValue = `${b.customer_city || ''} ${b.customer_province || ''}`.toLowerCase();
        } else {
          // @ts-ignore
          aValue = a[sortConfig.key] || '';
          // @ts-ignore
          bValue = b[sortConfig.key] || '';
        }

        if (sortConfig.key === 'created_at' || sortConfig.key === 'id') {
          if (sortConfig.key === 'created_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else {
          const strA = String(aValue).toLowerCase();
          const strB = String(bValue).toLowerCase();
          if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return data;
  }, [complaints, filters, sortConfig]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig.key !== colKey) return <BarsArrowUpIcon className="h-3 w-3 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUpIcon className="h-3 w-3 text-emerald-600 font-bold" />
      : <ChevronDownIcon className="h-3 w-3 text-emerald-600 font-bold" />;
  };

  const TableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: keyof Complaint | 'location', align?: 'left' | 'right' }) => (
    <th
      className={`px-4 py-3 text-${align} text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group select-none`}
      onClick={() => sortKey && handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {sortKey && <SortIcon colKey={sortKey} />}
      </div>
    </th>
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canViewComplaints')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 dark:text-gray-400">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArchiveBoxIcon className="h-6 w-6 text-emerald-600" />
            Dashboard Keluhan Pelanggan
          </h1>
        </div>

        {/* --- STATISTIK --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Status Keluhan Hari Ini */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Status Keluhan (Aktif)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1 px-2 font-semibold">Status</th>
                    <th className="text-center py-1 px-2 font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Observasi</th>
                    <th className="text-center py-1 px-2 font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">Investigasi</th>
                    <th className="text-center py-1 px-2 font-semibold bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100">Keputusan</th>
                    <th className="text-center py-1 px-2 font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2 font-semibold">Total</td>
                    <td className="text-center py-1 px-2 font-bold bg-green-50 dark:bg-green-900/30">
                      {complaints.filter(c => c.status === 'observation').length}
                    </td>
                    <td className="text-center py-1 px-2 font-bold bg-purple-50 dark:bg-purple-900/30">
                      {complaints.filter(c => ['investigation', 'investigating'].includes(c.status)).length}
                    </td>
                    <td className="text-center py-1 px-2 font-bold bg-cyan-50 dark:bg-cyan-900/30">
                      {complaints.filter(c => c.status === 'decision').length}
                    </td>
                    <td className="text-center py-1 px-2 font-bold bg-yellow-50 dark:bg-yellow-900/30">
                      {complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Road Map (SLA Targets) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Target SLA (Hari)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-center py-1 px-2 font-semibold">Submit</th>
                    <th className="text-center py-1 px-2 font-semibold">Observasi</th>
                    <th className="text-center py-1 px-2 font-semibold">Investigasi</th>
                    <th className="text-center py-1 px-2 font-semibold">Lab Testing</th>
                    <th className="text-center py-1 px-2 font-semibold">Result</th>
                    <th className="text-center py-1 px-2 font-semibold">Close</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center py-1 px-2 text-gray-500">1-2</td>
                    <td className="text-center py-1 px-2 text-gray-500">3-10</td>
                    <td className="text-center py-1 px-2 text-gray-500">3-15</td>
                    <td className="text-center py-1 px-2 text-gray-500">10-20</td>
                    <td className="text-center py-1 px-2 text-gray-500">21-29</td>
                    <td className="text-center py-1 px-2 text-gray-500">30</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 mt-2 text-center italic">* Tabel ini adalah target (SLA), bukan statistik aktual.</p>
            </div>
          </div>

          {/* Waktu Penanganan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Rata-rata Waktu (Hari)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <span className="font-medium">Waktu Penyelesaian (Selesai)</span>
                <span className="font-bold text-pink-700 dark:text-pink-400">{timeStats.avgResolution} Hari</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="font-medium">Umur Tiket "Observasi" Saat Ini</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{timeStats.avgObservationAge} Hari</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span className="font-medium">Umur Tiket "Investigasi" Saat Ini</span>
                <span className="font-bold text-purple-700 dark:text-purple-400">{timeStats.avgInvestigationAge} Hari</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                <span className="font-medium">Umur Tiket "Keputusan" Saat Ini</span>
                <span className="font-bold text-cyan-700 dark:text-cyan-400">{timeStats.avgLabAge} Hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Detail by Variety */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Detail Per Varietas</h3>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <th className="text-left py-1 px-2 font-semibold">Varietas</th>
                    <th className="text-center py-1 px-2 font-semibold">Total</th>
                    <th className="text-center py-1 px-2 font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Obs</th>
                    <th className="text-center py-1 px-2 font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">Inv</th>
                    <th className="text-center py-1 px-2 font-semibold bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100">Lab</th>
                    <th className="text-center py-1 px-2 font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">Cls</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(productStats).length > 0 ? (
                    Object.entries(productStats).map(([product, stats]) => (
                      <tr key={product} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-1 px-2 font-medium truncate max-w-[120px]" title={product}>{product}</td>
                        <td className="text-center py-1 px-2 font-bold">{stats.total}</td>
                        <td className="text-center py-1 px-2 bg-green-50 dark:bg-green-900/30">{stats.observation}</td>
                        <td className="text-center py-1 px-2 bg-purple-50 dark:bg-purple-900/30">{stats.investigation}</td>
                        <td className="text-center py-1 px-2 bg-cyan-50 dark:bg-cyan-900/30">{stats.lab_test}</td>
                        <td className="text-center py-1 px-2 bg-yellow-50 dark:bg-yellow-900/30">{stats.closed}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">Belum ada data varietas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">

            {/* Kind of Complaint - UPDATED UI */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Statistik Jenis Kasus (Tags)
              </h3>
              <div className="overflow-y-auto max-h-[200px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {caseTypeStats.length > 0 ? (
                  <div className="space-y-3">
                    {caseTypeStats.map(([name, count], index) => {
                      // Hitung persentase bar relatif terhadap nilai tertinggi
                      const maxCount = caseTypeStats[0][1];
                      const percentage = Math.round((count / maxCount) * 100);

                      return (
                        <div key={name} className="group">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 transition-colors">
                              {index + 1}. {name}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              {count}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">Belum ada data kasus.</div>
                )}
              </div>
            </div>

            {/* Complaint Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Sebaran Wilayah (Semua Produk)</h3>
              <div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">NTB</th>
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">EJ</th>
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">CJ</th>
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">WJ</th>
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">Sulawesi</th>
                      <th className="text-center py-1 px-1 font-semibold text-[10px]">Sumatera</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['NTB']}</td>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['EJ']}</td>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['CJ']}</td>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['WJ']}</td>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['Sulawesi']}</td>
                      <td className="text-center py-1 px-1 font-bold">{locationStats['Sumatera']}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILTERS & TABLE & EXPORT --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filter Bar with Export Button */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Cari (ID, Nama, Lokasi, dll)..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                />
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Dikirim</option>
                <option value="observation">Observasi</option>
                <option value="investigation">Investigasi</option>
                <option value="decision">Keputusan</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>

              {/* TOMBOL EXPORT */}
              <button
                onClick={handleExport}
                disabled={isExporting || complaints.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Excel</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* --- TABLE DENGAN SORTING --- */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <TableHeader label="ID" sortKey="complaint_number" />
                  <TableHeader label="Pelanggan" sortKey="customer_name" />
                  <TableHeader label="Lokasi" sortKey="location" />
                  <TableHeader label="Status" sortKey="status" />
                  <TableHeader label="Tgl Masuk" sortKey="created_at" />
                  <TableHeader label="Aksi" align="right" />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8"><ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                ) : sortedAndFilteredComplaints.length > 0 ? (
                  sortedAndFilteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 text-xs font-medium text-gray-900 dark:text-white">
                        <div className="truncate w-24" title={complaint.complaint_number}>{complaint.complaint_number}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="truncate w-32" title={complaint.customer_name}>{complaint.customer_name}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1 max-w-[180px]">
                          <MapPinIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <span className="truncate" title={`${complaint.customer_city}, ${complaint.customer_province}`}>
                            {complaint.customer_city || '-'}, {complaint.customer_province || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${getStatusClass(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(complaint.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/complaints/${complaint.id}`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          {hasComplaintPermission('canDeleteComplaints') && (
                            <button onClick={() => handleDelete(complaint.id, complaint.complaint_number)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-500">Tidak ada data ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}