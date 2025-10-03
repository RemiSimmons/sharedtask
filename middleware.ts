import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { addCorsHeaders, handlePreflight } from "@/lib/cors-middleware"
import { isAdminUser } from "@/lib/admin"

export default auth((req) => {
  // Handle CORS preflight requests for API routes
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    return handlePreflight(req)
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
    
    // Check if authenticated user has admin privileges
    if (!isAdminUser(session.user)) {
      console.log('Middleware: Non-admin user blocked from admin route:', {
        email: session.user?.email,
        path: req.nextUrl.pathname
      })
      // Redirect non-admin users to home page
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    console.log('Middleware: Admin user accessing admin route:', {
      email: session.user?.email,
      path: req.nextUrl.pathname
    })
  }
  
  // Create response
  const response = NextResponse.next()
  
  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return addCorsHeaders(response, req)
  }
  
  return response
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*" // Include API routes for CORS handling
  ]
}



