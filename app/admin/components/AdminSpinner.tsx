import React from 'react';

interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AdminSpinner({ text = 'Memuat Data...', size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const ringClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const baseSize = sizeClasses[size];
  const innerSize = ringClasses[size];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-10">
      <div className="relative flex items-center justify-center">
        {/* Outer track */}
        <div className={`${baseSize} rounded-full border-4 border-emerald-50 dark:border-gray-800`}></div>
        {/* Main spinner */}
        <div className={`absolute ${baseSize} rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent animate-spin`}></div>
        {/* Inner reversed spinner */}
        <div className={`absolute ${innerSize} rounded-full border-4 border-emerald-300 dark:border-emerald-700 border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite_reverse]`}></div>
        {/* Core dot */}
        <div className="absolute w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-ping"></div>
      </div>
      
      {text && (
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase animate-pulse">
            {text}
          </p>
          <span className="flex space-x-1">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></span>
          </span>
        </div>
      )}
    </div>
  );
}
