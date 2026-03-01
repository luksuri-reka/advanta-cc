import { createClient } from '@/app/utils/supabase/server';
import Navbar from './Navbar';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Route protection dasar: jika tidak login, lempar ke login
  // (Sebagian sudah di-handle oleh proxy.ts, namun ini jaga-jaga di level layout)
  if (!user && typeof window === 'undefined') {
    // Note: redirect() cannot be used inside Client Components, 
    // but this is a Server Component, so it's fine.
    // However, if the page is '/admin/login', we shouldn't redirect to '/admin/login'.
    // proxy.ts handles this properly. We'll let proxy.ts handle redirection mostly,
    // but we need 'user' for Navbar.
  }

  let displayUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from('user_complaint_profiles')
      .select('department, complaint_permissions')
      .eq('user_id', user.id)
      .single();

    displayUser = {
      name: user.user_metadata?.name || 'Admin',
      roles: user.app_metadata?.roles || ['User'],
      department: profile?.department,
      complaint_permissions: profile?.complaint_permissions || {}
    };
  }

  return (
    <>
      {user && <Navbar user={displayUser} />}
      {children}
    </>
  );
}