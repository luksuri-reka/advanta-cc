// app/components/Login.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRightIcon, 
  UserIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { login } from '../utils/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const { user } = await login(email, password);

      if (user) {
        router.replace('/admin');
      } else {
        throw new Error('Gagal masuk, data pengguna tidak diterima.');
      }
    } catch (err: any) {
      const message = err?.message || 'Gagal masuk. Periksa kembali email/kata sandi Anda.';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with dark mode */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/5 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-400/5 dark:bg-purple-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className={`max-w-md w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Login Card */}
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/80 dark:border-slate-700/80 relative overflow-hidden">
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 dark:from-emerald-500/5 dark:to-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-emerald-400/10 dark:from-purple-500/5 dark:to-emerald-500/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-full text-emerald-800 dark:text-emerald-300 text-sm font-semibold border border-emerald-200 dark:border-emerald-800 shadow-sm mb-6">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>Secure Login</span>
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-800 via-slate-800 to-emerald-700 dark:from-emerald-400 dark:via-slate-300 dark:to-emerald-500 bg-clip-text text-transparent mb-3">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Silakan masukkan kredensial Anda untuk mengakses sistem
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <UserIcon className={`h-5 w-5 transition-colors duration-200 ${emailFocused ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="block w-full rounded-2xl border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-200 dark:ring-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                      placeholder="Masukkan email Anda"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${passwordFocused ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="block w-full rounded-2xl border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 py-4 pl-12 pr-14 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-200 dark:ring-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                      placeholder="Masukkan kata sandi"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm animate-slide-in-bottom">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 px-6 py-5 text-base font-bold text-white shadow-2xl shadow-emerald-500/30 dark:shadow-emerald-500/20 hover:shadow-3xl hover:shadow-emerald-500/40 dark:hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 overflow-hidden"
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                        <span>Masuk</span>
                        <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </div>
                </button>

                {/* Security Notice */}
                <div className="text-center pt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Koneksi aman dan terenkripsi
                  </p>
                </div>
              </form>

              {/* Footer Info */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Sistem Verifikasi Benih Advanta Seeds Indonesia
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    © 2025 Powered by Advanta Seeds Indonesia
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span>Secure</span>
                    <span>•</span>
                    <span>Reliable</span>
                    <span>•</span>
                    <span>Trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}