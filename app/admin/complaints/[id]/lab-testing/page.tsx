'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  BeakerIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toast, Toaster } from 'react-hot-toast';

export default function LabTestingFormPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Market Sample
    market_sample_received_date: '',
    market_germination_result_date: '',
    market_vigour_result_date: '',
    market_germination_percent: '',
    market_vigour_percent: '',
    market_physical_purity_percent: '',
    market_mc_percent: '',
    market_genetic_purity_percent: '',
    market_result: '',
    
    // Guard Sample
    guard_sample_received_date: '',
    guard_germination_result_date: '',
    guard_vigour_result_date: '',
    guard_germination_percent: '',
    guard_vigour_percent: '',
    guard_physical_purity_percent: '',
    guard_mc_percent: '',
    guard_genetic_purity_percent: '',
    guard_result: '',
    
    // Additional Info
    lab_technician_name: '',
    testing_method: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/complaints/${id}/lab-testing`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            const formatDate = (d: string) => d ? d.split('T')[0] : '';
            setFormData(prev => ({
              ...prev,
              ...result.data,
              market_sample_received_date: formatDate(result.data.market_sample_received_date),
              market_germination_result_date: formatDate(result.data.market_germination_result_date),
              market_vigour_result_date: formatDate(result.data.market_vigour_result_date),
              guard_sample_received_date: formatDate(result.data.guard_sample_received_date),
              guard_germination_result_date: formatDate(result.data.guard_germination_result_date),
              guard_vigour_result_date: formatDate(result.data.guard_vigour_result_date),
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching lab testing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/complaints/${id}/lab-testing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Gagal menyimpan');

      toast.success('Data lab testing berhasil disimpan!');
      setTimeout(() => router.push(`/admin/complaints/${id}`), 1500);

    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/admin/complaints/${id}`} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BeakerIcon className="h-6 w-6 text-emerald-600" />
                Formulir Lab Testing
              </h1>
              <p className="text-sm text-gray-500">Hasil pengujian laboratorium untuk Market Sample & Guard Sample</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Info Lab Technician */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4">Informasi Teknisi Lab</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Teknisi Lab <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="lab_technician_name" 
                  required 
                  value={formData.lab_technician_name} 
                  onChange={handleChange} 
                  className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  placeholder="Nama teknisi yang melakukan pengujian"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Metode Pengujian</label>
                <input 
                  type="text" 
                  name="testing_method" 
                  value={formData.testing_method} 
                  onChange={handleChange} 
                  className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  placeholder="e.g. ISTA, AOSA"
                />
              </div>
            </div>
          </div>

          {/* MARKET SAMPLE */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-blue-300 dark:border-blue-800 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
                Market Sample
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Tanggal */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sample Received Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="market_sample_received_date" 
                    required 
                    value={formData.market_sample_received_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Germination Result Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="market_germination_result_date" 
                    required 
                    value={formData.market_germination_result_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vigour Result Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="market_vigour_result_date" 
                    required 
                    value={formData.market_vigour_result_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Persentase */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Germination (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="market_germination_percent" 
                    required 
                    value={formData.market_germination_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vigour (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="market_vigour_percent" 
                    required 
                    value={formData.market_vigour_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Physical Purity (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="market_physical_purity_percent" 
                    required 
                    value={formData.market_physical_purity_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MC (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="market_mc_percent" 
                    required 
                    value={formData.market_mc_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Genetic Purity (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="market_genetic_purity_percent" 
                    required 
                    value={formData.market_genetic_purity_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Result */}
              <div>
                <label className="block text-sm font-medium mb-1">Result <span className="text-red-500">*</span></label>
                <textarea 
                  name="market_result" 
                  required 
                  rows={3}
                  value={formData.market_result} 
                  onChange={handleChange} 
                  className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  placeholder="Kesimpulan hasil pengujian market sample..."
                />
              </div>
            </div>
          </div>

          {/* GUARD SAMPLE */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl shadow-lg border-2 border-emerald-300 dark:border-emerald-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
                Guard Sample
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Tanggal */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sample Received Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="guard_sample_received_date" 
                    required 
                    value={formData.guard_sample_received_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Germination Result Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="guard_germination_result_date" 
                    required 
                    value={formData.guard_germination_result_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vigour Result Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="guard_vigour_result_date" 
                    required 
                    value={formData.guard_vigour_result_date} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Persentase */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Germination (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="guard_germination_percent" 
                    required 
                    value={formData.guard_germination_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vigour (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="guard_vigour_percent" 
                    required 
                    value={formData.guard_vigour_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Physical Purity (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="guard_physical_purity_percent" 
                    required 
                    value={formData.guard_physical_purity_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MC (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="guard_mc_percent" 
                    required 
                    value={formData.guard_mc_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Genetic Purity (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="guard_genetic_purity_percent" 
                    required 
                    value={formData.guard_genetic_purity_percent} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Result */}
              <div>
                <label className="block text-sm font-medium mb-1">Result <span className="text-red-500">*</span></label>
                <textarea 
                  name="guard_result" 
                  required 
                  rows={3}
                  value={formData.guard_result} 
                  onChange={handleChange} 
                  className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
                  placeholder="Kesimpulan hasil pengujian guard sample..."
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4">Catatan Tambahan</h2>
            <textarea 
              name="notes" 
              rows={4}
              value={formData.notes} 
              onChange={handleChange} 
              className="w-full rounded-lg border p-2.5 dark:bg-gray-700"
              placeholder="Catatan atau observasi tambahan dari lab testing..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/admin/complaints/${id}`}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold bg-white dark:bg-gray-700 border rounded-xl hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <BeakerIcon className="h-5 w-5" />
                  Simpan Hasil Lab Testing
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}