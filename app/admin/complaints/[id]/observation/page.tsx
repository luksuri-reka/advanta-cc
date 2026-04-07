'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentMagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentTextIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { toast, Toaster } from 'react-hot-toast';
import { createBrowserClient } from '@supabase/ssr';
import ImageLightbox, { LightboxImage } from '@/app/components/ImageLightbox';

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
    observation_result: '',
    evidence_files: [] as string[]
  });

  // 🔥 Inisialisasi Supabase
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // 🔥 Fungsi mengubah Base64 kembali menjadi File untuk diupload
  const base64ToFile = (base64String: string, filename: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

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
              observation_date: result.data.observation_date ? result.data.observation_date.split('T')[0] : prev.observation_date,
              evidence_files: result.data.evidence_files || []
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
    const loadingToast = toast.loading('Sedang menyimpan data dan mengunggah dokumen...');

    try {
      // 🔥 1. Upload File ke Supabase Storage Dulu
      let uploadedUrls: string[] = [];

      for (let i = 0; i < formData.evidence_files.length; i++) {
        const fileData = formData.evidence_files[i];

        // Cek apakah ini file baru (format: "namafile|data:image/...")
        if (fileData.includes('|') && fileData.includes('data:')) {
          const separatorIndex = fileData.indexOf('|');
          const fileName = fileData.substring(0, separatorIndex);
          const base64Data = fileData.substring(separatorIndex + 1);

          const file = base64ToFile(base64Data, fileName);
          const filePath = `observations/${id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

          const { error: uploadError } = await supabase.storage
            .from('complaints')
            .upload(filePath, file);

          if (uploadError) throw new Error(`Gagal mengunggah ${fileName}`);

          const { data: publicUrlData } = supabase.storage
            .from('complaints')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrlData.publicUrl);
        } else {
          // Jika sudah berupa URL (file yang sudah pernah diupload), langsung push
          uploadedUrls.push(fileData);
        }
      }

      // 🔥 2. Siapkan Payload dengan URL Asli
      const payload = {
        ...formData,
        evidence_files: uploadedUrls
      };

      // 🔥 3. Kirim ke API Route
      const response = await fetch(`/api/complaints/${id}/observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Gagal menyimpan data observasi');

      toast.success('Data observasi berhasil disimpan!', { id: loadingToast });

      setTimeout(() => {
        router.push(`/admin/complaints/${id}`);
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan.', { id: loadingToast });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB maksimal masing-masing
  const MAX_FILES = 10; // Batas total 10 file lampiran untuk observasi

  const compressImage = (file: File): Promise<{ data: string; name: string }> => {
    return new Promise((resolve, reject) => {
      // Return file base64 directly if it's not an image (e.g., PDF, Excel, Word)
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ data: reader.result as string, name: file.name });
        reader.onerror = error => reject(error);
        return;
      }

      // If it's an image, apply canvas resizing and compression safely
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // Resize target dimension

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.6 detail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          // Ganti ekstensi jadi .jpeg karena dikonversi
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
          resolve({ data: dataUrl, name: newName });
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (formData.evidence_files.length + acceptedFiles.length > MAX_FILES) {
      toast.error(`Maksimal ${MAX_FILES} bukti dokumentasi.`);
      return;
    }

    const processingToast = toast.loading('Sedang memproses file...');
    try {
      const processedFilesPromises = acceptedFiles.map(file => compressImage(file));
      const processedFiles = await Promise.all(processedFilesPromises);

      // Simpan format `name|base64` untuk mempertahankan nama file asli jika bukan gambar
      const formattedAttachments = processedFiles.map(pf => `${pf.name}|${pf.data}`);

      setFormData(prev => ({
        ...prev,
        evidence_files: [...prev.evidence_files, ...formattedAttachments]
      }));
      toast.success('File berhasil ditambahkan.', { id: processingToast });
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Gagal memproses file.', { id: processingToast });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      // Support PDF, Word, Excel files
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          if (error.code === 'file-invalid-type') {
            toast.error(`File ${rejection.file.name} bermasalah: Format tidak didukung.`);
          } else if (error.code === 'file-too-large') {
            toast.error(`File ${rejection.file.name} terlalu besar (Maks 5MB)`);
          } else {
            toast.error(`Error pada ${rejection.file.name}: ${error.message}`);
          }
        });
      });
    },
  });

  const removeAttachment = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_files: prev.evidence_files.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // 🖼️ Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const obsLightboxImages: LightboxImage[] = formData.evidence_files
    .map((src) => {
      let base64Data = src;
      let fileNameStr = '';
      if (src.includes('|')) { const sep = src.indexOf('|'); fileNameStr = src.substring(0, sep); base64Data = src.substring(sep + 1); }
      const isBase64 = base64Data.startsWith('data:image/');
      const isHttp = base64Data.startsWith('http');
      const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;
      const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));
      return isVisualImage ? { src: displayUrl, alt: fileNameStr || 'Bukti Observasi', fileName: fileNameStr || src.split('/').pop() } : null;
    })
    .filter(Boolean) as LightboxImage[];

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

      {/* 🖼️ Lightbox for Observation Evidence */}
      {lightboxOpen && obsLightboxImages.length > 0 && (
        <ImageLightbox
          images={obsLightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          accentColor="cyan"
        />
      )}

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
                  <span className="block text-xs text-gray-500 mt-1">Foto kemasan, lahan penanaman, dll (Max {MAX_FILES} file, {MAX_FILE_SIZE / 1024 / 1024}MB per file)</span>
                </label>

                <div
                  {...getRootProps()}
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'} border-dashed rounded-lg cursor-pointer transition-colors`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klik atau seret file ke sini</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF, Excel, Word, Image</p>
                  </div>
                </div>

                {/* Tampilan Preview File */}
                {formData.evidence_files.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.evidence_files.map((src, index) => {
                      // Parse name if exists (name|base64)
                      let fileNameStr = `File ${index + 1}`;
                      let base64Data = src;

                      if (src.includes('|')) {
                        const separatorIndex = src.indexOf('|');
                        fileNameStr = src.substring(0, separatorIndex);
                        base64Data = src.substring(separatorIndex + 1);
                      }

                      const isBase64 = base64Data.startsWith('data:image/');
                      const isHttp = base64Data.startsWith('http');
                      const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;
                      const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));
                      const lbIndex = obsLightboxImages.findIndex(img => img.src === displayUrl);

                      return (
                        <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square bg-gray-50 flex flex-col items-center justify-center p-2 text-center cursor-pointer"
                          onClick={() => isVisualImage && lbIndex >= 0 && (setLightboxIndex(lbIndex), setLightboxOpen(true))}>
                          {isVisualImage ? (
                            <img
                              src={displayUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full p-2 z-10">
                              <DocumentTextIcon className="w-10 h-10 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-600 dark:text-gray-300 break-all line-clamp-2">
                                {isHttp ? src.split('/').pop() : fileNameStr}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-20 gap-2">
                            {isVisualImage && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); lbIndex >= 0 && (setLightboxIndex(lbIndex), setLightboxOpen(true)); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors text-xs"
                              >
                                <MagnifyingGlassPlusIcon className="w-4 h-4" />
                                Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeAttachment(index); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: PROPOSE REPLACEMENT - HANYA jika Valid */}
          {formData.observation_result === 'Valid' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
                <h2 className="font-bold text-amber-900 dark:text-amber-200">5. Propose Direct Replacement</h2>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Karena komplain diterima, tentukan usulan penggantian benih
                </p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="replacement_qty"
                    value={formData.replacement_qty}
                    onChange={handleChange}
                    required={formData.observation_result === 'Valid'}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                    placeholder="Jumlah unit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hybrid <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="replacement_hybrid"
                    value={formData.replacement_hybrid}
                    onChange={handleChange}
                    required={formData.observation_result === 'Valid'}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2.5"
                    placeholder="Nama varietas hybrid"
                  />
                </div>
              </div>
              {!formData.replacement_qty && !formData.replacement_hybrid && (
                <div className="px-6 pb-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      ⚠️ Wajib diisi jika komplain diterima
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pesan jika ditolak */}
          {formData.observation_result === 'Invalid' && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">
                    Komplain Ditolak
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Tidak ada penggantian benih karena masalah disebabkan faktor eksternal atau budidaya.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.observation_result === 'Valid'
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
                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.observation_result === 'Invalid'
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