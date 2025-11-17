// app/api/complaints/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const requiredFields = [
      'customer_name',
      'customer_phone',
      'customer_province',
      'customer_city',
      'customer_address',
      'complaint_category_id',
      'complaint_category_name',
      'complaint_subcategory_id',
      'complaint_subcategory_name',
      'subject',
      'description'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validasi minimal 1 case type
    if (!body.complaint_case_type_ids || !Array.isArray(body.complaint_case_type_ids) || body.complaint_case_type_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 complaint case type is required' },
        { status: 400 }
      );
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const { count } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00Z`);
      
    const newCount = (count || 0) + 1;
    const complaintNumber = `CMP-${dateStr}-${String(newCount).padStart(4, '0')}`;

    const complaintData = {
      ...body,
      complaint_number: complaintNumber,
      status: 'submitted',
      complaint_case_type_ids: body.complaint_case_type_ids,
      complaint_case_type_names: body.complaint_case_type_names
    };

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert(complaintData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create complaint', details: error.message },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // WhatsApp notification
    try {
      const waResponse = await fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaint_created',
          phone: body.customer_phone,
          customer_name: body.customer_name,
          complaint_number: complaintNumber, 
        }),
      });

      if (!waResponse.ok) {
        const notifError = await waResponse.json();
        console.error('Gagal mengirim notifikasi WhatsApp:', notifError);
      } else {
        console.log('Notifikasi WhatsApp berhasil:', complaintNumber);
      }
    } catch (notificationError: any) {
      console.error('Error WhatsApp notification:', notificationError.message);
    }

    // Email notification
    if (body.customer_email) {
      try {
        const emailResponse = await fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complaint_created',
            email: body.customer_email,
            customer_name: body.customer_name,
            complaint_number: complaintNumber,
          }),
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json();
          console.error('Gagal mengirim notifikasi Email:', emailError);
        } else {
          console.log('Notifikasi Email berhasil dikirim.');
        }
      } catch (emailError: any) {
        console.error('Error Email notification:', emailError.message);
      }
    }

    return NextResponse.json({
      success: true,
      complaint_number: complaintNumber,
      data: complaint,
      message: 'Complaint submitted successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const complaintNumber = searchParams.get('complaint_number');
    
    if (complaintNumber) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, complaint_responses(*)')
        .eq('complaint_number', complaintNumber)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: [data] });
    }

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    console.error('API Error (GET):', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}