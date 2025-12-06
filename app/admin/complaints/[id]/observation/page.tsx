'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  DocumentMagnifyingGlassIcon, 
  PhotoIcon 
} from '@heroicons/react/24/outline';
import { toast, Toaster } from 'react-hot-toast';

export default function ObservationFormPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    planting_date: '',
    label_expired_date: '',
    purchase_date: '',
    purchase_place: '',
    purchase_address: '',
    observer_name: '',
    observer_position: '',
    observation_date: new Date().toISOString().split('T')[0],
    is_germination_issue: '',
    germination_below_85: '',
    seed_not_found: '',
    seed_not_grow_soil: '',
    seed_damaged_chemical: '',
    seed_damaged_insect: '',
    fungal_infection: '',
    seed_excavated: '',
    additional_seed_treatment: '',
    seed_soaking: '',
    planting_depth_over_7cm: '',
    has_purchase_proof: '',
    has_packaging_evidence: '',
    replacement_qty: '',
    replacement_hybrid: '',
    general_notes: '',
    observation_result: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/complaints/${id}/observation`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setFormData(prev => ({
              ...prev,
              ...result.data,
              observation_date: result.data.observation_date ? result.data.observation_date.split('T')[0] : prev.observation_date
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching observation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/complaints/${id}/observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Gagal menyimpan data observasi');

      toast.success('Data observasi berhasil disimpan!');
      
      setTimeout(() => {
        router.push(`/admin/complaints/${id}`);
      }, 1500);

    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const RadioField = ({ name, label, required = false }: { name: string; label: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value="Ya"
            checked={formData[name as keyof typeof formData] === 'Ya'}
            onChange={handleChange}
            required={required}
            className="w-4 h-4 text-cyan-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Ya</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value="Tidak"
            checked={formData[name as keyof typeof formData] === 'Tidak'}
            onChange={handleChange}
            required={required}
            className="w-4 h-4 text-cyan-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Tidak</span>
        </label>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Memuat form observasi...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <Toaster position="top-right" />
      
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/admin/complaints/${id}`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-cyan-600" />
                Formulir Observasi Lapangan
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Isi data hasil pengamatan sesuai kondisi riil di lapangan
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: DATA PENANAMAN & PEMBELIAN (BARU) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-800">
              <h2 className="font-bold text-teal-900 dark:text-teal-200">1. Data Penanaman & Pembelian</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Tanggal Penanaman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Penanaman (jika sudah ditanam) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="planting_date"
                  value={formData.planting_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>

              {/* Masa Berlaku Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Masa Berlaku Label (Expired Date) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="label_expired_date"
                  value={formData.label_expired_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>

              {/* Tanggal Pembelian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Pembelian Benih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>

               {/* Tempat Pembelian */}
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tempat Pembelian Benih (Nama Toko) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="purchase_place"
                  value={formData.purchase_place}
                  onChange={handleChange}
                  required
                  placeholder="Nama Toko / Kios / Dealer"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>

               {/* Alamat Pembelian */}
               <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat Pembelian Benih <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="purchase_address"
                  rows={2}
                  value={formData.purchase_address}
                  onChange={handleChange}
                  required
                  placeholder="Alamat lengkap tempat pembelian..."
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>

            </div>
          </div>
          
          {/* SECTION 2: DATA OBSERVER */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-100 dark:border-cyan-800">
              <h2 className="font-bold text-cyan-900 dark:text-cyan-200">2. Data Pelaksana Observasi</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Pelaksana Observasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="observer_name"
                  value={formData.observer_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                  placeholder="Nama lengkap observer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jabatan / Posisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="observer_position"
                  value={formData.observer_position}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                  placeholder="ex. BS / TD Agronomist / Field Inspector"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Observasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="observation_date"
                  value={formData.observation_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: MASALAH GERMINASI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
              <h2 className="font-bold text-green-900 dark:text-green-200">3. Masalah Germinasi & Daya Tumbuh</h2>
            </div>
            <div className="p-6 space-y-6">
              <RadioField name="is_germination_issue" label="Apakah keluhan terkait dengan masalah germinasi/daya tumbuh?" required />
              <RadioField name="germination_below_85" label="Apakah daya tumbuh di bawah 85%?" required />
              <RadioField name="seed_not_found" label="Tidak ditemukan benih (dimakan oleh ayam, burung atau tikus, dll)" required />
              <RadioField name="seed_not_grow_soil" label="Benih tidak tumbuh (terkait dengan kondisi tanah yang tidak baik)" required />
              <RadioField name="seed_damaged_chemical" label="Benih tidak tumbuh (kondisi tanah yang tidak baik atau benih rusak diakibatkan kontak dengan pupuk/pestisida)" required />
              <RadioField name="seed_damaged_insect" label="Benih rusak oleh serangga" required />
              <RadioField name="fungal_infection" label="Serangan infeksi jamur (disebabkan oleh genangan air yang berlebihan)" required />
              <RadioField name="seed_excavated" label="Benih sudah tergali (dikarenakan oleh ayam, burung atau tikus, dll)" required />
              <RadioField name="additional_seed_treatment" label="Penambahan seed treatment lainnya (Pesticides)" required />
              <RadioField name="seed_soaking" label="Perendaman benih" required />
              <RadioField name="planting_depth_over_7cm" label="Penanaman benih dalam lebih dari kedalaman 7 cm" required />
            </div>
          </div>

          {/* SECTION 4: BUKTI & DOKUMENTASI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
              <h2 className="font-bold text-purple-900 dark:text-purple-200">4. Bukti & Dokumentasi</h2>
            </div>
            <div className="p-6 space-y-6">
              <RadioField name="has_purchase_proof" label="Apakah ada bukti pembelian? (nota pembelian)" />
              <RadioField name="has_packaging_evidence" label="Apakah ada bekas kemasan yang masih bisa diamati?" />

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dokumentasi terkait komplain <span className="text-red-500">*</span>
                  <span className="block text-xs text-gray-500 mt-1">Foto kemasan, lahan penanaman, dll (Max 10 file, 100MB per file)</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klik untuk upload</span></p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Word, Excel, PDF, Image, Video, Audio</p>
                    </div>
                    <input type="file" className="hidden" multiple accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: PROPOSE REPLACEMENT */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
              <h2 className="font-bold text-amber-900 dark:text-amber-200">5. Propose Direct Replacement</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qty</label>
                <input
                  type="number"
                  name="replacement_qty"
                  value={formData.replacement_qty}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                  placeholder="Jumlah unit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hybrid</label>
                <input
                  type="text"
                  name="replacement_hybrid"
                  value={formData.replacement_hybrid}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                  placeholder="Nama varietas hybrid"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: CATATAN TAMBAHAN */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
              <h2 className="font-bold text-red-900 dark:text-red-200">6. Catatan Tambahan</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan Umum</label>
              <textarea
                name="general_notes"
                rows={4}
                value={formData.general_notes}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                placeholder="Tambahkan informasi penting lainnya..."
              />
            </div>
          </div>

          {/* SECTION 7: KEPUTUSAN / HASIL OBSERVASI (BARU) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <h2 className="font-bold text-blue-900 dark:text-blue-200">7. Keputusan Hasil Observasi</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Apakah komplain ini valid dan dapat diterima? <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilihan Diterima */}
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  formData.observation_result === 'Valid' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="observation_result"
                    value="Valid"
                    checked={formData.observation_result === 'Valid'}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">
                      Komplain memenuhi syarat (Diterima)
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Masalah terbukti dari benih/produk, lanjut ke proses penggantian.
                    </span>
                  </div>
                </label>

                {/* Pilihan Ditolak */}
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  formData.observation_result === 'Invalid' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="observation_result"
                    value="Invalid"
                    checked={formData.observation_result === 'Invalid'}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">
                      Komplain tidak memenuhi syarat (Ditolak)
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Masalah akibat faktor eksternal/budidaya, komplain ditutup.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href={`/admin/complaints/${id}`}
              className="px-6 py-3 text-gray-700 font-semibold bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Hasil Observasi'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}