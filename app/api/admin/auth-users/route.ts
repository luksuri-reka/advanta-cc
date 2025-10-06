// app/api/admin/auth-users/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users from auth.users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get existing complaint profiles to exclude them
    const { data: existingProfiles } = await supabase
      .from('user_complaint_profiles')
      .select('user_id');

    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || []);

    // Map users to simpler format and exclude those who already have profiles
    const availableUsers = users
      .filter(u => !existingUserIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'Unknown',
        created_at: u.created_at
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ 
      success: true,
      data: availableUsers
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}