// app/api/complaints/[id]/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

// --- FUNGSI HELPER ---
async function getUserProfile(supabase: SupabaseClient, userId: string | null) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_complaint_profiles') 
      .select('user_id, full_name, department')
      .eq('user_id', userId) 
      .single();
      
    if (error || !data) {
      console.error(`Error fetching profile for ${userId}:`, error?.message);
      return null;
    }
    
    return {
      id: data.user_id,
      name: data.full_name, 
      department: data.department
    };
  } catch (err) {
    return null;
  }
}

// --- GET COMPLAINT BY ID ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_responses (
          id,
          message,
          admin_name,
          admin_id,
          created_at,
          is_customer_response:is_internal 
        )
      `)
      .eq('id', id)
      .order('created_at', { 
        foreignTable: 'complaint_responses', 
        ascending: true 
      })
      .single();

    if (complaintError) {
      console.error("Error fetching base complaint:", complaintError.message); 
      return NextResponse.json({ error: complaintError.message }, { status: 500 });
    }

    if (!complaint) {
      return NextResponse.json({ error: 'Komplain tidak ditemukan' }, { status: 404 });
    }

    const [
      assigned_to_user,
      assigned_by_user,
      resolved_by_user,
      escalated_by_user,
      created_by_user
    ] = await Promise.all([
      getUserProfile(supabase, complaint.assigned_to),
      getUserProfile(supabase, complaint.assigned_by),
      getUserProfile(supabase, complaint.resolved_by),
      getUserProfile(supabase, complaint.escalated_by),
      getUserProfile(supabase, complaint.created_by)
    ]);

    const finalComplaintData = {
      ...complaint,
      assigned_to_user,
      assigned_by_user,
      resolved_by_user,
      escalated_by_user,
      created_by_user
    };

    return NextResponse.json({ data: finalComplaintData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE COMPLAINT ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const roles = user.app_metadata?.roles || [];
    const complaintPermissions = user.user_metadata?.complaint_permissions || {};
    
    const isSuperadmin = roles.includes('Superadmin') || roles.includes('superadmin');
    const hasDeletePermission = complaintPermissions.canDeleteComplaints === true;

    if (!isSuperadmin && !hasDeletePermission) {
      return NextResponse.json({ error: 'Forbidden: No permission to delete' }, { status: 403 });
    }

    console.log(`Starting deletion process for complaint ID: ${id}`);

    // Gunakan database function untuk cascade delete
    const { data, error } = await supabase
      .rpc('delete_complaint_with_cascade', {
        complaint_id_param: parseInt(id)
      });

    if (error) {
      console.error('Error calling delete function:', error);
      return NextResponse.json({ 
        error: 'Failed to delete complaint', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Delete result:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Complaint and all related data deleted successfully',
      details: data
    });

  } catch (error: any) {
    console.error('Delete API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// --- UPDATE COMPLAINT (Optional, if needed) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update complaint
    const { data, error } = await supabase
      .from('complaints')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update complaint', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Complaint updated successfully' 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}