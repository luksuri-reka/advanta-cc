// app/api/complaints/[id]/feedback/route.ts
import { createServiceClient } from '@/app/utils/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 🔥 UBAH: params jadi Promise
) {
  try {
    const supabase = createServiceClient();
    
    // 🔥 AWAIT params dulu
    const { id } = await params;
    const complaintId = id;
    
    const body = await request.json();
    const { rating, quick_answers = [], feedback, complaint_number } = body;

    if (!/^[1-9]\d*$/.test(id) || typeof complaint_number !== 'string' || !complaint_number.trim()) {
      return NextResponse.json({ error: 'Nomor komplain tidak valid.' }, { status: 400 });
    }

    // Validasi rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus antara 1-5' },
        { status: 400 }
      );
    }

    // Update complaint dengan feedback
    const { data: complaint, error: updateError } = await supabase
      .from('complaints')
      .update({
        customer_satisfaction_rating: rating,
        customer_feedback: feedback || null,
        feedback_quick_answers: quick_answers,
        feedback_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', complaintId)
      .eq('complaint_number', complaint_number.trim())
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating complaint:', updateError);
      return NextResponse.json(
        { error: 'Gagal menyimpan feedback' },
        { status: 500 }
      );
    }
    if (!complaint) return NextResponse.json({ error: 'Komplain tidak ditemukan.' }, { status: 404 });

    // Optional: Kirim email notifikasi ke admin tentang feedback baru
    // await sendFeedbackNotificationEmail(complaint);

    // Optional: Log activity
    try {
      await supabase.from('complaint_responses').insert({
        complaint_id: complaintId,
        response_type: 'customer_feedback',
        message: `Customer memberikan rating ${rating}/5${feedback ? ` dengan feedback: "${feedback}"` : ''}`,
        is_internal: true,
        is_auto_response: true,
        admin_id: null,
        admin_name: 'System',
      });
    } catch (logError) {
      console.error('Error logging feedback:', logError);
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback berhasil disimpan',
      data: {
        complaint_number: complaint.complaint_number,
        rating: complaint.customer_satisfaction_rating,
        feedback_submitted_at: complaint.feedback_submitted_at,
      },
    });

  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
