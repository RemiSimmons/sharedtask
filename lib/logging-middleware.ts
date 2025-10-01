import { NextRequest, NextResponse } from 'next/server'
import { logger, LogContext } from './logger'

// ============================================================================
// LOGGING MIDDLEWARE FOR API ROUTES
// ============================================================================

export interface RequestLoggingOptions {
  logRequestBody?: boolean
  logResponseBody?: boolean
  logHeaders?: boolean
  sensitiveHeaders?: string[]
  maxBodySize?: number
  excludeHealthChecks?: boolean
}

const DEFAULT_OPTIONS: RequestLoggingOptions = {
  logRequestBody: false, // Don't log request bodies by default for security
  logResponseBody: false, // Don't log response bodies by default for performance
  logHeaders: false,
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key', 'x-auth-token'],
  maxBodySize: 1024, // 1KB max for logged bodies
  excludeHealthChecks: true
}

/**
 * Middleware to automatically log API requests and responses
 */
export function withRequestLogging<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: RequestLoggingOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    // Skip health checks if configured
    if (opts.excludeHealthChecks && request.nextUrl.pathname.includes('/health')) {
      return handler(request, ...args)
    }
    
    // Create base context
    const baseContext: LogContext = {
      requestId,
      method: request.method,
      endpoint: request.nextUrl.pathname,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
    
    // Log request start
    logger.api('info', `${request.method} ${request.nextUrl.pathname} - Started`, {
      ...baseContext,
      metadata: {
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
        ...(opts.logHeaders && {
          headers: sanitizeHeaders(request.headers, opts.sensitiveHeaders || [])
        }),
        ...(opts.logRequestBody && await getRequestBody(request, opts.maxBodySize || 1024))
      }
    })
    
    let response: NextResponse
    let error: Error | null = null
    
    try {
      response = await handler(request, ...args)
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
      
      // Log error
      logger.error('api', `${request.method} ${request.nextUrl.pathname} - Error`, {
        ...baseContext,
        error,
        duration: Date.now() - startTime
      })
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    
    const duration = Date.now() - startTime
    const statusCode = response.status
    
    // Determine log level based on status code
    const level = statusCode >= 500 ? 'error' : 
                 statusCode >= 400 ? 'warn' : 'info'
    
    // Log response
    logger.api(level, `${request.method} ${request.nextUrl.pathname} - ${statusCode} (${duration}ms)`, {
      ...baseContext,
      statusCode,
      duration,
      metadata: {
        ...(opts.logResponseBody && statusCode < 500 && {
          responseBody: await getResponseBody(response, opts.maxBodySize || 1024)
        }),
        ...(error && { error: error.message })
      }
    })
    
    // Log performance metric
    logger.performance(`API Response Time: ${request.method} ${request.nextUrl.pathname}`, {
      ...baseContext,
      duration,
      statusCode,
      metadata: {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        responseTime: duration
      }
    })
    
    // Add request ID to response headers
    response.headers.set('X-Request-ID', requestId)
    
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
 * Sanitize headers by removing sensitive ones
 */
function sanitizeHeaders(headers: Headers, sensitiveHeaders: string[]): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  headers.forEach((value, key) => {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = value
    } else {
      sanitized[key] = '[REDACTED]'
    }
  })
  
  return sanitized
}

/**
 * Get request body for logging (with size limit)
 */
async function getRequestBody(request: NextRequest, maxSize: number): Promise<{ requestBody?: any }> {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('application/json')) {
      return {}
    }
    
    const body = await request.text()
    
    if (body.length > maxSize) {
      return { requestBody: `[TRUNCATED - ${body.length} bytes]` }
    }
    
    return { requestBody: JSON.parse(body) }
  } catch {
    return {}
  }
}

/**
 * Get response body for logging (with size limit)
 */
async function getResponseBody(response: NextResponse, maxSize: number): Promise<{ responseBody?: any }> {
  try {
    const contentType = response.headers.get('content-type') || ''
    
    if (!contentType.includes('application/json')) {
      return {}
    }
    
    const body = await response.text()
    
    if (body.length > maxSize) {
      return { responseBody: `[TRUNCATED - ${body.length} bytes]` }
    }
    
    return { responseBody: JSON.parse(body) }
  } catch {
    return {}
  }
}

// ============================================================================
// SPECIALIZED LOGGING DECORATORS
// ============================================================================

/**
 * Decorator for authentication endpoints
 */
export function withAuthLogging<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withRequestLogging(handler, {
    logRequestBody: false, // Never log auth request bodies (contain passwords)
    logResponseBody: false,
    logHeaders: false // Never log auth headers (contain tokens)
  })
}

/**
 * Decorator for admin endpoints
 */
export function withAdminLogging<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withRequestLogging(handler, {
    logRequestBody: true,
    logResponseBody: true,
    logHeaders: true,
    maxBodySize: 2048 // Larger body size for admin operations
  })
}

/**
 * Decorator for public API endpoints
 */
export function withPublicAPILogging<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withRequestLogging(handler, {
    logRequestBody: false,
    logResponseBody: false,
    logHeaders: false
  })
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

export function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  request: NextRequest,
  additionalData: Record<string, any> = {}
) {
  const riskScore = severity === 'critical' ? 90 :
                   severity === 'high' ? 70 :
                   severity === 'medium' ? 40 : 20
  
  logger.security('warn', eventType, {
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl.pathname,
    method: request.method,
    metadata: {
      eventType,
      severity,
      riskScore,
      ...additionalData
    }
  })
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceMonitor {
  private startTime: number
  private context: LogContext
  
  constructor(operation: string, context: LogContext = {}) {
    this.startTime = Date.now()
    this.context = { ...context, metadata: { operation, ...context.metadata } }
  }
  
  end(additionalContext: LogContext = {}) {
    const duration = Date.now() - this.startTime
    
    logger.performance(`Operation completed: ${this.context.metadata?.operation}`, {
      ...this.context,
      ...additionalContext,
      duration,
      metadata: {
        ...this.context.metadata,
        ...additionalContext.metadata,
        duration
      }
    })
    
    return duration
  }
  
  endWithError(error: Error, additionalContext: LogContext = {}) {
    const duration = Date.now() - this.startTime
    
    logger.error('performance', `Operation failed: ${this.context.metadata?.operation}`, {
      ...this.context,
      ...additionalContext,
      error,
      duration,
      metadata: {
        ...this.context.metadata,
        ...additionalContext.metadata,
        duration,
        failed: true
      }
    })
    
    return duration
  }
}

// ============================================================================
// BUSINESS EVENT LOGGING
// ============================================================================

export function logBusinessEvent(
  event: string,
  level: 'info' | 'warn' | 'error',
  context: LogContext = {}
) {
  logger.business(level, event, {
    ...context,
    metadata: {
      businessEvent: true,
      event,
      ...context.metadata
    }
  })
}

// ============================================================================
// DATABASE OPERATION LOGGING
// ============================================================================

export function logDatabaseOperation(
  operation: string,
  table: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context: LogContext = {}
) {
  logger.database(level, operation, {
    ...context,
    metadata: {
      operation,
      table,
      ...context.metadata
    }
  })
}

// ============================================================================
// VALIDATION ERROR LOGGING
// ============================================================================

export function logValidationError(
  field: string,
  error: string,
  context: LogContext = {}
) {
  logger.validation('warn', `Validation failed: ${field}`, {
    ...context,
    metadata: {
      field,
      validationError: error,
      ...context.metadata
    }
  })
}
