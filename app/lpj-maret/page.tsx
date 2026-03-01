'use client';

import { useEffect, useRef, useState } from 'react';
import { exportAllSlidesAsJpg, exportAsPptx } from './exportUtils';

export default function LpjMaretPage() {
  const deckRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const revealApiRef = useRef<{ slide: (h: number) => void; getTotalSlides: () => number } | null>(null);
  const [exporting, setExporting] = useState<null | 'jpg' | 'pptx'>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Inject reveal.js CSS via <link> to avoid TypeScript CSS-module errors
    const injectLink = (href: string, id: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };
    injectLink('/reveal/reveal.css', 'revealjs-core');
    injectLink('/reveal/theme/black.css', 'revealjs-theme');

    let revealInstance: { destroy?: () => void } | null = null;

    const init = async () => {
      const Reveal = (await import('reveal.js')).default;
      if (!deckRef.current) return;

      revealInstance = new Reveal(deckRef.current, {
        hash: true,
        transition: 'slide',
        backgroundTransition: 'zoom',
        controls: true,
        progress: true,
        center: true,
        width: 1200,
        height: 700,
        margin: 0.06,
        slideNumber: 'c/t',
      });

      await (revealInstance as unknown as { initialize: () => Promise<void> }).initialize();
      // Store reveal API for export
      revealApiRef.current = revealInstance as unknown as { slide: (h: number) => void; getTotalSlides: () => number };
    };

    init();

    return () => {
      if (revealInstance && typeof revealInstance.destroy === 'function') {
        revealInstance.destroy();
      }
    };
  }, []);

  const forceDownload = (blob: Blob | null, filename: string) => {
    if (!blob || blob.size === 0) {
      console.error('[DOWNLOAD] Blob kosong, download dibatalkan.');
      return;
    }
    // JANGAN pakai a.target = "_blank" — akan membuat browser
    // membuka tab baru dan mengabaikan atribut download.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    setTimeout(() => {
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 100);
  };

  const handleExportJpg = async () => {
    if (!deckRef.current || !revealApiRef.current || exporting) return;
    setExporting('jpg');
    try {
      const blob = await exportAllSlidesAsJpg(deckRef.current, revealApiRef.current);
      if (!blob) { alert('Export JPG gagal. Coba refresh dan ulangi.'); return; }
      forceDownload(blob, 'LPJ-Compfeed-Slides.zip');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPptx = async () => {
    if (!deckRef.current || !revealApiRef.current || exporting) return;
    setExporting('pptx');
    try {
      const blob = await exportAsPptx(deckRef.current, revealApiRef.current);
      if (!blob) { alert('Export PPTX gagal. Coba refresh dan ulangi.'); return; }
      forceDownload(blob, 'LPJ-Compfeed-Luksuri-Reka.pptx');
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

        html, body, #__next {
          margin: 0; padding: 0; height: 100%; overflow: hidden;
          background: #060612;
          font-family: 'Inter', sans-serif;
        }

        /* ── ANIMATIONS ── */
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 10px #00e5ff80, 0 0 20px #00e5ff40; }
          50%       { text-shadow: 0 0 20px #00e5ffcc, 0 0 40px #00e5ff80, 0 0 60px #00e5ff40; }
        }
        @keyframes border-spin {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: var(--w); }
        }
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: .7; }
        }

        /* ── BASE REVEAL OVERRIDES ── */
        .reveal-viewport, .reveal, .reveal .slides {
          font-family: 'Inter', sans-serif !important;
        }
        .reveal .slides section {
          text-align: left;
          padding: 0 0.5rem;
        }
        .reveal .slides section.center-slide {
          text-align: center;
        }

        /* ── TYPOGRAPHY ── */
        .reveal h1 {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          line-height: 1.15;
          color: #ffffff;
          letter-spacing: -0.02em;
          text-shadow: 0 0 30px #00e5ff33;
        }
        .reveal h2 {
          font-size: clamp(1.1rem, 2vw, 1.55rem);
          font-weight: 700;
          color: #fff;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .reveal h2::after {
          content: '';
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, #00e5ff44, transparent);
          border-radius: 999px;
        }
        .reveal h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #00e5ff;
          margin: 0 0 0.5rem;
        }
        .reveal p, .reveal li {
          font-size: clamp(0.8rem, 1.4vw, 0.95rem);
          line-height: 1.65;
          color: #c8d8e8;
        }

        /* ── GLOW TEXT ── */
        .glow {
          color: #00e5ff;
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
        .glow-orange {
          color: #ffab40;
          text-shadow: 0 0 12px #ffab4066;
        }
        .glow-green {
          color: #69ff47;
          text-shadow: 0 0 10px #69ff4755;
        }

        /* ── CARDS ── */
        .card {
          background: linear-gradient(135deg, #0d1f35 0%, #0a1628 100%);
          border: 1px solid #00e5ff22;
          border-radius: 12px;
          padding: 1rem 1.2rem;
          position: relative;
          overflow: hidden;
          transition: border-color .3s;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00e5ff, transparent);
          opacity: .6;
        }
        .card:hover {
          border-color: #00e5ff55;
        }

        /* ── TWO-COL GRID ── */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.6rem;
        }
        .three-col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.8rem;
          margin-top: 0.6rem;
        }

        /* ── BULLET LIST ── */
        .reveal ul.custom-list {
          list-style: none;
          margin: 0.4rem 0 0;
          padding: 0;
        }
        .reveal ul.custom-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          margin-bottom: 0.6rem;
          font-size: clamp(0.78rem, 1.3vw, 0.92rem);
          color: #c8d8e8;
        }
        .reveal ul.custom-list li .bullet {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00e5ff22;
          border: 1px solid #00e5ff66;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: #00e5ff;
          margin-top: 2px;
        }

        /* ── BADGE ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #00e5ff14;
          border: 1px solid #00e5ff40;
          color: #00e5ff;
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: .03em;
        }
        .badge.orange {
          background: #ffab4014;
          border-color: #ffab4044;
          color: #ffab40;
        }
        .badge.green {
          background: #69ff4714;
          border-color: #69ff4744;
          color: #69ff47;
        }
        .badge.red {
          background: #ff535314;
          border-color: #ff535344;
          color: #ff7070;
        }

        /* ── PROGRESS BAR ── */
        .progress-bar-wrap {
          background: #ffffff14;
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
          margin-top: 0.3rem;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00e5ff, #00b4d8);
          animation: progress-fill 1.4s cubic-bezier(.4,0,.2,1) forwards;
        }

        /* ── STAT TILES ── */
        .stat {
          background: linear-gradient(135deg, #0d1f35, #091525);
          border: 1px solid #00e5ff22;
          border-radius: 10px;
          padding: 0.8rem 1rem;
          text-align: center;
        }
        .stat .num {
          font-family: 'JetBrains Mono', monospace;
          font-size: clamp(1.3rem, 2.5vw, 2rem);
          font-weight: 700;
          color: #00e5ff;
          text-shadow: 0 0 16px #00e5ff55;
          display: block;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .stat .label {
          font-size: 0.7rem;
          color: #7898aa;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        /* ── BUDGET TABLE ── */
        .budget-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.9rem;
          margin: 0.8rem 0;
          border-radius: 10px;
          overflow: hidden;
        }
        .budget-table thead tr {
          background: #00e5ff18;
        }
        .budget-table th {
          padding: 0.6rem 1rem;
          color: #00e5ff;
          font-weight: 700;
          text-align: left;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: .05em;
          border-bottom: 1px solid #00e5ff22;
        }
        .budget-table td {
          padding: 0.55rem 1rem;
          color: #c8d8e8;
          border-bottom: 1px solid #ffffff0a;
        }
        .budget-table tr:last-child td {
          border-bottom: none;
          background: #ffab4010;
          color: #ffab40;
          font-weight: 700;
        }

        /* ── URGENT BOX ── */
        .urgent-box {
          background: linear-gradient(135deg, #1a1206 0%, #241a05 100%);
          border: 1px solid #ffab4044;
          border-left: 3px solid #ffab40;
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          margin-top: 0.8rem;
          position: relative;
          overflow: hidden;
        }
        .urgent-box::before {
          content: '⚡ URGENT PAYMENT';
          display: block;
          font-size: 0.65rem;
          letter-spacing: .1em;
          font-weight: 800;
          color: #ffab40;
          margin-bottom: 0.45rem;
        }
        .urgent-box p {
          font-size: 0.8rem !important;
          line-height: 1.65;
          color: #d4c09e !important;
          margin: 0;
        }

        /* ── TIMELINE ── */
        .timeline-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.65rem;
          align-items: flex-start;
        }
        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 8px #00e5ff;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .timeline-line {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          padding-left: 1.5rem;
        }
        .timeline-line::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 8px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(#00e5ff33, transparent);
        }

        /* ── COVER SLIDE ── */
        .cover-logo-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1.4rem;
        }
        .cover-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #ffffff09;
          border: 1px solid #ffffff18;
          border-radius: 999px;
          padding: 0.5rem 1.2rem;
          font-size: 0.82rem;
          color: #aaccdd;
        }
        .cover-pill strong {
          color: #ffffff;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #00e5ff44, transparent);
          margin: 1rem auto;
          width: 70%;
        }

        /* ── CLOSING SLIDE ── */
        .closing-ring {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 3px solid transparent;
          background: linear-gradient(#060612, #060612) padding-box,
                      linear-gradient(135deg, #00e5ff, #7b61ff, #00e5ff) border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem;
          font-size: 3rem;
          animation: ping 2s ease-in-out infinite;
        }
        .closing-title {
          font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 800;
          text-align: center;
          background: linear-gradient(135deg, #00e5ff, #7b61ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .closing-sub {
          text-align: center;
          font-size: 0.9rem;
          color: #7898aa;
          margin-top: 0.4rem;
        }
        .contact-grid {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 1.2rem;
          flex-wrap: wrap;
        }
        .contact-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }
        .contact-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: #00e5ff14;
          border: 1px solid #00e5ff33;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .contact-text {
          font-size: 0.72rem;
          color: #7898aa;
          text-align: center;
        }
        .contact-val {
          font-size: 0.8rem;
          color: #c8d8e8;
          font-weight: 600;
          text-align: center;
        }
        /* ── EXPORT TOOLBAR ── */
        .export-bar {
          position: fixed;
          top: 16px;
          right: 20px;
          z-index: 9999;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0d1f35ee;
          border: 1px solid #00e5ff44;
          color: #c8d8e8;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          backdrop-filter: blur(8px);
          transition: border-color .2s, background .2s, transform .15s;
          white-space: nowrap;
        }
        .export-btn:hover:not(:disabled) {
          border-color: #00e5ffaa;
          background: #0d2a45ee;
          transform: translateY(-1px);
        }
        .export-btn:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .export-btn.pptx {
          border-color: #ffab4044;
          color: #ffab40;
        }
        .export-btn.pptx:hover:not(:disabled) {
          border-color: #ffab40aa;
          background: #2a1a00ee;
        }
        .spin {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Floating Export Toolbar ── */}
      <div className="export-bar">
        <button
          className="export-btn"
          onClick={handleExportJpg}
          disabled={!!exporting}
          title="Download semua slide sebagai JPG (ZIP)"
        >
          {exporting === 'jpg'
            ? <><span className="spin">⏳</span> Exporting…</>
            : <>📸 Export JPG</>}
        </button>
        <button
          className="export-btn pptx"
          onClick={handleExportPptx}
          disabled={!!exporting}
          title="Download sebagai file PowerPoint (.pptx)"
        >
          {exporting === 'pptx'
            ? <><span className="spin">⏳</span> Exporting…</>
            : <>📊 Export PPTX</>}
        </button>
      </div>

      <div style={{ width: '100vw', height: '100vh' }}>
        <div className="reveal" ref={deckRef}>
          <div className="slides">

            {/* ══════════════════════════════════════════
                SLIDE 1 — COVER
            ══════════════════════════════════════════ */}
            <section
              className="center-slide"
              data-background-gradient="radial-gradient(ellipse at 20% 50%, #001a2e 0%, #060612 60%, #0a001a 100%)"
            >
              <div className="cover-logo-bar">
                <span style={{ fontSize: '2.5rem' }}>🌾</span>
              </div>

              <h1>
                System Rescue &amp; Modernization<br />
                of <span className="glow">Compfeed</span>
              </h1>

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="cover-pill">
                  <span>📋</span>
                  <span>Prepared for: <strong>PT Advanta Seeds Indonesia</strong></span>
                </div>
                <div className="cover-pill">
                  <span>🏢</span>
                  <span>By: <strong>PT Luksuri Reka Digital Solutions</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="badge orange">LPJ — Q1 2026</span>
                <span className="badge">Progress Report</span>
                <span className="badge">Maret 2026</span>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 2 — THE HANDOVER CRISIS
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 80% 20%, #1a0505 0%, #060612 70%)">
              <h2>⚠️ The Handover Crisis</h2>
              <p style={{ marginBottom: '0.8rem', color: '#7898aa', fontSize: '0.82rem' }}>
                Kondisi sistem pada saat vendor overhandle dari pihak sebelumnya:
              </p>

              <div className="two-col">
                <div>
                  <div className="card" style={{ marginBottom: '0.8rem' }}>
                    <h3>🧩 Sistem Terfragmentasi</h3>
                    <ul className="custom-list">
                      <li><span className="bullet">▸</span> 2 frontend VueJS terpisah, tidak saling terintegrasi</li>
                      <li><span className="bullet">▸</span> 1 backend Laravel dengan dependency lama &amp; tidak terdokumentasi</li>
                    </ul>
                  </div>
                  <div className="card">
                    <h3>🔒 Tanpa Access Control</h3>
                    <ul className="custom-list">
                      <li><span className="bullet">▸</span> Tidak ada pemisahan role — semua user setara</li>
                      <li><span className="bullet">▸</span> Risiko kebocoran &amp; manipulasi data internal</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <div className="card" style={{ marginBottom: '0.8rem' }}>
                    <h3>📄 Minim Dokumentasi</h3>
                    <ul className="custom-list">
                      <li><span className="bullet">▸</span> Tidak ada API spec, ERD, maupun deployment guide</li>
                      <li><span className="bullet">▸</span> Proses handover "buta" — hanya source code mentah</li>
                    </ul>
                  </div>
                  <div className="card">
                    <h3>🚨 Ancaman Downtime</h3>
                    <ul className="custom-list">
                      <li><span className="bullet">▸</span> Arsitektur tidak scalable, potensi crash tinggi</li>
                      <li><span className="bullet">▸</span> Proses scanning &amp; lab reporting rentan terganggu</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 3 — THE ARCHITECTURE LEAP
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 10% 80%, #001428 0%, #060612 60%)">
              <h2>🚀 The Architecture Leap</h2>
              <p style={{ marginBottom: '0.8rem', color: '#7898aa', fontSize: '0.82rem' }}>
                Inisiatif strategis: <span className="glow-orange">Full Rewrite</span> ke platform modern terpadu.
              </p>

              <div className="two-col" style={{ marginBottom: '0.8rem' }}>
                <div className="card" style={{ borderColor: '#ff535322', borderLeftColor: '#ff5353' }}>
                  <h3 style={{ color: '#ff7070' }}>❌ Before — Legacy Stack</h3>
                  <ul className="custom-list">
                    <li><span className="bullet" style={{ borderColor: '#ff535344', color: '#ff5353' }}>✗</span> 2× Frontend VueJS terpisah</li>
                    <li><span className="bullet" style={{ borderColor: '#ff535344', color: '#ff5353' }}>✗</span> 1× Backend Laravel (monolith)</li>
                    <li><span className="bullet" style={{ borderColor: '#ff535344', color: '#ff5353' }}>✗</span> MySQL — skema tidak optimal</li>
                    <li><span className="bullet" style={{ borderColor: '#ff535344', color: '#ff5353' }}>✗</span> Tanpa CI/CD, tanpa dokumentasi</li>
                  </ul>
                </div>
                <div className="card" style={{ borderColor: '#69ff4722', borderLeftColor: '#69ff47' }}>
                  <h3 style={{ color: '#69ff47' }}>✅ After — Modern Stack</h3>
                  <ul className="custom-list">
                    <li><span className="bullet" style={{ borderColor: '#69ff4744', color: '#69ff47' }}>✓</span> <strong>1× Next.js 15</strong> full-stack (App Router)</li>
                    <li><span className="bullet" style={{ borderColor: '#69ff4744', color: '#69ff47' }}>✓</span> <strong>Supabase</strong> (PostgreSQL + Auth + Storage)</li>
                    <li><span className="bullet" style={{ borderColor: '#69ff4744', color: '#69ff47' }}>✓</span> Row Level Security (RLS) built-in</li>
                    <li><span className="bullet" style={{ borderColor: '#69ff4744', color: '#69ff47' }}>✓</span> 1 pintu — efisien, scalable &amp; stabil</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <div className="stat"><span className="num">80%+</span><span className="label">Core Progress</span></div>
                <div className="stat"><span className="num">1</span><span className="label">Platform (dari 3)</span></div>
                <div className="stat"><span className="num">0</span><span className="label">Downtime Terencana</span></div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 4 — KEY FEATURES 1
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 90% 10%, #001628 0%, #060612 70%)">
              <h2>✨ Key Features <span style={{ color: '#7898aa', fontWeight: 400, fontSize: '1rem' }}>1 / 2</span></h2>

              <div className="two-col">
                <div className="card">
                  <h3>🔗 Seamless Integration</h3>
                  <ul className="custom-list">
                    <li><span className="bullet">▸</span> Modul Scan &amp; Dashboard menyatu dalam <strong>1 platform</strong></li>
                    <li><span className="bullet">▸</span> Data scan QR terhubung real-time ke histori produk &amp; laporan lab</li>
                    <li><span className="bullet">▸</span> Tidak ada lagi sinkronisasi manual antar aplikasi terpisah</li>
                    <li><span className="bullet">▸</span> Single source of truth untuk semua data operasional</li>
                  </ul>
                  <div style={{ marginTop: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#7898aa', marginBottom: '4px' }}>
                      <span>Integrasi Module</span><span className="glow">95%</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ '--w': '95%' } as React.CSSProperties} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3>🛡️ Role-Based Access Control</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <div style={{ background: '#00e5ff0f', border: '1px solid #00e5ff22', borderRadius: '8px', padding: '0.4rem 0.7rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#00e5ff', fontWeight: 700 }}>ADMIN</div>
                      <div style={{ fontSize: '0.68rem', color: '#7898aa' }}>Full management access</div>
                    </div>
                    <div style={{ background: '#ffab400f', border: '1px solid #ffab4022', borderRadius: '8px', padding: '0.4rem 0.7rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#ffab40', fontWeight: 700 }}>LAB</div>
                      <div style={{ fontSize: '0.68rem', color: '#7898aa' }}>Input &amp; validasi hasil uji</div>
                    </div>
                    <div style={{ background: '#69ff470f', border: '1px solid #69ff4722', borderRadius: '8px', padding: '0.4rem 0.7rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#69ff47', fontWeight: 700 }}>QC / FIELD</div>
                      <div style={{ fontSize: '0.68rem', color: '#7898aa' }}>Scan &amp; submit observasi</div>
                    </div>
                  </div>
                  <ul className="custom-list">
                    <li><span className="bullet">▸</span> Audit trail otomatis di setiap aksi kritis</li>
                    <li><span className="bullet">▸</span> RLS policy di level database (Supabase)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 5 — KEY FEATURES 2
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 50% 90%, #00100a 0%, #060612 60%)">
              <h2>✨ Key Features <span style={{ color: '#7898aa', fontWeight: 400, fontSize: '1rem' }}>2 / 2</span></h2>

              <div className="two-col">
                <div className="card">
                  <h3>📋 Flow Komplain Terintegrasi</h3>
                  <div style={{ position: 'relative', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{
                      position: 'absolute', left: '4px', top: '8px', bottom: '8px',
                      width: '2px', background: 'linear-gradient(#00e5ff, #7b61ff, transparent)'
                    }} />
                    {[
                      { label: 'Observasi Lapangan', icon: '👁' },
                      { label: 'Submit Komplain', icon: '📝' },
                      { label: 'Lab Testing', icon: '🔬' },
                      { label: 'Approval', icon: '✅' },
                      { label: 'Resolusi & Notifikasi', icon: '📲' },
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: i === 4 ? '#7b61ff' : '#00e5ff',
                          boxShadow: `0 0 6px ${i === 4 ? '#7b61ff' : '#00e5ff'}`
                        }} />
                        <span style={{ fontSize: '0.82rem', color: '#c8d8e8' }}>{step.icon} {step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>📦 QR Code &amp; Notifikasi</h3>
                  <ul className="custom-list" style={{ marginTop: '0.4rem' }}>
                    <li><span className="bullet">▸</span> Generate &amp; cetak QR Code produk dengan <strong>1 klik</strong></li>
                    <li><span className="bullet">▸</span> Scan langsung dari <strong>mobile browser</strong> — tanpa install app</li>
                    <li><span className="bullet">▸</span> Notifikasi <strong>WhatsApp</strong> otomatis setiap stage event:
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>QC Selesai</span>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>Approval Dibutuhkan</span>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>Komplain Baru</span>
                      </div>
                    </li>
                  </ul>
                  <div style={{ marginTop: '0.8rem', padding: '0.5rem 0.8rem', background: '#00e5ff08', borderRadius: '8px', border: '1px solid #00e5ff1a' }}>
                    <div style={{ fontSize: '0.68rem', color: '#7898aa', marginBottom: '2px' }}>Delivery Rate Notifikasi</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#69ff47', fontFamily: 'JetBrains Mono, monospace' }}>99.2%</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 6 — ROADMAP APRIL - SEPTEMBER
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 30% 70%, #001428 0%, #060612 70%)">
              <h2>🗺️ Roadmap Sisa Pekerjaan</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <span className="badge">April 2026</span>
                <span style={{ color: '#7898aa', fontSize: '0.8rem', alignSelf: 'center' }}>→</span>
                <span className="badge">September 2026</span>
              </div>

              <div className="three-col">
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <h3 style={{ textAlign: 'center', fontSize: '0.9rem' }}>Modul Survey Dinamis</h3>
                  <p style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                    Builder form survey yang dapat dikonfigurasi admin. Hasil survey teragregasi di dashboard analytics.
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ '--w': '10%', background: 'linear-gradient(90deg, #7b61ff, #a78bfa)' } as React.CSSProperties} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#7898aa', marginTop: '3px', textAlign: 'right' }}>10%</div>
                  </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎨</div>
                  <h3 style={{ textAlign: 'center', fontSize: '0.9rem' }}>Minor Tweaks UI/UX &amp; DB</h3>
                  <p style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                    Penyempurnaan UI berdasarkan feedback, optimasi query, dan penyesuaian skema DB operasional.
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ '--w': '60%', background: 'linear-gradient(90deg, #00e5ff, #00b4d8)' } as React.CSSProperties} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#7898aa', marginTop: '3px', textAlign: 'right' }}>60%</div>
                  </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖥️</div>
                  <h3 style={{ textAlign: 'center', fontSize: '0.9rem' }}>Server Maintenance</h3>
                  <p style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                    Pemeliharaan VPS/hosting, update dependensi, backup rutin, dan pemantauan uptime.
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ '--w': '40%', background: 'linear-gradient(90deg, #ffab40, #ff8c00)' } as React.CSSProperties} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#7898aa', marginTop: '3px', textAlign: 'right' }}>40%</div>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '0.8rem', padding: '0.55rem 1rem',
                background: '#ffffff06', borderRadius: '8px', border: '1px solid #ffffff10',
                display: 'flex', alignItems: 'center', gap: '0.8rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📅</span>
                <span style={{ fontSize: '0.78rem', color: '#7898aa' }}>
                  Seluruh deliverable di atas diselesaikan dalam rentang <strong style={{ color: '#c8d8e8' }}>April – September 2026</strong> pasca pencairan Termin 2.
                </span>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 7 — BUDGET & URGENT PAYMENT
            ══════════════════════════════════════════ */}
            <section data-background-gradient="radial-gradient(ellipse at 70% 30%, #1a0e00 0%, #060612 60%)">
              <h2>💰 Budget &amp; Urgent Payment Justification</h2>

              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Komponen</th>
                    <th>Nominal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span style={{ fontWeight: 600, color: '#c8d8e8' }}>Pagu Tahunan</span>
                      <div style={{ fontSize: '0.7rem', color: '#7898aa' }}>Total kontrak FY 2026</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem' }}>
                      <strong style={{ color: '#c8d8e8' }}>Rp 42.000.000</strong>
                    </td>
                    <td><span className="badge">Kontrak</span></td>
                  </tr>
                  <tr>
                    <td>
                      <span style={{ fontWeight: 600, color: '#c8d8e8' }}>Termin 1</span>
                      <div style={{ fontSize: '0.7rem', color: '#7898aa' }}>Kickoff &amp; Core System Build</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', color: '#69ff47 !important' }}>
                      <span style={{ color: '#69ff47' }}>Rp 21.000.000</span>
                    </td>
                    <td><span className="badge green">✅ Cair</span></td>
                  </tr>
                  <tr>
                    <td>
                      <span style={{ fontWeight: 600 }}>Termin 2</span>
                      <div style={{ fontSize: '0.7rem', color: '#c09060' }}>Sisa Pekerjaan April – Sept 2026</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem' }}>
                      Rp 21.000.000
                    </td>
                    <td><span className="badge orange">🔔 Diajukan</span></td>
                  </tr>
                </tbody>
              </table>

              <div className="urgent-box">
                <p>
                  Karena PT Luksuri Reka mengambil inisiatif investasi waktu di awal untuk me-rewrite sistem demi mencegah downtime,
                  progres <em>core system</em> saat ini telah <strong style={{ color: '#ffab40' }}>&gt;80%</strong>.
                  Sesuai aturan tutup buku <strong style={{ color: '#ffab40' }}>Fiscal Year bulan Maret</strong>,
                  kami mengajukan pencairan Termin 2 (sisa pekerjaan April–Sept) bulan ini sebagai{' '}
                  <strong style={{ color: '#ffab40' }}>Urgent Payment</strong>.
                </p>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SLIDE 8 — CLOSING / THANK YOU
            ══════════════════════════════════════════ */}
            <section
              className="center-slide"
              data-background-gradient="radial-gradient(ellipse at 50% 50%, #050a1a 0%, #060612 60%, #0a0518 100%)"
            >
              <div className="closing-ring">🤝</div>

              <div className="closing-title">Terima Kasih, PT Advanta Seeds!</div>
              <p className="closing-sub">
                Kami berkomitmen penuh untuk menyelesaikan sistem Compfeed menjadi platform<br />
                yang <span className="glow">andal, efisien, dan berkembang bersama bisnis Anda.</span>
              </p>

              <div style={{ margin: '1rem auto', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, #00e5ff33, transparent)' }} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div className="stat" style={{ minWidth: '100px' }}>
                  <span className="num">80%+</span>
                  <span className="label">Progres Core</span>
                </div>
                <div className="stat" style={{ minWidth: '100px' }}>
                  <span className="num">8</span>
                  <span className="label">Fitur Utama</span>
                </div>
                <div className="stat" style={{ minWidth: '100px' }}>
                  <span className="num">1</span>
                  <span className="label">Platform Terpadu</span>
                </div>
                <div className="stat" style={{ minWidth: '100px' }}>
                  <span className="num" style={{ color: '#ffab40' }}>Maret</span>
                  <span className="label">Target Pencairan</span>
                </div>
              </div>

              <div className="contact-grid" style={{ marginTop: '1rem' }}>
                <div className="contact-item">
                  <div className="contact-icon">🌐</div>
                  <div className="contact-text">Website</div>
                  <div className="contact-val">luksurireka.com</div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div className="contact-text">Email</div>
                  <div className="contact-val">hello@luksurireka.com</div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📱</div>
                  <div className="contact-text">WhatsApp</div>
                  <div className="contact-val">+62 xxx-xxxx-xxxx</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span className="badge orange" style={{ fontSize: '0.72rem' }}>⚡ Mohon segera diproses — Termin 2 Urgent Payment Maret 2026</span>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}