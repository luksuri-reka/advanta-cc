// app/api/surveys/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
  // Jika rating tidak ada, null, undefined, atau 0, return null
  if (rating === null || rating === undefined || rating === 0 || rating === '') {
    return null;
  }
  
  const num = Number(rating);
  
  // Jika bukan number atau di luar range 1-5
  if (isNaN(num) || num < 1 || num > 5) {
    throw new Error(`${fieldName} harus antara 1-5 atau kosong`);
  }
  
  return num;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customer_name || body.customer_name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama pelanggan wajib diisi' }, 
        { status: 400 }
      );
    }

    if (!body.customer_email || body.customer_email.trim() === '') {
      return NextResponse.json(
        { error: 'Email pelanggan wajib diisi' }, 
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer_email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' }, 
        { status: 400 }
      );
    }

    try {
      // Prepare ratings data dengan validasi
      const ratingsData = body.ratings || {};
      const preparedRatings: any = {};

      // Validasi setiap rating field
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

      // Validasi individual rating fields
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
        customer_name: body.customer_name.trim(),
        customer_email: body.customer_email.trim().toLowerCase(),
        customer_phone: body.customer_phone?.trim() || null,
        survey_type: body.survey_type || 'post_verification',
        ratings: Object.keys(preparedRatings).length > 0 ? preparedRatings : null,
        comments: body.comments?.trim() || null,
        suggestions: body.suggestions?.trim() || null,
        would_recommend: body.would_recommend !== undefined ? body.would_recommend : null,
        product_performance_rating: productPerformanceRating,
        packaging_quality_rating: packagingQualityRating
      };

      // Log data yang akan diinsert (untuk debugging)
      console.log('Inserting survey data:', {
        customer_name: insertData.customer_name,
        customer_email: insertData.customer_email,
        product_performance_rating: insertData.product_performance_rating,
        packaging_quality_rating: insertData.packaging_quality_rating,
        ratings: insertData.ratings
      });

      // Insert survey data menggunakan service role (bypass RLS)
      const { data, error } = await supabaseAdmin
        .from('surveys')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        
        // Handle specific constraint errors
        if (error.message.includes('check constraint')) {
          return NextResponse.json(
            { error: 'Nilai rating harus antara 1-5 atau kosong' }, 
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'Gagal menyimpan survey: ' + error.message }, 
          { status: 500 }
        );
      }

      // Log success
      console.log('Survey submitted successfully:', {
        id: data.id,
        customer_name: data.customer_name,
        created_at: data.created_at
      });

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
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const serial = searchParams.get('serial');

    let query = supabaseAdmin
      .from('surveys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by serial if provided
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