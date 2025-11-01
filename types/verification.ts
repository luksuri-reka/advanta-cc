// types/verification.ts
// Type definitions untuk sistem verifikasi

export type VerificationType = 'serial' | 'lot';

export type ProductCategory = 'hybrid_corn' | 'sweet_corn' | 'vegetable';

export type ModelType = 'bag' | 'production' | 'lot';

export interface ProductData {
  // Basic Info
  product_name: string;
  search_key: string;
  serial_number?: string;
  lot_number?: string;
  
  // Plant Information
  jenis_tanaman: string;
  kelas_benih: string;
  varietas: string;
  
  // Test Parameters
  benih_murni: number;
  daya_berkecambah: number;
  kadar_air: number;
  kotoran_benih: number;
  campuran_varietas_lain: number;
  benih_tanaman_lain: number;
  
  // Certification Information
  cert_number: string;
  group_number: string;
  production_code: string;
  tanggal_panen: string;
  tested_date: string;
  expired_date: string;
  
  // Additional Information
  qr_code_link?: string;
  bahan_bahan_aktif: string[];
  company_name: string;
  province: string;
  
  // Visual
  product_image?: string;
}

export interface ApiResponse {
  success: boolean;
  data: ProductData;
  meta: {
    model_type: ModelType;
    verification_type: VerificationType;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error_code?: string;
}

export interface VerificationFormData {
  type: VerificationType;
  code: string;
}

// Database Types
export interface Production {
  id: number;
  product_id: number;
  group_number: string;
  code_1: string;
  code_2: string;
  code_3: string;
  code_4: string;
  lot_number: string;
  verification_type: VerificationType;
  
  // Lab results
  lab_result_certification_number: string;
  lab_result_serial_number: string;
  lab_result_tested_date: string;
  lab_result_expired_date: string;
  
  // Test parameters
  test_param_kadar_air: number;
  test_param_benih_murni: number;
  test_param_campuran_varietas_lain: number;
  test_param_benih_tanaman_lain: number;
  test_param_kotoran_benih: number;
  test_param_daya_berkecambah: number;
  
  // Dates
  cert_realization_tanggal_panen: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: Product;
  company?: Company;
  lot_varietas?: Varietas;
  lot_kelas_benih?: KelasBenih;
}

export interface Product {
  id: number;
  name: string;
  photo: string;
  sku: string;
  product_category: ProductCategory;
  
  // Relations
  jenis_tanaman?: JenisTanaman;
  kelas_benih?: KelasBenih;
  varietas?: Varietas;
}

export interface BagPiece {
  id: number;
  bag_id: number;
  serial_number: string;
  qr_code: string;
  qr_expired_date: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  bag?: Bag;
}

export interface Bag {
  id: number;
  qr_code: string;
  production_id: number;
  capacity: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  production?: Production;
}

export interface ProductionRegister {
  id: number;
  production_id: number;
  serial_number: string;
  production_code: string;
  search_key: string;
  qr_code_link: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  production?: Production;
}

export interface JenisTanaman {
  id: number;
  name: string;
  description: string;
}

export interface KelasBenih {
  id: number;
  name: string;
  description: string;
}

export interface Varietas {
  id: number;
  name: string;
  description: string;
}

export interface Company {
  id: number;
  name: string;
  type: string;
  address?: string;
  province_id: number;
  
  // Relations
  province?: Province;
}

export interface Province {
  id: number;
  code: string;
  name: string;
}

// View Types
export interface LotVerificationView {
  production_id: number;
  lot_number: string;
  group_number: string;
  production_code: string;
  
  product_id: number;
  product_name: string;
  product_image: string;
  product_sku: string;
  product_category: ProductCategory;
  
  jenis_tanaman: string;
  kelas_benih: string;
  varietas: string;
  
  benih_murni: number;
  daya_berkecambah: number;
  kadar_air: number;
  kotoran_benih: number;
  campuran_varietas_lain: number;
  benih_tanaman_lain: number;
  
  cert_number: string;
  lab_result_serial_number: string;
  tanggal_panen: string;
  tested_date: string;
  expired_date: string;
  
  company_name: string;
  province: string;
  
  lot_volume: number;
  lot_content: number;
  lot_total: number;
}

export interface SerialVerificationView {
  bag_piece_id: number;
  serial_number: string;
  qr_code: string;
  qr_expired_date: string;
  
  bag_id: number;
  bag_capacity: number;
  
  production_id: number;
  group_number: string;
  production_code: string;
  lot_number: string;
  
  product_id: number;
  product_name: string;
  product_image: string;
  product_sku: string;
  product_category: ProductCategory;
  
  jenis_tanaman: string;
  kelas_benih: string;
  varietas: string;
  
  benih_murni: number;
  daya_berkecambah: number;
  kadar_air: number;
  kotoran_benih: number;
  campuran_varietas_lain: number;
  benih_tanaman_lain: number;
  
  cert_number: string;
  lab_result_serial_number: string;
  tanggal_panen: string;
  tested_date: string;
  expired_date: string;
  
  company_name: string;
  province: string;
}

// UI Component Props
export interface ProductResultProps {
  data: ProductData;
  modelType: ModelType;
  verificationType?: VerificationType;
}

export interface VerificationCardProps {
  type: VerificationType;
  title: string;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onClick: () => void;
}

// Form Validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface VerificationFormState {
  type: VerificationType | null;
  code: string;
  isScanning: boolean;
  errors: ValidationError[];
}

// Search/Query Params
export interface VerificationSearchParams {
  type?: VerificationType;
  code?: string;
  serial?: string; // backward compatibility
  product?: string;
}

// Supabase Query Responses
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseError extends Error {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}