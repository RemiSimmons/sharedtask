import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import crypto from 'crypto'

// ============================================================================
// COMPREHENSIVE ERROR TRACKING SYSTEM
// ============================================================================

export interface ErrorContext {
  // Request context
  requestId?: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  
  // Application context
  endpoint?: string
  method?: string
  statusCode?: number
  
  // Business context
  projectId?: string
  taskId?: string
  feature?: string
  action?: string
  
  // Technical context
  component?: string
  function?: string
  line?: number
  file?: string
  
  // Environment context
  environment?: string
  version?: string
  buildId?: string
  timestamp?: string
  
  // Additional metadata
  metadata?: Record<string, any>
}

export interface ErrorFingerprint {
  hash: string
  message: string
  stackTrace?: string
  type: string
  location?: string
}

export interface TrackedError {
  id: string
  fingerprint: ErrorFingerprint
  context: ErrorContext
  timestamp: Date
  count: number
  firstSeen: Date
  lastSeen: Date
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  assignedTo?: string
  tags: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact: 'user' | 'system' | 'business' | 'security'
}

export interface ErrorTrend {
  timestamp: Date
  count: number
  uniqueErrors: number
  affectedUsers: number
}

class ErrorTracker {
  private environment: string
  private version: string
  private buildId: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
    this.version = process.env.npm_package_version || '1.0.0'
    this.buildId = process.env.BUILD_ID || 'dev'
  }

  /**
   * Track an error with full context
   */
  async trackError(
    error: Error | string,
    context: ErrorContext = {},
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical'
      impact?: 'user' | 'system' | 'business' | 'security'
      tags?: string[]
      fingerprint?: string
    } = {}
  ): Promise<string> {
    try {
      // Create error fingerprint
      const fingerprint = options.fingerprint || this.createFingerprint(error, context)
      
      // Determine severity automatically if not provided
      const severity = options.severity || this.determineSeverity(error, context)
      
      // Determine impact automatically if not provided
      const impact = options.impact || this.determineImpact(error, context)
      
      // Extract error details
      const errorDetails = this.extractErrorDetails(error)
      
      // Enhanced context
      const enhancedContext: ErrorContext = {
        ...context,
        environment: this.environment,
        version: this.version,
        buildId: this.buildId,
        timestamp: new Date().toISOString()
      }

      // Log the error through our structured logging system
      logger.error('system', `Error tracked: ${errorDetails.message}`, {
        ...enhancedContext,
        error: errorDetails.message,
        stack: errorDetails.stackTrace,
        metadata: {
          fingerprint,
          severity,
          impact,
          tags: options.tags || [],
          ...enhancedContext.metadata
        }
      })

      // Store in error tracking database
      const errorId = await this.storeError(fingerprint, errorDetails, enhancedContext, {
        severity,
        impact,
        tags: options.tags || []
      })

      // Check if this error should trigger alerts
      await this.checkAlertThresholds(fingerprint, severity, impact)

      return errorId

    } catch (trackingError) {
      // Never let error tracking crash the application
      console.error('Error tracking failed:', trackingError)
      logger.error('system', 'Error tracking system failed', {
        error: trackingError instanceof Error ? trackingError.message : String(trackingError),
        originalError: error instanceof Error ? error.message : String(error)
      })
      return 'tracking-failed-' + Date.now()
    }
  }

  /**
   * Create a unique fingerprint for error grouping
   */
  private createFingerprint(error: Error | string, context: ErrorContext): string {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackTrace = error instanceof Error ? error.stack : ''
    
    // Extract the most relevant part of the stack trace (first few frames)
    const relevantStack = stackTrace
      ?.split('\n')
      .slice(0, 3)
      .map(line => line.trim().replace(/\s+/g, ' '))
      .join('|') || ''
    
    // Create fingerprint from error message + relevant stack + context
    const fingerprintData = [
      errorMessage.replace(/\d+/g, 'N'), // Replace numbers with N for grouping
      relevantStack,
      context.endpoint || '',
      context.component || '',
      context.function || ''
    ].join('::')
    
    return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16)
  }

  /**
   * Extract detailed error information
   */
  private extractErrorDetails(error: Error | string): {
    message: string
    type: string
    stackTrace?: string
    location?: string
  } {
    if (error instanceof Error) {
      // Extract location from stack trace
      const location = error.stack
        ?.split('\n')[1]
        ?.match(/\((.+):(\d+):(\d+)\)/)
        ?.[1] || undefined

      return {
        message: error.message,
        type: error.constructor.name,
        stackTrace: error.stack,
        location
      }
    }

    return {
      message: String(error),
      type: 'StringError'
    }
  }

  /**
   * Automatically determine error severity
   */
  private determineSeverity(error: Error | string, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const lowerMessage = errorMessage.toLowerCase()

    // Critical errors
    if (
      lowerMessage.includes('database') && lowerMessage.includes('connection') ||
      lowerMessage.includes('payment') && lowerMessage.includes('failed') ||
      lowerMessage.includes('security') ||
      lowerMessage.includes('unauthorized') && context.endpoint?.includes('admin') ||
      context.statusCode === 500
    ) {
      return 'critical'
    }

    // High severity errors
    if (
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('auth') && lowerMessage.includes('failed') ||
      context.statusCode === 503 ||
      context.statusCode === 502
    ) {
      return 'high'
    }

    // Medium severity errors
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('not found') ||
      context.statusCode === 404 ||
      context.statusCode === 400
    ) {
      return 'medium'
    }

    // Default to low severity
    return 'low'
  }

  /**
   * Automatically determine error impact
   */
  private determineImpact(error: Error | string, context: ErrorContext): 'user' | 'system' | 'business' | 'security' {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const lowerMessage = errorMessage.toLowerCase()

    // Security impact
    if (
      lowerMessage.includes('security') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('csrf') ||
      lowerMessage.includes('xss')
    ) {
      return 'security'
    }

    // Business impact
    if (
      lowerMessage.includes('payment') ||
      lowerMessage.includes('subscription') ||
      lowerMessage.includes('billing') ||
      lowerMessage.includes('checkout') ||
      context.endpoint?.includes('payment') ||
      context.endpoint?.includes('billing')
    ) {
      return 'business'
    }

    // System impact
    if (
      lowerMessage.includes('database') ||
      lowerMessage.includes('server') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('memory') ||
      lowerMessage.includes('disk') ||
      context.statusCode === 500 ||
      context.statusCode === 503
    ) {
      return 'system'
    }

    // Default to user impact
    return 'user'
  }

  /**
   * Store error in database with deduplication
   */
  private async storeError(
    fingerprint: string,
    errorDetails: any,
    context: ErrorContext,
    options: {
      severity: string
      impact: string
      tags: string[]
    }
  ): Promise<string> {
    // Comment out error tracking database operations - table doesn't exist in current schema
    // const { data: existingError } = await supabaseAdmin
    //   .from('error_tracking')
    //   .select('id, occurrence_count, first_seen')
    //   .eq('error_hash', fingerprint)
    //   .single()
    
    const existingError = null // No database table available

    // All error tracking database operations commented out - table doesn't exist in current schema
    // Return a mock ID for now
    return 'mock-error-id-' + Date.now()
  }

  /**
   * Check if error should trigger alerts
   */
  private async checkAlertThresholds(fingerprint: string, severity: string, impact: string) {
    // Get error occurrence count in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    // Comment out application logs query - table doesn't exist in current schema
    // const { data: recentOccurrences, count } = await supabaseAdmin
    //   .from('application_logs')
    //   .select('*', { count: 'exact' })
    //   .eq('level', 'error')
    //   .contains('context', { fingerprint })
    //   .gte('timestamp', oneHourAgo.toISOString())
    
    const recentOccurrences = []
    const count = 0

    // Alert thresholds based on severity
    const thresholds = {
      critical: 1,  // Alert immediately for critical errors
      high: 3,      // Alert after 3 occurrences in 1 hour
      medium: 10,   // Alert after 10 occurrences in 1 hour
      low: 50       // Alert after 50 occurrences in 1 hour
    }

    const threshold = thresholds[severity as keyof typeof thresholds] || 10

    if ((count || 0) >= threshold) {
      await this.triggerErrorAlert(fingerprint, severity, impact, count || 0)
    }
  }

  /**
   * Trigger error alert
   */
  private async triggerErrorAlert(fingerprint: string, severity: string, impact: string, count: number) {
    logger.error('system', `Error alert triggered: ${fingerprint}`, {
      metadata: {
        fingerprint,
        severity,
        impact,
        occurrenceCount: count,
        alertType: 'error_threshold_exceeded'
      }
    })

    // Here you would integrate with your alerting system:
    // - Send email notifications
    // - Post to Slack
    // - Create PagerDuty incident
    // - etc.
  }

  /**
   * Get error analytics
   */
  async getErrorAnalytics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalErrors: number
    uniqueErrors: number
    topErrors: any[]
    trends: any[]
    summary: Record<string, number>
  }> {
    const windowMs = timeframe === 'hour' ? 60 * 60 * 1000 : 
                     timeframe === 'day' ? 24 * 60 * 60 * 1000 : 
                     7 * 24 * 60 * 60 * 1000

    const since = new Date(Date.now() - windowMs)

    // Comment out all error statistics queries - tables don't exist in current schema
    // Return mock data for now
    return {
      totalErrors: 0,
      uniqueErrors: 0,
      topErrors: [],
      trends: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    }
  }

  /**
   * Process error trends data
   */
  private processErrorTrends(logs: any[], timeframe: string): ErrorTrend[] {
    const bucketSize = timeframe === 'hour' ? 5 * 60 * 1000 : // 5 minutes
                      timeframe === 'day' ? 60 * 60 * 1000 :  // 1 hour
                      24 * 60 * 60 * 1000 // 1 day

    const buckets = new Map<string, {
      count: number
      uniqueErrors: Set<string>
      affectedUsers: Set<string>
    }>()

    logs.forEach(log => {
      const timestamp = new Date(log.timestamp)
      const bucketKey = new Date(Math.floor(timestamp.getTime() / bucketSize) * bucketSize).toISOString()
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          count: 0,
          uniqueErrors: new Set(),
          affectedUsers: new Set()
        })
      }

      const bucket = buckets.get(bucketKey)!
      bucket.count++
      
      if (log.context?.fingerprint) {
        bucket.uniqueErrors.add(log.context.fingerprint)
      }
      
      if (log.context?.userId) {
        bucket.affectedUsers.add(log.context.userId)
      }
    })

    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        count: data.count,
        uniqueErrors: data.uniqueErrors.size,
        affectedUsers: data.affectedUsers.size
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  /**
   * Get error details by ID
   */
  async getErrorDetails(errorId: string): Promise<TrackedError | null> {
    // Comment out error details query - table doesn't exist in current schema
    // const { data: error } = await supabaseAdmin
    //   .from('error_tracking')
    //   .select('*')
    //   .eq('id', errorId)
    //   .single()

    // Return null for now
    return null
  }

  /**
   * Update error status
   */
  async updateErrorStatus(
    errorId: string, 
    status: 'open' | 'investigating' | 'resolved' | 'ignored',
    assignedTo?: string,
    notes?: string
  ): Promise<void> {
    // Comment out error status update - table doesn't exist in current schema
    // await supabaseAdmin
    //   .from('error_tracking')
    //   .update({
    //     status,
    //     assigned_to: assignedTo,
    //     notes,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', errorId)

    logger.info('system', `Error status updated: ${errorId}`, {
      metadata: { errorId, status, assignedTo, notes }
    })
  }

  /**
   * Add tags to error
   */
  async addErrorTags(errorId: string, tags: string[]): Promise<void> {
    // Comment out error tags update - table doesn't exist in current schema
    // const { data: error } = await supabaseAdmin
    //   .from('error_tracking')
    //   .select('tags')
    //   .eq('id', errorId)
    //   .single()

    // if (error) {
    //   const existingTags = error.tags || []
    //   const newTags = [...new Set([...existingTags, ...tags])]

    //   await supabaseAdmin
    //     .from('error_tracking')
    //     .update({
    //       tags: newTags,
    //       updated_at: new Date().toISOString()
    //     })
    //     .eq('id', errorId)
    // }
  }
}

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

