'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  BeakerIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast, Toaster } from 'react-hot-toast';

export default function InvestigationFormPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Data Investigator
    investigator_name: '',
    investigator_position: '',
    investigation_date: new Date().toISOString().split('T')[0],
    
    // Data Complaint (dari complaint utama)
    initiator_complaint: '',
    complaint_location: '',
    farmer_name: '',
    complaint_type: '',
    seed_variety: '',
    lot_number: '',
    problematic_quantity_kg: '',
    planting_date: '',
    label_expired_date: '',
    purchase_date: '',
    purchase_place: '',
    purchase_address: '',
    
    // Hasil Investigasi - Penyebab Complaint
    cause_category: '', // Delivery/Packaging atau Quality Product
    
    // Delivery / Packaging Issues (jika cause_category = Delivery/Packaging)
    packaging_damage: '',
    product_error: '',
    delivery_issue: '',
    delivery_condition: '',
    
    // Quality Product Issues (jika cause_category = Quality Product)
    growth_issue: '',
    seed_treatment_issue: '',
    product_appearance: '',
    product_purity: '',
    seed_health: '',
    physiological_factors: '',
    genetic_issue: '',
    herbicide_damage: '',
    product_performance: '',
    product_expired: '',
    
    // Informasi Tambahan
    problem_description: '',
    action_taken: '',
    pest_info: '',
    agronomic_aspect: '',
    environment_info: '',
    plant_performance_phase: '',
    
    // Kesimpulan
    investigation_conclusion: '',
    root_cause_determination: '',
    long_term_corrective_action: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch complaint data
        const complaintRes = await fetch(`/api/complaints/${id}`);
        if (complaintRes.ok) {
          const complaintData = await complaintRes.json();
          const c = complaintData.data;
          
          // Pre-fill dari data complaint
          setFormData(prev => ({
            ...prev,
            initiator_complaint: c.customer_name || '',
            complaint_location: `${c.customer_address || ''}, ${c.customer_city || ''}, ${c.customer_province || ''}`.trim(),
            farmer_name: c.customer_name || '',
            seed_variety: c.related_product_name || '',
            lot_number: c.lot_number || '',
            problematic_quantity_kg: c.problematic_quantity || '',
          }));
        }
        
        // Fetch existing investigation data
        const invRes = await fetch(`/api/complaints/${id}/investigation`);
        if (invRes.ok) {
          const result = await invRes.json();
          if (result.data) {
            const formatDate = (d: string) => d ? d.split('T')[0] : '';
            setFormData(prev => ({
              ...prev,
              ...result.data,
              investigation_date: formatDate(result.data.investigation_date) || prev.investigation_date,
              planting_date: formatDate(result.data.planting_date),
              label_expired_date: formatDate(result.data.label_expired_date),
              purchase_date: formatDate(result.data.purchase_date),
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
      const response = await fetch(`/api/complaints/${id}/investigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Gagal menyimpan');

      toast.success('Data investigasi berhasil disimpan!');
      setTimeout(() => router.push(`/admin/complaints/${id}`), 1500);

    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <Toaster position="top-right" />
      
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/admin/complaints/${id}`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BeakerIcon className="h-6 w-6 text-indigo-600" />
                Laporan Investigasi Keluhan Pelanggan
              </h1>
              <p className="text-sm text-gray-500">Mohon lengkapi data investigasi di bawah ini</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION: Data Investigator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
              Data Investigator
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Investigator <span className="text-red-500">*</span></label>
                <input type="text" name="investigator_name" required value={formData.investigator_name} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jabatan / Posisi <span className="text-red-500">*</span></label>
                <input type="text" name="investigator_position" required value={formData.investigator_position} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Investigasi <span className="text-red-500">*</span></label>
                <input type="date" name="investigation_date" required value={formData.investigation_date} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          {/* SECTION: Data Complaint */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4">Data Complaint</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Initiator Complaint <span className="text-red-500">*</span></label>
                <input type="text" name="initiator_complaint" required value={formData.initiator_complaint} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lokasi Komplain / Alamat <span className="text-red-500">*</span></label>
                <input type="text" name="complaint_location" required value={formData.complaint_location} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Petani <span className="text-red-500">*</span></label>
                <input type="text" name="farmer_name" required value={formData.farmer_name} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipe Komplain <span className="text-red-500">*</span></label>
                <select name="complaint_type" required value={formData.complaint_type} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                  <option value="">Pilih...</option>
                  <option value="Daya Tumbuh">Daya Tumbuh</option>
                  <option value="Kemurnian Fisik Benih">Kemurnian Fisik Benih</option>
                  <option value="Kemurnian Genetik Benih / Benih Tercampur">Kemurnian Genetik Benih / Benih Tercampur</option>
                  <option value="Kemasan dan Packaging">Kemasan dan Packaging</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Varietas Benih <span className="text-red-500">*</span></label>
                <input type="text" name="seed_variety" required value={formData.seed_variety} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor Lot <span className="text-red-500">*</span></label>
                <input type="text" name="lot_number" required value={formData.lot_number} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Bermasalah (Kg) <span className="text-red-500">*</span></label>
                <input type="number" name="problematic_quantity_kg" required value={formData.problematic_quantity_kg} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Penanaman <span className="text-red-500">*</span></label>
                <input type="date" name="planting_date" required value={formData.planting_date} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Masa Berlaku Label <span className="text-red-500">*</span></label>
                <input type="date" name="label_expired_date" required value={formData.label_expired_date} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Pembelian <span className="text-red-500">*</span></label>
                <input type="date" name="purchase_date" required value={formData.purchase_date} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tempat Pembelian <span className="text-red-500">*</span></label>
                <input type="text" name="purchase_place" required value={formData.purchase_place} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Alamat Pembelian <span className="text-red-500">*</span></label>
                <textarea name="purchase_address" required value={formData.purchase_address} onChange={handleChange} rows={2} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          {/* SECTION: Hasil Investigasi - Penyebab */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4 text-amber-700">Hasil Investigasi</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Penyebab Complaint <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="cause_category" value="Delivery/Packaging" checked={formData.cause_category === 'Delivery/Packaging'} onChange={handleChange} required />
                  <span>Delivery / Packaging</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="cause_category" value="Quality Product" checked={formData.cause_category === 'Quality Product'} onChange={handleChange} required />
                  <span>Quality Product</span>
                </label>
              </div>
            </div>

            {/* Conditional: Delivery/Packaging */}
            {formData.cause_category === 'Delivery/Packaging' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">Detail Masalah Pengiriman & Kemasan</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Kerusakan pada Kemasan</label>
                  <select name="packaging_damage" value={formData.packaging_damage} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                    <option value="">Pilih...</option>
                    <option value="Kemasan Rusak">Kemasan Rusak</option>
                    <option value="Kemasan Kotor">Kemasan Kotor</option>
                    <option value="Kerusakan karena Forklift">Kerusakan karena Forklift</option>
                    <option value="Serangga / Hewan Pengerat">Serangga / Hewan Pengerat</option>
                    <option value="Kerusakan karena Tumpukan">Kerusakan karena Tumpukan</option>
                    <option value="Kemasan Basah / Lembab">Kemasan Basah / Lembab</option>
                    <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kesalahan Produk / Jumlah Pengiriman</label>
                  <select name="product_error" value={formData.product_error} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                    <option value="">Pilih...</option>
                    <option value="Salah Lot">Salah Lot</option>
                    <option value="Salah Jumlah">Salah Jumlah</option>
                    <option value="Salah Ukuran">Salah Ukuran</option>
                    <option value="Salah Varietas">Salah Varietas</option>
                    <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Masalah Pengiriman</label>
                  <select name="delivery_issue" value={formData.delivery_issue} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                    <option value="">Pilih...</option>
                    <option value="Dokumen Hilang / Salah">Dokumen Hilang / Salah</option>
                    <option value="Dikirim ke Alamat yang Salah">Dikirim ke Alamat yang Salah</option>
                    <option value="Pengiriman Tidak Tepat Waktu">Pengiriman Tidak Tepat Waktu</option>
                    <option value="Kinerja Sopir">Kinerja Sopir</option>
                    <option value="Kebocoran">Kebocoran</option>
                    <option value="Kehilangan Sebagian / Seluruhnya">Kehilangan Sebagian / Seluruhnya</option>
                    <option value="Kesalahan Pihak Ketiga">Kesalahan Pihak Ketiga</option>
                    <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kondisi Pengiriman</label>
                  <select name="delivery_condition" value={formData.delivery_condition} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                    <option value="">Pilih...</option>
                    <option value="Metode Pengiriman Salah">Metode Pengiriman Salah</option>
                    <option value="Pengiriman Tidak Dipersiapkan dengan Benar">Pengiriman Tidak Dipersiapkan dengan Benar</option>
                    <option value="Kondisi Alat Transportasi Tidak Memadai">Kondisi Alat Transportasi Tidak Memadai</option>
                    <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                  </select>
                </div>
              </div>
            )}

            {/* Conditional: Quality Product */}
            {formData.cause_category === 'Quality Product' && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-200">Detail Masalah Kualitas Produk</h3>
                
                {/* Grid untuk menghemat space */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Masalah Pertumbuhan</label>
                    <select name="growth_issue" value={formData.growth_issue} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Rebah semai">Rebah semai</option>
                      <option value="Pertumbuhan Lambat">Pertumbuhan Lambat</option>
                      <option value="Perbedaan Pengujian Pihak Ketiga">Perbedaan Pengujian Pihak Ketiga</option>
                      <option value="Keseragaman Jelek">Keseragaman Jelek</option>
                      <option value="Vigor Jelek">Vigor Jelek</option>
                      <option value="Yang Tumbuh Terlalu Rendah / Sedikit">Yang Tumbuh Terlalu Rendah / Sedikit</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Treatment Benih</label>
                    <select name="seed_treatment_issue" value={formData.seed_treatment_issue} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Menggumpal">Menggumpal</option>
                      <option value="Treatment Lengket">Treatment Lengket</option>
                      <option value="Cakupan Treatment">Cakupan Treatment</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Penampilan Produk</label>
                    <select name="product_appearance" value={formData.product_appearance} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Berdebu">Berdebu</option>
                      <option value="Innert matter">Innert matter (kototan benih)</option>
                      <option value="Rusak oleh Serangga">Rusak oleh Serangga</option>
                      <option value="Lembab">Lembab</option>
                      <option value="Berjamur / Pudar / Kotor">Berjamur / Pudar / Kotor</option>
                      <option value="Sclerotinia">Sclerotinia</option>
                      <option value="Benih Pecah / Retak / Patah">Benih Pecah / Retak / Patah</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Kemurnian Produk</label>
                    <select name="product_purity" value={formData.product_purity} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Tongkol">Tongkol</option>
                      <option value="Benda / Bahan Lain">Benda / Bahan Lain</option>
                      <option value="Ditemukan Tanaman Lainnya">Ditemukan Tanaman Lainnya</option>
                      <option value="Benih Campuran">Benih Campuran</option>
                      <option value="Benih Diganti">Benih Diganti</option>
                      <option value="Batang">Batang</option>
                      <option value="Benih Gulma">Benih Gulma</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Kesehatan Benih</label>
                    <select name="seed_health" value={formData.seed_health} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Perbedaan Pengujian oleh Pihak Ketiga">Perbedaan Pengujian oleh Pihak Ketiga</option>
                      <option value="Penyakit pada Tanaman">Penyakit pada Tanaman</option>
                      <option value="Penyakit pada Benih">Penyakit pada Benih</option>
                      <option value="Gejala Virus">Gejala Virus</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Faktor Fisiologis Lainnya</label>
                    <select name="physiological_factors" value={formData.physiological_factors} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Blind Plants">Blind Plants</option>
                      <option value="Bibit Cacat">Bibit Cacat</option>
                      <option value="Jack Plants">Jack Plants</option>
                      <option value="Tidak Berkecambah">Tidak Berkecambah</option>
                      <option value="Umur Simpan / Benih lama">Umur Simpan / Benih lama</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Genetik</label>
                    <select name="genetic_issue" value={formData.genetic_issue} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Bolter">Bolter</option>
                      <option value="Perbedaan Pengujian oleh Pihak Ketiga">Perbedaan Pengujian oleh Pihak Ketiga</option>
                      <option value="Selfing">Selfing</option>
                      <option value="Offtype">Offtype</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Kerusakan Herbisida</label>
                    <select name="herbicide_damage" value={formData.herbicide_damage} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Tanaman Terkena Herbisida">Tanaman Terkena Herbisida</option>
                      <option value="Tidak Terkena Herbisida">Tidak Terkena Herbisida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Performa Produk</label>
                    <select name="product_performance" value={formData.product_performance} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Hasil rendah di Lapang">Hasil rendah di Lapang</option>
                      <option value="Tidak Bermasalah">Tidak Bermasalah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Produk Kedaluwarsa</label>
                    <select name="product_expired" value={formData.product_expired} onChange={handleChange} className="w-full rounded-lg border p-2.5 dark:bg-gray-700">
                      <option value="">Pilih...</option>
                      <option value="Produk Kedaluwarsa">Produk Kedaluwarsa</option>
                      <option value="Belum Kedaluwarsa">Belum Kedaluwarsa</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: Informasi Tambahan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4">Informasi Deskripsi Investigasi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Masalah <span className="text-red-500">*</span></label>
                <textarea name="problem_description" required value={formData.problem_description} onChange={handleChange} rows={4} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Jelaskan detail masalah yang ditemukan..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tindakan yang Dilakukan <span className="text-red-500">*</span></label>
                <textarea name="action_taken" required value={formData.action_taken} onChange={handleChange} rows={3} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Tindakan apa yang sudah dilakukan..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Info OPT (Organisme Pengganggu Tanaman)</label>
                <textarea name="pest_info" value={formData.pest_info} onChange={handleChange} rows={3} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Jenis OPT, Penggunaan Pestisida..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aspek Agronomi</label>
                <textarea name="agronomic_aspect" value={formData.agronomic_aspect} onChange={handleChange} rows={3} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Penggunaan Pupuk (Urea, NPK, dll), Tanggal Pemupukan, Dosis, Irigasi..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lingkungan</label>
                <textarea name="environment_info" value={formData.environment_info} onChange={handleChange} rows={3} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Kondisi Curah Hujan, Tanaman sekitar sebagai pembanding, Observasi lainnya..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Performa Tanaman Berdasarkan Fase</label>
                <textarea name="plant_performance_phase" value={formData.plant_performance_phase} onChange={handleChange} rows={3} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Fase vegetatif, generatif, dll..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dokumentasi Investigasi</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span></p>
                      <p className="text-xs text-gray-500">Word, Excel, PDF, Image, Video, Audio</p>
                    </div>
                    <input type="file" className="hidden" multiple accept=".doc,.docx,.xls,.xlsx,.pdf,image/*,video/*,audio/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Kesimpulan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4 text-blue-700">Kesimpulan & Tindakan</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kesimpulan Hasil Investigasi <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {[
                    'Masalah Daya tumbuh benih',
                    'Masalah pada Kemurnian benih',
                    'Masalah pada seed treatment',
                    'Masalah pada Kemasan dan packaging',
                    'Masalah Lingkungan',
                    'Masalah lainnya'
                  ].map((option) => (
                    <label key={option} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input 
                        type="radio" 
                        name="investigation_conclusion" 
                        value={option}
                        checked={formData.investigation_conclusion === option}
                        onChange={handleChange}
                        required
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Penentuan Akar Masalah <span className="text-red-500">*</span></label>
                <textarea name="root_cause_determination" required value={formData.root_cause_determination} onChange={handleChange} rows={4} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Jelaskan analisa akar masalah secara detail (gunakan metode 5 Why, Fishbone, dll)..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tindakan Perbaikan Jangka Panjang <span className="text-red-500">*</span></label>
                <textarea name="long_term_corrective_action" required value={formData.long_term_corrective_action} onChange={handleChange} rows={4} className="w-full rounded-lg border p-2.5 dark:bg-gray-700" placeholder="Rekomendasi tindakan perbaikan untuk mencegah terulangnya masalah..." />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href={`/admin/complaints/${id}`}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold bg-white dark:bg-gray-700 border rounded-xl hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <BeakerIcon className="h-5 w-5" />
                  Simpan Laporan Investigasi
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}