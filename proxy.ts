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

  // RBAC untuk Customer Service (Atau role non-Admin lainnya)
  if (user && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const roles = user?.app_metadata?.roles || [];
    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin');

    if (!isSuperAdmin) {
      const { data: profile } = await supabase
        .from('user_complaint_profiles')
        .select('department')
        .eq('user_id', user.id)
        .single();

      // Jika user adalah petugas biasa (contoh di departemen customer_service atau observasi/investigasi/lab)
      if (profile) {
        // Tentukan path mana saja yang boleh mereka akses secara umum (Selain fitur spesifik)
        const allowedPaths = [
          '/admin/complaints',
          '/admin/profile',
          '/admin/help'
          // Jika butuh analytics, bisa ditambahkan di sini berdasarkan permissions
        ];

        const isAllowed = allowedPaths.some(p =>
          pathname === p || pathname.startsWith(p + '/')
        );

        // Jika mencoba akses /admin/bags (Master Data), dll, langsung tendang ke complaints
        if (!isAllowed) {
          return NextResponse.redirect(new URL('/admin/complaints', request.url));
        }
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