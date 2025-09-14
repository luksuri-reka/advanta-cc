'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAuthToken } from '../utils/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Client-side route guard. Redirects to /admin/login if no auth token found.
 * This complements middleware.ts which guards on the server/edge.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      const next = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setReady(true);
  }, [router, pathname, searchParams]);

  if (!ready) {
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
