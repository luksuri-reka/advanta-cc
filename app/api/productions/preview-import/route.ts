// app/api/productions/preview-import/route.ts - Enhanced version
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 });
    }

    let headers: string[];
    let previewRows: any[];

    if (file.type.includes('sheet') || file.type.includes('excel')) {
      // Handle Excel files
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (jsonData.length < 2) {
        return NextResponse.json({ error: 'File Excel kosong atau tidak valid' }, { status: 400 });
      }

      headers = (jsonData[0] as string[]).map(h => String(h).trim());
      
      // Get preview rows (first 5 data rows)
      previewRows = jsonData.slice(1, 6).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = String((row as any[])[index] || '').trim();
        });
        return obj;
      });

    } else {
      // Handle CSV files (existing logic)
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return NextResponse.json({ error: 'File CSV kosong atau tidak valid' }, { status: 400 });
      }

      headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1, 6); // First 5 rows for preview

      previewRows = dataRows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    }

    return NextResponse.json({
      preview: previewRows,
      totalRows: file.type.includes('sheet') || file.type.includes('excel') 
        ? XLSX.utils.sheet_to_json(XLSX.read(await file.arrayBuffer()).Sheets[XLSX.read(await file.arrayBuffer()).SheetNames[0]], { header: 1 }).length - 1
        : (await file.text()).split('\n').filter(line => line.trim()).length - 1,
      headers,
      fileType: file.type.includes('sheet') || file.type.includes('excel') ? 'excel' : 'csv'
    });

  } catch (error) {
    console.error('Error previewing file:', error);
    return NextResponse.json(
      { error: 'Gagal memproses file untuk preview' },
      { status: 500 }
    );
  }
}