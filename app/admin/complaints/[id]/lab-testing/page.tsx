'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast, Toaster } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { createBrowserClient } from '@supabase/ssr';

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
    notes: '',
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
              evidence_files: result.data.evidence_files || [],
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
          // Tambahkan file ke direktori lab_testing
          const filePath = `lab_testing/${id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

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
      const response = await fetch(`/api/complaints/${id}/lab-testing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Gagal menyimpan');

      toast.success('Data lab testing berhasil disimpan!', { id: loadingToast });
      setTimeout(() => router.push(`/admin/complaints/${id}`), 1500);

    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan.', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB maksimal masing-masing
  const MAX_FILES = 10; // Batas total 10 file lampiran

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

          {/* Bukti & Dokumentasi Lab */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 border-purple-200 dark:border-purple-800/30 overflow-hidden">
            <h2 className="font-bold text-lg mb-4 text-purple-900 dark:text-purple-200">Dokumentasi Pengujian</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lampiran File / Foto <span className="text-red-500">*</span>
                <span className="block text-xs text-gray-500 mt-1">Sertakan foto sampel, sertifikat ISTA, atau Excel worksheet (Max {MAX_FILES} file, {MAX_FILE_SIZE / 1024 / 1024}MB per file)</span>
              </label>

              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 ${isDragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'} border-dashed rounded-lg cursor-pointer transition-colors`}
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
                    let fileNameStr = `File Evidence ${index + 1}`;
                    let base64Data = src;

                    if (src.includes('|') && src.includes('data:')) {
                      const separatorIndex = src.indexOf('|');
                      fileNameStr = src.substring(0, separatorIndex);
                      base64Data = src.substring(separatorIndex + 1);
                    }

                    // Gunakan proxy URL untuk file http agar preview aman
                    const isBase64 = base64Data.startsWith('data:image/');
                    const isHttp = base64Data.startsWith('http');
                    const displayUrl = isBase64 || !isHttp ? base64Data : `/api/public/images?url=${btoa(base64Data)}`;

                    // Check if it's visually an image
                    const isVisualImage = isBase64 || (isHttp && base64Data.match(/\.(jpeg|jpg|png|gif)$/i));

                    return (
                      <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-2 text-center">
                        {isVisualImage ? (
                          <img
                            src={displayUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full p-2 z-10">
                            <DocumentTextIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 break-all line-clamp-2">
                              {isHttp ? src.split('/').pop() : fileNameStr}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeAttachment(index); }}
                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-transform"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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