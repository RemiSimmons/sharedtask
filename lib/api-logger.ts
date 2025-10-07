import { supabaseAdmin } from './supabase'
import { NextRequest, NextResponse } from 'next/server'

export interface LogContext {
  endpoint?: string
  method?: string
  responseTime?: number
  statusCode?: number
  slow_query?: boolean
  error?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
}

export class ApiLogger {
  /**
   * Log an API request/response
   */
  static async log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context: LogContext = {}
  ): Promise<void> {
    try {
      // Don't log in development to avoid noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${message}`, context)
        return
      }

      const { error } = await supabaseAdmin
        .from('application_logs')
        .insert({
          level,
          message,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
          },
          user_id: context.userId || null,
          ip_address: context.ipAddress || null,
          user_agent: context.userAgent || null,
          endpoint: context.endpoint || null,
          method: context.method || null,
          response_time: context.responseTime || null,
          status_code: context.statusCode || null
        })

      if (error) {
        console.error('Failed to log to application_logs:', error)
      }
    } catch (err) {
      console.error('Error in ApiLogger.log:', err)
    }
  }

  /**
   * Log API request start
   */
  static async logRequest(
    request: NextRequest,
    endpoint: string,
    userId?: string
  ): Promise<void> {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await this.log('info', `API Request: ${request.method} ${endpoint}`, {
      endpoint,
      method: request.method,
      userId,
      ipAddress,
      userAgent
    })
  }

  /**
   * Log API response
   */
  static async logResponse(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    error?: string
  ): Promise<void> {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info'
    const message = error || `API Response: ${method} ${endpoint} - ${statusCode}`

    await this.log(level, message, {
      endpoint,
      method,
      statusCode,
      responseTime,
      userId,
      error,
      slow_query: responseTime > 1000 // Flag slow queries
    })
  }

  /**
   * Log slow queries
   */
  static async logSlowQuery(
    query: string,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    await this.log('warn', `Slow query detected: ${responseTime}ms`, {
      slow_query: true,
      responseTime,
      userId,
      endpoint: 'database',
      method: 'QUERY'
    })
  }

  /**
   * Log errors
   */
  static async logError(
    error: Error,
    context: LogContext = {}
  ): Promise<void> {
    await this.log('error', error.message, {
      ...context,
      error: error.stack || error.message
    })
  }
}

/**
 * Middleware wrapper to log API requests/responses
 */
export function withApiLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest
    const startTime = Date.now()
    
    // Extract endpoint from request URL
    const url = new URL(request.url)
    const endpoint = url.pathname
    
    // Try to get user ID from headers or session
    const userId = request.headers.get('x-user-id') || undefined
    
    // Log request
    await ApiLogger.logRequest(request, endpoint, userId)
    
    try {
      // Execute the handler
      const response = await handler(...args)
      const responseTime = Date.now() - startTime
      
      // Log response
      await ApiLogger.logResponse(
        endpoint,
        request.method,
        response.status,
        responseTime,
        userId
      )
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Log error
      await ApiLogger.logError(error as Error, {
        endpoint,
        method: request.method,
        responseTime,
        userId
      })
      
      throw error
    }
  }
}
