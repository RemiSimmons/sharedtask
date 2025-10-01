import { supabaseAdmin } from './supabase'

// ============================================================================
// STRUCTURED LOGGING SYSTEM
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type LogCategory = 
  | 'auth' 
  | 'api' 
  | 'database' 
  | 'security' 
  | 'performance' 
  | 'business' 
  | 'system' 
  | 'validation'
  | 'rate_limit'
  | 'email'

export interface LogContext {
  // Request context
  requestId?: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  
  // Business context
  projectId?: string
  taskId?: string
  endpoint?: string
  method?: string
  
  // Performance context
  duration?: number
  statusCode?: number
  
  // Error context
  error?: Error | string
  stack?: string
  originalError?: Error | string
  
  // Custom metadata
  metadata?: Record<string, any>
  intervalMs?: number
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  context: LogContext
  environment: string
  service: string
  version: string
}

class StructuredLogger {
  private environment: string
  private service: string
  private version: string
  private logBuffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
    this.service = 'sharedtask-api'
    this.version = process.env.npm_package_version || '1.0.0'
    
    // Start periodic flush to database
    this.startPeriodicFlush()
  }

  private startPeriodicFlush() {
    if (this.flushInterval) return
    
    // Flush logs every 30 seconds in production, 10 seconds in development
    const interval = this.environment === 'production' ? 30000 : 10000
    
    this.flushInterval = setInterval(() => {
      this.flushToDatabase()
    }, interval)
  }

  private async flushToDatabase() {
    if (this.logBuffer.length === 0) return
    
    const logsToFlush = [...this.logBuffer]
    this.logBuffer = []
    
    try {
      // Comment out application logs insert - table doesn't exist in current schema
      // await supabaseAdmin
      //   .from('application_logs')
      //   .insert(logsToFlush.map(log => ({
      //     timestamp: log.timestamp,
      //     level: log.level,
      //     category: log.category,
      //     message: log.message,
      //     context: log.context,
      //     environment: log.environment,
      //     service: log.service,
      //     version: log.version
      //   })))
    } catch (error) {
      // If database logging fails, fall back to console
      console.error('Failed to flush logs to database:', error)
      logsToFlush.forEach(log => {
        console.log(JSON.stringify(log, null, 2))
      })
    }
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: LogContext = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: {
        ...context,
        // Add error serialization if present
        ...(context.error && {
          error: context.error instanceof Error ? context.error.message : context.error,
          stack: context.error instanceof Error ? context.error.stack : undefined
        })
      },
      environment: this.environment,
      service: this.service,
      version: this.version
    }
  }

  private log(level: LogLevel, category: LogCategory, message: string, context: LogContext = {}) {
    const logEntry = this.createLogEntry(level, category, message, context)
    
    // Always log to console for immediate visibility
    const consoleMethod = level === 'error' || level === 'fatal' ? 'error' : 
                         level === 'warn' ? 'warn' : 'log'
    
    if (this.environment === 'development') {
      // Pretty print in development
      console[consoleMethod](`[${level.toUpperCase()}] [${category}] ${message}`, context)
    } else {
      // Structured JSON in production
      console[consoleMethod](JSON.stringify(logEntry))
    }
    
    // Buffer for database logging (except debug in production)
    if (!(this.environment === 'production' && level === 'debug')) {
      this.logBuffer.push(logEntry)
      
      // Immediate flush for errors and fatal logs
      if (level === 'error' || level === 'fatal') {
        this.flushToDatabase()
      }
    }
  }

  // ============================================================================
  // PUBLIC LOGGING METHODS
  // ============================================================================

  debug(category: LogCategory, message: string, context?: LogContext) {
    this.log('debug', category, message, context)
  }

  info(category: LogCategory, message: string, context?: LogContext) {
    this.log('info', category, message, context)
  }

  warn(category: LogCategory, message: string, context?: LogContext) {
    this.log('warn', category, message, context)
  }

  error(category: LogCategory, message: string, context?: LogContext) {
    this.log('error', category, message, context)
  }

  fatal(category: LogCategory, message: string, context?: LogContext) {
    this.log('fatal', category, message, context)
  }

  // ============================================================================
  // SPECIALIZED LOGGING METHODS
  // ============================================================================

  /**
   * Log authentication events
   */
  auth(level: LogLevel, event: string, context: LogContext = {}) {
    this.log(level, 'auth', `Auth: ${event}`, {
      ...context,
      metadata: { event, ...context.metadata }
    })
  }

  /**
   * Log API requests and responses
   */
  api(level: LogLevel, message: string, context: LogContext = {}) {
    this.log(level, 'api', message, context)
  }

  /**
   * Log security events
   */
  security(level: LogLevel, event: string, context: LogContext = {}) {
    this.log(level, 'security', `Security: ${event}`, {
      ...context,
      metadata: { event, securityEvent: true, ...context.metadata }
    })
  }

  /**
   * Log performance metrics
   */
  performance(message: string, context: LogContext = {}) {
    this.log('info', 'performance', message, context)
  }

  /**
   * Log business events
   */
  business(level: LogLevel, event: string, context: LogContext = {}) {
    this.log(level, 'business', `Business: ${event}`, {
      ...context,
      metadata: { event, businessEvent: true, ...context.metadata }
    })
  }

  /**
   * Log database operations
   */
  database(level: LogLevel, operation: string, context: LogContext = {}) {
    this.log(level, 'database', `DB: ${operation}`, {
      ...context,
      metadata: { operation, ...context.metadata }
    })
  }

  /**
   * Log validation events
   */
  validation(level: LogLevel, message: string, context: LogContext = {}) {
    this.log(level, 'validation', message, context)
  }

  /**
   * Log rate limiting events
   */
  rateLimit(level: LogLevel, event: string, context: LogContext = {}) {
    this.log(level, 'rate_limit', `Rate Limit: ${event}`, {
      ...context,
      metadata: { event, rateLimitEvent: true, ...context.metadata }
    })
  }

  /**
   * Log email events
   */
  email(level: LogLevel, event: string, context: LogContext = {}) {
    this.log(level, 'email', `Email: ${event}`, {
      ...context,
      metadata: { event, emailEvent: true, ...context.metadata }
    })
  }

  // ============================================================================
  // REQUEST LOGGING HELPERS
  // ============================================================================

  /**
   * Create request context from Next.js request
   */
  createRequestContext(request: Request, additionalContext: Partial<LogContext> = {}): LogContext {
    const url = new URL(request.url)
    
    return {
      method: request.method,
      endpoint: url.pathname,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestId: request.headers.get('x-request-id') || 
                 crypto.randomUUID(),
      ...additionalContext
    }
  }

  /**
   * Log API request start
   */
  apiRequestStart(request: Request, context: LogContext = {}) {
    const requestContext = this.createRequestContext(request, context)
    
    this.api('info', `${request.method} ${new URL(request.url).pathname} - Request started`, {
      ...requestContext,
      metadata: { requestStart: true, ...requestContext.metadata }
    })
    
    return requestContext
  }

  /**
   * Log API request completion
   */
  apiRequestComplete(
    request: Request, 
    statusCode: number, 
    duration: number, 
    context: LogContext = {}
  ) {
    const requestContext = this.createRequestContext(request, context)
    const level: LogLevel = statusCode >= 500 ? 'error' : 
                           statusCode >= 400 ? 'warn' : 'info'
    
    this.api(level, `${request.method} ${new URL(request.url).pathname} - ${statusCode} (${duration}ms)`, {
      ...requestContext,
      statusCode,
      duration,
      metadata: { requestComplete: true, ...requestContext.metadata }
    })
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    
    // Final flush
    await this.flushToDatabase()
  }
}

