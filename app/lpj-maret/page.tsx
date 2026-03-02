'use client';

import { useState, useEffect, useRef } from 'react';
import { exportToJpgZip, exportToPptx, exportToPdf } from './exportUtils';

export default function PresentationViewer() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const totalSlides = 8;
  const viewerRef = useRef<HTMLDivElement>(null);

  // Navigasi Menggunakan Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fitur Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Helper untuk Trigger Download File
  const forceDownload = (blob: Blob | null, filename: string) => {
    if (!blob) {
      alert("Terjadi kesalahan saat memproses file. Silakan coba lagi.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handler Export
  const handleExport = async (type: 'jpg' | 'pptx' | 'pdf') => {
    if (exporting) return;
    setExporting(type);
    try {
      if (type === 'jpg') {
        const blob = await exportToJpgZip(totalSlides);
        forceDownload(blob, 'LPJ-Compfeed-Slides.zip');
      } else if (type === 'pptx') {
        const blob = await exportToPptx(totalSlides);
        forceDownload(blob, 'LPJ-Compfeed-Presentation.pptx');
      } else if (type === 'pdf') {
        const blob = await exportToPdf(totalSlides);
        forceDownload(blob, 'LPJ-Compfeed-Document.pdf');
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <div ref={viewerRef} className="relative w-screen h-screen bg-black overflow-hidden font-sans">

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        .spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />

      {/* RENDER IFRAME SLIDES */}
      {Array.from({ length: totalSlides }).map((_, index) => {
        const slideNum = index + 1;
        const isActive = currentSlide === slideNum;

        return (
          <iframe
            key={slideNum}
            src={`/lpj-maret/v2/slide${slideNum}.html`}
            className={`absolute top-0 left-0 w-full h-full border-none transition-all duration-700 ease-in-out origin-center
              ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}
            title={`Slide ${slideNum}`}
          />
        );
      })}

      {/* PANEL EXPORT (Pojok Kanan Atas) */}
      <div className="absolute top-6 right-6 flex gap-3 z-50">
        <button
          onClick={() => handleExport('jpg')}
          disabled={!!exporting}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-blue-600 text-white border border-blue-500/50 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {exporting === 'jpg' ? <span className="spin">⏳</span> : <i className="fa-solid fa-file-zipper"></i>}
          JPG (Zip)
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!exporting}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-red-600 text-white border border-red-500/50 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {exporting === 'pdf' ? <span className="spin">⏳</span> : <i className="fa-solid fa-file-pdf"></i>}
          PDF
        </button>
        <button
          onClick={() => handleExport('pptx')}
          disabled={!!exporting}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-amber-600 text-white border border-amber-500/50 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {exporting === 'pptx' ? <span className="spin">⏳</span> : <i className="fa-solid fa-file-powerpoint"></i>}
          PPTX
        </button>
      </div>

      {/* PANEL NAVIGASI (Bawah Tengah) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 transition-all">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
          disabled={currentSlide === 1}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-blue-500 disabled:opacity-30 transition-all"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="min-w-[80px] text-center">
          <span className="text-white font-mono font-bold tracking-widest text-sm">
            {currentSlide} <span className="text-slate-500">/</span> {totalSlides}
          </span>
        </div>
        <button
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
          disabled={currentSlide === totalSlides}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-blue-500 disabled:opacity-30 transition-all"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
        <div className="w-[1px] h-6 bg-slate-700 mx-2"></div>
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-emerald-500 transition-all"
        >
          <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>
    </div>
  );
}