import { Suspense } from 'react';
import LoginForm from './LoginForm'; // Impor komponen yang baru dibuat

// Komponen untuk fallback loading
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-emerald-600"></div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        />
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <Suspense fallback={<LoadingSpinner />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}