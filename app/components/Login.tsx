'use client';

import { useState } from 'react';
import { ArrowRightIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { loginUser } from '../utils/api'; // Sesuaikan path jika perlu

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onSwitchToVerification: () => void;
}

export default function Login({ onLoginSuccess, onSwitchToVerification }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(username, password);
      onLoginSuccess(response.token); // Panggil callback dengan token yang diterima
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan periksa kredensial Anda.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center max-w-6xl w-full p-8">
      {/* Kolom Kiri: Branding & Teks (Sama seperti di VerificationPage) */}
      <div className="hidden md:flex flex-col gap-4 text-zinc-800">
        <img src="/advanta-logo.png" alt="Advanta Logo" className="w-40 mb-4" />
        <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
          Akses Admin untuk Manajemen Produk.
        </h1>
        <p className="text-lg text-zinc-600">
          Masuk untuk mengelola data produk benih unggul Advanta Anda.
        </p>
      </div>

      {/* Kolom Kanan: Kartu Form Login */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 lg:p-10 border border-white/50">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-900 text-center">
            Masuk ke Akun Anda
          </h2>
          <p className="text-center text-zinc-600 mt-2 mb-8">
            Gunakan akun admin Anda untuk mengakses fitur manajemen.
          </p>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <UserIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-colors duration-200"
                placeholder="Username"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <LockClosedIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 transition-colors duration-200"
                placeholder="Password"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToVerification}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
            >
              Kembali ke Verifikasi Produk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
