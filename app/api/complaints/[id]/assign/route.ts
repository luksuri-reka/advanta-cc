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
    const {
      assignee_observasi,
      assignee_investigasi_1,
      assignee_investigasi_2,
      assignee_lab_testing,
      notes
    } = body;

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

    // Tentukan status baru. Jika kita menugaskan ke departemen investigasi/lab, prioritas status adalah investigation.
    // Jika hanya menugaskan observasi, statusnya observation. Jika belum diakui, status tidak berubah dari logika sini.
    let newStatus = complaint.status;

    if (assignee_investigasi_1 || assignee_investigasi_2 || assignee_lab_testing) {
      if (complaint.status === 'observation' || complaint.status === 'acknowledged') {
        newStatus = 'investigation';
      }
    } else if (assignee_observasi) {
      if (complaint.status === 'acknowledged') {
        newStatus = 'observation';
      }
    }

    const payload: any = {
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (assignee_observasi !== undefined) payload.assignee_observasi = assignee_observasi || null;
    if (assignee_investigasi_1 !== undefined) payload.assignee_investigasi_1 = assignee_investigasi_1 || null;
    if (assignee_investigasi_2 !== undefined) payload.assignee_investigasi_2 = assignee_investigasi_2 || null;
    if (assignee_lab_testing !== undefined) payload.assignee_lab_testing = assignee_lab_testing || null;

    // Hapus logika single assignee_to dan department
    // Update complaint
    const { error: updateError } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to assign complaint'
      }, { status: 500 });
    }

    // Log the assignment (Minimal mapping for manual tracking if needed)
    const validAssignees = [
      assignee_observasi,
      assignee_investigasi_1,
      assignee_investigasi_2,
      assignee_lab_testing
    ].filter(Boolean);

    if (validAssignees.length > 0) {
      await supabase
        .from('complaint_assignments')
        .insert({
          complaint_id: parseInt(id),
          assigned_to: validAssignees[0], // Menyimpan satu dari mereka untuk legacy fallback
          assigned_by: user.id,
          assignment_reason: notes || 'Manual multi-department assignment by admin',
          is_active: true
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        new_status: newStatus,
      },
      message: 'Complaint assigned to multiple departments successfully'
    });

  } catch (error: any) {
    console.error('Assign API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}