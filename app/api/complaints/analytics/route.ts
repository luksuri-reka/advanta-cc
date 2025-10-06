// app/api/complaints/analytics/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Fetch all complaints in period with all relevant fields
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select(`
        id,
        complaint_number,
        status,
        priority,
        department,
        complaint_type,
        created_at,
        resolved_at,
        assigned_to,
        assigned_at,
        assigned_by,
        resolved_by,
        customer_satisfaction_rating,
        customer_feedback,
        customer_feedback_at,
        first_response_at,
        first_response_sla,
        resolution_sla,
        escalated,
        escalated_at,
        related_product_serial,
        related_product_name
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user profiles for team performance
    const { data: userProfiles } = await supabase
      .from('user_complaint_profiles')
      .select('*')
      .eq('is_active', true);

    // Calculate basic metrics
    const totalComplaints = complaints?.length || 0;
    const resolvedComplaints = complaints?.filter(c => 
      ['resolved', 'closed'].includes(c.status)
    ).length || 0;
    const pendingComplaints = complaints?.filter(c => 
      !['resolved', 'closed'].includes(c.status)
    ).length || 0;

    // Resolution rate
    const resolutionRate = totalComplaints > 0 
      ? Math.round((resolvedComplaints / totalComplaints) * 100) 
      : 0;

    // Average resolution time (hours)
    const resolvedWithTime = complaints?.filter(c => c.resolved_at && c.created_at) || [];
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, c) => {
          const created = new Date(c.created_at).getTime();
          const resolved = new Date(c.resolved_at!).getTime();
          return acc + ((resolved - created) / (1000 * 60 * 60));
        }, 0) / resolvedWithTime.length
      : 0;

    // Average first response time (hours)
    const withFirstResponse = complaints?.filter(c => c.first_response_at && c.created_at) || [];
    const avgFirstResponseTime = withFirstResponse.length > 0
      ? withFirstResponse.reduce((acc, c) => {
          const created = new Date(c.created_at).getTime();
          const responded = new Date(c.first_response_at!).getTime();
          return acc + ((responded - created) / (1000 * 60 * 60));
        }, 0) / withFirstResponse.length
      : 0;

    // SLA compliance metrics
    const slaBreaches = {
      first_response: 0,
      resolution: 0
    };

    complaints?.forEach(c => {
      // First response SLA breach
      if (c.first_response_at && c.created_at && c.first_response_sla) {
        const responseTime = (new Date(c.first_response_at).getTime() - new Date(c.created_at).getTime()) / 1000; // seconds
        const slaSeconds = parseInterval(c.first_response_sla);
        if (responseTime > slaSeconds) {
          slaBreaches.first_response++;
        }
      }

      // Resolution SLA breach
      if (c.resolved_at && c.created_at && c.resolution_sla) {
        const resolutionTime = (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 1000;
        const slaSeconds = parseInterval(c.resolution_sla);
        if (resolutionTime > slaSeconds) {
          slaBreaches.resolution++;
        }
      }
    });

    // SLA compliance rates
    const firstResponseCompliance = withFirstResponse.length > 0
      ? Math.round(((withFirstResponse.length - slaBreaches.first_response) / withFirstResponse.length) * 100)
      : 100;
    
    const resolutionCompliance = resolvedWithTime.length > 0
      ? Math.round(((resolvedWithTime.length - slaBreaches.resolution) / resolvedWithTime.length) * 100)
      : 100;

    // CSAT score and feedback
    const rated = complaints?.filter(c => c.customer_satisfaction_rating) || [];
    const avgCsat = rated.length > 0
      ? rated.reduce((acc, c) => acc + c.customer_satisfaction_rating!, 0) / rated.length
      : 0;

    // CSAT distribution
    const csatDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    rated.forEach(c => {
      if (c.customer_satisfaction_rating) {
        csatDistribution[c.customer_satisfaction_rating as keyof typeof csatDistribution]++;
      }
    });

    // Escalation metrics
    const escalatedCount = complaints?.filter(c => c.escalated).length || 0;
    const escalationRate = totalComplaints > 0
      ? Math.round((escalatedCount / totalComplaints) * 100)
      : 0;

    // Group by status
    const statusDistribution = complaints?.reduce((acc: any, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by priority
    const priorityDistribution = complaints?.reduce((acc: any, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by department
    const departmentDistribution = complaints?.reduce((acc: any, c) => {
      const dept = c.department || 'unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by type
    const typeDistribution = complaints?.reduce((acc: any, c) => {
      acc[c.complaint_type] = (acc[c.complaint_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Product-related complaints (if product serial exists)
    const productRelated = complaints?.filter(c => c.related_product_serial).length || 0;
    const productRelatedRate = totalComplaints > 0
      ? Math.round((productRelated / totalComplaints) * 100)
      : 0;

    // Most problematic products
    const productIssues: Record<string, number> = {};
    complaints?.forEach(c => {
      if (c.related_product_name) {
        productIssues[c.related_product_name] = (productIssues[c.related_product_name] || 0) + 1;
      }
    });
    const topProblematicProducts = Object.entries(productIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));

    // Trend data (daily)
    const trendData: Record<string, any> = {};
    complaints?.forEach(c => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      if (!trendData[date]) {
        trendData[date] = { 
          date, 
          total: 0, 
          resolved: 0, 
          pending: 0,
          escalated: 0,
          critical: 0
        };
      }
      trendData[date].total++;
      if (['resolved', 'closed'].includes(c.status)) {
        trendData[date].resolved++;
      } else {
        trendData[date].pending++;
      }
      if (c.escalated) {
        trendData[date].escalated++;
      }
      if (c.priority === 'critical') {
        trendData[date].critical++;
      }
    });

    // Assignment metrics
    const assignmentMetrics = {
      total_assigned: complaints?.filter(c => c.assigned_to).length || 0,
      total_unassigned: complaints?.filter(c => !c.assigned_to).length || 0,
      avg_time_to_assign: 0
    };

    const withAssignTime = complaints?.filter(c => c.assigned_at && c.created_at) || [];
    if (withAssignTime.length > 0) {
      assignmentMetrics.avg_time_to_assign = withAssignTime.reduce((acc, c) => {
        const created = new Date(c.created_at).getTime();
        const assigned = new Date(c.assigned_at!).getTime();
        return acc + ((assigned - created) / (1000 * 60 * 60));
      }, 0) / withAssignTime.length;
    }

    // Team performance with enriched data
    const teamPerformance = userProfiles?.map(profile => {
      const userComplaints = complaints?.filter(c => c.assigned_to === profile.user_id) || [];
      const userResolved = complaints?.filter(c => c.resolved_by === profile.user_id) || [];
      
      return {
        user_id: profile.user_id,
        name: profile.full_name,
        department: profile.department,
        total_assigned: userComplaints.length,
        total_resolved: userResolved.length,
        avg_resolution_time: profile.avg_resolution_time,
        csat_score: profile.customer_satisfaction_avg || 0,
        current_load: profile.current_assigned_count || 0,
        max_load: profile.max_assigned_complaints || 10,
        // New metrics
        escalated_count: userComplaints.filter(c => c.escalated).length,
        critical_handled: userComplaints.filter(c => c.priority === 'critical').length,
        sla_breaches: userComplaints.filter(c => {
          if (c.resolved_at && c.created_at && c.resolution_sla) {
            const resTime = (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 1000;
            const slaSeconds = parseInterval(c.resolution_sla);
            return resTime > slaSeconds;
          }
          return false;
        }).length
      };
    }).sort((a, b) => b.total_resolved - a.total_resolved) || [];

    // Response time by priority
    const responseTimeByPriority: Record<string, number> = {};
    ['critical', 'high', 'medium', 'low'].forEach(priority => {
      const priorityComplaints = withFirstResponse.filter(c => c.priority === priority);
      if (priorityComplaints.length > 0) {
        responseTimeByPriority[priority] = priorityComplaints.reduce((acc, c) => {
          const created = new Date(c.created_at).getTime();
          const responded = new Date(c.first_response_at!).getTime();
          return acc + ((responded - created) / (1000 * 60 * 60));
        }, 0) / priorityComplaints.length;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalComplaints,
          resolved: resolvedComplaints,
          pending: pendingComplaints,
          resolution_rate: resolutionRate,
          avg_resolution_time: Math.round(avgResolutionTime * 10) / 10,
          avg_first_response_time: Math.round(avgFirstResponseTime * 10) / 10,
          avg_csat: Math.round(avgCsat * 10) / 10,
          // New summary metrics
          escalated_count: escalatedCount,
          escalation_rate: escalationRate,
          first_response_sla_compliance: firstResponseCompliance,
          resolution_sla_compliance: resolutionCompliance,
          product_related_rate: productRelatedRate
        },
        distributions: {
          status: statusDistribution,
          priority: priorityDistribution,
          department: departmentDistribution,
          type: typeDistribution,
          csat: csatDistribution
        },
        trends: Object.values(trendData).sort((a: any, b: any) => 
          a.date.localeCompare(b.date)
        ),
        team_performance: teamPerformance,
        assignment_metrics: {
          ...assignmentMetrics,
          avg_time_to_assign: Math.round(assignmentMetrics.avg_time_to_assign * 10) / 10
        },
        sla_metrics: {
          first_response_breaches: slaBreaches.first_response,
          resolution_breaches: slaBreaches.resolution,
          first_response_compliance: firstResponseCompliance,
          resolution_compliance: resolutionCompliance
        },
        response_time_by_priority: Object.entries(responseTimeByPriority).reduce((acc, [key, value]) => {
          acc[key] = Math.round(value * 10) / 10;
          return acc;
        }, {} as Record<string, number>),
        top_problematic_products: topProblematicProducts,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: parseInt(period)
        }
      }
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to parse PostgreSQL interval to seconds
function parseInterval(interval: string): number {
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}