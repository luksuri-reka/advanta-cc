// app/admin/settings/complaints/page.tsx
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
  sla_response_time: number; // hours
  sla_resolution_time: number; // hours
  auto_assign_enabled: boolean;
  email_notifications_enabled: boolean;
  priority_auto_escalation: boolean;
  escalation_threshold_hours: number;
}

interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  default_priority: string;
  auto_assign_department?: string;
}

export default function ComplaintSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'sla' | 'categories' | 'notifications' | 'templates'>('sla');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SLA Settings
  const [settings, setSettings] = useState<ComplaintSettings>({
    sla_response_time: 24,
    sla_resolution_time: 72,
    auto_assign_enabled: true,
    email_notifications_enabled: true,
    priority_auto_escalation: true,
    escalation_threshold_hours: 48
  });

  // Categories
  const [categories, setCategories] = useState<ComplaintCategory[]>([
    {
      id: '1',
      name: 'Cacat Produk',
      description: 'Masalah terkait kualitas atau cacat fisik produk',
      default_priority: 'high',
      auto_assign_department: 'quality_assurance'
    },
    {
      id: '2',
      name: 'Masalah Kemasan',
      description: 'Kemasan rusak atau tidak sesuai',
      default_priority: 'medium',
      auto_assign_department: 'quality_assurance'
    },
    {
      id: '3',
      name: 'Masalah Performa',
      description: 'Performa produk tidak sesuai ekspektasi',
      default_priority: 'high',
      auto_assign_department: 'technical'
    },
    {
      id: '4',
      name: 'Pengiriman',
      description: 'Masalah terkait pengiriman produk',
      default_priority: 'medium',
      auto_assign_department: 'customer_service'
    }
  ]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComplaintCategory | null>(null);

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
      // Load SLA settings from database
      const slaResponse = await fetch('/api/complaint-settings/sla');
      if (slaResponse.ok) {
        const slaData = await slaResponse.json();
        if (slaData.data) {
          setSettings(slaData.data);
        }
      }
      
      // Load categories from database
      const categoriesResponse = await fetch('/api/complaint-settings/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.data && Array.isArray(categoriesData.data)) {
          setCategories(categoriesData.data);
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
      default_priority: 'medium',
      auto_assign_department: 'customer_service'
    };
    setEditingCategory(newCategory);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: ComplaintCategory) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      handleSaveCategories();
    }
  };

  const handleSaveCategoryForm = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name || !editingCategory.description) {
      alert('Nama dan deskripsi wajib diisi');
      return;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasComplaintPermission('canConfigureComplaintSystem')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses pengaturan ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CogIcon className="h-8 w-8 text-emerald-600" />
            Pengaturan Sistem Komplain
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola konfigurasi SLA, kategori, dan notifikasi untuk sistem komplain
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 group relative px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <tab.icon className={`w-5 h-5 transition-all duration-200 ${
                      activeTab === tab.id ? 'text-emerald-500 scale-110' : 'text-gray-400'
                    }`} />
                    <span>{tab.label}</span>
                  </div>
                  
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* SLA Settings Tab */}
            {activeTab === 'sla' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Service Level Agreement (SLA)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <label className="block text-sm font-semibold text-blue-900 mb-3">
                      Target Waktu Respon (jam)
                    </label>
                    <input
                      type="number"
                      value={settings.sla_response_time}
                      onChange={(e) => setSettings({ ...settings, sla_response_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <p className="text-xs text-blue-700 mt-2">
                      Waktu maksimal untuk memberikan respon pertama
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <label className="block text-sm font-semibold text-green-900 mb-3">
                      Target Waktu Penyelesaian (jam)
                    </label>
                    <input
                      type="number"
                      value={settings.sla_resolution_time}
                      onChange={(e) => setSettings({ ...settings, sla_resolution_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
                      min="1"
                    />
                    <p className="text-xs text-green-700 mt-2">
                      Waktu maksimal untuk menyelesaikan komplain
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Fitur Otomatis</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Auto-Assign Komplain</p>
                      <p className="text-sm text-gray-600">Otomatis menugaskan komplain ke departemen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.auto_assign_enabled}
                        onChange={(e) => setSettings({ ...settings, auto_assign_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Eskalasi Prioritas Otomatis</p>
                      <p className="text-sm text-gray-600">Naikkan prioritas jika melebihi threshold</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.priority_auto_escalation}
                        onChange={(e) => setSettings({ ...settings, priority_auto_escalation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {settings.priority_auto_escalation && (
                    <div className="ml-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="block text-sm font-semibold text-yellow-900 mb-2">
                        Threshold Eskalasi (jam)
                      </label>
                      <input
                        type="number"
                        value={settings.escalation_threshold_hours}
                        onChange={(e) => setSettings({ ...settings, escalation_threshold_hours: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
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

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Kategori Komplain</h2>
                  <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
                  >
                    <TagIcon className="h-5 w-5" />
                    Tambah Kategori
                  </button>
                </div>

                {/* Category List */}
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                          
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Prioritas Default:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                category.default_priority === 'critical' ? 'bg-red-100 text-red-800' :
                                category.default_priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                category.default_priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {category.default_priority.toUpperCase()}
                              </span>
                            </div>
                            
                            {category.auto_assign_department && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Departemen:</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                                  {category.auto_assign_department.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category Form Modal */}
                {showCategoryForm && editingCategory && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        {categories.find(c => c.id === editingCategory.id) ? 'Edit' : 'Tambah'} Kategori
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Kategori *
                          </label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            placeholder="Contoh: Cacat Produk"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Deskripsi *
                          </label>
                          <textarea
                            value={editingCategory.description}
                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            placeholder="Jelaskan kategori ini..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Prioritas Default
                          </label>
                          <select
                            value={editingCategory.default_priority}
                            onChange={(e) => setEditingCategory({ ...editingCategory, default_priority: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="low">Rendah</option>
                            <option value="medium">Sedang</option>
                            <option value="high">Tinggi</option>
                            <option value="critical">Kritis</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Auto-Assign ke Departemen
                          </label>
                          <select
                            value={editingCategory.auto_assign_department}
                            onChange={(e) => setEditingCategory({ ...editingCategory, auto_assign_department: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="customer_service">Customer Service</option>
                            <option value="quality_assurance">Quality Assurance</option>
                            <option value="technical">Technical</option>
                            <option value="management">Management</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8">
                        <button
                          onClick={() => {
                            setShowCategoryForm(false);
                            setEditingCategory(null);
                          }}
                          className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSaveCategoryForm}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                          {saving ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-5 w-5" />
                              Simpan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Pengaturan Notifikasi</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <div>
                      <p className="font-bold text-blue-900 mb-1">Email Notifikasi ke Customer</p>
                      <p className="text-sm text-blue-700">Kirim email otomatis saat komplain dibuat/diupdate</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications_enabled}
                        onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Notifikasi Internal</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Pengaturan notifikasi untuk admin dan tim customer care
                    </p>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600" />
                        <span className="text-sm text-gray-700">Komplain baru masuk</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600" />
                        <span className="text-sm text-gray-700">Komplain kritis atau urgent</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600" />
                        <span className="text-sm text-gray-700">Mendekati batas waktu SLA</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" />
                        <span className="text-sm text-gray-700">Customer memberikan rating/feedback</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
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

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Template Email</h2>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mb-6">
                  <div className="flex items-start gap-3">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">Template Email Otomatis</h3>
                      <p className="text-sm text-blue-700">
                        Template email ini akan digunakan untuk mengirim notifikasi otomatis kepada pelanggan. 
                        Anda dapat menggunakan variabel seperti <code className="bg-blue-200 px-1 rounded">{'{customer_name}'}</code>, 
                        <code className="bg-blue-200 px-1 rounded mx-1">{'{complaint_number}'}</code>, dan 
                        <code className="bg-blue-200 px-1 rounded">{'{status}'}</code>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Template 1: Komplain Created */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                      Email Konfirmasi Komplain Baru
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Komplain Anda Telah Diterima - {complaint_number}"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                          <p className="font-semibold mb-2">Halo {'{customer_name}'},</p>
                          <p className="mb-2">Terima kasih telah menghubungi kami. Komplain Anda telah kami terima dengan nomor referensi: <strong>{'{complaint_number}'}</strong></p>
                          <p className="mb-2">Tim customer care kami akan menindaklanjuti dalam waktu maksimal 24 jam.</p>
                          <p>Hormat kami,<br />PT Advanta Seeds Indonesia</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template 2: Status Update */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                      Email Update Status
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Update Komplain {complaint_number}"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                          <p className="font-semibold mb-2">Halo {'{customer_name}'},</p>
                          <p className="mb-2">Ada update terbaru untuk komplain Anda: <strong>{'{complaint_number}'}</strong></p>
                          <p className="mb-2">Status saat ini: <strong>{'{status}'}</strong></p>
                          <p className="mb-2">Silakan klik link berikut untuk melihat detail: {'{tracking_link}'}</p>
                          <p>Hormat kami,<br />PT Advanta Seeds Indonesia</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template 3: Resolution */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                      Email Komplain Selesai
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                          type="text"
                          defaultValue="Komplain {complaint_number} Telah Diselesaikan"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
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

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() => alert('Template berhasil disimpan!')}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
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
    </div>
  );
}