// ============================================================================
// SINGLETON LOGGER INSTANCE
// ============================================================================

export const logger = new StructuredLogger()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const logAuth = (level: LogLevel, event: string, context?: LogContext) => 
  logger.auth(level, event, context)

export const logAPI = (level: LogLevel, message: string, context?: LogContext) => 
  logger.api(level, message, context)

export const logSecurity = (level: LogLevel, event: string, context?: LogContext) => 
  logger.security(level, event, context)

export const logPerformance = (message: string, context?: LogContext) => 
  logger.performance(message, context)

export const logBusiness = (level: LogLevel, event: string, context?: LogContext) => 
  logger.business(level, event, context)

export const logDatabase = (level: LogLevel, operation: string, context?: LogContext) => 
  logger.database(level, operation, context)

export const logValidation = (level: LogLevel, message: string, context?: LogContext) => 
  logger.validation(level, message, context)

export const logRateLimit = (level: LogLevel, event: string, context?: LogContext) => 
  logger.rateLimit(level, event, context)

export const logEmail = (level: LogLevel, event: string, context?: LogContext) => 
  logger.email(level, event, context)

// ============================================================================
// REQUEST TIMING DECORATOR
// ============================================================================

export function withRequestLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      logger.debug('api', `${operationName} - Started`)
      const result = await fn(...args)
      const duration = Date.now() - startTime
      
      logger.info('api', `${operationName} - Completed successfully`, { duration })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error('api', `${operationName} - Failed`, { 
        error: error instanceof Error ? error : String(error),
        duration 
      })
      throw error
    }
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================================================

if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Shutting down logger...')
    await logger.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('Shutting down logger...')
    await logger.shutdown()
    process.exit(0)
  })
}
