// app/api/admin/complaint-users/route.ts
import { createClient as createServerClient } from '@/app/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Helper untuk create admin client
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client untuk bypass RLS
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('user_complaint_profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = data?.map(u => u.user_id) || [];
    const emailMap: Record<string, string> = {};
    
    for (const userId of userIds) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        emailMap[userId] = authUser.user.email;
      }
    }

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
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received body:', body);

    // Validasi
    if (!body.user_id || typeof body.user_id !== 'string' || body.user_id.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid user_id is required',
        received: body.user_id
      }, { status: 400 });
    }

    if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid full_name is required',
        received: body.full_name
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Cek apakah user sudah ada
    const { data: existing } = await adminClient
      .from('user_complaint_profiles')
      .select('user_id')
      .eq('user_id', body.user_id.trim())
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'User sudah terdaftar dalam sistem keluhan',
        user_id: body.user_id
      }, { status: 409 }); // Conflict
    }

    // Insert new profile
    const { data, error } = await adminClient
      .from('user_complaint_profiles')
      .insert({
        user_id: body.user_id.trim(),
        full_name: body.full_name.trim(),
        department: body.department || 'customer_service',
        job_title: body.job_title?.trim() || null,
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
        current_assigned_count: 0,
        total_resolved_complaints: 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'User complaint profile created successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PATCH received:', body);

    if (!body.user_id) {
      return NextResponse.json({ 
        error: 'user_id is required for PATCH' 
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.full_name) updateData.full_name = body.full_name.trim();
    if (body.department) updateData.department = body.department;
    if (body.job_title !== undefined) updateData.job_title = body.job_title?.trim() || null;
    if (body.complaint_permissions) updateData.complaint_permissions = body.complaint_permissions;
    if (body.max_assigned_complaints !== undefined) updateData.max_assigned_complaints = body.max_assigned_complaints;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await adminClient
      .from('user_complaint_profiles')
      .update(updateData)
      .eq('user_id', body.user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'User profile updated successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('user_complaint_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'User deactivated successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}