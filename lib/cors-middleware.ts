import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Request-ID',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
}

// Production CORS configuration
const PRODUCTION_CORS_OPTIONS: CorsOptions = {
  origin: [
    'https://sharedtask.ai',
    'https://www.sharedtask.ai',
    'https://sharedtask.vercel.app',
    'https://sharedtask-jvtbzg8ii-remi-westaymovings-projects.vercel.app',
    // Add your production domains here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Request-ID',
  ],
  credentials: true,
  maxAge: 3600, // 1 hour in production
  optionsSuccessStatus: 200,
}

// ============================================================================
// CORS UTILITIES
// ============================================================================

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigin: CorsOptions['origin']): boolean {
  if (!origin) return false
  
  if (allowedOrigin === true) return true
  if (allowedOrigin === false) return false
  
  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin
  }
  
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin)
  }
  
  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(origin)
  }
  
  return false
}

/**
 * Get CORS configuration based on environment
 */
function getCorsOptions(): CorsOptions {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isProduction) {
    return PRODUCTION_CORS_OPTIONS
  }
  
  if (isDevelopment) {
    return {
      ...DEFAULT_CORS_OPTIONS,
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        // Add any other development origins
      ]
    }
  }
  
  return DEFAULT_CORS_OPTIONS
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  options?: CorsOptions
): NextResponse {
  const corsOptions = { ...getCorsOptions(), ...options }
  const origin = request.headers.get('origin')
  
  // Handle origin
  if (isOriginAllowed(origin, corsOptions.origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  
  // Handle credentials
  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Handle methods
  if (corsOptions.methods) {
    response.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '))
  }
  
  // Handle allowed headers
  if (corsOptions.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '))
  }
  
  // Handle exposed headers
  if (corsOptions.exposedHeaders) {
    response.headers.set('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '))
  }
  
  // Handle max age
  if (corsOptions.maxAge) {
    response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString())
  }
  
  return response
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: NextRequest, options?: CorsOptions): NextResponse {
  const corsOptions = { ...getCorsOptions(), ...options }
  const origin = request.headers.get('origin')
  
  // Create preflight response
  const response = new NextResponse(null, {
    status: corsOptions.optionsSuccessStatus || 200,
  })
  
  // Add CORS headers
  return addCorsHeaders(response, request, corsOptions)
}

/**
 * CORS middleware wrapper for API routes
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: CorsOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, options)
    }
    
    // Call the actual handler
    const response = await handler(request)
    
    // Add CORS headers to the response
    return addCorsHeaders(response, request, options)
  }
}

/**
 * Simple CORS wrapper for basic use cases
 */
export function corsResponse(
  data: any,
  init?: ResponseInit,
  corsOptions?: CorsOptions
) {
  return (request: NextRequest) => {
    const response = NextResponse.json(data, init)
    return addCorsHeaders(response, request, corsOptions)
  }
}

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================

/**
 * Development CORS - Allow all origins
 */
export const developmentCors: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
}

/**
 * Production CORS - Strict origin control
 */
export const productionCors: CorsOptions = {
  origin: [
    // Add your production domains here
    'https://your-domain.com',
    'https://www.your-domain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  maxAge: 3600,
}

/**
 * API-only CORS - For external API access
 */
export const apiOnlyCors: CorsOptions = {
  origin: false, // No browser access
  credentials: false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

/**
 * Public API CORS - For public endpoints
 */
export const publicApiCors: CorsOptions = {
  origin: true,
  credentials: false,
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // Cache for 24 hours
}

// ============================================================================
// SECURITY HELPERS
// ============================================================================

/**
 * Validate origin against allowed patterns
 */
export function validateOrigin(origin: string, allowedPatterns: string[]): boolean {
  return allowedPatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(origin)
    }
    return origin === pattern
  })
}

/**
 * Log CORS violations for security monitoring
 */
export function logCorsViolation(request: NextRequest, reason: string): void {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')
  
  console.warn('CORS Violation:', {
    origin,
    userAgent,
    method: request.method,
    url: request.url,
    reason,
    timestamp: new Date().toISOString(),
  })
  
  // In production, you might want to send this to your security monitoring system
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  withCors,
  addCorsHeaders,
  handlePreflight,
  corsResponse,
  getCorsOptions,
  developmentCors,
  productionCors,
  apiOnlyCors,
  publicApiCors,
  validateOrigin,
  logCorsViolation,
}



