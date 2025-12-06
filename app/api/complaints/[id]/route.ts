// app/api/complaints/[id]/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

// --- HELPER: Mengambil Profil User ---
async function getUserProfile(supabase: SupabaseClient, userId: string | null) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_complaint_profiles') 
      .select('user_id, full_name, department')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error || !data) return null;
    
    return {
      id: data.user_id,
      name: data.full_name || 'Admin', 
      department: data.department
    };
  } catch (err) {
    return null;
  }
}

// --- GET: Mengambil Detail Komplain ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Ambil Data Komplain Utama
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (complaintError) {
      console.error('Error fetching complaint:', complaintError);
      return NextResponse.json({ error: complaintError.message }, { status: 500 });
    }

    // 2. Ambil Responses
    const { data: responses } = await supabase
      .from('complaint_responses')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true });

    // 3. Ambil Observations
    const { data: observations } = await supabase
      .from('complaint_observations')
      .select('*')
      .eq('complaint_id', id);

    // 4. Ambil Investigations
    const { data: investigations } = await supabase
      .from('complaint_investigations')
      .select('*')
      .eq('complaint_id', id);

    // 5. Ambil Data Profil User Terkait
    const [assignedTo, assignedBy, resolvedBy, escalatedBy, createdBy] = await Promise.all([
      getUserProfile(supabase, complaint.assigned_to),
      getUserProfile(supabase, complaint.assigned_by),
      getUserProfile(supabase, complaint.resolved_by),
      getUserProfile(supabase, complaint.escalated_by),
      getUserProfile(supabase, complaint.created_by)
    ]);

    // 6. Gabungkan Semua Data
    const enrichedData = {
      ...complaint,
      complaint_responses: responses || [],
      complaint_observations: observations || [],
      complaint_investigations: investigations || [],
      assigned_to_user: assignedTo,
      assigned_by_user: assignedBy,
      resolved_by_user: resolvedBy,
      escalated_by_user: escalatedBy,
      created_by_user: createdBy
    };

    return NextResponse.json({ success: true, data: enrichedData });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE: Menghapus Komplain ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Complaint deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// --- PATCH: Update Komplain (General) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('complaints')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Complaint updated successfully' 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to update', 
      details: error.message 
    }, { status: 500 });
  }
}