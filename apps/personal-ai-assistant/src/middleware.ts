import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('__session');  // Firebase Auth cookie

  // Protect dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!authCookie) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Redirect authenticated users away from auth page
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth']
}; 