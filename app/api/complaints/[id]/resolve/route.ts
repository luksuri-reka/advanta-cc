// app/api/complaints/[id]/resolve/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // --- PERBAIKAN: Membaca 'resolution' (pesan lengkap) ---
    const { resolution, resolution_summary, customer_satisfaction_rating } = body;

    // Get complaint data
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

    // Check if already resolved
    if (complaint.status === 'resolved' || complaint.status === 'closed') {
      return NextResponse.json({ 
        error: 'Complaint is already resolved' 
      }, { status: 400 });
    }

    const resolvedAt = new Date().toISOString();

    // --- PERBAIKAN: Menyimpan 'resolution' ke database ---
    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        status: 'resolved',
        resolved_at: resolvedAt,
        resolved_by: user.id,
        resolution: resolution, // <-- BIDANG INI DITAMBAHKAN
        resolution_summary: resolution_summary,
        customer_satisfaction_rating: customer_satisfaction_rating || null,
        updated_at: resolvedAt
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to resolve complaint' 
      }, { status: 500 });
    }

    // Update user metrics if assigned
    if (complaint.assigned_to) {
      // Calculate resolution time in milliseconds
      const createdTime = new Date(complaint.created_at).getTime();
      const resolvedTime = new Date(resolvedAt).getTime();
      const resolutionTimeMs = resolvedTime - createdTime;

      // Call database function to update metrics
      const { error: metricsError } = await supabase.rpc(
        'update_user_complaint_metrics',
        {
          p_user_id: complaint.assigned_to,
          p_resolution_time: resolutionTimeMs,
          p_satisfaction_rating: customer_satisfaction_rating || null
        }
      );

      if (metricsError) {
        console.error('Metrics update error:', metricsError);
        // Don't fail the whole operation, just log the error
      }

      // Decrement count will be handled by trigger
    }

    // Log to assignment history
    await supabase
      .from('complaint_assignments')
      .update({ 
        is_active: false,
        unassigned_at: resolvedAt,
        unassigned_by: user.id
      })
      .eq('complaint_id', id)
      .eq('is_active', true);

    // Send resolution email to customer
    if (complaint.customer_email) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaint_resolved',
          email: complaint.customer_email,
          complaint_number: complaint.complaint_number,
          customer_name: complaint.customer_name,
          resolution_summary: resolution_summary // Anda mungkin ingin mengirim 'resolution' di sini
        })
      }).catch(err => console.error('Email notification failed:', err));
    }

    return NextResponse.json({ 
      success: true,
      message: 'Complaint resolved successfully',
      data: {
        id: complaint.id,
        complaint_number: complaint.complaint_number,
        resolved_at: resolvedAt
      }
    });

  } catch (error: any) {
    console.error('Resolve API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}