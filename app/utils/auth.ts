// app/utils/auth.ts
'use client';

import { supabase } from './supabase'; // Impor client Supabase
import type { User } from '@supabase/supabase-js';

// Tipe data disesuaikan dengan Supabase
export type AuthUser = User;

/**
 * Perform login to Supabase
 */
export async function login(email: string, password: string): Promise<{ user: AuthUser | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase login error:', error.message);
    // Terjemahkan pesan error dari Supabase jika perlu
    if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email atau kata sandi salah.');
    }
    throw new Error(error.message);
  }

  return { user: data.user };
}

/**
 * Fetch authenticated profile from Supabase
 */
export async function getProfile(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting profile:', error.message);
    throw error;
  }
  
  return user;
}

/**
 * Logout from Supabase and clear local auth state
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout error:', error.message);
    // Tetap lanjutkan proses logout di client meskipun ada error
  }
  // Supabase SDK akan otomatis membersihkan session
}

/**
 * Mendapatkan sesi aktif
 */
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}