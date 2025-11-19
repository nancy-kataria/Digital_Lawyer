import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Allow landing page and static assets
  if (path === '/' || path === '/landing' || path.startsWith('/_next') || path.startsWith('/favicon') || path.includes('.')) {
    return NextResponse.next()
  }
  
  // Redirect everything else to landing
  return NextResponse.redirect(new URL('/landing', request.url))
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
