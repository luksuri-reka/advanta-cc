// app/components/ImageLightbox.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

export interface LightboxImage {
  src: string;
  alt?: string;
  fileName?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
  accentColor?: 'cyan' | 'purple' | 'teal' | 'emerald' | 'blue';
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
  accentColor = 'emerald',
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const current = images[currentIndex];

  const colorMap = {
    cyan: 'bg-cyan-600 hover:bg-cyan-500',
    purple: 'bg-purple-600 hover:bg-purple-500',
    teal: 'bg-teal-600 hover:bg-teal-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500',
    blue: 'bg-blue-600 hover:bg-blue-500',
  };

  const btnColor = colorMap[accentColor];

  const goNext = useCallback(() => {
    setZoom(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setZoom(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    },
    [onClose, goNext, goPrev]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = async () => {
    if (!current?.src) return;
    setIsDownloading(true);
    try {
      const response = await fetch(current.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = current.fileName || `gambar-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(current.src, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white/60 text-sm font-medium flex-shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
          {current.fileName && (
            <span className="text-white/80 text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
              {current.fileName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Perkecil"
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5" />
          </button>
          <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Perbesar"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset zoom"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 ${btnColor} text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-lg`}
            title="Unduh gambar"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Unduh</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Prev button */}
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-3 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110 shadow-lg"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
          <img
            key={currentIndex}
            src={current.src}
            alt={current.alt || `Gambar ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-3 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110 shadow-lg"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip (only if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex-shrink-0 bg-black/60 border-t border-white/10 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto justify-center scrollbar-thin scrollbar-thumb-white/20">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setZoom(1); setCurrentIndex(i); }}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIndex
                    ? 'border-white scale-110 shadow-xl'
                    : 'border-white/20 hover:border-white/60 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt || `Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
