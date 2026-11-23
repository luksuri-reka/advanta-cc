// app/api/complaint-profiles/route.ts
import { authorizeComplaintTeam } from '@/app/admin/complaintAccess';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const access = await authorizeComplaintTeam('canAssignComplaints');
    if (access.denied) return access.denied;
    const { supabase } = access;

    // Get all active complaint profiles
    const { data: profiles, error } = await supabase
      .from('user_complaint_profiles')
      .select('user_id, full_name, department, job_title, assigned_regions')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data: profiles || []
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
