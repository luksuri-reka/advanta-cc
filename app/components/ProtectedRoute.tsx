// app/components/ProtectedRoute.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// 1. Ganti getAuthToken dengan getProfile
import { getProfile } from '../utils/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Client-side route guard. Redirects to /admin/login if no auth session found.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 2. Buat fungsi async untuk memeriksa sesi
    const checkSession = async () => {
      const user = await getProfile();

      if (!user) {
        // 3. Jika tidak ada user, arahkan ke halaman login
        const next = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
      } else {
        // 4. Jika ada user, tampilkan halamannya
        setIsReady(true);
      }
    };

    checkSession();
  }, [router, pathname, searchParams]);

  // Tampilkan loading selama proses pengecekan sesi
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-700">
          <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Mengecek sesi...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}