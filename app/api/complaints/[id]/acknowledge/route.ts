// app/api/complaints/[id]/acknowledge/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { replacement_qty, replacement_hybrid } = body;

    if (!replacement_qty || !replacement_hybrid) {
      return NextResponse.json({ 
        error: 'Replacement qty and hybrid are required' 
      }, { status: 400 });
    }

    // 1. Update status dan simpan data replacement
    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        status: 'acknowledged',
        acknowledged_replacement_qty: replacement_qty,
        acknowledged_replacement_hybrid: replacement_hybrid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Log history
    await supabase
      .from('complaint_history')
      .insert({
        complaint_id: parseInt(id),
        action: 'acknowledged_with_replacement',
        old_value: 'submitted',
        new_value: 'acknowledged',
        created_by: user.id,
        notes: `Acknowledged with replacement: ${replacement_qty} unit ${replacement_hybrid}`
      });

    // 3. Kirim notifikasi ke customer
    const { data: complaint } = await supabase
      .from('complaints')
      .select('customer_email, customer_phone, customer_name, complaint_number')
      .eq('id', id)
      .single();

    if (complaint) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Email notification
      if (complaint.customer_email) {
        fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'acknowledged_with_replacement',
            email: complaint.customer_email,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name,
            replacement_qty,
            replacement_hybrid
          })
        }).catch(err => console.error('Email notification failed:', err));
      }

      // WhatsApp notification
      if (complaint.customer_phone) {
        fetch(`${baseUrl}/api/notifications/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'acknowledged_with_replacement',
            customer_phone: complaint.customer_phone,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name,
            replacement_qty,
            replacement_hybrid
          })
        }).catch(err => console.error('WhatsApp notification failed:', err));
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Complaint acknowledged with replacement proposal'
    });

  } catch (error: any) {
    console.error('Acknowledge API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}