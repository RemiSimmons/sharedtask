import { NextRequest, NextResponse } from 'next/server'

/**
 * COMPREHENSIVE SECURITY HEADERS
 * 
 * This module implements enterprise-grade security headers to protect against:
 * - XSS (Cross-Site Scripting) attacks
 * - Clickjacking attacks
 * - MIME type sniffing
 * - Information leakage
 * - Man-in-the-middle attacks
 * 
 * @see https://owasp.org/www-project-secure-headers/
 */

/**
 * Content Security Policy (CSP)
 * 
 * CSP is the most powerful security header. It controls which resources
 * the browser is allowed to load, preventing XSS attacks.
 */
function getContentSecurityPolicy(isDev: boolean = false): string {
  const policies = [
    // Default: Only allow resources from same origin
    "default-src 'self'",
    
    // Scripts: Allow self, inline scripts (for Next.js), and specific domains
    isDev 
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com"
      : "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    
    // Styles: Allow self, inline styles (for styled-components/CSS-in-JS), and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Images: Allow self, data URIs (for inline images), and common CDNs
    "img-src 'self' data: https: blob:",
    
    // Fonts: Allow self and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    
    // Connect: Allow self, Supabase, Stripe, and analytics
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://vitals.vercel-insights.com",
    
    // Frames: Allow Stripe checkout
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    
    // Objects: Disallow plugins (Flash, Java, etc.)
    "object-src 'none'",
    
    // Base URI: Restrict base tag to same origin
    "base-uri 'self'",
    
    // Form Actions: Only allow forms to submit to same origin
    "form-action 'self'",
    
    // Frame Ancestors: Prevent being embedded in iframes (clickjacking protection)
    "frame-ancestors 'none'",
    
    // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
    "upgrade-insecure-requests",
    
    // Block all mixed content
    "block-all-mixed-content",
  ]
  
  return policies.join('; ')
}

/**
 * Permissions Policy (formerly Feature Policy)
 * 
 * Controls which browser features and APIs can be used.
 * This prevents malicious third-party code from accessing sensitive features.
 */
function getPermissionsPolicy(): string {
  const policies = [
    // Camera and microphone: Deny all
    "camera=()",
    "microphone=()",
    
    // Geolocation: Deny all
    "geolocation=()",
    
    // Payment: Allow same origin only (for Stripe)
    "payment=(self)",
    
    // USB: Deny all
    "usb=()",
    
    // Interest cohort: Disable FLoC tracking
    "interest-cohort=()",
    
    // Display capture: Deny all
    "display-capture=()",
    
    // Gyroscope and accelerometer: Deny all
    "gyroscope=()",
    "accelerometer=()",
    
    // Magnetometer: Deny all
    "magnetometer=()",
  ]
  
  return policies.join(', ')
}

/**
 * Apply security headers to a response
 * 
 * @param response - The NextResponse object to add headers to
 * @param request - The incoming request (used to determine if dev mode)
 * @returns The response with security headers added
 */
export function applySecurityHeaders(
  response: NextResponse,
  request?: NextRequest
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development'
  
  // Content Security Policy
  // Note: We use Content-Security-Policy-Report-Only in dev to avoid breaking hot reload
  const cspHeader = isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
  response.headers.set(cspHeader, getContentSecurityPolicy(isDev))
  
  // Strict-Transport-Security (HSTS)
  // Force HTTPS for 2 years, including all subdomains
  // Only set in production (localhost doesn't have HTTPS)
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
  
  // X-Frame-Options
  // Prevent clickjacking by disallowing the page to be embedded in frames
  response.headers.set('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options
  // Prevent MIME type sniffing (forces browser to respect Content-Type header)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // X-DNS-Prefetch-Control
  // Disable DNS prefetching to improve privacy
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // Referrer-Policy
  // Control how much referrer information is sent with requests
  // 'strict-origin-when-cross-origin' is a good balance of privacy and functionality
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions-Policy (Feature Policy)
  // Control which browser features can be used
  response.headers.set('Permissions-Policy', getPermissionsPolicy())
  
  // X-XSS-Protection (legacy, but still good for older browsers)
  // Note: Modern browsers use CSP instead, but this doesn't hurt
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Cross-Origin-Embedder-Policy
  // Enables SharedArrayBuffer and other features that require cross-origin isolation
  // Use 'require-corp' for maximum security, but only if your site doesn't embed cross-origin resources
  // For now, we use 'unsafe-none' to avoid breaking functionality
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  
  // Cross-Origin-Opener-Policy
  // Isolates the browsing context from cross-origin windows
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  
  // Cross-Origin-Resource-Policy
  // Protects against Spectre-like attacks
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  return response
}

/**
 * Get security headers as an object (useful for API routes)
 * 
 * @returns Object with security headers
 */
export function getSecurityHeadersObject(isDev: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Security-Policy': getContentSecurityPolicy(isDev),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': getPermissionsPolicy(),
    'X-XSS-Protection': '1; mode=block',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
  
  // Only add HSTS in production
  if (!isDev) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }
  
  return headers
}

/**
 * Create a NextResponse with security headers
 * 
 * @param body - Response body
 * @param init - Response init options
 * @returns NextResponse with security headers
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init)
  return applySecurityHeaders(response)
}

/**
 * Validate security headers on a response (for testing)
 * 
 * @param response - The response to validate
 * @returns Object with validation results
 */
export function validateSecurityHeaders(response: Response): {
  passed: string[]
  failed: string[]
  warnings: string[]
} {
  const passed: string[] = []
  const failed: string[] = []
  const warnings: string[] = []
  
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ]
  
  const recommendedHeaders = [
    'Strict-Transport-Security',
    'X-XSS-Protection',
  ]
  
  // Check required headers
  for (const header of requiredHeaders) {
    if (response.headers.has(header)) {
      passed.push(header)
    } else {
      failed.push(header)
    }
  }
  
  // Check recommended headers
  for (const header of recommendedHeaders) {
    if (!response.headers.has(header)) {
      warnings.push(`Missing recommended header: ${header}`)
    }
  }
  
  return { passed, failed, warnings }
}

