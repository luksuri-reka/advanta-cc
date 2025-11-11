// app/api/complaints/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const complaint_number = searchParams.get('complaint_number');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    let query = supabase
      .from('complaints')
      .select(`
        id,
        complaint_number,
        customer_name,
        customer_email,
        customer_province,
        customer_city,
        complaint_type,
        subject,
        status,
        created_at,
        resolved_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    
    if (complaint_number) {
      query = query.eq('complaint_number', complaint_number);
    }

    if (!complaint_number) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count,
      pagination: {
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.customer_name || !body.subject || !body.description) {
      return NextResponse.json(
        { error: 'Nama, subjek, dan deskripsi wajib diisi' }, 
        { status: 400 }
      );
    }

    if (!body.customer_province || !body.customer_city || !body.customer_address) {
      return NextResponse.json(
        { error: 'Provinsi, Kabupaten/Kota, dan Alamat wajib diisi' }, 
        { status: 400 }
      );
    }

    // Generate complaint number
    const year = new Date().getFullYear();
    const { data: lastComplaint } = await supabase
      .from('complaints')
      .select('complaint_number')
      .like('complaint_number', `ADV-COMP-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastComplaint && lastComplaint.length > 0) {
      const lastNumber = lastComplaint[0].complaint_number.split('-').pop();
      nextNumber = parseInt(lastNumber || '0') + 1;
    }
    
    const complaintNumber = `ADV-COMP-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Insert complaint
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        complaint_number: complaintNumber,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_province: body.customer_province,
        customer_city: body.customer_city,
        customer_address: body.customer_address,
        complaint_type: body.complaint_type || 'other',
        subject: body.subject,
        description: body.description,
        related_product_serial: body.related_product_serial,
        related_product_name: body.related_product_name,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification
    if (data && body.customer_email) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'http://localhost:3000';
      const emailApiUrl = `${baseUrl}/api/notifications/email`;
      
      fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaint_created',
          email: body.customer_email,
          complaint_number: complaintNumber,
          customer_name: body.customer_name
        })
      })
      .then(res => res.json())
      .then(data => console.log('✅ Email sent:', data))
      .catch(err => console.error('❌ Email failed:', err));
    }

    return NextResponse.json({
      data,
      message: 'Komplain berhasil dibuat',
      complaint_number: complaintNumber
    });

  } catch (error: any) {
    console.error('POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}