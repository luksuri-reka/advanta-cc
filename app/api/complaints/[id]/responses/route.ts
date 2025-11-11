// app/api/complaints/[id]/responses/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // --- PERBAIKAN 1: Baca payload yang benar dari frontend ---
    const body = await request.json();
    const { 
      message, 
      admin_name, 
      admin_id, 
      is_customer_response 
    } = body;

    // Get current user (for auth check)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- PERBAIKAN 2: Validasi payload baru ---
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      );
    }
    if (!admin_id) {
      return NextResponse.json(
        { error: 'admin_id is required' }, 
        { status: 400 }
      );
    }

    // --- PERBAIKAN 3: Insert data yang benar ke DB ---
    const { data, error } = await supabase
      .from('complaint_responses')
      .insert({
        complaint_id: parseInt(id),
        message: message,
        admin_name: admin_name || user.user_metadata?.name || 'Admin', // Fallback
        admin_id: admin_id, // Simpan ID admin
        is_customer_response: is_customer_response || false // Gunakan field yang benar
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update complaint's updated_at timestamp
    await supabase
      .from('complaints')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // --- PERBAIKAN 4: Tambahkan log ke riwayat ---
    await supabase
      .from('complaint_history') // Asumsi nama tabel ini benar
      .insert({
        complaint_id: parseInt(id),
        action: 'response_added',
        new_value: `Response by ${admin_name}`,
        created_by: admin_id, // Gunakan admin_id dari payload
        notes: message.substring(0, 150) // Potong pesan untuk notes
      });


    // --- PERBAIKAN 5: Update logika email ---
    // Kirim email jika ini adalah balasan DARI admin (BUKAN dari customer)
    if (is_customer_response === false) {
      // Get complaint details for email
      const { data: complaint } = await supabase
        .from('complaints')
        .select('customer_email, customer_name, complaint_number')
        .eq('id', id)
        .single();

      if (complaint && complaint.customer_email) {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complaint_response', // Tipe email ini sudah benar
            email: complaint.customer_email,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name,
            response_message: message // Kirim pesan lengkap di email
          })
        }).catch(err => console.error('Email notification failed:', err));
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Response sent successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}