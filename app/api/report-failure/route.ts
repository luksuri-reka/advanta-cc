// app/api/report-failure/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Inisialisasi Supabase client di sisi server.
// Pastikan variabel lingkungan (environment variables) ini sudah diatur di hosting Anda (misalnya Vercel).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // PENTING: Gunakan Service Role Key yang rahasia di sini
);

export async function POST(request: Request) {
  try {
    const { serialNumber, errorMessage } = await request.json();

    if (!serialNumber || !errorMessage) {
      return NextResponse.json({ error: 'Nomor seri dan pesan error dibutuhkan' }, { status: 400 });
    }

    // Siapkan data laporan untuk disimpan
    const reportData = {
      uuid: uuidv4(), // Membuat UUID unik baru
      connection: 'user_report', // Penanda bahwa ini laporan dari pengguna
      queue: 'verification_failures',
      payload: JSON.stringify({
        serialNumber: serialNumber,
        reportedAt: new Date().toISOString(),
        source: 'Halaman Verifikasi Web',
      }),
      exception: errorMessage, // Menyimpan pesan error yang dilihat pengguna
    };

    // Simpan ke tabel 'failed_jobs'
    const { error } = await supabase.from('failed_jobs').insert(reportData);

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Laporan berhasil dikirim' }, { status: 200 });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Gagal mengirim laporan', details: err.message }, { status: 500 });
  }
}