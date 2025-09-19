// app/api/productions/preview-import/route.ts
import { NextRequest, NextResponse } from 'next/server';

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

    const fileContent = await file.text();

    // Parse CSV (simple implementation)
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File kosong atau tidak valid' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1, 6); // Ambil 5 baris pertama untuk preview

    const preview = dataRows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    return NextResponse.json({
      preview,
      totalRows: lines.length - 1, // Exclude header
      headers
    });

  } catch (error) {
    console.error('Error previewing file:', error);
    return NextResponse.json(
      { error: 'Gagal memproses file untuk preview' },
      { status: 500 }
    );
  }
}