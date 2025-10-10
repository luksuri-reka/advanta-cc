// app/api/admin/auth-users/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users from auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get existing complaint profiles to exclude them
    const { data: existingProfiles } = await supabaseAdmin
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