// app/api/admin/complaint-users/route.ts
import { NextResponse } from 'next/server';
import { authorizeComplaintTeam } from '@/app/admin/complaintAccess';
import { createServiceClient } from '@/app/utils/supabase/service';
import { normalizeComplaintPermissions } from '@/app/utils/complaintPermissions';

export async function GET() {
  try {
    const access = await authorizeComplaintTeam('canManageComplaintUsers');
    if (access.denied) return access.denied;


    // Use admin client untuk bypass RLS
    const adminClient = createServiceClient();

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
    const access = await authorizeComplaintTeam('canManageComplaintUsers');
    if (access.denied) return access.denied;
    const { actor: user } = access;


    const body = await request.json();


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

    const adminClient = createServiceClient();

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
        complaint_permissions: normalizeComplaintPermissions(body.complaint_permissions),
        max_assigned_complaints: body.max_assigned_complaints || 10,
        whatsapp_number: body.whatsapp_number?.trim() || null,
        assigned_regions: body.assigned_regions || [], // 🔥 TAMBAHKAN
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
    const access = await authorizeComplaintTeam('canManageComplaintUsers');
    if (access.denied) return access.denied;


    const body = await request.json();


    if (!body.user_id) {
      return NextResponse.json({
        error: 'user_id is required for PATCH'
      }, { status: 400 });
    }

    const adminClient = createServiceClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.full_name) updateData.full_name = body.full_name.trim();
    if (body.department) updateData.department = body.department;
    if (body.job_title !== undefined) updateData.job_title = body.job_title?.trim() || null;
    if (body.whatsapp_number !== undefined) updateData.whatsapp_number = body.whatsapp_number?.trim() || null;
    if (body.complaint_permissions !== undefined) {
      updateData.complaint_permissions = normalizeComplaintPermissions(body.complaint_permissions);
    }
    if (body.max_assigned_complaints !== undefined) updateData.max_assigned_complaints = body.max_assigned_complaints;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.assigned_regions !== undefined) updateData.assigned_regions = body.assigned_regions;

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
    const access = await authorizeComplaintTeam('canManageComplaintUsers');
    if (access.denied) return access.denied;


    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({
        error: 'user_id parameter is required'
      }, { status: 400 });
    }

    const adminClient = createServiceClient();

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
