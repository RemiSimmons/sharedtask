import { NextRequest, NextResponse } from 'next/server'
import { trackError, ErrorContext } from './error-tracker'
import { logger } from './logger'

// ============================================================================
// ERROR TRACKING MIDDLEWARE FOR API ROUTES
// ============================================================================

export interface ErrorTrackingOptions {
  trackValidationErrors?: boolean
  trackBusinessErrors?: boolean
  trackSystemErrors?: boolean
  customErrorHandler?: (error: Error, context: ErrorContext) => Promise<void>
  excludeStatusCodes?: number[]
  includeRequestBody?: boolean
  includeResponseBody?: boolean
}

const DEFAULT_OPTIONS: ErrorTrackingOptions = {
  trackValidationErrors: true,
  trackBusinessErrors: true,
  trackSystemErrors: true,
  excludeStatusCodes: [404], // Don't track 404s by default
  includeRequestBody: false, // Security: don't log request bodies by default
  includeResponseBody: false // Performance: don't log response bodies by default
}

/**
 * Middleware to automatically track errors in API routes
 */
export function withErrorTracking<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: ErrorTrackingOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    // Create base error context
    const baseContext: ErrorContext = {
      requestId,
      method: request.method,
      endpoint: request.nextUrl.pathname,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }

    let response: NextResponse
    let caughtError: Error | null = null

    try {
      response = await handler(request, ...args)
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error))
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    const statusCode = response.status

    // Enhanced context with response information
    const enhancedContext: ErrorContext = {
      ...baseContext,
      statusCode,
      metadata: {
        duration,
        ...(opts.includeRequestBody && await getRequestBodySafely(request)),
        ...(opts.includeResponseBody && await getResponseBodySafely(response))
      }
    }

    // Track errors based on configuration
    if (caughtError) {
      // Always track caught exceptions
      await trackError(caughtError, enhancedContext, {
        severity: 'critical',
        impact: 'system',
        tags: ['uncaught-exception', 'api-error']
      })

      // Call custom error handler if provided
      if (opts.customErrorHandler) {
        try {
          await opts.customErrorHandler(caughtError, enhancedContext)
        } catch (handlerError) {
          logger.error('system', 'Custom error handler failed', {
            error: handlerError instanceof Error ? handlerError.message : String(handlerError),
            originalError: caughtError.message
          })
        }
      }
    } else if (shouldTrackStatusCode(statusCode, opts)) {
      // Track HTTP errors based on status code
      const errorMessage = getErrorMessageForStatusCode(statusCode)
      const errorType = getErrorTypeForStatusCode(statusCode)
      
      if (errorType && (
        (errorType === 'validation' && opts.trackValidationErrors) ||
        (errorType === 'business' && opts.trackBusinessErrors) ||
        (errorType === 'system' && opts.trackSystemErrors)
      )) {
        await trackError(new Error(errorMessage), enhancedContext, {
          severity: getSeverityForStatusCode(statusCode),
          impact: getImpactForStatusCode(statusCode),
          tags: [errorType, 'http-error', `status-${statusCode}`]
        })
      }
    }

    // Add error tracking headers to response
    response.headers.set('X-Request-ID', requestId)
    if (caughtError) {
      response.headers.set('X-Error-Tracked', 'true')
    }

    return response
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown'
}

/**
 * Safely get request body for error context
 */
async function getRequestBodySafely(request: NextRequest): Promise<{ requestBody?: any }> {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('application/json')) {
      return {}
    }
    
    const body = await request.text()
    
    if (body.length > 1024) { // Limit body size
      return { requestBody: `[TRUNCATED - ${body.length} bytes]` }
    }
    
    return { requestBody: JSON.parse(body) }
  } catch {
    return {}
  }
}

/**
 * Safely get response body for error context
 */
async function getResponseBodySafely(response: NextResponse): Promise<{ responseBody?: any }> {
  try {
    const contentType = response.headers.get('content-type') || ''
    
    if (!contentType.includes('application/json')) {
      return {}
    }
    
    const body = await response.text()
    
    if (body.length > 1024) { // Limit body size
      return { responseBody: `[TRUNCATED - ${body.length} bytes]` }
    }
    
    return { responseBody: JSON.parse(body) }
  } catch {
    return {}
  }
}

/**
 * Determine if status code should be tracked
 */
function shouldTrackStatusCode(statusCode: number, options: ErrorTrackingOptions): boolean {
  // Don't track success codes
  if (statusCode < 400) {
    return false
  }
  
  // Check exclusion list
  if (options.excludeStatusCodes?.includes(statusCode)) {
    return false
  }
  
  return true
}

/**
 * Get error message for status code
 */
