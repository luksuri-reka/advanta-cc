// app/utils/api.ts
import { supabase } from './supabase';

// Tipe data ProductData tidak perlu diubah
export interface ProductData {
  serial_number: string;
  search_key: string;
  product_photo: string;
  product_name: string;
  jenis_tanaman: string;
  kelas_benih: string;
  varietas: string;
  production_code: string;
  benih_tanaman_lain: number;
  campuran_varietas_lain: number;
  kotoran_benih: number;
  benih_murni: number;
  kadar_air: number;
  daya_berkecambah: number;
  cert_number: string;
  group_number: string;
  tested_date: string;
  expired_date: string;
  tanggal_panen: string;
  bahan_bahan_aktif: string[];
  qr_code_link?: string;
  model_type: 'bag' | 'production';
}

export interface ApiResponse {
  data: ProductData;
  meta: {
    model_type: 'bag' | 'production';
  };
}

export async function searchProduct(serialNumber: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('get_product_details_by_serial', {
    p_search_key: serialNumber,
  });

  if (error) {
    console.error('Error calling RPC function:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat memanggil Data.'); // Terjadi kesalahan saat memanggil RPC
  }

  if (!data) {
    // Pesan error jika RLS aktif dan tidak ada data yang cocok
    throw new Error(`Produk dengan nomor seri "${serialNumber}" tidak ditemukan. Jika mengalami masalah saat memindai lot, silakan langsung hubungi kami.`); // `Produk dengan nomor seri "${serialNumber}" tidak ditemukan. Pastikan nomor seri benar dan RLS (Row Level Security) telah diatur jika diperlukan.`
  }

  // Data dari RPC sudah dalam format ApiResponse
  return data as ApiResponse;
}