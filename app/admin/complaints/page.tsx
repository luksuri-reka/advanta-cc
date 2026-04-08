// app/admin/complaints/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../utils/auth';
import type { User } from '@supabase/supabase-js';
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
import ModernDashboard from './ModernDashboard';
import FiscalYearSidebar from './FiscalYearSidebar';

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
  key: keyof Complaint | 'location' | 'age' | null;
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
    search: '',
    age: '',
    product: ''
  });

  // STATE SORTING
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc'
  });

  // STATE SIDEBAR
  const [sidebarFilters, setSidebarFilters] = useState<{
    fiscalYear: string | null;
    quarter: string | null;
    status: string | null;
  }>({ fiscalYear: null, quarter: null, status: null });

  const handleSidebarFilterChange = (fy: string | null, quarter: string | null, status: string | null) => {
    setSidebarFilters({ fiscalYear: fy, quarter: quarter, status: status });
  };

  const getFiscalYearInfo = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 is Jan, 3 is Apr
    const isFYNext = month >= 3; 
    const baseYear = isFYNext ? year : year - 1;
    const fyLabel = `FY${baseYear.toString().slice(-2)}`;
    let quarter = '';
    if (month >= 3 && month <= 5) quarter = 'Q1';
    else if (month >= 6 && month <= 8) quarter = 'Q2';
    else if (month >= 9 && month <= 11) quarter = 'Q3';
    else quarter = 'Q4';
    return { fyLabel, quarter };
  };

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
      } else if (response.status === 401) {
        router.replace('/admin/login');
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
        'Tanggal Selesai': item.resolved_at ? formatDate(item.resolved_at) : '-',
        'Umur Tiket (Hari)': calculateAge(item.created_at, item.resolved_at),
        'Status': getStatusLabel(item.status),
        // 'Prioritas': item.priority || '-',
        'Departemen': item.department || '-',
        'Nama Pelanggan': item.customer_name,
        'Email': item.customer_email,
        'No. Telepon': item.customer_phone || '-',
        'Provinsi': item.customer_province || '-',
        'Kota': item.customer_city || '-',
        'Alamat Lengkap': item.customer_address || '-',
        'Subjek': item.subject,
        'Deskripsi': item.description || '-',
        // 'Kategori Keluhan': item.complaint_type || '-',
        'Jenis Kasus (Tags)': item.complaint_case_type_names?.join(', ') || '-',
        'Nama Produk': item.related_product_name || '-',
        'Nomor Lot': item.lot_number || '-',
        'Quantity Bermasalah': item.problematic_quantity || '-',
        'Serial Number Produk': item.related_product_serial || '-',
        'Ringkasan Solusi': item.resolution_summary || '-',
        'Rating Kepuasan (1-5)': item.customer_satisfaction_rating ?? '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        { wch: 18 },  // No. Tiket
        { wch: 20 },  // Tanggal Masuk
        { wch: 20 },  // Tanggal Selesai
        { wch: 16 },  // Umur Tiket (Hari)
        { wch: 18 },  // Status
        // { wch: 12 },  // Prioritas
        { wch: 16 },  // Departemen
        { wch: 25 },  // Nama Pelanggan
        { wch: 28 },  // Email
        { wch: 16 },  // No. Telepon
        { wch: 20 },  // Provinsi
        { wch: 18 },  // Kota
        { wch: 35 },  // Alamat Lengkap
        { wch: 30 },  // Subjek
        { wch: 45 },  // Deskripsi
        // { wch: 20 },  // Kategori Keluhan
        { wch: 30 },  // Jenis Kasus (Tags)
        { wch: 25 },  // Nama Produk
        { wch: 18 },  // Nomor Lot
        { wch: 18 },  // Quantity Bermasalah
        { wch: 22 },  // Serial Number Produk
        { wch: 40 },  // Ringkasan Solusi
        { wch: 18 },  // Rating Kepuasan
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Keluhan');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      XLSX.writeFile(workbook, `Rekap_Complaint_${timestamp}.xlsx`);

    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (key: keyof Complaint | 'location' | 'age') => {
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

  const calculateAge = (createdAt: string, resolvedAt?: string) => {
    const startDate = new Date(createdAt).getTime();
    const endDate = resolvedAt ? new Date(resolvedAt).getTime() : new Date().getTime();
    return Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
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

  // Daftar nama produk unik untuk dropdown filter
  const uniqueProductNames = useMemo(() => {
    const names = new Set<string>();
    complaints.forEach(c => {
      if (c.related_product_name) names.add(c.related_product_name);
    });
    return Array.from(names).sort();
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
      let ageMatch = true;
      if (filters.age) {
        const ageInDays = calculateAge(c.created_at, c.resolved_at);
        if (filters.age === '0-3') ageMatch = ageInDays >= 0 && ageInDays <= 3;
        else if (filters.age === '4-7') ageMatch = ageInDays >= 4 && ageInDays <= 7;
        else if (filters.age === '8-14') ageMatch = ageInDays >= 8 && ageInDays <= 14;
        else if (filters.age === '>14') ageMatch = ageInDays > 14;
      }

      let sidebarMatch = true;
      if (sidebarFilters.fiscalYear || sidebarFilters.quarter || sidebarFilters.status) {
        const info = getFiscalYearInfo(c.created_at);
        
        if (sidebarFilters.fiscalYear && info.fyLabel !== sidebarFilters.fiscalYear) {
          sidebarMatch = false;
        }
        if (sidebarFilters.quarter && info.quarter !== sidebarFilters.quarter) {
          sidebarMatch = false;
        }
        if (sidebarMatch && sidebarFilters.status) {
          const statusGroups: Record<string, string[]> = {
            'Pending': ['submitted', 'pending_response'],
            'In Progress': ['acknowledged', 'observation', 'investigating', 'investigation', 'decision'],
            'Resolved': ['resolved', 'closed']
          };
          const allowedStatuses = statusGroups[sidebarFilters.status] || [];
          if (!allowedStatuses.includes(c.status)) {
            sidebarMatch = false;
          }
        }
      }

      return (
        ageMatch &&
        sidebarMatch &&
        (filters.status === '' || c.status === filters.status) &&
        (filters.product === '' || (c.related_product_name || '') === filters.product) &&
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
        } else if (sortConfig.key === 'age') {
          aValue = calculateAge(a.created_at, a.resolved_at);
          bValue = calculateAge(b.created_at, b.resolved_at);
        } else {
          // @ts-ignore
          aValue = a[sortConfig.key] || '';
          // @ts-ignore
          bValue = b[sortConfig.key] || '';
        }

        if (sortConfig.key === 'created_at' || sortConfig.key === 'id' || sortConfig.key === 'age') {
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
  }, [complaints, filters, sortConfig, sidebarFilters]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig.key !== colKey) return <BarsArrowUpIcon className="h-3 w-3 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUpIcon className="h-3 w-3 text-emerald-600 font-bold" />
      : <ChevronDownIcon className="h-3 w-3 text-emerald-600 font-bold" />;
  };

  const TableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: keyof Complaint | 'location' | 'age', align?: 'left' | 'right' | 'center' }) => (
    <th
      className={`px-4 py-3 text-${align} text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group select-none`}
      onClick={() => sortKey && handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
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
      <main className="mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArchiveBoxIcon className="h-6 w-6 text-emerald-600" />
            Dashboard Keluhan Pelanggan
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column - Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
             <FiscalYearSidebar 
               complaints={complaints}
               selectedFY={sidebarFilters.fiscalYear} 
               selectedQuarter={sidebarFilters.quarter} 
               selectedStatus={sidebarFilters.status}
               onFilterChange={handleSidebarFilterChange}
             />
          </div>

          {/* Right Column - Main Content */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            <ModernDashboard 
              filters={filters} 
              sidebarFilters={sidebarFilters} 
            />

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

              <select
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Produk</option>
                {uniqueProductNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select
                name="age"
                value={filters.age}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Umur</option>
                <option value="0-3">0-3 Hari</option>
                <option value="4-7">4-7 Hari</option>
                <option value="8-14">8-14 Hari</option>
                <option value=">14">&gt; 14 Hari</option>
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
                  <TableHeader label="Umur" sortKey="age" align="center" />
                  <TableHeader label="Aksi" align="right" />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8"><ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" /></td></tr>
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
                      <td className="px-4 py-2 text-center text-xs">
                        <span className={`px-2 py-1 rounded-full inline-block min-w-[60px] font-medium ${complaint.status === 'resolved' || complaint.status === 'closed'
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          : calculateAge(complaint.created_at, complaint.resolved_at) > 14
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : calculateAge(complaint.created_at, complaint.resolved_at) > 7
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                          {calculateAge(complaint.created_at, complaint.resolved_at)} Hari
                        </span>
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
                  <tr><td colSpan={7} className="text-center py-8 text-sm text-gray-500">Tidak ada data ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}