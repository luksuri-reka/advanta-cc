'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '../../utils/auth'; // Pastikan path ini benar

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('adminadvanta@gmail.com');
  const [password, setPassword] = useState('advanta2023');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);

    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setDebugInfo('Menghubungi server...');
      
      const result = await login(email, password);
      
      setDebugInfo(`Login berhasil! Token: ${result.token?.substring(0, 20)}...`);
      
      const next = searchParams?.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      
      const message = err?.message || 'Gagal masuk. Periksa kembali email/kata sandi Anda.';
      setError(message);
      
      setDebugInfo(`Debug: ${JSON.stringify({
        errorMessage: err?.message,
        errorName: err?.name,
        stack: err?.stack?.split('\n')[0]
      }, null, 2)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const testConnection = async () => {
    try {
      setDebugInfo('Testing connection...');
      const response = await fetch('http://127.0.0.1:8000/api/console/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      
      const text = await response.text();
      setDebugInfo(`Connection test: ${response.status} - ${text.substring(0, 200)}...`);
    } catch (err: any) {
      setDebugInfo(`Connection failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/60">
      <div className="flex flex-col items-center gap-3 mb-6">
        <img src="/advanta-logo.png" alt="Advanta Logo" className="w-32" />
        <h1 className="text-xl font-semibold text-zinc-900">Masuk Admin Console</h1>
        <p className="text-sm text-zinc-600 text-center">
          Silakan masuk menggunakan akun admin Anda untuk mengelola data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors"
            placeholder="admin@example.com"
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors"
            placeholder="••••••••"
            disabled={submitting}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {debugInfo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-mono whitespace-pre-wrap">
            {debugInfo}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
          
          <button
            type="button"
            onClick={testConnection}
            disabled={submitting}
            className="px-3 py-3 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Test Connection"
          >
            🔍
          </button>
        </div>
      </form>
    </div>
  );
}