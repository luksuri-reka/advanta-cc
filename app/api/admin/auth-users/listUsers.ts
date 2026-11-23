import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export async function listAuthUsers(supabase: SupabaseClient): Promise<User[]> {
  const users: User[] = [];

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 250 });
    if (error) throw error;
    users.push(...data.users);
    if (!data.nextPage) return users;
  }
}
