// app/api/admin/complaint-users/[userId]/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile
    const { data, error } = await supabase
      .from('user_complaint_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'User complaint profile not found' 
      }, { status: 404 });
    }

    // Get email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || 'N/A';

    // Get current assignments
    const { data: assignments, count: assignedCount } = await supabase
      .from('complaints')
      .select('id, complaint_number, subject, priority, status', { count: 'exact' })
      .eq('assigned_to', userId)
      .not('status', 'in', '(resolved,closed)');

    return NextResponse.json({ 
      success: true,
      data: {
        ...data,
        email,
        current_assignments: assignments || [],
        actual_assigned_count: assignedCount || 0
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update profile
    const { data, error } = await supabase
      .from('user_complaint_profiles')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('user_complaint_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}