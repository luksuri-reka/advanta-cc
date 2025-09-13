// API service for communicating with backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface ProductData {
  serial_number: string;
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
}

export interface ApiResponse {
  data: ProductData;
  meta: {
    model_type: 'bag' | 'production';
  };
}

export async function searchProduct(serialNumber: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/web/search/registered/${serialNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product data:', error);
    throw error;
  }
}
