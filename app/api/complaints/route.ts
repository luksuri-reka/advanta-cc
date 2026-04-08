// app/api/complaints/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Tambahkan helper function
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

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

    // Format nomor telepon
    const formattedPhone = formatPhoneNumber(body.customer_phone);

    let complaint = null;
    let complaintNumber = '';
    let lastError = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        complaintNumber = await generateUniqueComplaintNumber(supabase);

        const complaintData = {
          complaint_number: complaintNumber,
          customer_name: body.customer_name,
          customer_email: body.customer_email,
          customer_phone: formattedPhone,
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
          // 🔥 BARU: Simpan data Lot dan Quantity
          lot_number: body.lot_number || '',
          problematic_quantity: body.problematic_quantity || '',

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // WhatsApp notification
    try {
      const waResponse = await fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaint_created',
          customer_phone: formattedPhone,
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

    // 🔥 ADMIN WhatsApp — Panggil Fonnte LANGSUNG (bypass internal route)
    try {
      const adminWaNumbers = process.env.ADMIN_WA_NUMBERS;
      const fonnteToken = process.env.FONNTE_API_TOKEN;

      if (adminWaNumbers && fonnteToken) {
        // Normalisasi tiap nomor: 08x → 628x
        const normalizePhone = (num: string): string => {
          const cleaned = num.trim().replace(/\D/g, '');
          if (cleaned.startsWith('62')) return cleaned;
          if (cleaned.startsWith('0')) return '62' + cleaned.slice(1);
          if (cleaned.startsWith('8')) return '62' + cleaned;
          return cleaned;
        };

        const finalAdminTarget = adminWaNumbers
          .split(',')
          .map(normalizePhone)
          .filter(Boolean)
          .join(',');

        const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://advantaindonesia.com'}/admin/complaints/${complaint.id}`;
        const adminMessage = `🚨 *KOMPLAIN BARU MASUK* 🚨

Ada laporan komplain baru dari pelanggan.

👤 *Nama:* ${body.customer_name}
📞 *No. WA:* ${formattedPhone}
📋 *No. Komplain:* ${complaintNumber}
📌 *Kategori:* ${body.complaint_category_name || '-'}
⚠️ *Subjek:* ${body.subject || '-'}

Silakan segera cek dashboard admin untuk menindaklanjuti:
🔗 ${adminUrl}

---
*Sistem Notifikasi Advanta*`;

        const adminPayload = new URLSearchParams();
        adminPayload.append('target', finalAdminTarget);
        adminPayload.append('message', adminMessage);
        adminPayload.append('countryCode', '62');

        console.log(`📱 [Admin WA] Mengirim ke: ${finalAdminTarget}`);

        const fonnteResponse = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: adminPayload.toString(),
        });

        const fonnteResult = await fonnteResponse.json();
        if (!fonnteResponse.ok || fonnteResult.status === false) {
          console.error('❌ Gagal kirim WA Admin via Fonnte:', fonnteResult);
        } else {
          console.log('✅ Notifikasi WA Admin berhasil dikirim:', fonnteResult);
        }
      } else {
        if (!adminWaNumbers) console.warn('⚠️ ADMIN_WA_NUMBERS tidak disetting di .env');
        if (!fonnteToken) console.warn('⚠️ FONNTE_API_TOKEN tidak disetting di .env');
      }
    } catch (adminError: any) {
      console.error('❌ Error kirim WA Admin:', adminError.message);
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

  const microtime = Date.now().toString().slice(-4);
  const uniqueId = `${newCounter}${microtime}`.slice(0, 4).padStart(4, '0');

  return `CMP-${dateStr}-${uniqueId}`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const complaintNumber = searchParams.get('complaint_number');

    if (complaintNumber) {
      // Gunakan service role key untuk bypass RLS (karena ini request public tanpa session user)
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return [] },
            setAll() { }
          }
        }
      );

      // 🔥 UPDATE: Tambahkan observations di sini
      const { data: complaint, error } = await supabaseAdmin
        .from('complaints')
        .select('*')
        .eq('complaint_number', complaintNumber)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Ambil responses
      const { data: responses } = await supabaseAdmin
        .from('complaint_responses')
        .select('*')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      // 🔥 TAMBAHKAN: Ambil observations
      const { data: observations } = await supabaseAdmin
        .from('complaint_observations')
        .select('*')
        .eq('complaint_id', complaint.id);

      // Gabungkan data
      const enrichedData = {
        ...complaint,
        complaint_responses: responses || [],
        complaint_observations: observations || []
      };

      return NextResponse.json({ success: true, data: [enrichedData] });
    }

    // List all complaints (membutuhkan Auth)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = user?.app_metadata?.roles || [];
    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin');

    // Baca optional query params
    const limit = searchParams.get('limit');
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

    // Apply optional filters
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (priorityFilter) {
      query = query.eq('priority', priorityFilter);
    }
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    if (!isSuperAdmin) {
      const { data: profile } = await supabase
        .from('user_complaint_profiles')
        .select('assigned_regions')
        .eq('user_id', user.id)
        .single();

      if (profile?.assigned_regions && profile.assigned_regions.length > 0) {
        query = query.in('customer_province', profile.assigned_regions);
      }
      // Jika kosong, query dibiarkan tanpa filter in(), sehingga RLS di DB yang akan mengambil alih.
      // (Berdasarkan update RLS: array kosong berarti boleh lihat semua)
    }

    const { data, error } = await query;

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