import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Simplified Loading Component
function LoadingSpinner() {
  return (
    <div className="glass-morphism rounded-3xl shadow-premium p-12 border border-white/80">
      <div className="text-center space-y-6">
        {/* Logo Skeleton */}
        <div className="w-40 h-12 skeleton rounded-lg mx-auto"></div>
        
        {/* Title Skeleton */}
        <div className="space-y-3">
          <div className="w-32 h-6 skeleton rounded-lg mx-auto"></div>
          <div className="w-48 h-8 skeleton rounded-lg mx-auto"></div>
          <div className="w-64 h-4 skeleton rounded-lg mx-auto"></div>
        </div>
        
        {/* Form Skeleton */}
        <div className="space-y-4 pt-6">
          <div className="w-full h-14 skeleton rounded-2xl"></div>
          <div className="w-full h-14 skeleton rounded-2xl"></div>
          <div className="w-full h-14 skeleton rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Simplified Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-white/70 to-emerald-50/80"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg px-6">
        <Suspense fallback={<LoadingSpinner />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}