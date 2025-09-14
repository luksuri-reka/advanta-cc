// Simplified API service - focus on getting basic connection working first
export const API_BASE_URL = 'http://127.0.0.1:8000/api';
export const AUTH_BASE_URL = 'http://127.0.0.1:8000/api/console';

function getAuthTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function doFetch<T = any>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthTokenFromCookie();
  const headers = new Headers(options.headers || {});
  
  // Set standard headers
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'XMLHttpRequest'); // Laravel expects this
  
  // Set Authorization header if token exists
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  console.log('API Request:', {
    method: options.method || 'GET',
    baseUrl,
    path,
    fullUrl: url,
    headers: Object.fromEntries(headers.entries()),
    hasBody: !!options.body
  });

  // Timeout controller
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include', // Important for cookies/session
      signal: options.signal ?? controller.signal,
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.log('Error response body:', errorText);
      } catch (e) {
        console.log('Could not read error response body');
      }
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    try {
      const jsonData = await response.json();
      console.log('Response data:', jsonData);
      return jsonData;
    } catch (parseError) {
      console.log('No JSON response body or parse error:', parseError);
      return undefined as unknown as T;
    }
  } catch (err: any) {
    console.error('Fetch error:', err);
    
    if (err?.name === 'AbortError') {
      throw new Error('Permintaan waktu habis. Periksa koneksi atau server API.');
    }
    
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan di http://127.0.0.1:8000');
    }
    
    throw new Error(err?.message || 'Gagal terhubung ke server API.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  return doFetch<T>(API_BASE_URL, path, options);
}

export async function authFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  return doFetch<T>(AUTH_BASE_URL, path, options);
}

// Interface definitions
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
    const data = await apiFetch<ApiResponse>(`/web/search/registered/${serialNumber}`, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.error('Error fetching product data:', error);
    throw error;
  }
}