// app/api/complaints/[id]/responses/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Get current user (for auth check)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      );
    }

    // Insert response
    const { data, error } = await supabase
      .from('complaint_responses')
      .insert({
        complaint_id: parseInt(id),
        message: body.message,
        admin_name: body.admin_name || user.user_metadata?.name || 'Admin',
        is_internal: body.is_internal || false
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update complaint's updated_at timestamp
    await supabase
      .from('complaints')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Send email notification to customer if not internal message
    if (!body.is_internal) {
      // Get complaint details for email
      const { data: complaint } = await supabase
        .from('complaints')
        .select('customer_email, customer_name, complaint_number')
        .eq('id', id)
        .single();

      if (complaint && complaint.customer_email) {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complaint_response',
            email: complaint.customer_email,
            complaint_number: complaint.complaint_number,
            customer_name: complaint.customer_name
          })
        }).catch(err => console.error('Email notification failed:', err));
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Response sent successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}