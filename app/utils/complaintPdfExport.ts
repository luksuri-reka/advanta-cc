// app/utils/complaintPdfExport.ts
// Utility untuk export Summary Report PDF menggunakan html2canvas + jsPDF

export async function exportComplaintSummaryPdf(elementId: string, filename: string) {
  // Dynamic import agar tidak bundle di server
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);

  const element = document.getElementById(elementId);
  if (!element) throw new Error('Elemen tidak ditemukan');

  // Capture the element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Jika konten lebih dari 1 halaman, buat multi-page
  let position = 0;
  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi page
    while (position < imgHeight) {
      pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
      position += pageHeight;
      if (position < imgHeight) {
        pdf.addPage();
      }
    }
  }

  pdf.save(filename);
}
