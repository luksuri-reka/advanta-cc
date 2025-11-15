// app/admin/settings/complaints/page.tsx - 3 Level Categories System
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from '../../Navbar';
import {
  CogIcon,
  ClockIcon,
  BellIcon,
  DocumentTextIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface ComplaintSettings {
  sla_response_time: number;
  sla_resolution_time: number;
  auto_assign_enabled: boolean;
  email_notifications_enabled: boolean;
  priority_auto_escalation: boolean;
  escalation_threshold_hours: number;
}

interface CaseType {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  caseTypes: CaseType[];
}

interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  auto_assign_department?: string;
  subCategories: SubCategory[];
}

export default function ComplaintSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'sla' | 'categories' | 'notifications' | 'templates'>('sla');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<ComplaintSettings>({
    sla_response_time: 24,
    sla_resolution_time: 72,
    auto_assign_enabled: true,
    email_notifications_enabled: true,
    priority_auto_escalation: true,
    escalation_threshold_hours: 48
  });

  const [categories, setCategories] = useState<ComplaintCategory[]>([
    {
      id: '1',
      name: 'Masalah Pengiriman',
      description: 'Masalah terkait pengiriman dan distribusi produk',
      auto_assign_department: 'customer_service',
      subCategories: [
        {
          id: '1-1',
          name: 'Kerusakan pada Kemasan',
          caseTypes: [
            { id: '1-1-1', name: 'Kemasan Rusak' },
            { id: '1-1-2', name: 'Kemasan Kotor' },
            { id: '1-1-3', name: 'Kerusakan karena Forklift' },
            { id: '1-1-4', name: 'Serangan / Hewan Pengerat' },
            { id: '1-1-5', name: 'Kerusakan karena Tumpukan' },
            { id: '1-1-6', name: 'Kemasan Basah / Lembab' }
          ]
        },
        {
          id: '1-2',
          name: 'Masalah Pengiriman',
          caseTypes: [
            { id: '1-2-1', name: 'Dokumen Hilang / Salah' },
            { id: '1-2-2', name: 'Dikirim ke Alamat yang Salah' },
            { id: '1-2-3', name: 'Pengiriman Tidak Tepat Waktu' },
            { id: '1-2-4', name: 'Kinerja Sopir' },
            { id: '1-2-5', name: 'Kebocoran' },
            { id: '1-2-6', name: 'Kehilangan Sebagian / Seluruhnya saat Pengiriman' },
            { id: '1-2-7', name: 'Kesalahan Pihak Ketiga (vendor)' }
          ]
        },
        {
          id: '1-3',
          name: 'Kesalahan Produk / Jumlah Pengiriman',
          caseTypes: [
            { id: '1-3-1', name: 'Salah Lot' },
            { id: '1-3-2', name: 'Salah Jumlah' },
            { id: '1-3-3', name: 'Salah Ukuran' },
            { id: '1-3-4', name: 'Salah Varietas' }
          ]
        },
        {
          id: '1-4',
          name: 'Kondisi Pengiriman',
          caseTypes: [
            { id: '1-4-1', name: 'Metode Pengiriman Salah' },
            { id: '1-4-2', name: 'Pengiriman Tidak Dipersiapkan dengan Benar' },
            { id: '1-4-3', name: 'Kondisi dari Transportasi' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Kualitas',
      description: 'Masalah terkait kualitas produk',
      auto_assign_department: 'quality_assurance',
      subCategories: [
        {
          id: '2-1',
          name: 'Masalah Pertumbuhan',
          caseTypes: [
            { id: '2-1-1', name: 'Rebah semai' },
            { id: '2-1-2', name: 'Pertumbuhan Lambat' },
            { id: '2-1-3', name: 'Perbedaan Penugian Pihak Ketiga' },
            { id: '2-1-4', name: 'Keseragaman Jelek' },
            { id: '2-1-5', name: 'Vigor Jelek' },
            { id: '2-1-6', name: 'Yang Tumbuh Terlalu Rendah / Sedikit' }
          ]
        },
        {
          id: '2-2',
          name: 'Faktor Fisiologis Lainnya',
          caseTypes: [
            { id: '2-2-1', name: 'Blind Plants' },
            { id: '2-2-2', name: 'Bibit Cacat' },
            { id: '2-2-3', name: 'Jack Plants' },
            { id: '2-2-4', name: 'Tidak Berkecambah' },
            { id: '2-2-5', name: 'Umur Simpan / Benih lama' }
          ]
        },
        {
          id: '2-3',
          name: 'Kemurnian Produk',
          caseTypes: [
            { id: '2-3-1', name: 'Tongkol' },
            { id: '2-3-2', name: 'Benda / Bahan Lain' },
            { id: '2-3-3', name: 'Ditemukan Tanaman Lainnya' },
            { id: '2-3-4', name: 'Benih Campuran' },
            { id: '2-3-5', name: 'Benih Diganti' },
            { id: '2-3-6', name: 'Batang' },
            { id: '2-3-7', name: 'Benih Gulma' }
          ]
        },
        {
          id: '2-4',
          name: 'Genetik',
          caseTypes: [
            { id: '2-4-1', name: 'Boiler' },
            { id: '2-4-2', name: 'Perbedaan Penugian oleh Pihak Ketiga' },
            { id: '2-4-3', name: 'Inbred' },
            { id: '2-4-4', name: 'Offtype' }
          ]
        },
        {
          id: '2-5',
          name: 'Treatment Benih',
          caseTypes: [
            { id: '2-5-1', name: 'Menggumpal' },
            { id: '2-5-2', name: 'Treatment Lengket' },
            { id: '2-5-3', name: 'Cakupan Treatment' }
          ]
        },
        {
          id: '2-6',
          name: 'Penampilan Produk',
          caseTypes: [
            { id: '2-6-1', name: 'Berdebu' },
            { id: '2-6-2', name: 'Invert matter' },
            { id: '2-6-3', name: 'Rusak oleh Serangga' },
            { id: '2-6-4', name: 'Lembab' },
            { id: '2-6-5', name: 'Berjamir / Pudar / Kotor' },
            { id: '2-6-6', name: 'Sclerotinia' },
            { id: '2-6-7', name: 'Benih tidak Seragam' },
            { id: '2-6-8', name: 'Benih Pecah / Retak / Patah' }
          ]
        },
        {
          id: '2-7',
          name: 'Kesehatan Benih',
          caseTypes: [
            { id: '2-7-1', name: 'Perbedaan Penugian oleh Pihak Ketiga' },
            { id: '2-7-2', name: 'Penyakit pada Tanaman' },
            { id: '2-7-3', name: 'Penyakit pada Benih' },
            { id: '2-7-4', name: 'Gejala Virus' }
          ]
        },
        {
          id: '2-8',
          name: 'Produk Kadaluarsa',
          caseTypes: [
            { id: '2-8-1', name: 'Produk Kadaluarsa' }
          ]
        },
        {
          id: '2-9',
          name: 'Kerusakan karena Herbisida',
          caseTypes: [
            { id: '2-9-1', name: 'Tanaman Terkena Herbisida' }
          ]
        },
        {
          id: '2-10',
          name: 'Performa Produk',
          caseTypes: [
            { id: '2-10-1', name: 'Tanaman Tumbuh di Lapang' }
          ]
        }
      ]
    }
  ]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComplaintCategory | null>(null);
  const [selectedSubCategoryIndex, setSelectedSubCategoryIndex] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
        await loadSettings();
      } catch (err) {
        console.error('Failed to load profile:', err);
        router.push('/admin/login');
      }
    })();
  }, []);

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const slaResponse = await fetch('/api/complaint-settings/sla');
      if (slaResponse.ok) {
        const slaData = await slaResponse.json();
        if (slaData.data) {
          setSettings(slaData.data);
        }
      }
      
      const categoriesResponse = await fetch('/api/complaint-settings/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.data && Array.isArray(categoriesData.data)) {
          // Ensure all categories have subCategories array
          const normalizedCategories = categoriesData.data.map((cat: any) => ({
            ...cat,
            subCategories: cat.subCategories || []
          }));
          setCategories(normalizedCategories);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/complaint-settings/sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategories = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/complaint-settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categories)
      });

      if (response.ok) {
        alert('Kategori berhasil disimpan!');
        setShowCategoryForm(false);
        setEditingCategory(null);
      } else {
        throw new Error('Failed to save categories');
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const newCategory: ComplaintCategory = {
      id: Date.now().toString(),
      name: '',
      description: '',
      auto_assign_department: 'customer_service',
      subCategories: []
    };
    setEditingCategory(newCategory);
    setSelectedSubCategoryIndex(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: ComplaintCategory) => {
    setEditingCategory(JSON.parse(JSON.stringify(category)));
    setSelectedSubCategoryIndex(null);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      handleSaveCategories();
    }
  };

  const handleAddSubCategory = () => {
    if (!editingCategory) return;
    
    const newSubCategory: SubCategory = {
      id: `${editingCategory.id}-${editingCategory.subCategories.length + 1}`,
      name: '',
      caseTypes: []
    };
    
    setEditingCategory({
      ...editingCategory,
      subCategories: [...editingCategory.subCategories, newSubCategory]
    });
    setSelectedSubCategoryIndex(editingCategory.subCategories.length);
  };

  const handleAddCaseType = (subCategoryIndex: number) => {
    if (!editingCategory) return;
    
    const newCaseType: CaseType = {
      id: `${editingCategory.subCategories[subCategoryIndex].id}-${editingCategory.subCategories[subCategoryIndex].caseTypes.length + 1}`,
      name: ''
    };
    
    const updatedSubCategories = [...editingCategory.subCategories];
    updatedSubCategories[subCategoryIndex].caseTypes.push(newCaseType);
    
    setEditingCategory({
      ...editingCategory,
      subCategories: updatedSubCategories
    });
  };

  const handleDeleteSubCategory = (subCategoryIndex: number) => {
    if (!editingCategory) return;
    
    const updatedSubCategories = editingCategory.subCategories.filter((_, idx) => idx !== subCategoryIndex);
    setEditingCategory({
      ...editingCategory,
      subCategories: updatedSubCategories
    });
    
    if (selectedSubCategoryIndex === subCategoryIndex) {
      setSelectedSubCategoryIndex(null);
    }
  };

  const handleDeleteCaseType = (subCategoryIndex: number, caseTypeIndex: number) => {
    if (!editingCategory) return;
    
    const updatedSubCategories = [...editingCategory.subCategories];
    updatedSubCategories[subCategoryIndex].caseTypes = 
      updatedSubCategories[subCategoryIndex].caseTypes.filter((_, idx) => idx !== caseTypeIndex);
    
    setEditingCategory({
      ...editingCategory,
      subCategories: updatedSubCategories
    });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveCategoryForm = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name || !editingCategory.description) {
      alert('Nama dan deskripsi kategori wajib diisi');
      return;
    }

    for (const sub of editingCategory.subCategories) {
      if (!sub.name) {
        alert('Semua sub-kategori harus memiliki nama');
        return;
      }
      if (sub.caseTypes.length === 0) {
        alert(`Sub-kategori "${sub.name}" harus memiliki minimal 1 jenis kasus`);
        return;
      }
      for (const caseType of sub.caseTypes) {
        if (!caseType.name) {
          alert('Semua jenis kasus harus memiliki nama');
          return;
        }
      }
    }

    const existingIndex = categories.findIndex(c => c.id === editingCategory.id);
    if (existingIndex >= 0) {
      const updated = [...categories];
      updated[existingIndex] = editingCategory;
      setCategories(updated);
    } else {
      setCategories([...categories, editingCategory]);
    }
    
    handleSaveCategories();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const tabs = [
    { id: 'sla', label: 'SLA & Response Time', icon: ClockIcon },
    { id: 'categories', label: 'Kategori Komplain', icon: TagIcon },
    { id: 'notifications', label: 'Notifikasi', icon: BellIcon },
    { id: 'templates', label: 'Template Email', icon: DocumentTextIcon }
  ];

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canConfigureComplaintSystem')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Anda tidak memiliki izin untuk mengakses pengaturan ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <CogIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Pengaturan Sistem Komplain
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Kelola konfigurasi SLA, kategori, dan notifikasi untuk sistem komplain
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 group relative px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <tab.icon className={`w-5 h-5 transition-all duration-200 ${
                      activeTab === tab.id ? 'text-emerald-500 dark:text-emerald-400 scale-110' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span>{tab.label}</span>
                  </div>
                  
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'sla' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Service Level Agreement (SLA)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                      Target Waktu Respon (jam)
                    </label>
                    <input
                      type="number"
                      value={settings.sla_response_time}
                      onChange={(e) => setSettings({ ...settings, sla_response_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      min="1"
                    />
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Waktu maksimal untuk memberikan respon pertama
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-3">
                      Target Waktu Penyelesaian (jam)
                    </label>
                    <input
                      type="number"
                      value={settings.sla_resolution_time}
                      onChange={(e) => setSettings({ ...settings, sla_resolution_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-green-300 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                      min="1"
                    />
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                      Waktu maksimal untuk menyelesaikan komplain
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Fitur Otomatis</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Auto-Assign Komplain</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Otomatis menugaskan komplain ke departemen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.auto_assign_enabled}
                        onChange={(e) => setSettings({ ...settings, auto_assign_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Eskalasi Prioritas Otomatis</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Naikkan prioritas jika melebihi threshold</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.priority_auto_escalation}
                        onChange={(e) => setSettings({ ...settings, priority_auto_escalation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {settings.priority_auto_escalation && (
                    <div className="ml-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <label className="block text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                        Threshold Eskalasi (jam)
                      </label>
                      <input
                        type="number"
                        value={settings.escalation_threshold_hours}
                        onChange={(e) => setSettings({ ...settings, escalation_threshold_hours: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Simpan Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sistem Kategori 3 Level</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kategori → Sub-Kategori → Jenis Kasus/Tipe Masalah</p>
                  </div>
                  <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                  >
                    <TagIcon className="h-5 w-5" />
                    Tambah Kategori
                  </button>
                </div>

                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() => toggleCategoryExpand(category.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              >
                                <svg 
                                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{category.name}</h3>
                              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white rounded-full text-xs font-bold shadow-sm">
                                KATEGORI
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 ml-9 mb-3">{category.description}</p>
                            
                            <div className="flex flex-wrap gap-3 ml-9">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                                  {(category.subCategories || []).length} Sub-Kategori
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                                  {(category.subCategories || []).reduce((sum, sub) => sum + (sub.caseTypes || []).length, 0)} Jenis Kasus
                                </span>
                              </div>

                              {category.auto_assign_department && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                                    {category.auto_assign_department.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-semibold"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>

                      {expandedCategories.has(category.id) && (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-6">
                          <div className="space-y-4">
                            {(category.subCategories || []).map((subCategory, subIdx) => (
                              <div key={subCategory.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                                    {subIdx + 1}
                                  </span>
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base">{subCategory.name}</h4>
                                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-bold">
                                    SUB-KATEGORI
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    ({(subCategory.caseTypes || []).length} tipe)
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2.5 ml-10">
                                  {(subCategory.caseTypes || []).map((caseType) => (
                                    <div key={caseType.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                                      <input 
                                        type="checkbox" 
                                        disabled 
                                        className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                        {caseType.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            
                            {(category.subCategories || []).length === 0 && (
                              <div className="text-center py-12 px-4">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Belum ada sub-kategori</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Klik Edit untuk menambahkan sub-kategori dan jenis kasus</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {showCategoryForm && editingCategory && (
                  <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full my-8 border-2 border-gray-200 dark:border-gray-700">
                      <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 px-8 py-6 rounded-t-2xl border-b-4 border-emerald-800 dark:border-emerald-900">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <TagIcon className="h-7 w-7" />
                          {categories.find(c => c.id === editingCategory.id) ? 'Edit' : 'Tambah'} Kategori Komplain
                        </h3>
                        <p className="text-sm text-emerald-100 mt-1">
                          Kelola kategori, sub-kategori, dan jenis kasus komplain dengan sistem 3 level
                        </p>
                      </div>
                      
                      <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-1 space-y-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-emerald-600 dark:bg-emerald-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">1</span>
                                Kategori Utama
                              </h4>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                                    Nama Kategori *
                                  </label>
                                  <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 text-sm font-medium transition-all"
                                    placeholder="Contoh: Masalah Pengiriman"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                                    Deskripsi *
                                  </label>
                                  <textarea
                                    value={editingCategory.description}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 text-sm font-medium transition-all resize-none"
                                    placeholder="Jelaskan kategori ini..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                                    Auto-Assign Departemen
                                  </label>
                                  <select
                                    value={editingCategory.auto_assign_department}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, auto_assign_department: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-sm font-medium transition-all"
                                  >
                                    <option value="customer_service">Customer Service</option>
                                    <option value="quality_assurance">Quality Assurance</option>
                                    <option value="technical">Technical</option>
                                    <option value="management">Management</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleAddSubCategory}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              Tambah Sub-Kategori
                            </button>
                          </div>

                          <div className="col-span-1">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm h-full flex flex-col">
                              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span>
                                Sub-Kategori 
                                <span className="ml-auto px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 rounded-full text-xs font-bold">
                                  {editingCategory.subCategories.length}
                                </span>
                              </h4>
                              
                              <div className="space-y-2.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {editingCategory.subCategories.map((subCategory, subIdx) => (
                                  <div 
                                    key={subIdx}
                                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer group ${
                                      selectedSubCategoryIndex === subIdx
                                        ? 'bg-blue-100 dark:bg-blue-800/50 border-blue-500 dark:border-blue-400 shadow-md scale-[1.02]'
                                        : 'bg-white dark:bg-gray-700 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'
                                    }`}
                                    onClick={() => setSelectedSubCategoryIndex(subIdx)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className={`flex items-center justify-center min-w-[24px] h-6 rounded-md text-xs font-bold mt-0.5 ${
                                        selectedSubCategoryIndex === subIdx
                                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                          : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                      }`}>
                                        {subIdx + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <input
                                          type="text"
                                          value={subCategory.name}
                                          onChange={(e) => {
                                            const updated = [...editingCategory.subCategories];
                                            updated[subIdx].name = e.target.value;
                                            setEditingCategory({ ...editingCategory, subCategories: updated });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full px-2.5 py-1.5 border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                                          placeholder="Nama sub-kategori..."
                                        />
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5 font-medium">
                                          <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                          </svg>
                                          {subCategory.caseTypes.length} jenis kasus
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`Hapus sub-kategori "${subCategory.name}"?`)) {
                                            handleDeleteSubCategory(subIdx);
                                          }
                                        }}
                                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                
                                {editingCategory.subCategories.length === 0 && (
                                  <div className="flex flex-col items-center justify-center h-full py-12">
                                    <svg className="w-16 h-16 text-blue-300 dark:text-blue-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <p className="text-center text-blue-600 dark:text-blue-400 text-sm font-semibold">
                                      Belum ada sub-kategori
                                    </p>
                                    <p className="text-center text-blue-500 dark:text-blue-500 text-xs mt-1">
                                      Klik tombol di bawah untuk menambah
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-1">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm h-full flex flex-col">
                              <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-purple-600 dark:bg-purple-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">3</span>
                                Jenis Kasus / Tipe Masalah
                              </h4>
                              
                              {selectedSubCategoryIndex !== null ? (
                                <div className="space-y-3 flex-1 flex flex-col">
                                  <div className="bg-purple-200 dark:bg-purple-800/50 p-3 rounded-lg border border-purple-300 dark:border-purple-700">
                                    <p className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">Sub-Kategori Terpilih:</p>
                                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                      {editingCategory.subCategories[selectedSubCategoryIndex]?.name || 'Belum ada nama'}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleAddCaseType(selectedSubCategoryIndex)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white font-bold rounded-xl hover:from-purple-500 hover:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tambah Jenis Kasus
                                  </button>

                                  <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {editingCategory.subCategories[selectedSubCategoryIndex]?.caseTypes.map((caseType, caseIdx) => (
                                      <div key={caseIdx} className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-700 rounded-lg border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
                                        <span className="text-xs text-purple-600 dark:text-purple-400 font-bold w-7 h-7 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-md flex-shrink-0">
                                          {caseIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={caseType.name}
                                          onChange={(e) => {
                                            const updated = [...editingCategory.subCategories];
                                            updated[selectedSubCategoryIndex].caseTypes[caseIdx].name = e.target.value;
                                            setEditingCategory({ ...editingCategory, subCategories: updated });
                                          }}
                                          className="flex-1 px-2.5 py-1.5 border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                                          placeholder="Nama jenis kasus..."
                                        />
                                        <button
                                          onClick={() => {
                                            if (window.confirm('Hapus jenis kasus ini?')) {
                                              handleDeleteCaseType(selectedSubCategoryIndex, caseIdx);
                                            }
                                          }}
                                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                    
                                    {editingCategory.subCategories[selectedSubCategoryIndex]?.caseTypes.length === 0 && (
                                      <div className="flex flex-col items-center justify-center h-full py-12">
                                        <svg className="w-16 h-16 text-purple-300 dark:text-purple-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <p className="text-center text-purple-600 dark:text-purple-400 text-sm font-semibold">
                                          Belum ada jenis kasus
                                        </p>
                                        <p className="text-center text-purple-500 dark:text-purple-500 text-xs mt-1">
                                          Klik tombol di atas untuk menambah
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <svg className="w-20 h-20 text-purple-300 dark:text-purple-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  <p className="text-center text-purple-600 dark:text-purple-400 text-base font-semibold mb-1">
                                    Pilih Sub-Kategori
                                  </p>
                                  <p className="text-center text-purple-500 dark:text-purple-500 text-sm">
                                    Pilih sub-kategori di kolom tengah<br />untuk mengelola jenis kasus
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 px-8 py-5 rounded-b-2xl flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-bold text-blue-900 dark:text-blue-300">
                              {editingCategory.subCategories.length} Sub-Kategori
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span className="font-bold text-purple-900 dark:text-purple-300">
                              {editingCategory.subCategories.reduce((sum, sub) => sum + sub.caseTypes.length, 0)} Jenis Kasus
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowCategoryForm(false);
                              setEditingCategory(null);
                              setSelectedSubCategoryIndex(null);
                            }}
                            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveCategoryForm}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                          >
                            {saving ? (
                              <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-5 w-5" />
                                Simpan Kategori
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Pengaturan Notifikasi</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-300 mb-1">Email Notifikasi ke Customer</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Kirim email otomatis saat komplain dibuat/diupdate</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications_enabled}
                        onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Notifikasi Internal</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Pengaturan notifikasi untuk admin dan tim customer care
                    </p>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 dark:focus:ring-emerald-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Komplain baru masuk</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 dark:focus:ring-emerald-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Komplain kritis atau urgent</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 dark:focus:ring-emerald-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Mendekati batas waktu SLA</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 dark:focus:ring-emerald-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Customer memberikan rating/feedback</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Simpan Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Template Email</h2>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
                  <div className="flex items-start gap-3">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Template Email Otomatis</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Template email ini akan digunakan untuk mengirim notifikasi otomatis kepada pelanggan. 
                        Anda dapat menggunakan variabel seperti <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">{'{customer_name}'}</code>, 
                        <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded mx-1">{'{complaint_number}'}</code>, dan 
                        <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">{'{status}'}</code>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                      Email Konfirmasi Komplain Baru
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Komplain Anda Telah Diterima - {complaint_number}"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-semibold mb-2">Halo {'{customer_name}'},</p>
                          <p className="mb-2">Terima kasih telah menghubungi kami. Komplain Anda telah kami terima dengan nomor referensi: <strong>{'{complaint_number}'}</strong></p>
                          <p className="mb-2">Tim customer care kami akan menindaklanjuti dalam waktu maksimal 24 jam.</p>
                          <p>Hormat kami,<br />PT Advanta Seeds Indonesia</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                      Email Update Status
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Update Komplain {complaint_number}"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-semibold mb-2">Halo {'{customer_name}'},</p>
                          <p className="mb-2">Ada update terbaru untuk komplain Anda: <strong>{'{complaint_number}'}</strong></p>
                          <p className="mb-2">Status saat ini: <strong>{'{status}'}</strong></p>
                          <p className="mb-2">Silakan klik link berikut untuk melihat detail: {'{tracking_link}'}</p>
                          <p>Hormat kami,<br />PT Advanta Seeds Indonesia</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                      Email Komplain Selesai
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Komplain {complaint_number} Telah Diselesaikan"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-semibold mb-2">Halo {'{customer_name}'},</p>
                          <p className="mb-2">Komplain Anda dengan nomor <strong>{'{complaint_number}'}</strong> telah diselesaikan.</p>
                          <p className="mb-2">Kami berharap solusi yang diberikan dapat memuaskan Anda.</p>
                          <p className="mb-2">Mohon berikan rating kepuasan Anda: {'{feedback_link}'}</p>
                          <p>Terima kasih atas kepercayaan Anda.<br />PT Advanta Seeds Indonesia</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => alert('Template berhasil disimpan!')}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Simpan Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}