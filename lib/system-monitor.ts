import { supabaseAdmin } from './supabase'
import { logger } from './logger'

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

  /**
   * Get current system health metrics
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const [databaseHealth, memoryStats, cpuStats, diskStats] = await Promise.all([
        this.checkDatabaseHealth(),
        this.getMemoryStats(),
        this.getCpuStats(),
        this.getDiskStats()
      ])

      const errorRate = await this.calculateErrorRate()
      const activeConnections = await this.getActiveConnections()

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
      const used = Math.round(memUsage.heapUsed / 1024 / 1024)
      const total = Math.round(memUsage.heapTotal / 1024 / 1024)
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
   */
  private async calculateErrorRate(): Promise<number> {
    try {
      // Temporarily return 0 until application_logs table is implemented
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get active connections estimate
   */
  private async getActiveConnections(): Promise<number> {
    try {
      // Temporarily return 0 until application_logs table is implemented
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get slow queries count
   */
  private async getSlowQueriesCount(): Promise<number> {
    try {
      // Temporarily return 0 until application_logs table is implemented
      return 0
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
        .then(({ count }) => count || 0)

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
   */
  async getApiPerformance(): Promise<SystemMetrics['apiPerformance']> {
    try {
      // Temporarily return empty data until application_logs table is implemented
      return {
        summary: { healthy: 0, slow: 0, error: 0, total: 0 },
        endpoints: []
      }
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
      // Temporarily return empty array until application_logs table is implemented
      return []
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

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  systemMonitor.startHealthMonitoring(30000) // Check every 30 seconds in production
}

