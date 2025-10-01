import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { formatValidationError } from './validation'

// ============================================================================
// VALIDATION MIDDLEWARE
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
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: true } | { success: false; response: NextResponse } {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
  
  const current = rateLimitMap.get(identifier)
  
  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }
  
  if (current.count >= maxRequests) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString(),
          }
        }
      )
    }
  }
  
  current.count++
  return { success: true }
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
 * Comprehensive request validation wrapper
 */
export async function validateRequest<T>(
  request: NextRequest,
  options: {
    bodySchema?: z.ZodSchema<T>
    querySchema?: z.ZodSchema<any>
    urlParams?: Record<string, string>
    urlParamsSchema?: z.ZodSchema<any>
    rateLimit?: { identifier: string; maxRequests?: number; windowMs?: number }
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
} | {
  success: false
  response: NextResponse
}> {
  // Rate limiting check
  if (options.rateLimit) {
    const rateLimitResult = checkRateLimit(
      options.rateLimit.identifier,
      options.rateLimit.maxRequests,
      options.rateLimit.windowMs
    )
    if (!rateLimitResult.success) {
      return rateLimitResult
    }
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

  return { success: true, data: result }
}