function getErrorMessageForStatusCode(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request - Invalid input data',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Access denied',
    404: 'Not Found - Resource not found',
    405: 'Method Not Allowed - HTTP method not supported',
    409: 'Conflict - Resource conflict',
    422: 'Unprocessable Entity - Validation failed',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server error',
    502: 'Bad Gateway - Upstream server error',
    503: 'Service Unavailable - Server temporarily unavailable',
    504: 'Gateway Timeout - Upstream server timeout'
  }
  
  return messages[statusCode] || `HTTP Error ${statusCode}`
}

/**
 * Get error type for status code
 */
function getErrorTypeForStatusCode(statusCode: number): 'validation' | 'business' | 'system' | null {
  if (statusCode >= 400 && statusCode < 500) {
    if ([400, 422].includes(statusCode)) {
      return 'validation'
    }
    if ([401, 403, 404, 409].includes(statusCode)) {
      return 'business'
    }
    return 'business' // Default for 4xx
  }
  
  if (statusCode >= 500) {
    return 'system'
  }
  
  return null
}

/**
 * Get severity for status code
 */
function getSeverityForStatusCode(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode === 500) return 'critical'
  if ([502, 503, 504].includes(statusCode)) return 'high'
  if ([401, 403, 409, 429].includes(statusCode)) return 'medium'
  return 'low'
}

/**
 * Get impact for status code
 */
function getImpactForStatusCode(statusCode: number): 'user' | 'system' | 'business' | 'security' {
  if ([401, 403].includes(statusCode)) return 'security'
  if ([500, 502, 503, 504].includes(statusCode)) return 'system'
  if ([409, 422].includes(statusCode)) return 'business'
  return 'user'
}

// ============================================================================
// SPECIALIZED ERROR TRACKING MIDDLEWARE
// ============================================================================

/**
 * Error tracking for authentication endpoints
 */
export function withAuthErrorTracking<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorTracking(handler, {
    trackValidationErrors: true,
    trackBusinessErrors: true,
    trackSystemErrors: true,
    excludeStatusCodes: [], // Track all errors for auth endpoints
    includeRequestBody: false, // Never log auth request bodies (contain passwords)
    customErrorHandler: async (error, context) => {
      // Special handling for auth errors
      if (context.endpoint?.includes('signin') || context.endpoint?.includes('signup')) {
        logger.security('warn', 'Authentication error occurred', {
          ...context,
          metadata: {
            ...context.metadata,
            authError: true,
            potentialAttack: error.message.toLowerCase().includes('brute') ||
                           error.message.toLowerCase().includes('multiple')
          }
        })
      }
    }
  })
}

/**
 * Error tracking for payment endpoints
 */
export function withPaymentErrorTracking<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorTracking(handler, {
    trackValidationErrors: true,
    trackBusinessErrors: true,
    trackSystemErrors: true,
    excludeStatusCodes: [],
    customErrorHandler: async (error, context) => {
      // All payment errors are business critical
      await trackError(error, context, {
        severity: 'critical',
        impact: 'business',
        tags: ['payment-error', 'revenue-impact']
      })
    }
  })
}

/**
 * Error tracking for admin endpoints
 */
export function withAdminErrorTracking<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorTracking(handler, {
    trackValidationErrors: true,
    trackBusinessErrors: true,
    trackSystemErrors: true,
    includeRequestBody: true, // Log admin request bodies for debugging
    includeResponseBody: true,
    customErrorHandler: async (error, context) => {
      // Admin errors might indicate security issues
      logger.security('warn', 'Admin endpoint error', {
        ...context,
        metadata: {
          ...context.metadata,
          adminError: true,
          potentialSecurityIssue: true
        }
      })
    }
  })
}

// ============================================================================
// ERROR CONTEXT ENHANCERS
// ============================================================================

/**
 * Add user context to error tracking
 */
export function withUserContext(userId: string, sessionId?: string) {
  return function<T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withErrorTracking(handler, {
      customErrorHandler: async (error, context) => {
        const enhancedContext: ErrorContext = {
          ...context,
          userId,
          sessionId,
          metadata: {
            ...context.metadata,
            hasUserContext: true
          }
        }
        
        await trackError(error, enhancedContext)
      }
    })
  }
}

/**
 * Add business context to error tracking
 */
export function withBusinessContext(projectId?: string, taskId?: string, feature?: string) {
  return function<T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withErrorTracking(handler, {
      customErrorHandler: async (error, context) => {
        const enhancedContext: ErrorContext = {
          ...context,
          projectId,
          taskId,
          feature,
          metadata: {
            ...context.metadata,
            hasBusinessContext: true
          }
        }
        
        await trackError(error, enhancedContext)
      }
    })
  }
}
