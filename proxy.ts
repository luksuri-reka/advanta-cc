// proxy.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Redirect ke login jika belum auth dan akses /admin (kecuali /admin/login)
  if (!user && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Redirect ke dashboard jika sudah login tapi akses halaman login
  if (user && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // RBAC untuk Customer Service
  if (user && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const { data: profile } = await supabase
      .from('user_complaint_profiles')
      .select('department, role')
      .eq('user_id', user.id)
      .single();

    if (profile?.department === 'customer_service') {
      const allowedCustomerServicePaths = ['/admin/complaints', '/admin/profile', '/admin/help'];
      const isAllowed = allowedCustomerServicePaths.some(p => pathname === p || pathname.startsWith(p + '/'));

      if (!isAllowed) {
        return NextResponse.redirect(new URL('/admin/complaints', request.url));
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}