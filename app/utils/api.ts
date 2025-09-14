// app/utils/api.ts
import { supabase } from './supabase';

export interface ProductData {
  // Pastikan semua nama properti ini ada sebagai kolom di tabel 'production_registers' Anda
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
  // ==========================================================
  // PASTIKAN NAMA TABEL ADALAH 'production_registers'
  const { data: productData, error } = await supabase
    .from('production_registers') 
    .select('*')
    .eq('search_key', serialNumber) // Dan kita mencari di kolom 'search_key'
    .single();
  // ==========================================================

  if (error) {
    console.error('Error fetching product from Supabase:', error);
    if (error.code === 'PGRST116') {
      throw new Error(`Produk dengan nomor seri "${serialNumber}" tidak ditemukan. Pastikan RLS (Row Level Security) sudah diatur.`);
    }
    throw new Error(error.message || 'Terjadi kesalahan saat mengambil data produk.');
  }

  if (!productData) {
    throw new Error('Produk tidak ditemukan.');
  }

  const response: ApiResponse = {
    data: productData as ProductData,
    meta: {
      // Pastikan ada kolom 'model_type' di tabel Anda
      model_type: productData.model_type || 'bag', 
    },
  };

  return response;
}