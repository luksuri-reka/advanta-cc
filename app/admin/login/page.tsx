import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Enhanced Loading Component
function LoadingSpinner() {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/80 animate-pulse">
      <div className="text-center space-y-6">
        {/* Logo Skeleton */}
        <div className="w-40 h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mx-auto animate-shimmer"></div>
        
        {/* Title Skeleton */}
        <div className="space-y-3">
          <div className="w-32 h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mx-auto animate-shimmer"></div>
          <div className="w-48 h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mx-auto animate-shimmer"></div>
          <div className="w-64 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mx-auto animate-shimmer"></div>
        </div>
        
        {/* Form Skeleton */}
        <div className="space-y-4 pt-6">
          <div className="w-full h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer"></div>
          <div className="w-full h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer"></div>
          <div className="w-full h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ backgroundImage: "url('/background-field.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-white/50 to-emerald-50/70 backdrop-blur-[2px]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
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