/**
 * CSRF PROTECTION MIDDLEWARE
 * 
 * Implements multiple layers of CSRF protection:
 * 1. Origin/Referer validation
 * 2. Session binding (via NextAuth)
 * 3. Custom header requirement for API calls
 * 
 * This provides strong CSRF protection without requiring tokens on every request.
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://sharedtask.ai',
  'https://www.sharedtask.ai',
  'https://sharedtask.vercel.app',
  // Add production domains here
]

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

// Endpoints that are exempt from CSRF (webhooks, public APIs)
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/',      // Stripe webhooks
  '/api/cron/',          // Cron jobs
  '/api/auth/',          // NextAuth handles its own CSRF
]

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/**
 * Validates the origin/referer header matches allowed origins
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Development: allow if no origin (can happen in server-side requests)
  if (process.env.NODE_ENV === 'development' && !origin && !referer) {
    return true
  }
  
  // Check origin first (more reliable)
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    )
    if (isAllowed) return true
  }
  
  // Fallback to referer check
  if (referer) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      referer.startsWith(allowed)
    )
    if (isAllowed) return true
  }
  
  return false
}

// ============================================================================
// CUSTOM HEADER CHECK
// ============================================================================

/**
 * Requires a custom header for API calls
 * Simple browsers can't add custom headers in CSRF attacks
 */
function hasCustomHeader(request: NextRequest): boolean {
  // Check for custom header that CSRF attacks can't set
  const customHeader = request.headers.get('x-requested-with')
  return customHeader === 'XMLHttpRequest' || customHeader === 'fetch'
}

/**
 * Check if request has content-type that requires preflight
 * (CSRF attacks are limited to simple requests)
 */
function hasComplexContentType(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || ''
  // application/json requires preflight, which CSRF attacks can't do
  return contentType.includes('application/json')
}

// ============================================================================
// CSRF PROTECTION MIDDLEWARE
// ============================================================================

/**
 * Validates request against CSRF attacks
 * Returns true if request is safe, false if potentially malicious
 */
export function validateCSRF(request: NextRequest): boolean {
  const method = request.method
  const pathname = request.nextUrl.pathname
  
  // Only protect state-changing methods
  if (!PROTECTED_METHODS.includes(method)) {
    return true
  }
  
  // Check if path is exempt
  const isExempt = CSRF_EXEMPT_PATHS.some(exemptPath => 
    pathname.startsWith(exemptPath)
  )
  if (isExempt) {
    return true
  }
  
  // Validate origin/referer
  if (!validateOrigin(request)) {
    console.warn('CSRF: Invalid origin/referer', {
      path: pathname,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    })
    return false
  }
  
  // Require either custom header OR complex content-type
  // (Both indicate this is a legitimate API call, not CSRF)
  if (!hasCustomHeader(request) && !hasComplexContentType(request)) {
    console.warn('CSRF: Missing custom header and simple content-type', {
      path: pathname,
      contentType: request.headers.get('content-type')
    })
    return false
  }
  
  return true
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wraps an API route handler with CSRF protection
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Validate CSRF
    if (!validateCSRF(req)) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'This request appears to be coming from an untrusted source. Please refresh the page and try again.'
        },
        { 
          status: 403,
          headers: {
            'X-CSRF-Protection': 'denied'
          }
        }
      )
    }
    
    // Call the actual handler
    return handler(req)
  }
}

// ============================================================================
// AUTOMATIC PROTECTION FOR API ROUTES
// ============================================================================

/**
 * Middleware function that can be used in middleware.ts
 * or applied to individual API routes
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Only check API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null // Let request through
  }
  
  // Validate CSRF
  if (!validateCSRF(request)) {
    return NextResponse.json(
      { 
        error: 'Invalid request',
        message: 'CSRF validation failed. Please refresh the page and try again.'
      },
      { 
        status: 403,
        headers: {
          'X-CSRF-Protection': 'denied',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )
  }
  
  return null // Let request through
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Add CSRF token to response headers (for complex implementations)
 */
export function addCSRFHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-CSRF-Protected', 'true')
  return response
}

/**
 * Check if a specific origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.startsWith(allowed)
  )
}

/**
 * Log CSRF violation for monitoring
 */
export function logCSRFViolation(request: NextRequest, reason: string): void {
  console.warn('CSRF VIOLATION:', {
    reason,
    method: request.method,
    path: request.nextUrl.pathname,
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip'),
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateCSRF,
  withCSRFProtection,
  csrfMiddleware,
  addCSRFHeaders,
  isOriginAllowed,
  logCSRFViolation,
  ALLOWED_ORIGINS,
  PROTECTED_METHODS,
  CSRF_EXEMPT_PATHS
}

