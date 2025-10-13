import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { addCorsHeaders, handlePreflight } from "@/lib/cors-middleware"
import { isAdminUser } from "@/lib/admin"
import { csrfMiddleware } from "@/lib/csrf-protection"
import { applySecurityHeaders } from "@/lib/security-headers"

export default auth((req) => {
  // Handle CORS preflight requests for API routes
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    return handlePreflight(req)
  }
  
  // CSRF Protection for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const csrfResult = csrfMiddleware(req)
    if (csrfResult) {
      return csrfResult // CSRF validation failed
    }
  }
  
  // In NextAuth v5, the session is directly available as req.auth
  const session = req.auth
  
  // Check if user is trying to access admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      // Redirect to sign in page
      console.log('Middleware: Unauthenticated user trying to access admin:', req.nextUrl.pathname)
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
    
    // Allow access to admin project pages for authenticated users (they manage their own projects)
    if (req.nextUrl.pathname.startsWith("/admin/project/")) {
      console.log('Middleware: Authenticated user accessing their project admin page:', {
        email: session.user?.email,
        path: req.nextUrl.pathname
      })
      // Allow access - users can manage their own projects
    }
    // Check if authenticated user has admin privileges for other admin routes
    else if (!isAdminUser(session.user)) {
      console.log('Middleware: Non-admin user blocked from general admin route:', {
        email: session.user?.email,
        path: req.nextUrl.pathname
      })
      // Redirect non-admin users to home page
      return NextResponse.redirect(new URL("/", req.url))
    } else {
      console.log('Middleware: Admin user accessing general admin route:', {
        email: session.user?.email,
        path: req.nextUrl.pathname
      })
    }
  }
  
  // Create response
  let response = NextResponse.next()
  
  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith('/api/')) {
    response = addCorsHeaders(response, req)
  }
  
  // Apply security headers to all responses
  response = applySecurityHeaders(response, req)
  
  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}



