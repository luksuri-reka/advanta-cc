/**
 * Export utilities for LPJ Maret presentation
 *
 * Root cause fixes:
 * - JPG blank: Reveal.js menyimpan konten slide di dalam CSS transforms + overflow:hidden
 *   sehingga html2canvas tidak bisa "melihat" konten yang sesungguhnya.
 *   Fix: clone setiap section ke container offscreen yang bersih (tanpa transforms),
 *   dengan background yang diambil dari data-background-gradient, lalu capture dari situ.
 *
 * - PPTX tidak match UI: PPTX dibuat ulang dengan cara embed screenshot (data URL)
 *   langsung sebagai gambar full-slide → pixel-perfect, 100% sama dengan browser.
 */

// ─── Shared: capture satu slide ke base64 JPEG data URL ──────────────────────
async function captureSlideAsDataUrl(
    deckEl: HTMLDivElement,
    sectionEl: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement>
): Promise<string | null> {

    // Ambil background dari atribut data- (Reveal.js tidak set inline style di <section>)
    const bgGradient = sectionEl.getAttribute('data-background-gradient');
    const bgColor = sectionEl.getAttribute('data-background-color') || '#060612';
    const background = bgGradient ?? bgColor;

    // ── Container offscreen ───────────────────────────────────────────────────
    // Struktur: div[container] > div.reveal > div.slides > section.present
    // agar semua selector CSS (.reveal h2, .reveal .card, dsb.) tetap match pada clone.
    const container = document.createElement('div');
    container.style.cssText = [
        'position:fixed',
        'left:-99999px',
        'top:0',
        'width:1200px',
        'height:700px',
        'overflow:hidden',
        `background:${background}`,
        'font-family:Inter,sans-serif',
        'z-index:-9999',
        'pointer-events:none',
    ].join(';');

    const revealWrap = document.createElement('div');
    revealWrap.className = 'reveal';
    revealWrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;';

    const slidesWrap = document.createElement('div');
    slidesWrap.className = 'slides';
    // Reset semua transform Reveal — posisikan langsung di 0,0
    slidesWrap.style.cssText = [
        'position:absolute',
        'top:0',
        'left:0',
        'width:1200px',
        'height:700px',
        'transform:none',
        'margin:0',
        'padding:0',
    ].join(';');

    // Clone section dan hapus class Reveal (past/future) agar tidak ada style residual
    const clone = sectionEl.cloneNode(true) as HTMLElement;
    clone.classList.remove('past', 'future');
    clone.classList.add('present');
    clone.style.cssText = [
        'display:block',
        'position:absolute',
        'top:0',
        'left:0',
        'width:1200px',
        'height:700px',
        'padding:40px 60px',
        'box-sizing:border-box',
        'overflow:hidden',
        'opacity:1',
        'visibility:visible',
        'transform:none',
    ].join(';');

    slidesWrap.appendChild(clone);
    revealWrap.appendChild(slidesWrap);
    container.appendChild(revealWrap);
    document.body.appendChild(container);

    // Tunggu browser layout + font render. 1.6s cukup untuk animasi progress-fill (1.4s)
    await new Promise<void>(r => setTimeout(r, 1600));

    // ── Fix 1: Override semua animated element ke final state ──────────────────
    // progress-bar-fill: hentikan animasi dan langsung set ke nilai --w akhir
    clone.querySelectorAll<HTMLElement>('.progress-bar-fill').forEach(bar => {
        const w = bar.style.getPropertyValue('--w')
            || getComputedStyle(bar).getPropertyValue('--w').trim()
            || '0%';
        bar.style.cssText += `;animation:none;width:${w}`;
    });

    // ── Fix 2: Freeze semua animasi lain (glow-pulse, ping, float-in, dsb.) ────
    // Ambil computed values dulu, baru hentikan animasi → hasil freeze di current frame
    clone.querySelectorAll<HTMLElement>('*').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none') {
            // Beku di posisi saat ini dengan animation-play-state: paused
            el.style.animationPlayState = 'paused';
            el.style.animationDelay = '-9999s'; // paksa ke frame akhir
        }
    });

    // ── Fix 3: Force computed font-size ke inline agar vw/clamp konsisten ──────
    // html2canvas menghitung ulang clamp() berdasarkan windowWidth yang kita pass.
    // Agar hasilnya sama persis dengan browser, kita override font-size ke nilai
    // yang sudah di-compute oleh browser (dalam px) sebelum container di-move.
    clone.querySelectorAll<HTMLElement>('h1,h2,h3,p,li,span,div').forEach(el => {
        const computed = getComputedStyle(el).fontSize;
        if (computed && !el.style.fontSize) {
            el.style.fontSize = computed;
        }
    });

    try {
        const canvas = await html2canvas(container, {
            backgroundColor: null,   // biarkan background CSS yang bekerja
            scale: 2,                 // 2× resolusi (1200→2400px) untuk kualitas tajam
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 1200,
            height: 700,
            windowWidth: 1200,
            windowHeight: 700,
            onclone: (_doc: Document, el: HTMLElement) => {
                // Pastikan semua animasi di-freeze juga pada cloned document
                el.querySelectorAll('.progress-bar-fill').forEach(bar => {
                    const barEl = bar as HTMLElement;
                    const w = barEl.style.getPropertyValue('--w') || '0%';
                    barEl.style.cssText += `;animation:none;width:${w}`;
                });
            },
        });

        return canvas.toDataURL('image/jpeg', 0.94);
    } catch (err) {
        console.error('[CAPTURE] html2canvas error:', err);
        return null;
    } finally {
        document.body.removeChild(container);
    }
}

