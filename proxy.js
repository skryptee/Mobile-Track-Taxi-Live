import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // Allow auth routes
  if (pathname.startsWith('/api/auth') || pathname === '/admin/login' || pathname === '/admin/register') {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
