import { NextResponse, NextRequest } from 'next/server';

const AUTH_COOKIE = 'auth_token';

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const { pathname, origin } = nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = cookies.get(AUTH_COOKIE)?.value || null;
  const isLoginPage = pathname === '/admin/login';

  // Not authenticated and trying to access any /admin route except /admin/login
  if (!token && !isLoginPage) {
    const redirectUrl = new URL('/admin/login', origin);
    redirectUrl.searchParams.set('next', pathname + (nextUrl.search || ''));
    return NextResponse.redirect(redirectUrl);
  }

  // Already authenticated and tries to access /admin/login, redirect to /admin
  if (token && isLoginPage) {
    const redirectUrl = new URL('/admin', origin);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
