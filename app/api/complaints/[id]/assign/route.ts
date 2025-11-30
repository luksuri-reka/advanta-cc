// app/api/complaints/[id]/assign/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { admin_id, department, notes } = body;

    if (!admin_id) {
      return NextResponse.json({ 
        error: 'admin_id is required' 
      }, { status: 400 });
    }
    if (!department) {
      return NextResponse.json({ 
        error: 'department is required' 
      }, { status: 400 });
    }

    // Validate target user exists and is active
    const { data: targetUser, error: userCheckError } = await supabase
      .from('user_complaint_profiles')
      .select('*')
      .eq('user_id', admin_id)
      .eq('is_active', true)
      .single();

    if (userCheckError || !targetUser) {
      return NextResponse.json({ 
        error: 'Target user not found or inactive' 
      }, { status: 404 });
    }

    // Get current complaint data
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ 
        error: 'Complaint not found' 
      }, { status: 404 });
    }

    const previousAssignee = complaint.assigned_to;

    // Tentukan status baru berdasarkan department
    let newStatus = complaint.status;
    
    if (department === 'observasi' && complaint.status === 'acknowledged') {
      newStatus = 'observation';
    } else if ((department === 'investigasi_1' || department === 'investigasi_2' || department === 'lab_tasting') 
               && (complaint.status === 'observation' || complaint.status === 'acknowledged')) {
      newStatus = 'investigation';
    }

    // Update complaint dengan department dan status
    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        assigned_to: admin_id,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
        department: department,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to assign complaint' 
      }, { status: 500 });
    }

    // Deactivate previous assignment if exists
    if (previousAssignee) {
      await supabase
        .from('complaint_assignments')
        .update({ 
          is_active: false,
          unassigned_at: new Date().toISOString(),
          unassigned_by: user.id
        })
        .eq('complaint_id', id)
        .eq('is_active', true);
    }

    // Log new assignment
    await supabase
      .from('complaint_assignments')
      .insert({
        complaint_id: parseInt(id),
        assigned_to: admin_id,
        assigned_by: user.id,
        assignment_reason: notes || 'Manual assignment by admin',
        previous_assignee: previousAssignee,
        is_active: true
      });

    return NextResponse.json({ 
      success: true,
      data: {
        assigned_to: targetUser.full_name,
        department: department,
        new_status: newStatus,
        previous_assignee: previousAssignee
      },
      message: 'Complaint assigned successfully'
    });

  } catch (error: any) {
    console.error('Assign API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}