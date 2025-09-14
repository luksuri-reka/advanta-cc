'use client';

import { authFetch } from './api';

// Debug: Log the exact URL being used
console.log('AUTH_BASE_URL from api.ts:', 'http://127.0.0.1:8000/api/console');

export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  roles?: string[] | { name: string }[];
  role?: any; // Based on your API response structure
  [key: string]: any;
};

export type LoginResult = {
  token: string;
  user?: AuthUser | null;
};

const TOKEN_COOKIE_NAME = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function setCookie(name: string, value: string, days = 7) {
  if (!isBrowser()) return;
  const maxAge = days * 24 * 60 * 60;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=false`;
}

export function getCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function setAuthToken(token: string) {
  console.log('Setting auth token:', token?.substring(0, 20) + '...');
  setCookie(TOKEN_COOKIE_NAME, token);
}

export function getAuthToken(): string | null {
  return getCookie(TOKEN_COOKIE_NAME);
}

export function clearAuth() {
  console.log('Clearing auth');
  deleteCookie(TOKEN_COOKIE_NAME);
  if (isBrowser()) {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  }
}

export function setAuthUser(user: AuthUser | null) {
  if (!isBrowser()) return;
  if (!user) {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    return;
  }
  console.log('Setting auth user:', user);
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// Extract token from various possible response structures
function extractToken(payload: any): string | null {
  console.log('Extracting token from payload:', payload);
  
  if (!payload) return null;
  
  // Direct token properties
  if (typeof payload.token === 'string') return payload.token;
  if (typeof payload.access_token === 'string') return payload.access_token;
  
  // Nested in data
  if (payload.data) {
    if (typeof payload.data.token === 'string') return payload.data.token;
    if (typeof payload.data.access_token === 'string') return payload.data.access_token;
  }
  
  // Nested in meta (based on your curl response)
  if (payload.meta && typeof payload.meta.token === 'string') return payload.meta.token;
  
  return null;
}

// Extract user from various possible response structures
function extractUser(payload: any): AuthUser | null {
  console.log('Extracting user from payload:', payload);
  
  if (!payload) return null;
  
  // Direct user property
  if (payload.user && typeof payload.user === 'object') return payload.user as AuthUser;
  
  // Nested in data (based on your curl response)
  if (payload.data && typeof payload.data === 'object') {
    // If data itself is the user object
    if (payload.data.id || payload.data.email) return payload.data as AuthUser;
    
    // If user is nested in data
    if (payload.data.user && typeof payload.data.user === 'object') return payload.data.user as AuthUser;
  }
  
  return null;
}

/**
 * Perform login to backend
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    console.log('Attempting login for:', email);
    
    const resp = await authFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response received:', resp);

    const token = extractToken(resp);
    if (!token) {
      console.error('No token found in response:', resp);
      throw new Error('Token tidak ditemukan pada respons login.');
    }

    const user = extractUser(resp);
    console.log('Extracted token:', token?.substring(0, 20) + '...');
    console.log('Extracted user:', user);

    setAuthToken(token);
    if (user) setAuthUser(user);

    return { token, user: user ?? null };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific HTTP errors
    if (error?.message?.includes('401')) {
      throw new Error('Email atau kata sandi salah.');
    }
    if (error?.message?.includes('422')) {
      throw new Error('Data yang dimasukkan tidak valid.');
    }
    if (error?.message?.includes('timeout') || error?.message?.includes('waktu habis')) {
      throw new Error('Koneksi timeout. Periksa koneksi internet Anda.');
    }
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Server tidak dapat dijangkau. Pastikan server Laravel berjalan.');
    }
    
    throw error;
  }
}

/**
 * Fetch authenticated profile from backend
 */
export async function getProfile(): Promise<AuthUser> {
  try {
    const profile = await authFetch<any>('/auth/profile', {
      method: 'GET',
    });
    
    // Handle different response structures
    let user: AuthUser;
    if (profile.data) {
      user = profile.data as AuthUser;
    } else {
      user = profile as AuthUser;
    }
    
    if (user) setAuthUser(user);
    return user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Logout from backend and clear local auth state
 */
export async function logout(): Promise<void> {
  try {
    await authFetch('/auth/logout', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // swallow errors to ensure client clears state
  } finally {
    clearAuth();
  }
}