// app/api/complaints/stats/route.ts
import { authorizeComplaintTeam } from '@/app/admin/complaintAccess';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const access = await authorizeComplaintTeam('canViewComplaints');
    if (access.denied) return access.denied;
    const { regions, supabase } = access;
    const countComplaints = () => {
      const query = supabase.from('complaints').select('id', { count: 'exact', head: true });
      return regions.length ? query.in('customer_province', regions) : query;
    };

    // Get counts for different statuses
    const [
      pendingResult,
      criticalResult,
      needsResponseResult,
      totalResult
    ] = await Promise.all([
      // Pending complaints (submitted, acknowledged, investigating)
      countComplaints()
        .in('status', ['submitted', 'acknowledged', 'investigating']),
      
      // Critical priority complaints that are not resolved
      countComplaints()
        .eq('priority', 'critical')
        .not('status', 'in', '(resolved,closed)'),
      
      // Complaints needing response (pending_response status)
      countComplaints()
        .eq('status', 'pending_response'),
      
      // Total complaints
      countComplaints()
    ]);

    // Get recent complaints (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { count: recentCount } = await countComplaints()
      .gte('created_at', twentyFourHoursAgo.toISOString());

    const stats = {
      pending: pendingResult.count || 0,
      critical: criticalResult.count || 0,
      needs_response: needsResponseResult.count || 0,
      total: totalResult.count || 0,
      recent_24h: recentCount || 0
    };

    return NextResponse.json({ 
      success: true,
      data: stats 
    });

  } catch (error: any) {
    console.error('Error fetching complaint stats:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      data: {
        pending: 0,
        critical: 0,
        needs_response: 0,
        total: 0,
        recent_24h: 0
      }
    }, { status: 500 });
  }
}
