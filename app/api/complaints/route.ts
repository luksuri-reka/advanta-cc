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

    if (!body.complaint_case_type_ids || !Array.isArray(body.complaint_case_type_ids) || body.complaint_case_type_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 complaint case type is required' },
        { status: 400 }
      );
    }

    // Retry logic untuk handle race condition
    let complaint = null;
    let complaintNumber = '';
    let lastError = null;
    
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        // Generate unique complaint number
        complaintNumber = await generateUniqueComplaintNumber(supabase);
        
        const complaintData = {
          complaint_number: complaintNumber,
          customer_name: body.customer_name,
          customer_email: body.customer_email,
          customer_phone: body.customer_phone,
          customer_province: body.customer_province,
          customer_city: body.customer_city,
          customer_address: body.customer_address,
          complaint_category_id: body.complaint_category_id,
          complaint_category_name: body.complaint_category_name,
          complaint_subcategory_id: body.complaint_subcategory_id,
          complaint_subcategory_name: body.complaint_subcategory_name,
          subject: body.subject,
          description: body.description,
          related_product_serial: body.related_product_serial || '',
          related_product_name: body.related_product_name || '',
          priority: body.priority || 'medium',
          status: 'submitted',
          complaint_case_type_ids: body.complaint_case_type_ids,
          complaint_case_type_names: body.complaint_case_type_names,
          attachments: body.attachments || []
        };

        const { data, error } = await supabase
          .from('complaints')
          .insert(complaintData)
          .select()
          .single();

        if (error) {
          // Jika duplicate key, retry dengan nomor baru
          if (error.code === '23505') {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
            continue;
          }
          throw error;
        }

        complaint = data;
        break;
        
      } catch (err: any) {
        lastError = err;
        if (attempt === 9) break;
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
    }

    if (!complaint) {
      console.error('Failed after retries:', lastError);
      return NextResponse.json(
        { error: 'Failed to create complaint', details: lastError?.message },
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
          console.error('Gagal mengirim notifikasi Email');
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

async function generateUniqueComplaintNumber(supabase: any): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Ambil nomor tertinggi + tambahkan random untuk avoid collision
  const { data: existingComplaints } = await supabase
    .from('complaints')
    .select('complaint_number')
    .like('complaint_number', `CMP-${dateStr}-%`)
    .order('complaint_number', { ascending: false })
    .limit(1);

  let newCounter = 1;
  
  if (existingComplaints && existingComplaints.length > 0) {
    const lastNumber = existingComplaints[0].complaint_number;
    const match = lastNumber.match(/CMP-\d{8}-(\d{4})$/);
    if (match) {
      newCounter = parseInt(match[1], 10) + 1;
    }
  }

  // Tambahkan timestamp microsecond untuk uniqueness
  const microtime = Date.now().toString().slice(-4);
  const uniqueId = `${newCounter}${microtime}`.slice(0, 4).padStart(4, '0');
  
  return `CMP-${dateStr}-${uniqueId}`;
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