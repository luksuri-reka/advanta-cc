import React from 'react';

export default function AdminLoading() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative flex items-center justify-center">
        {/* Outer track */}
        <div className="w-20 h-20 rounded-full border-4 border-emerald-50 dark:border-gray-800"></div>
        {/* Main spinner */}
        <div className="absolute w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent animate-spin"></div>
        {/* Inner reversed spinner */}
        <div className="absolute w-14 h-14 rounded-full border-4 border-emerald-300 dark:border-emerald-700 border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
        {/* Core dot */}
        <div className="absolute w-4 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-ping"></div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-[0.2em] uppercase animate-pulse">
          Menyiapkan Workspace
        </h2>
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sinkronisasi data dari server
          </p>
          <span className="flex space-x-1">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
