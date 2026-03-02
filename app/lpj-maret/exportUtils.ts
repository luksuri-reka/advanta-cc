/**
 * Export utilities untuk 3D Viewer Presentation
 * Solusi Super Presisi: Menunggu Font & Tailwind, Fix Glassmorphism, & Lock Resolusi
 */

async function captureSlideUrl(slideNumber: number): Promise<string | null> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');

        // Letakkan iframe dengan opacity sangat kecil agar tetap dirender sempurna oleh browser
        iframe.style.cssText = 'position:fixed; top:0; left:0; width:1920px; height:1080px; border:none; opacity:0.01; z-index:-9999; pointer-events:none;';
        iframe.src = `/lpj-maret/v2/slide${slideNumber}.html`;
        document.body.appendChild(iframe);

        iframe.onload = async () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!doc) {
                    document.body.removeChild(iframe);
                    return resolve(null);
                }

                // 1. TUNGGU TAILWIND SELESAI (Beri waktu ekstra 2 detik)
                await new Promise(r => setTimeout(r, 2000));

                // 2. TUNGGU FONT SELESAI LOADING (Agar layout teks tidak berantakan)
                if (doc.fonts) {
                    await doc.fonts.ready;
                }

                // 3. SUNTIKAN CSS "ANTI-RUSAK" KHUSUS HTML2CANVAS
                const styleInject = doc.createElement('style');
                styleInject.innerHTML = `
                    /* Kunci ukuran mutlak agar tidak ada yang bergeser */
                    html, body {
                        width: 1920px !important;
                        height: 1080px !important;
                        min-width: 1920px !important;
                        min-height: 1080px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    .slide-container {
                        width: 1920px !important;
                        height: 1080px !important;
                        min-width: 1920px !important;
                        min-height: 1080px !important;
                    }
                    
                    /* Matikan semua animasi agar hasil foto tidak blur/berbayang */
                    * {
                        animation: none !important;
                        transition: none !important;
                    }

                    /* FIX EFEK KACA (GLASSMORPHISM) */
                    /* html2canvas gagal merender backdrop-filter (blur).
                       Sebagai gantinya, kita matikan blur-nya dan kita beri warna solid 
                       biru dongker (slate-800) agar terlihat 99% mirip aslinya */
                    .card-glass, .feature-card, .auto-card, .phase-card, .budget-card, 
                    .highlight-box, .mini-banner, .conclusion-card, .qa-box, .cta-section {
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                        background-color: rgba(30, 41, 59, 0.95) !important; /* Warna pekat pengganti efek kaca */
                    }
                    
                    /* Pastikan overlay background cukup gelap */
                    .overlay {
                        background-color: rgba(15, 23, 42, 0.95) !important;
                    }
                `;
                doc.head.appendChild(styleInject);

                // Beri waktu 500ms agar browser mengaplikasikan CSS suntikan di atas
                await new Promise(r => setTimeout(r, 500));

                const html2canvas = (await import('html2canvas')).default;

                const canvas = await html2canvas(doc.body, {
                    width: 1920,
                    height: 1080,
                    windowWidth: 1920,
                    windowHeight: 1080,
                    scale: 1.5, // Kualitas HD
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#0f172a'
                });

                document.body.removeChild(iframe);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (err) {
                console.error(`Gagal capture slide ${slideNumber}:`, err);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
                resolve(null);
            }
        };
    });
}

// ─── 1. EXPORT KE JPG (DALAM FILE ZIP) ───
export async function exportToJpgZip(totalSlides: number): Promise<Blob | null> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('LPJ-Compfeed-Slides')!;

    for (let i = 1; i <= totalSlides; i++) {
        const dataUrl = await captureSlideUrl(i);
        if (dataUrl) {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            folder.file(`Slide-${String(i).padStart(2, '0')}.jpg`, blob);
        }
    }
    return await zip.generateAsync({ type: 'blob' });
}

// ─── 2. EXPORT KE PPTX (POWERPOINT) ───
export async function exportToPptx(totalSlides: number): Promise<Blob | null> {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';

    for (let i = 1; i <= totalSlides; i++) {
        const dataUrl = await captureSlideUrl(i);
        if (dataUrl) {
            const slide = pptx.addSlide();
            slide.addImage({
                data: dataUrl,
                x: 0, y: 0, w: '100%', h: '100%',
                sizing: { type: 'cover', w: 13.33, h: 7.5 }
            });
        }
    }
    return (await pptx.write({ outputType: 'blob' })) as Blob;
}

// ─── 3. EXPORT KE PDF ───
export async function exportToPdf(totalSlides: number): Promise<Blob | null> {
    const jsPDF = (await import('jspdf')).jsPDF;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

    for (let i = 1; i <= totalSlides; i++) {
        const dataUrl = await captureSlideUrl(i);
        if (dataUrl) {
            if (i > 1) pdf.addPage([1920, 1080], 'landscape');
            pdf.addImage(dataUrl, 'JPEG', 0, 0, 1920, 1080);
        }
    }
    return pdf.output('blob');
}