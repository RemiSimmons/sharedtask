import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { addCorsHeaders, handlePreflight } from "@/lib/cors-middleware"

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
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
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



