// app/api/complaint-settings/sla/route.ts
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

    // Fetch SLA settings from complaint_system_settings table
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .select('setting_value')
      .eq('setting_key', 'sla_configuration')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Default settings if not found
    const defaultSettings = {
      sla_response_time: 24,
      sla_resolution_time: 72,
      auto_assign_enabled: true,
      email_notifications_enabled: true,
      priority_auto_escalation: true,
      escalation_threshold_hours: 48
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

    // Validate required fields
    if (
      typeof body.sla_response_time !== 'number' ||
      typeof body.sla_resolution_time !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Upsert SLA settings
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .upsert({
        setting_key: 'sla_configuration',
        setting_value: body,
        description: 'SLA and automatic features configuration',
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
      message: 'SLA settings saved successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}