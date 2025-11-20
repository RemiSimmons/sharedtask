import { supabaseAdmin } from './supabase'
import { logger } from './logger'
import os from 'os'

// ============================================================================
// PRODUCTION SYSTEM MONITORING
// ============================================================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  timestamp: string
  database: {
    status: 'connected' | 'slow' | 'disconnected'
    responseTime: number
    connectionCount: number
    slowQueries: number
  }
  memory: {
    percentage: number
    used: number
    total: number
    available: number
  }
  cpu: {
    percentage: number
    loadAverage: number[]
  }
  disk: {
    percentage: number
    used: number
    total: number
    available: number
  }
  uptime: number
  activeConnections: number
  errorRate: number
}

export interface ApiEndpointHealth {
  endpoint: string
  method: string
  status: 'healthy' | 'slow' | 'error'
  responseTime: number
  successRate: number
  errorCount: number
  lastChecked: string
}

export interface SystemMetrics {
  systemHealth: SystemHealth
  apiPerformance: {
    summary: {
      healthy: number
      slow: number
      error: number
      total: number
    }
    endpoints: ApiEndpointHealth[]
  }
  recentAlerts: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: string
    resolved: boolean
  }>
}

class SystemMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null
  private lastHealthCheck: SystemHealth | null = null
  private lastHealthCheckTime: number = 0
  private healthCheckCacheMs: number = 60000 // Cache health checks for 1 minute

  /**
   * Get current system health metrics
   * Uses caching to prevent excessive database queries
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Return cached result if available and recent
      const now = Date.now()
      if (this.lastHealthCheck && (now - this.lastHealthCheckTime) < this.healthCheckCacheMs) {
        return this.lastHealthCheck
      }

      // Get memory and CPU stats immediately (no DB queries)
      const [memoryStats, cpuStats, diskStats] = await Promise.all([
        this.getMemoryStats(),
        this.getCpuStats(),
        this.getDiskStats()
      ])

      // Database health check (lightweight query)
      const databaseHealth = await this.checkDatabaseHealth()

      // Only calculate error rate and connections if cache expired
      // These are the most expensive operations
      const [errorRate, activeConnections] = await Promise.all([
        this.calculateErrorRate(),
        this.getActiveConnections()
      ])

      const systemHealth: SystemHealth = {
        status: this.determineOverallStatus(databaseHealth, memoryStats, cpuStats, errorRate),
        timestamp: new Date().toISOString(),
        database: databaseHealth,
        memory: memoryStats,
        cpu: cpuStats,
        disk: diskStats,
        uptime: process.uptime(),
        activeConnections,
        errorRate
      }

      this.lastHealthCheck = systemHealth
      this.lastHealthCheckTime = now
      return systemHealth

    } catch (error) {
      logger.error('system', 'Failed to get system health', { error: error instanceof Error ? error.message : String(error) })
      
      return {
        status: 'critical',
        timestamp: new Date().toISOString(),
        database: { status: 'disconnected', responseTime: 0, connectionCount: 0, slowQueries: 0 },
        memory: { percentage: 0, used: 0, total: 0, available: 0 },
        cpu: { percentage: 0, loadAverage: [0, 0, 0] },
        disk: { percentage: 0, used: 0, total: 0, available: 0 },
        uptime: 0,
        activeConnections: 0,
        errorRate: 100
      }
    }
  }

  /**
   * Check database health and performance
   */
  private async checkDatabaseHealth(): Promise<SystemHealth['database']> {
    const startTime = Date.now()
    
    try {
      // Test database connection with a simple query
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        throw error
      }

      // Check for slow queries (get recent slow operations)
      const slowQueriesCount = await this.getSlowQueriesCount()

      // Estimate connection count (this is approximate)
      const connectionCount = await this.estimateConnectionCount()

      return {
        status: responseTime < 100 ? 'connected' : responseTime < 500 ? 'slow' : 'disconnected',
        responseTime,
        connectionCount,
        slowQueries: slowQueriesCount
      }

    } catch (error) {
      logger.error('system', 'Database health check failed', { error: error instanceof Error ? error.message : String(error) })
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        connectionCount: 0,
        slowQueries: 0
      }
    }
  }

  /**
   * Get memory usage statistics
   */
  private async getMemoryStats(): Promise<SystemHealth['memory']> {
    try {
      const memUsage = process.memoryUsage()
      
      // Convert bytes to MB
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024)
      const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024)
      
      // Get actual memory limit (for serverless environments like Vercel)
      // Vercel sets AWS_LAMBDA_FUNCTION_MEMORY_SIZE or we can use NODE_OPTIONS
      // Default to 1024 MB (1GB) for Hobby plan, or detect from environment
      let actualMemoryLimitMB = 1024 // Default 1GB
      
      // Try to detect memory limit from environment
      if (process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) {
        actualMemoryLimitMB = parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) || 1024
      } else if (process.env.VERCEL) {
        // Vercel Hobby: 1024MB, Pro: 3008MB, Enterprise: varies
        // Check if we can detect from NODE_OPTIONS
        const nodeOptions = process.env.NODE_OPTIONS || ''
        const maxOldSpaceMatch = nodeOptions.match(/--max-old-space-size=(\d+)/)
        if (maxOldSpaceMatch) {
          actualMemoryLimitMB = parseInt(maxOldSpaceMatch[1]) || 1024
        } else {
          // Default based on Vercel plan (conservative estimate)
          actualMemoryLimitMB = 1024
        }
      } else {
        // For local development or other environments, use heapTotal as fallback
        // but cap at reasonable limit to avoid false high percentages
        actualMemoryLimitMB = Math.max(heapTotal, 512) // At least 512MB
      }
      
      // Use the larger of heapTotal or actual limit to avoid false high percentages
      const total = Math.max(heapTotal, actualMemoryLimitMB)
      const used = heapUsed
      const available = total - used
      
      // Calculate percentage based on actual limit, not just heapTotal
      // This prevents false high percentages when heapTotal is small
      const percentage = Math.min(Math.round((used / total) * 100), 100)

      return {
        percentage,
        used,
        total,
        available
      }
    } catch (error) {
      return { percentage: 0, used: 0, total: 0, available: 0 }
    }
  }

  /**
   * Get CPU usage statistics
   */
  private async getCpuStats(): Promise<SystemHealth['cpu']> {
    try {
      // Get load average (Unix-like systems)
      const loadAverage = typeof (process as any).loadavg === 'function' ? (process as any).loadavg() : [0, 0, 0]
      
      // Estimate CPU percentage based on load average
      const cpuCount = typeof process.env.CPU_COUNT !== 'undefined' ? parseInt(process.env.CPU_COUNT) : 1
      const percentage = Math.min(Math.round((loadAverage[0] / cpuCount) * 100), 100)

      return {
        percentage,
        loadAverage
      }
    } catch (error) {
      return { percentage: 0, loadAverage: [0, 0, 0] }
    }
  }

  /**
   * Get disk usage statistics
   */
  private async getDiskStats(): Promise<SystemHealth['disk']> {
    try {
      // For serverless environments, we'll use approximate values
      // In a real server environment, you'd use fs.statSync or similar
      const used = 512 // MB - approximate
      const total = 2048 // MB - approximate
      const available = total - used
      const percentage = Math.round((used / total) * 100)

      return {
        percentage,
        used,
        total,
        available
      }
    } catch (error) {
      return { percentage: 0, used: 0, total: 0, available: 0 }
    }
  }

  /**
   * Calculate current error rate from logs
   * Optimized to use a single query with better performance
   */
  private async calculateErrorRate(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      // Use a single query with aggregation instead of two separate queries
      // This reduces database load
      const { data, error } = await supabaseAdmin
        .from('application_logs')
        .select('level', { count: 'exact' })
        .gte('timestamp', oneHourAgo)

      if (error || !data) {
        return 0
      }

      const totalRequests = data.length
      const errorRequests = data.filter((log: any) => log.level === 'error').length

      return totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 100) : 0

    } catch (error) {
      return 0
    }
  }

  /**
   * Get active connections estimate
   */
  private async getActiveConnections(): Promise<number> {
    try {
      // Estimate based on recent activity
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { count } = await supabaseAdmin
        .from('application_logs')
        .select('*', { count: 'exact' })
        .gte('timestamp', fiveMinutesAgo)

      return Math.min(count || 0, 100) // Cap at reasonable number
    } catch (error) {
      return 0
    }
  }

  /**
   * Get slow queries count
   */
  private async getSlowQueriesCount(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { count } = await supabaseAdmin
        .from('application_logs')
        .select('*', { count: 'exact' })
        .contains('context', { slow_query: true })
        .gte('timestamp', oneHourAgo)

      return count || 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Estimate connection count
   */
  private async estimateConnectionCount(): Promise<number> {
    try {
      // This is an approximation - in production you'd query actual connection pools
      const activeUsers = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .then(({ count }: { count: any }) => count || 0)

      // Estimate 10% of users are active at any time
      return Math.max(Math.round(activeUsers * 0.1), 1)
    } catch (error) {
      return 1
    }
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(
    database: SystemHealth['database'],
    memory: SystemHealth['memory'],
    cpu: SystemHealth['cpu'],
    errorRate: number
  ): 'healthy' | 'degraded' | 'critical' {
    // Critical conditions
    if (
      database.status === 'disconnected' ||
      memory.percentage > 90 ||
      cpu.percentage > 90 ||
      errorRate > 50
    ) {
      return 'critical'
    }

    // Degraded conditions
    if (
      database.status === 'slow' ||
      database.responseTime > 200 ||
      memory.percentage > 75 ||
      cpu.percentage > 75 ||
      errorRate > 10
    ) {
      return 'degraded'
    }

    return 'healthy'
  }

  /**
   * Get API endpoint performance
   * Optimized to reduce data fetched and improve performance
   */
  async getApiPerformance(): Promise<SystemMetrics['apiPerformance']> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Get endpoint performance from logs - only fetch necessary fields
      // Reduced limit from 1000 to 500 to improve performance
      const { data: logs } = await supabaseAdmin
        .from('application_logs')
        .select('endpoint, method, level, response_time, timestamp')
        .gte('timestamp', oneHourAgo)
        .not('endpoint', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(500)

      const endpointStats = new Map<string, {
        totalRequests: number
        errorCount: number
        totalResponseTime: number
        lastChecked: string
      }>()

      // Process logs to calculate endpoint stats
      logs?.forEach((log: any) => {
        const endpoint = log.endpoint || 'unknown'
        const method = log.method || 'GET'
        const key = `${method} ${endpoint}`

        if (!endpointStats.has(key)) {
          endpointStats.set(key, {
            totalRequests: 0,
            errorCount: 0,
            totalResponseTime: 0,
            lastChecked: log.timestamp
          })
        }

        const stats = endpointStats.get(key)!
        stats.totalRequests++
        stats.totalResponseTime += log.response_time || 0
        stats.lastChecked = log.timestamp

        if (log.level === 'error') {
          stats.errorCount++
        }
      })

      // Convert to endpoint health objects
      const endpoints: ApiEndpointHealth[] = Array.from(endpointStats.entries()).map(([key, stats]) => {
        const [method, endpoint] = key.split(' ', 2)
        const avgResponseTime = stats.totalRequests > 0 ? stats.totalResponseTime / stats.totalRequests : 0
        const successRate = stats.totalRequests > 0 ? ((stats.totalRequests - stats.errorCount) / stats.totalRequests) * 100 : 100

        return {
          endpoint,
          method,
          status: avgResponseTime < 200 && successRate > 95 ? 'healthy' : 
                  avgResponseTime < 1000 && successRate > 80 ? 'slow' : 'error',
          responseTime: Math.round(avgResponseTime),
          successRate: Math.round(successRate),
          errorCount: stats.errorCount,
          lastChecked: stats.lastChecked
        }
      })

      // Calculate summary
      const summary = {
        healthy: endpoints.filter(e => e.status === 'healthy').length,
        slow: endpoints.filter(e => e.status === 'slow').length,
        error: endpoints.filter(e => e.status === 'error').length,
        total: endpoints.length
      }

      return { summary, endpoints }

    } catch (error) {
      logger.error('system', 'Failed to get API performance', { error: error instanceof Error ? error.message : String(error) })
      return {
        summary: { healthy: 0, slow: 0, error: 0, total: 0 },
        endpoints: []
      }
    }
  }

  /**
   * Get recent system alerts
   */
  async getRecentAlerts(): Promise<SystemMetrics['recentAlerts']> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data: alertLogs } = await supabaseAdmin
        .from('application_logs')
        .select('*')
        .in('level', ['error', 'warn'])
        .gte('timestamp', oneHourAgo)
        .order('timestamp', { ascending: false })
        .limit(10)

      return alertLogs?.map((log: any) => ({
        id: log.id,
        type: log.level === 'error' ? 'error' : 'warning' as const,
        message: log.message,
        timestamp: log.timestamp,
        resolved: false // You could add resolution tracking
      })) || []

    } catch (error) {
      return []
    }
  }

  /**
   * Get complete system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [systemHealth, apiPerformance, recentAlerts] = await Promise.all([
      this.getSystemHealth(),
      this.getApiPerformance(),
      this.getRecentAlerts()
    ])

    return {
      systemHealth,
      apiPerformance,
      recentAlerts
    }
  }

  /**
   * Start continuous health monitoring
   */
  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getSystemHealth()
      } catch (error) {
        logger.error('system', 'Health monitoring check failed', { error: error instanceof Error ? error.message : String(error) })
      }
    }, intervalMs)

    logger.info('system', 'Health monitoring started', { intervalMs })
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      logger.info('system', 'Health monitoring stopped')
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const systemMonitor = new SystemMonitor()

// DISABLED: Auto-start monitoring was causing performance issues
// The monitoring should be triggered on-demand via API calls, not continuously
// This prevents excessive database queries and memory usage
// if (process.env.NODE_ENV === 'production') {
//   systemMonitor.startHealthMonitoring(30000) // Check every 30 seconds in production
// }