// ─── JPG Export → ZIP ────────────────────────────────────────────────────────
export async function exportAllSlidesAsJpg(
    deckEl: HTMLDivElement,
    revealApi: { slide: (h: number) => void; getTotalSlides: () => number }
): Promise<Blob | null> {
    console.log('[JPG EXPORT] Memulai export JPG (ZIP)...');
    try {
        const html2canvas = (await import('html2canvas')).default;
        const JSZip = (await import('jszip')).default;

        // Ambil semua section horizontal (top-level)
        const sections = Array.from(
            deckEl.querySelectorAll<HTMLElement>('.slides > section')
        );
        const total = sections.length;
        console.log(`[JPG EXPORT] Total ${total} slides terdeteksi.`);

        const zip = new JSZip();
        const folder = zip.folder('LPJ-Compfeed-Slides')!;

        for (let i = 0; i < total; i++) {
            console.log(`[JPG EXPORT] Merender slide ${i + 1}/${total}...`);

            const dataUrl = await captureSlideAsDataUrl(deckEl, sections[i], html2canvas);
            if (!dataUrl) {
                console.warn(`[JPG EXPORT] Slide ${i + 1} gagal dirender, dilewati.`);
                continue;
            }

            // Konversi data URL → Blob via fetch (cara paling reliable)
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            console.log(`[JPG EXPORT] Slide ${i + 1} OK — ${blob.size} bytes`);
            folder.file(`slide-${String(i + 1).padStart(2, '0')}.jpg`, blob);
        }

        console.log('[JPG EXPORT] Mengompres ke ZIP...');
        const zipRaw = await zip.generateAsync({ type: 'blob' });
        console.log(`[JPG EXPORT] ZIP selesai. Ukuran: ${zipRaw.size} bytes`);

        if (zipRaw.size < 1000) {
            console.error('[JPG EXPORT] ZIP terlalu kecil — tidak ada slide berhasil dirender.');
            return null;
        }

        return new Blob([zipRaw], { type: 'application/zip' });
    } catch (e) {
        console.error('[ERROR] Gagal export JPG:', e);
        return null;
    }
}

// ─── PPTX Export → Screenshot-based (pixel-perfect match UI) ─────────────────
// Strategi: setiap slide di-screenshot lalu di-embed sebagai gambar full-slide.
// Hasilnya identik 100% dengan tampilan di browser — tidak ada gap desain.
export async function exportAsPptx(
    deckEl: HTMLDivElement,
    revealApi: { slide: (h: number) => void; getTotalSlides: () => number }
): Promise<Blob | null> {
    console.log('[PPTX EXPORT] Memulai export PPTX (screenshot-based)...');
    try {
        const html2canvas = (await import('html2canvas')).default;
        const PptxGenJSMod = await import('pptxgenjs');
        const pptxgenjs = PptxGenJSMod.default;

        const sections = Array.from(
            deckEl.querySelectorAll<HTMLElement>('.slides > section')
        );
        const total = sections.length;
        console.log(`[PPTX EXPORT] Total ${total} slides terdeteksi.`);

        const prs = new pptxgenjs();
        prs.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
        prs.layout = 'WIDE';

        for (let i = 0; i < total; i++) {
            console.log(`[PPTX EXPORT] Merender slide ${i + 1}/${total}...`);

            const dataUrl = await captureSlideAsDataUrl(deckEl, sections[i], html2canvas);
            if (!dataUrl) {
                console.warn(`[PPTX EXPORT] Slide ${i + 1} gagal dirender, dilewati.`);
                continue;
            }

            const slide = prs.addSlide();
            // Embed screenshot sebagai gambar full-slide → pixel-perfect
            slide.addImage({
                data: dataUrl,
                x: 0, y: 0,
                w: '100%', h: '100%',
                sizing: { type: 'cover', w: 13.33, h: 7.5 },
            });

            console.log(`[PPTX EXPORT] Slide ${i + 1} di-embed ke PPTX.`);
        }

        console.log('[PPTX EXPORT] Menulis file PPTX...');
        const pptxRaw = (await prs.write({ outputType: 'blob' })) as Blob;
        console.log(`[PPTX EXPORT] Selesai. Ukuran: ${pptxRaw.size} bytes`);

        if (pptxRaw.size < 5000) {
            console.error('[PPTX EXPORT] File terlalu kecil — kemungkinan gagal digenerate.');
            return null;
        }

        return new Blob([pptxRaw], {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });
    } catch (e) {
        console.error('[ERROR] Gagal export PPTX:', e);
        return null;
    }
}