// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { getProfile, logout } from '../utils/auth';
import type { User } from '@supabase/supabase-js';

// Tipe data sederhana untuk state di komponen ini
interface DisplayUser {
  id: string;
  name: string;
  email: string;
  roles?: string[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile: User | null = await getProfile();
        
        if (mounted && profile) {
          // Memetakan data dari objek User Supabase ke state kita
          setUser({
            id: profile.id,
            name: profile.user_metadata?.name || profile.user_metadata?.full_name || 'Nama tidak tersedia',
            email: profile.email || 'Email tidak tersedia',
            roles: profile.app_metadata?.roles || [],
          });
        }
      } catch (err: any) {
        console.error('Gagal memuat profil:', err);
        setErrMsg('Gagal memuat data profil. Sesi Anda mungkin telah berakhir.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50">
        <header className="w-full bg-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/advanta-logo.png" alt="Advanta Logo" className="w-28" />
              <h1 className="text-lg font-semibold text-zinc-800">Admin Console</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
            >
              Keluar
            </button>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 py-10">
          {loading ? (
            <div className="flex items-center gap-3 text-zinc-700">
              <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat data...</span>
            </div>
          ) : (
            <>
              {errMsg && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Gagal memuat data</p>
                  <p className="text-sm text-zinc-600 mt-1">
                    {errMsg} Silakan coba masuk kembali.
                  </p>
                  <button
                    onClick={() => router.replace('/admin/login')}
                    className="mt-3 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
                  >
                    Ke Halaman Login
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <h2 className="text-xl font-semibold text-zinc-900 mb-4">Selamat datang</h2>
                {user ? (
                  <div className="space-y-1 text-zinc-700">
                    <p><span className="font-medium">Nama:</span> {user.name}</p>
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    {Array.isArray(user.roles) && user.roles.length > 0 && (
                      <p className="flex gap-2 flex-wrap">
                        <span className="font-medium">Peran:</span>
                        {user.roles.map((r: any, idx: number) => (
                          <span key={idx} className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-xs">
                            {typeof r === 'string' ? r : r?.name ?? 'role'}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-700">Tidak ada data profil.</p>
                )}
              </div>

              <div className="mt-6 text-sm text-zinc-500">
                Halaman ini adalah placeholder. Integrasikan menu dan konten admin sesuai kebutuhan.
              </div>
            </>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}