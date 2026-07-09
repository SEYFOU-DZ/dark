import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes (don't require auth)
  const publicPaths = ['/login', '/api'];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // If it's a public path, allow access
  if (isPublicPath) {
    // If already logged in and trying to access login page, redirect to dashboard
    if (pathname === '/login') {
      const token = request.cookies.get('token')?.value;
      const userCookie = request.cookies.get('user')?.value;
      
      if (token && userCookie) {
        try {
          const user = JSON.parse(userCookie);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (e) {
          // Invalid user data, continue to login
        }
      }
    }
    return NextResponse.next();
  }
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // If trying to access protected route without token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
