// app/api/complaints/stats/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get counts for different statuses
    const [
      pendingResult,
      criticalResult,
      needsResponseResult,
      totalResult
    ] = await Promise.all([
      // Pending complaints (submitted, acknowledged, investigating)
      supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'acknowledged', 'investigating']),
      
      // Critical priority complaints that are not resolved
      supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'critical')
        .not('status', 'in', '(resolved,closed)'),
      
      // Complaints needing response (pending_response status)
      supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_response'),
      
      // Total complaints
      supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
    ]);

    // Get recent complaints (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { count: recentCount } = await supabase
      .from('complaints')
      .select('id', { count: 'exact', head: true })
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