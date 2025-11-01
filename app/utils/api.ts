// app/utils/api.ts
import { supabase } from './supabase';

export interface ProductData {
  product_image: any;
  serial_number?: string;
  lot_number?: string;
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
  model_type: 'bag' | 'production' | 'lot';
  company_name?: string;
  province?: string;
}

export interface ApiResponse {
  data: ProductData;
  meta: {
    model_type: 'bag' | 'production' | 'lot';
    verification_type: 'serial' | 'lot';
  };
}

export async function searchProduct(serialNumber: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('get_product_details_by_serial', {
    p_search_key: serialNumber,
  });

  if (error) {
    console.error('Error calling RPC function:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat memanggil Data.');
  }

  if (!data) {
    throw new Error(
      `Produk dengan nomor seri "${serialNumber}" tidak ditemukan.`
    );
  }

  // RPC function sudah return format {data: {...}, meta: {...}}
  return data as ApiResponse;
}

export async function searchBySerialNumber(serialNumber: string): Promise<ApiResponse> {
  return await searchProduct(serialNumber);
}

export async function searchByLotNumber(lotNumber: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('get_product_details_by_lot', {
    p_lot_number: lotNumber,
  });

  if (error) {
    console.error('Error calling lot RPC function:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat mencari nomor lot.');
  }

  if (!data) {
    throw new Error(
      `Produk dengan nomor lot "${lotNumber}" tidak ditemukan.`
    );
  }

  return data as ApiResponse;
}

export async function verifyProduct(
  code: string,
  type: 'serial' | 'lot'
): Promise<ApiResponse> {
  if (type === 'serial') {
    return await searchBySerialNumber(code);
  } else {
    return await searchByLotNumber(code);
  }
}