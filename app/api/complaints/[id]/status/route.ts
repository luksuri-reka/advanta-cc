// app/api/complaints/[id]/status/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

const complaintStatuses = [
  'submitted',        // 1. Dikirim
  'acknowledged',     // 2. Dikonfirmasi
  'observation',      // 3. Proses Observasi
  'investigation',    // 4. Proses Investigasi & Lab Testing
  'decision',         // 5. Menunggu Keputusan
  'pending_response', // 6. Menunggu Respon Customer
  'resolved',         // 7. Selesai
  'closed'            // 8. Ditutup/Arsip
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !complaintStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status: ${status}` 
      }, { status: 400 });
    }

    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('status, resolved_at, customer_email, customer_phone, complaint_number, customer_name')
      .eq('id', id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ 
        error: 'Complaint not found' 
      }, { status: 404 });
    }

    if (complaint.status === status) {
      return NextResponse.json({ 
        message: 'Status already set',
        data: complaint
      }, { status: 200 });
    }

    const updateData: {
      status: string;
      updated_at: string;
      resolved_at?: string;
      resolved_by?: string;
    } = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    if ((status === 'resolved' || status === 'closed') && !complaint.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    }

    const { error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Update status error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update status' 
      }, { status: 500 });
    }

    // Log history
    await supabase
      .from('complaint_history')
      .insert({
        complaint_id: parseInt(id),
        action: 'status_changed',
        old_value: complaint.status,
        new_value: status,
        created_by: user.id,
        notes: `Status changed from ${complaint.status} to ${status}`
      });

    // Kirim notifikasi ke customer
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Email notification
    if (complaint.customer_email) {
      fetch(`${baseUrl}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_update',
          email: complaint.customer_email,
          complaint_number: complaint.complaint_number,
          customer_name: complaint.customer_name,
          new_status: status
        })
      }).catch(err => console.error('Email notification failed:', err));
    }

    // WhatsApp notification
    if (complaint.customer_phone) {
      fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_update',
          customer_phone: complaint.customer_phone, // ← Ubah dari phone
          complaint_number: complaint.complaint_number,
          customer_name: complaint.customer_name,
          new_status: status
        })
      }).catch(err => console.error('WhatsApp notification failed:', err));
    }

    return NextResponse.json({ 
      success: true,
      message: `Status updated to ${status}`,
      data: { old_status: complaint.status, new_status: status }
    });

  } catch (error: any) {
    console.error('Update Status API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}