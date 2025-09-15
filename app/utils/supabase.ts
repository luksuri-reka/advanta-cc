// app/utils/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Gunakan nama variabel yang benar
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and publishable key are required.');
}

// Gunakan createBrowserClient karena komponen kita adalah client component ('use client')
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);