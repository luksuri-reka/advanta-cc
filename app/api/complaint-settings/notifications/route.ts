// app/api/complaint-settings/notifications/route.ts
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

    // Fetch notification settings
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_settings')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Default notification settings
    const defaultSettings = {
      email_notifications_enabled: true,
      notify_on_new_complaints: true,
      notify_on_critical: true,
      notify_on_sla_breach: true,
      notify_on_customer_feedback: false,
      internal_notification_channels: ['email'],
      customer_notification_events: [
        'complaint_created',
        'status_updated',
        'response_added',
        'complaint_resolved'
      ]
    };

    return NextResponse.json({
      success: true,
      data: data?.setting_value || defaultSettings
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

    // Upsert notification settings
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .upsert({
        setting_key: 'notification_settings',
        setting_value: body,
        description: 'Notification preferences and channels',
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
      message: 'Notification settings saved successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}