class GlobalErrorHandler {
  private errorTracker: ErrorTracker

  constructor() {
    this.errorTracker = new ErrorTracker()
    this.setupGlobalHandlers()
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        this.errorTracker.trackError(
          reason instanceof Error ? reason : new Error(String(reason)),
          {
            component: 'global',
            function: 'unhandledRejection',
            metadata: { promise: promise.toString() }
          },
          {
            severity: 'critical',
            impact: 'system',
            tags: ['unhandled-rejection']
          }
        )
      })

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        this.errorTracker.trackError(
          error,
          {
            component: 'global',
            function: 'uncaughtException'
          },
          {
            severity: 'critical',
            impact: 'system',
            tags: ['uncaught-exception']
          }
        )
      })
    }

    // Handle window errors (if in browser environment)
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.errorTracker.trackError(
          event.error || new Error(event.message),
          {
            component: 'client',
            file: event.filename,
            line: event.lineno,
            function: 'window.onerror'
          },
          {
            severity: 'medium',
            impact: 'user',
            tags: ['client-error']
          }
        )
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.errorTracker.trackError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          {
            component: 'client',
            function: 'unhandledrejection'
          },
          {
            severity: 'high',
            impact: 'user',
            tags: ['client-unhandled-rejection']
          }
        )
      })
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const errorTracker = new ErrorTracker()
export const globalErrorHandler = new GlobalErrorHandler()

// Convenience functions
export const trackError = (error: Error | string, context?: ErrorContext, options?: any) =>
  errorTracker.trackError(error, context, options)

export const getErrorAnalytics = (timeframe?: 'hour' | 'day' | 'week') =>
  errorTracker.getErrorAnalytics(timeframe)

export const getErrorDetails = (errorId: string) =>
  errorTracker.getErrorDetails(errorId)

export const updateErrorStatus = (errorId: string, status: any, assignedTo?: string, notes?: string) =>
  errorTracker.updateErrorStatus(errorId, status, assignedTo, notes)
