// app/api/complaints/[id]/responses/route.ts - DIPERBAIKI
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // --- PERBAIKAN 1: Baca 'is_internal' BUKAN 'is_customer_response' ---
    const body = await request.json();
    const { 
      message, 
      admin_name, 
      admin_id, 
      is_internal // 👈 BACA INI (sesuai skema database)
    } = body;

    // Get user (bisa 'null' jika pelanggan yang post)
    const { data: { user } } = await supabase.auth.getUser();

    // --- PERBAIKAN 2: Validasi ---
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      );
    }
    
    // Catatan internal harus punya admin_id
    if (admin_id === null && is_internal === true) {
       return NextResponse.json(
        { error: 'Internal notes must have an admin_id' }, 
        { status: 400 }
      );
    }

    // --- PERBAIKAN 3: Insert 'is_internal' ke DB ---
    const { data, error } = await supabase
      .from('complaint_responses')
      .insert({
        complaint_id: parseInt(id),
        message: message,
        admin_name: admin_name, // Ini akan 'null' jika dari pelanggan
        admin_id: admin_id, // Ini akan 'null' jika dari pelanggan
        is_internal: is_internal || false // 👈 GUNAKAN INI (sesuai skema database)
      })
      .select()
      .single();

    if (error) {
      // Error 'PGRST204' akan hilang sekarang
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update complaint's updated_at timestamp
    await supabase
      .from('complaints')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // --- PERBAIKAN 4: Log HANYA jika dari admin ---
    if (admin_id) {
      await supabase
        .from('complaint_history') // Asumsi nama tabel ini benar
        .insert({
          complaint_id: parseInt(id),
          action: is_internal ? 'internal_note_added' : 'response_added',
          new_value: `Response by ${admin_name || 'Admin'}`,
          created_by: admin_id,
          notes: message.substring(0, 150)
        });
    }

    // --- PERBAIKAN 5: Kirim notifikasi HANYA jika BUKAN internal ---
    // (PENTING: 'admin_id' null berarti dari pelanggan, JANGAN kirim notif)
    if (is_internal === false && admin_id !== null) {
      
      const { data: complaint } = await supabase
        .from('complaints')
        .select('customer_email, customer_name, complaint_number, customer_phone')
        .eq('id', id)
        .single();

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // Kirim Email
      if (complaint && complaint.customer_email) {
        fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complaint_response',
            email: complaint.customer_email,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name,
            response_message: message 
          })
        }).catch(err => console.error('Email notification failed:', err));
      }

      // Kirim WhatsApp
      if (complaint && complaint.customer_phone) {
        fetch(`${baseUrl}/api/notifications/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complaint_response',
            phone: complaint.customer_phone,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name
          })
        }).catch(err => console.error('WhatsApp notification failed:', err));
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