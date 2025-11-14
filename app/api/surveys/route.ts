// app/api/surveys/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ++ HAPUS IMPORT YANG SALAH (referensi Twilio) ++
// import { sendSurveyWhatsAppNotification } from '@/app/utils/emailService';

// Buat Supabase client dengan service role untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function untuk validasi rating
const validateRating = (rating: any, fieldName: string): number | null => {
  // ... (Fungsi ini tidak berubah)
  if (rating === null || rating === undefined || rating === 0 || rating === '') {
    return null;
  }
  const num = Number(rating);
  if (isNaN(num) || num < 1 || num > 5) {
    throw new Error(`${fieldName} harus antara 1-5 atau kosong`);
  }
  return num;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validasi Nama (wajib)
    if (!body.customer_name || body.customer_name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama pelanggan wajib diisi' }, 
        { status: 400 }
      );
    }

    // Validasi Email (Opsional, tapi jika ada, harus valid)
    if (body.customer_email && body.customer_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.customer_email)) {
        return NextResponse.json(
          { error: 'Format email tidak valid' }, 
          { status: 400 }
        );
      }
    }

    try {
      // ... (Bagian validasi rating tetap sama) ...
      const ratingsData = body.ratings || {};
      const preparedRatings: any = {};
      if (ratingsData.overall_satisfaction !== undefined) {
        preparedRatings.overall_satisfaction = validateRating(
          ratingsData.overall_satisfaction, 
          'Kepuasan keseluruhan'
        );
      }
      if (ratingsData.product_quality !== undefined) {
        preparedRatings.product_quality = validateRating(
          ratingsData.product_quality, 
          'Kualitas produk'
        );
      }
      if (ratingsData.packaging !== undefined) {
        preparedRatings.packaging = validateRating(
          ratingsData.packaging, 
          'Kemasan'
        );
      }
      if (ratingsData.delivery !== undefined) {
        preparedRatings.delivery = validateRating(
          ratingsData.delivery, 
          'Pengiriman'
        );
      }
      const productPerformanceRating = validateRating(
        body.product_performance_rating, 
        'Performa produk'
      );
      const packagingQualityRating = validateRating(
        body.packaging_quality_rating, 
        'Kualitas kemasan'
      );

      // Prepare insert data
      const insertData: any = {
        verification_serial: body.verification_serial || null,
        related_product_name: body.related_product_name || null,
        customer_name: body.customer_name.trim(),
        customer_email: body.customer_email ? body.customer_email.trim().toLowerCase() : null,
        customer_phone: body.customer_phone?.trim() || null,
        survey_type: body.survey_type || 'post_verification',
        ratings: Object.keys(preparedRatings).length > 0 ? preparedRatings : null,
        comments: body.comments?.trim() || null,
        suggestions: body.suggestions?.trim() || null,
        would_recommend: body.would_recommend !== undefined ? body.would_recommend : null,
        product_performance_rating: productPerformanceRating,
        packaging_quality_rating: packagingQualityRating
      };

      // Insert survey data
      const { data, error } = await supabaseAdmin
        .from('surveys')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Gagal menyimpan survey: ' + error.message },
          { status: 500 }
        );
      }

      console.log('Survey submitted successfully:', data.id);

      // ++ UBAH: Blok Notifikasi (Gunakan Fonnte untuk Keduanya) ++
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // 1. Kirim notifikasi WhatsApp (ke Admin via Fonnte)
      const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER;
      if (adminWhatsAppNumber) {
        try {
          // Tidak perlu await, biarkan berjalan di background
          fetch(`${baseUrl}/api/notifications/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'survey_admin_notification', // Tipe baru
              phone: adminWhatsAppNumber, // Nomor Admin
              customer_name: data.customer_name,
              survey_id: data.id,
              product_name: data.related_product_name,
              serial: data.verification_serial,
              rating: data.ratings?.overall_satisfaction
            }),
          });
          console.log(`Notifikasi WhatsApp admin terpicu.`);
        } catch (adminNotificationError: any) {
          console.error('Gagal memicu notifikasi WhatsApp admin:', adminNotificationError.message);
        }
      } else {
        console.warn('ADMIN_WHATSAPP_NUMBER tidak diset. Melewatkan notifikasi admin.');
      }

      // 2. Kirim notifikasi WhatsApp (ke Pelanggan via Fonnte)
      if (body.customer_phone) {
        try {
          // Tidak perlu await, biarkan berjalan di background
          fetch(`${baseUrl}/api/notifications/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'survey_submitted', // Tipe untuk pelanggan
              phone: body.customer_phone,
              customer_name: body.customer_name,
              survey_id: data.id 
            }),
          });
          console.log(`Notifikasi WhatsApp ke pelanggan ${body.customer_name} terpicu.`);
        } catch (customerNotificationError: any) {
          console.error('Gagal memicu notifikasi WhatsApp pelanggan:', customerNotificationError.message);
        }
      }
      // ++ AKHIR BLOK NOTIFIKASI ++

      return NextResponse.json({
        success: true,
        data,
        message: 'Survey berhasil disimpan. Terima kasih atas feedback Anda!'
      }, { status: 201 });

    } catch (validationError: any) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: validationError.message || 'Validasi data gagal' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // ... (Fungsi GET tidak berubah) ...
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const serial = searchParams.get('serial');

    let query = supabaseAdmin
      .from('surveys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (serial) {
      query = query.eq('verification_serial', serial);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data survey' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      }
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}