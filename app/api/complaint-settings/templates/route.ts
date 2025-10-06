// app/api/complaint-settings/templates/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch email templates
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .select('setting_value')
      .eq('setting_key', 'email_templates')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Default email templates
    const defaultTemplates = {
      complaint_created: {
        subject: 'Komplain Anda Telah Diterima - {complaint_number}',
        body: `Halo {customer_name},

Terima kasih telah menghubungi kami. Komplain Anda telah kami terima dengan nomor referensi: {complaint_number}

Tim customer care kami akan menindaklanjuti dalam waktu maksimal 24 jam. Anda dapat melacak status komplain menggunakan nomor referensi di atas.

Hormat kami,
PT Advanta Seeds Indonesia`
      },
      status_updated: {
        subject: 'Update Komplain {complaint_number}',
        body: `Halo {customer_name},

Ada update terbaru untuk komplain Anda: {complaint_number}

Status saat ini: {status}

Silakan klik link berikut untuk melihat detail: {tracking_link}

Hormat kami,
PT Advanta Seeds Indonesia`
      },
      complaint_resolved: {
        subject: 'Komplain {complaint_number} Telah Diselesaikan',
        body: `Halo {customer_name},

Komplain Anda dengan nomor {complaint_number} telah diselesaikan.

Kami berharap solusi yang diberikan dapat memuaskan Anda. Mohon berikan rating kepuasan Anda: {feedback_link}

Terima kasih atas kepercayaan Anda.
PT Advanta Seeds Indonesia`
      },
      response_added: {
        subject: 'Respon Baru untuk Komplain {complaint_number}',
        body: `Halo {customer_name},

Tim kami telah memberikan respon untuk komplain Anda: {complaint_number}

Silakan lihat detail respon di: {tracking_link}

Hormat kami,
PT Advanta Seeds Indonesia`
      }
    };

    return NextResponse.json({
      success: true,
      data: data?.setting_value || defaultTemplates
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate templates format
    const requiredTemplates = ['complaint_created', 'status_updated', 'complaint_resolved'];
    for (const templateKey of requiredTemplates) {
      if (!body[templateKey] || !body[templateKey].subject || !body[templateKey].body) {
        return NextResponse.json(
          { error: `Invalid template format for ${templateKey}` },
          { status: 400 }
        );
      }
    }

    // Upsert email templates
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .upsert({
        setting_key: 'email_templates',
        setting_value: body,
        description: 'Email templates for complaint notifications',
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data.setting_value,
      message: 'Email templates saved successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}