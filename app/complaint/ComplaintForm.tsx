// app/complaint/ComplaintForm.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr'; 
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
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhotoIcon,
  TagIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ComplaintFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_province: string;
  customer_city: string;
  customer_address: string;
  complaint_category_id: string;
  complaint_category_name: string;
  complaint_subcategory_id: string;
  complaint_subcategory_name: string;
  complaint_case_type_ids: string[];  // Array untuk multiple selection
  complaint_case_type_names: string[]; // Array untuk multiple selection
  subject: string;
  description: string;
  related_product_serial?: string;
  related_product_name?: string;
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
  id: number;
  name: string;
  description: string;
  auto_assign_department?: string;
  subCategories: SubCategory[];
}

interface Province {
  id: number;
  name: string;
}

interface Regency {
  id: number;
  province_id: number;
  name: string;
}

export default function ComplaintForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  
  const productId = searchParams?.get('product_id') || '';
  const serial = searchParams?.get('serial') || '';
  const lot = searchParams?.get('lot') || '';
  const productNameQuery = searchParams?.get('product') || '';
  const customerName = searchParams?.get('name') || '';
  const customerEmail = searchParams?.get('email') || '';
  const customerPhone = searchParams?.get('phone') || '';
  
  const [productPhoto, setProductPhoto] = useState<string>('');
  const [photoLoading, setPhotoLoading] = useState(false);
  
  // State untuk 3 Level Categories
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [selectedCaseTypeIds, setSelectedCaseTypeIds] = useState<string[]>([]); // Multiple selection
  const [categoryError, setCategoryError] = useState('');
  
  // State untuk lokasi dari Supabase
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [availableRegencies, setAvailableRegencies] = useState<Regency[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  const [formData, setFormData] = useState<ComplaintFormData>({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_province: '',
    customer_city: '',
    customer_address: '',
    complaint_category_id: '',
    complaint_category_name: '',
    complaint_subcategory_id: '',
    complaint_subcategory_name: '',
    complaint_case_type_ids: [],
    complaint_case_type_names: [],
    subject: '',
    description: '',
    related_product_serial: serial || lot,
    related_product_name: productNameQuery
  });

  const selectedCategory = categories.find(c => Number(c.id) === Number(selectedCategoryId));
  const selectedSubCategory = selectedCategory?.subCategories.find(s => s.id === selectedSubCategoryId);

  useEffect(() => {
    setMounted(true);
    loadCategories();
    loadLocations();
  }, []);

  useEffect(() => {
    if (mounted && productId) {
      const fetchProductData = async () => {
        setPhotoLoading(true);
        const { data: productData, error } = await supabase
          .from('products')
          .select('name, photo')
          .eq('id', productId)
          .single();

        if (productData) {
          setFormData(prev => ({
            ...prev,
            related_product_name: productData.name
          }));
          setProductPhoto(productData.photo || '');
        } else {
          console.error('Error fetching product data:', error?.message);
        }
        setPhotoLoading(false);
      };
      fetchProductData();
    }
  }, [mounted, productId, supabase]);

  useEffect(() => {
    if (formData.customer_province) {
      const selectedProvince = provinces.find(p => p.name === formData.customer_province);
      if (selectedProvince) {
        const filtered = regencies.filter(r => r.province_id === selectedProvince.id);
        setAvailableRegencies(filtered);
      }
      setFormData(prev => ({ ...prev, customer_city: '' }));
    } else {
      setAvailableRegencies([]);
    }
  }, [formData.customer_province, provinces, regencies]);

  // Update formData when case types change
  useEffect(() => {
    if (selectedSubCategory && selectedCaseTypeIds.length > 0) {
      const selectedNames = selectedCaseTypeIds
        .map(id => selectedSubCategory.caseTypes.find(ct => ct.id === id)?.name)
        .filter(Boolean) as string[];
      
      setFormData(prev => ({
        ...prev,
        complaint_case_type_ids: selectedCaseTypeIds,
        complaint_case_type_names: selectedNames
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        complaint_case_type_ids: [],
        complaint_case_type_names: []
      }));
    }
  }, [selectedCaseTypeIds, selectedSubCategory]);

  const loadLocations = async () => {
    try {
      const [provincesRes, regenciesRes] = await Promise.all([
        supabase.from('provinces').select('id, name').order('name'),
        supabase.from('regencies').select('id, province_id, name').order('name')
      ]);

      if (provincesRes.data) {
        setProvinces(provincesRes.data);
      }
      if (regenciesRes.data) {
        setRegencies(regenciesRes.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // 🔥 UBAH: Ganti ke endpoint public
      const response = await fetch('/api/public/complaint-categories');
      const data = await response.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const numericId = categoryId ? Number(categoryId) : '';
    setSelectedCategoryId(numericId);
    setSelectedSubCategoryId('');
    setSelectedCaseTypeIds([]);
    setFormData(prev => ({
      ...prev,
      complaint_category_id: '',
      complaint_category_name: '',
      complaint_subcategory_id: '',
      complaint_subcategory_name: '',
      complaint_case_type_ids: [],
      complaint_case_type_names: []
    }));
    setCategoryError('');
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setSelectedSubCategoryId(subCategoryId);
    setSelectedCaseTypeIds([]);
    
    const category = categories.find(c => Number(c.id) === Number(selectedCategoryId));
    const subCategory = category?.subCategories.find(s => s.id === subCategoryId);

    if (category && subCategory) {
      setFormData(prev => ({
        ...prev,
        complaint_category_id: String(category.id),
        complaint_category_name: category.name,
        complaint_subcategory_id: subCategory.id,
        complaint_subcategory_name: subCategory.name,
        complaint_case_type_ids: [],
        complaint_case_type_names: []
      }));
    }
  };

  const handleCaseTypeToggle = (caseTypeId: string) => {
    setSelectedCaseTypeIds(prev => {
      if (prev.includes(caseTypeId)) {
        return prev.filter(id => id !== caseTypeId);
      }
      return [...prev, caseTypeId];
    });
    setCategoryError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.complaint_category_id || !formData.complaint_subcategory_id) {
      setCategoryError('Silakan pilih kategori dan sub-kategori');
      return;
    }

    if (selectedCaseTypeIds.length === 0) {
      setCategoryError('Silakan pilih minimal 1 jenis masalah');
      return;
    }
    
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

  // Handler untuk "Laporkan Masalah Lain"
  const handleReportAnother = () => {
    setIsSubmitted(false);
    setComplaintNumber('');
    
    // Reset form tapi keep customer info
    setSelectedCategoryId('');
    setSelectedSubCategoryId('');
    setSelectedCaseTypeIds([]);
    setCategoryError('');
    
    setFormData(prev => ({
      ...prev,
      complaint_category_id: '',
      complaint_category_name: '',
      complaint_subcategory_id: '',
      complaint_subcategory_name: '',
      complaint_case_type_ids: [],
      complaint_case_type_names: [],
      subject: '',
      description: ''
    }));

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 px-8 py-12 text-center">
              <div className="relative inline-block mb-6">
                <CheckCircleIcon className="h-20 w-20 text-white mx-auto" />
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Komplain Berhasil Dikirim
              </h1>
              <p className="text-emerald-100 dark:text-emerald-200 text-lg">
                Terima kasih atas laporan Anda
              </p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-6">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Nomor Komplain Anda:</span>
                  <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{complaintNumber}</span>
                </div>
                
                <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
                  Komplain Anda telah diterima dan akan ditindaklanjuti oleh tim kami dalam waktu maksimal 24 jam. 
                  Anda akan mendapat email konfirmasi sebentar lagi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link
                  href={`/complaint/${complaintNumber}/status`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-semibold rounded-xl hover:from-blue-400 hover:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Lacak Status
                </Link>
                
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-300"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Kembali ke Beranda
                </Link>
              </div>

              {/* Tombol "Laporkan Masalah Lain" - BARU */}
              <div className="mb-8 pt-6 border-t-2 border-dashed border-gray-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <PlusCircleIcon className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Ada Masalah Lain?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Jika Anda memiliki masalah tambahan yang berbeda, silakan buat laporan komplain terpisah dengan nomor referensi baru.
                      </p>
                      <button
                        onClick={handleReportAnother}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 dark:hover:from-orange-700 dark:hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        <PlusCircleIcon className="h-5 w-5 transition-transform group-hover:rotate-90" />
                        Laporkan Masalah Lain
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-4">Langkah Selanjutnya:</h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Tim kami akan mengirim email konfirmasi dalam beberapa menit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Anda dapat melacak status komplain menggunakan nomor referensi di atas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/30">
      
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="h-6 sm:h-8 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-slate-100 truncate">Formulir Komplain</h1>
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/80 dark:border-slate-700/80 overflow-hidden">
          
          <div className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 px-8 py-12 text-center">
            <div className="relative inline-block mb-6">
              <ExclamationTriangleIcon className="h-16 w-16 text-white mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Sampaikan Komplain Anda
            </h2>
            <p className="text-red-100 dark:text-orange-100 text-lg max-w-2xl mx-auto">
              Kami menghargai feedback Anda dan berkomitmen untuk menyelesaikan setiap masalah dengan cepat dan profesional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Personal Info (SAMA SEPERTI SEBELUMNYA) */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <UserIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  Informasi Kontak
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Email <span className="text-slate-400">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Nomor WhatsApp *
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Lokasi
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        Provinsi *
                      </label>
                      <select
                        name="customer_province"
                        value={formData.customer_province}
                        onChange={handleChange}
                        required
                        disabled={locationsLoading}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{locationsLoading ? 'Memuat...' : 'Pilih Provinsi'}</option>
                        {provinces.map(province => (
                          <option key={province.id} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        Kabupaten/Kota *
                      </label>
                      <select
                        name="customer_city"
                        value={formData.customer_city}
                        onChange={handleChange}
                        required
                        disabled={!formData.customer_province || locationsLoading}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {locationsLoading ? 'Memuat...' : formData.customer_province ? 'Pilih Kabupaten/Kota' : 'Pilih Provinsi terlebih dahulu'}
                        </option>
                        {availableRegencies.map(regency => (
                          <option key={regency.id} value={regency.name}>
                            {regency.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        Alamat Lengkap *
                      </label>
                      <textarea
                        name="customer_address"
                        value={formData.customer_address}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        placeholder="Jalan, RT/RW, Kelurahan/Desa, Kecamatan"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Info Card (SAMA SEPERTI SEBELUMNYA) */}
                {(formData.related_product_serial || formData.related_product_name) && (
                  <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-900/20 dark:via-slate-800 dark:to-emerald-900/10 rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-400/10 to-transparent rounded-tr-full"></div>
                    
                    <div className="relative z-10">
                      <h4 className="text-lg sm:text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Produk Terkait
                      </h4>
                      
                      {photoLoading ? (
                        <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-2xl mb-4 shadow-inner"></div>
                      ) : productPhoto ? (
                        <div className="group relative w-full mb-4 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600">
                          <div className="relative aspect-[4/3] sm:aspect-video w-full">
                            <img 
                              src={productPhoto} 
                              alt={formData.related_product_name || 'Produk'}
                              className="absolute inset-0 w-full h-full object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-48 sm:h-56 md:h-64 mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:via-emerald-800/20 dark:to-emerald-900/10 border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-inner">
                          <div className="text-center">
                            <div className="relative inline-block mb-3">
                              <PhotoIcon className="h-16 w-16 sm:h-20 sm:w-20 text-emerald-400 dark:text-emerald-500 opacity-40" />
                              <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full"></div>
                            </div>
                            <p className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">Foto Tidak Tersedia</p>
                            <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">Produk belum memiliki foto</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 bg-white/50 dark:bg-slate-900/30 rounded-xl p-4 backdrop-blur-sm border border-emerald-100 dark:border-emerald-900">
                        {formData.related_product_name && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                              <span className="text-white text-xs font-bold">📦</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Nama Produk</p>
                              <p className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200 break-words leading-tight">{formData.related_product_name}</p>
                            </div>
                          </div>
                        )}
                        
                        {formData.related_product_serial && (
                          <div className="flex items-start gap-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                              <span className="text-white text-xs font-bold">#</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Serial/Lot Number</p>
                              <p className="text-sm sm:text-base font-mono font-bold text-blue-900 dark:text-blue-200 break-all">{formData.related_product_serial}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Complaint Details dengan Multiple Checkbox */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  Detail Komplain
                </h3>

                {/* 3 Level Category Selector dengan Multiple Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Kategori Komplain</h4>
                  </div>

                  {categoriesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Level 1: Kategori */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                          Kategori *
                          <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded text-xs font-bold">
                            Level 1
                          </span>
                        </label>
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
                        >
                          <option value="">-- Pilih Kategori --</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {selectedCategory && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1.5 ml-1">
                            {selectedCategory.description}
                          </p>
                        )}
                      </div>

                      {/* Level 2: Sub-Kategori */}
                      {selectedCategoryId && (
                        <div className="pl-4 border-l-4 border-blue-300 dark:border-blue-700">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Sub-Kategori *
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-bold">
                              Level 2
                            </span>
                          </label>
                          <select
                            value={selectedSubCategoryId}
                            onChange={(e) => handleSubCategoryChange(e.target.value)}
                            required
                            className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                          >
                            <option value="">-- Pilih Sub-Kategori --</option>
                            {selectedCategory?.subCategories.map((subCategory) => (
                              <option key={subCategory.id} value={subCategory.id}>
                                {subCategory.name} ({subCategory.caseTypes.length} tipe)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Level 3: Multiple Case Types dengan Checkbox */}
                      {selectedSubCategoryId && (
                        <div className="pl-8 border-l-4 border-purple-300 dark:border-purple-700">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                            <span className="flex items-center gap-2">
                              Jenis Masalah *
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-bold">
                                Level 3
                              </span>
                            </span>
                          </label>
                          
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                            Pilih semua masalah yang Anda alami (bisa lebih dari 1):
                          </p>

                          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {selectedSubCategory?.caseTypes.map((caseType) => (
                              <label 
                                key={caseType.id}
                                className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  selectedCaseTypeIds.includes(caseType.id)
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCaseTypeIds.includes(caseType.id)}
                                  onChange={() => handleCaseTypeToggle(caseType.id)}
                                  className="mt-0.5 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 transition-all"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 leading-relaxed">
                                  {caseType.name}
                                </span>
                                {selectedCaseTypeIds.includes(caseType.id) && (
                                  <CheckCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                )}
                              </label>
                            ))}
                          </div>

                          {selectedCaseTypeIds.length > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-sm p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                              <CheckCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <span className="font-bold text-purple-700 dark:text-purple-300">
                                {selectedCaseTypeIds.length} jenis masalah dipilih
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {categoryError && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {categoryError}
                        </p>
                      )}

                      {/* Summary Selection */}
                      {selectedCategoryId && selectedSubCategoryId && selectedCaseTypeIds.length > 0 && (
                        <div className="mt-4 p-5 bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-inner">
                          <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Ringkasan Kategori:
                          </p>
                          
                          {/* Path */}
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm font-bold shadow-sm">
                              {selectedCategory?.name}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-bold shadow-sm">
                              {selectedSubCategory?.name}
                            </span>
                          </div>

                          {/* Selected Issues */}
                          <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              Masalah yang Dipilih ({selectedCaseTypeIds.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCaseTypeIds.map(id => {
                                const caseType = selectedSubCategory?.caseTypes.find(ct => ct.id === id);
                                return (
                                  <span 
                                    key={id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-lg text-xs font-semibold shadow-sm"
                                  >
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                    {caseType?.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Subject & Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Subjek Komplain *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Ringkasan singkat masalah Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Deskripsi Detail *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={8}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder="Jelaskan masalah Anda secara detail. Sertakan informasi seperti kapan masalah terjadi, langkah-langkah yang sudah dilakukan, dan dampak yang dialami."
                  />
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Dengan mengirim formulir ini, Anda menyetujui bahwa informasi yang diberikan akurat dan dapat diverifikasi.
                </p>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 text-white font-bold rounded-xl hover:from-red-400 hover:to-orange-400 dark:hover:from-red-500 dark:hover:to-orange-500 focus:ring-4 focus:ring-red-500/20 dark:focus:ring-red-400/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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

      {/* Custom Scrollbar Style */}
      <style jsx>{`
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