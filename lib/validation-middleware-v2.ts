import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { formatValidationError } from './validation'
import { checkRateLimit, checkAuthRateLimit, checkAPIRateLimit, checkContactRateLimit, RateLimitConfig } from './rate-limiter'

// ============================================================================
// ENHANCED VALIDATION MIDDLEWARE WITH COMPREHENSIVE RATE LIMITING
// ============================================================================

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          formatValidationError(error),
          { status: 400 }
        )
      }
    }
    
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedData = schema.parse(params)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          formatValidationError(error),
          { status: 400 }
        )
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }
  }
}

/**
 * Validates URL parameters (like /api/projects/[id])
 */
export function validateUrlParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validatedData = schema.parse(params)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          formatValidationError(error),
          { status: 400 }
        )
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid URL parameters' },
        { status: 400 }
      )
    }
  }
}

/**
 * Content-Type validation helper
 */
export function validateContentType(
  request: NextRequest,
  expectedType: string = 'application/json'
): { success: true } | { success: false; response: NextResponse } {
  const contentType = request.headers.get('content-type')
  
  if (!contentType || !contentType.includes(expectedType)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Content-Type must be ${expectedType}` },
        { status: 400 }
      )
    }
  }
  
  return { success: true }
}

/**
 * Request size validation helper
 */
export function validateRequestSize(
  request: NextRequest,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): { success: true } | { success: false; response: NextResponse } {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Request body too large. Maximum size: ${maxSizeBytes} bytes` },
        { status: 413 }
      )
    }
  }
  
  return { success: true }
}

/**
 * Comprehensive request validation wrapper with enhanced rate limiting
 */
export async function validateRequest<T>(
  request: NextRequest,
  options: {
    bodySchema?: z.ZodSchema<T>
    querySchema?: z.ZodSchema<any>
    urlParams?: Record<string, string>
    urlParamsSchema?: z.ZodSchema<any>
    
    // Enhanced rate limiting options
    rateLimitType?: 'auth' | 'api' | 'contact' | 'custom'
    rateLimitConfig?: RateLimitConfig
    userId?: string
    
    // Other validation options
    maxBodySize?: number
    requireJson?: boolean
  }
): Promise<{
  success: true
  data: {
    body?: T
    query?: any
    urlParams?: any
  }
  rateLimitInfo?: {
    limit: number
    remaining: number
    resetTime: number
  }
} | {
  success: false
  response: NextResponse
}> {
  // Enhanced rate limiting check
  let rateLimitResult
  
  if (options.rateLimitType === 'auth') {
    rateLimitResult = await checkAuthRateLimit(request)
  } else if (options.rateLimitType === 'api') {
    rateLimitResult = await checkAPIRateLimit(request, options.userId)
  } else if (options.rateLimitType === 'contact') {
    rateLimitResult = await checkContactRateLimit(request)
  } else if (options.rateLimitConfig) {
    rateLimitResult = await checkRateLimit(request, options.rateLimitConfig)
  }
  
  if (rateLimitResult && !rateLimitResult.success) {
    return { success: false, response: rateLimitResult.response! }
  }

  // Content-Type validation
  if (options.requireJson !== false && options.bodySchema) {
    const contentTypeResult = validateContentType(request)
    if (!contentTypeResult.success) {
      return contentTypeResult
    }
  }

  // Request size validation
  if (options.maxBodySize) {
    const sizeResult = validateRequestSize(request, options.maxBodySize)
    if (!sizeResult.success) {
      return sizeResult
    }
  }

  const result: any = {}

  // Validate body
  if (options.bodySchema) {
    const bodyResult = await validateRequestBody(request, options.bodySchema)
    if (!bodyResult.success) {
      return bodyResult
    }
    result.body = bodyResult.data
  }

  // Validate query parameters
  if (options.querySchema) {
    const queryResult = validateQueryParams(request, options.querySchema)
    if (!queryResult.success) {
      return queryResult
    }
    result.query = queryResult.data
  }

  // Validate URL parameters
  if (options.urlParams && options.urlParamsSchema) {
    const urlParamsResult = validateUrlParams(options.urlParams, options.urlParamsSchema)
    if (!urlParamsResult.success) {
      return urlParamsResult
    }
    result.urlParams = urlParamsResult.data
  }

  return { 
    success: true, 
    data: result,
    rateLimitInfo: rateLimitResult ? {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    } : undefined
  }
}

// ============================================================================
// SPECIALIZED VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation for authentication endpoints
 */
export async function validateAuthRequest<T>(
  request: NextRequest,
  bodySchema: z.ZodSchema<T>,
  options: {
    maxBodySize?: number
    requireJson?: boolean
  } = {}
) {
  return validateRequest(request, {
    bodySchema,
    rateLimitType: 'auth',
    maxBodySize: options.maxBodySize || 1024, // 1KB for auth requests
    requireJson: options.requireJson !== false
  })
}

/**
 * Validation for API endpoints
 */
export async function validateAPIRequest<T>(
  request: NextRequest,
  options: {
    bodySchema?: z.ZodSchema<T>
    querySchema?: z.ZodSchema<any>
    userId?: string
    maxBodySize?: number
    requireJson?: boolean
  } = {}
) {
  return validateRequest(request, {
    bodySchema: options.bodySchema,
    querySchema: options.querySchema,
    rateLimitType: 'api',
    userId: options.userId,
    maxBodySize: options.maxBodySize || 4096, // 4KB for API requests
    requireJson: options.requireJson !== false
  })
}

/**
 * Validation for contact/support endpoints
 */
export async function validateContactRequest<T>(
  request: NextRequest,
  bodySchema: z.ZodSchema<T>,
  options: {
    maxBodySize?: number
    requireJson?: boolean
  } = {}
) {
  return validateRequest(request, {
    bodySchema,
    rateLimitType: 'contact',
    maxBodySize: options.maxBodySize || 8192, // 8KB for contact forms
    requireJson: options.requireJson !== false
  })
}

// ============================================================================
// MIDDLEWARE FOR ADDING RATE LIMIT HEADERS
// ============================================================================

export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo?: {
    limit: number
    remaining: number
    resetTime: number
  }
): NextResponse {
  if (!rateLimitInfo) return response
  
  response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString())
  
  return response
}
