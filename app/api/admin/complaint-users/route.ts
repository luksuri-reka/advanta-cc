// app/api/admin/complaint-users/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch complaint users with their email from auth.users
    const { data, error } = await supabase
      .from('user_complaint_profiles')
      .select(`
        *
      `)
      .order('full_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch emails separately (RLS limitation)
    const userIds = data?.map(u => u.user_id) || [];
    const emailMap: Record<string, string> = {};
    
    for (const userId of userIds) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        emailMap[userId] = authUser.user.email;
      }
    }

    // Enrich data with emails
    const enrichedData = data?.map(profile => ({
      ...profile,
      email: emailMap[profile.user_id] || 'N/A'
    }));

    return NextResponse.json({ 
      success: true,
      data: enrichedData 
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.user_id || !body.full_name) {
      return NextResponse.json({ 
        error: 'user_id and full_name are required' 
      }, { status: 400 });
    }

    // Check if user exists in auth
    const { data: authUser } = await supabase.auth.admin.getUserById(body.user_id);
    if (!authUser?.user) {
      return NextResponse.json({ 
        error: 'User not found in auth system' 
      }, { status: 404 });
    }

    // Upsert profile
    const { data, error } = await supabase
      .from('user_complaint_profiles')
      .upsert({
        user_id: body.user_id,
        full_name: body.full_name,
        department: body.department || 'customer_service',
        job_title: body.job_title,
        complaint_permissions: body.complaint_permissions || {
          canViewComplaints: false,
          canAssignComplaints: false,
          canRespondToComplaints: false,
          canUpdateComplaintStatus: false,
          canViewComplaintAnalytics: false,
          canConfigureComplaintSystem: false,
          canManageComplaintUsers: false,
          canExportComplaintData: false
        },
        max_assigned_complaints: body.max_assigned_complaints || 10,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'User complaint profile saved successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}