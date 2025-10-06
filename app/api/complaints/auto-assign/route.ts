// app/api/complaints/auto-assign/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { complaint_id, department, priority } = await request.json();

    if (!complaint_id) {
      return NextResponse.json({ 
        error: 'complaint_id is required' 
      }, { status: 400 });
    }

    // Get complaint details
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaint_id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ 
        error: 'Complaint not found' 
      }, { status: 404 });
    }

    // If already assigned, return error
    if (complaint.assigned_to) {
      return NextResponse.json({ 
        error: 'Complaint is already assigned' 
      }, { status: 400 });
    }

    const targetDepartment = department || complaint.department || 'customer_service';
    
    // Find best available user in department
    // Priority: 1) Lowest current load, 2) Best performance metrics
    const { data: availableUsers, error: usersError } = await supabase
      .from('user_complaint_profiles')
      .select('*')
      .eq('department', targetDepartment)
      .eq('is_active', true)
      .order('current_assigned_count', { ascending: true })
      .order('customer_satisfaction_avg', { ascending: false });

    if (usersError) {
      console.error('Users query error:', usersError);
      return NextResponse.json({ 
        error: 'Failed to find available users' 
      }, { status: 500 });
    }

    if (!availableUsers || availableUsers.length === 0) {
      return NextResponse.json({ 
        error: `No active users found in ${targetDepartment} department` 
      }, { status: 400 });
    }

    // Filter users who haven't reached max load
    const eligibleUsers = availableUsers.filter(
      user => user.current_assigned_count < user.max_assigned_complaints
    );

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ 
        error: 'All users in department have reached maximum workload',
        suggestion: 'Please manually assign or increase max_assigned_complaints'
      }, { status: 400 });
    }

    // Select best user (first one, already sorted by load and performance)
    const selectedUser = eligibleUsers[0];

    // Update complaint
    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        assigned_to: selectedUser.user_id,
        assigned_at: new Date().toISOString(),
        assigned_by: null, // null = system auto-assigned
        department: targetDepartment,
        updated_at: new Date().toISOString()
      })
      .eq('id', complaint_id);

    if (updateError) {
      console.error('Update complaint error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to assign complaint' 
      }, { status: 500 });
    }

    // Log assignment history
    await supabase
      .from('complaint_assignments')
      .insert({
        complaint_id: complaint_id,
        assigned_to: selectedUser.user_id,
        assigned_by: null, // system
        assignment_reason: `Auto-assigned to ${targetDepartment} based on workload distribution`,
        is_active: true
      });

    // Note: current_assigned_count will be incremented by trigger

    return NextResponse.json({ 
      success: true,
      assigned_to: {
        user_id: selectedUser.user_id,
        name: selectedUser.full_name,
        department: selectedUser.department,
        current_load: selectedUser.current_assigned_count + 1,
        max_load: selectedUser.max_assigned_complaints
      },
      message: `Complaint auto-assigned to ${selectedUser.full_name}`
    });

  } catch (error: any) {
    console.error('Auto-assign API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}