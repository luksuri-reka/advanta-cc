import { Suspense } from 'react';

// Ini adalah tampilan loading yang akan muncul sementara
// komponen yang butuh browser (seperti ProtectedRoute) disiapkan.
function AdminLoadingFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50">
      <div className="flex items-center gap-3 text-zinc-700">
        <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Memuat Halaman Admin...</span>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Semua halaman di dalam /admin akan dibungkus oleh Suspense ini
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      {children}
    </Suspense>
  );
}