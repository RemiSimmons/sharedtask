"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deduplicateRequest } from '@/lib/request-deduplication'

interface SystemHealth {
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

interface ApiEndpointHealth {
  endpoint: string
  method: string
  status: 'healthy' | 'slow' | 'error'
  responseTime: number
  successRate: number
  errorCount: number
  lastChecked: string
}

interface SystemMetrics {
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

interface AdminSystemMonitorProps {
  refreshInterval?: number
}

export default function AdminSystemMonitor({ refreshInterval = 120000 }: AdminSystemMonitorProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const fetchMetrics = async () => {
    try {
      setError(null)
      
      // Use deduplication to prevent excessive requests
      const data = await deduplicateRequest(
        'admin-system-metrics',
        async () => {
          const response = await fetch('/api/admin/monitoring?type=overview')
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json()
        },
        60000 // 1 minute cache
      )
      
      if (data.systemHealth) {
        setMetrics(data)
        setLastUpdated(new Date())
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch system metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Smart refresh: only refresh when page is visible and user is active
    let interval: NodeJS.Timeout
    let isVisible = true
    
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible) {
        fetchMetrics() // Refresh immediately when tab becomes visible
      }
    }
    
    const startInterval = () => {
      // DISABLED: Polling causing performance issues
      // if (interval) clearInterval(interval)
      // interval = setInterval(() => {
      //   if (isVisible) {
      //     fetchMetrics()
      //   }
      // }, refreshInterval)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    startInterval()
    
    return () => {
      // clearInterval(interval) // Commented out since interval is not being set
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // cleanup() removed - function no longer exists after refactoring
    }
  }, [refreshInterval])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'connected': return 'text-green-600 bg-green-100'
      case 'degraded': case 'slow': return 'text-yellow-600 bg-yellow-100'
      case 'critical': case 'error': case 'disconnected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'connected': return '✅'
      case 'degraded': case 'slow': return '⚠️'
      case 'critical': case 'error': case 'disconnected': return '❌'
      default: return '❓'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} GB`
    return `${bytes} MB`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          <strong>System Monitor Error:</strong> {error || 'No data available'}
          <button 
            onClick={fetchMetrics}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  const { systemHealth, apiPerformance, recentAlerts } = metrics

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">System Monitor</h2>
          <Badge className={getStatusColor(systemHealth.status)}>
            {getStatusIcon(systemHealth.status)} {systemHealth.status.toUpperCase()}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </div>
      </div>

      {/* Critical Alerts */}
      {recentAlerts.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription>
            <strong>Recent Alerts ({recentAlerts.length}):</strong>
            <div className="mt-2 space-y-1">
              {recentAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    alert.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></span>
                  {alert.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Status */}
            <Card className={`border-l-4 ${
              systemHealth.status === 'healthy' ? 'border-green-500' :
              systemHealth.status === 'degraded' ? 'border-yellow-500' :
              'border-red-500'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${
                      systemHealth.status === 'healthy' ? 'text-green-600' :
                      systemHealth.status === 'degraded' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {systemHealth.status.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uptime: {formatUptime(systemHealth.uptime)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    systemHealth.status === 'healthy' ? 'bg-green-100' :
                    systemHealth.status === 'degraded' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <span className="text-2xl">
                      {getStatusIcon(systemHealth.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Health */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {systemHealth.database.responseTime}ms
                    </p>
                    <p className="text-xs text-gray-500">
                      {systemHealth.database.connectionCount} connections
                    </p>
                  </div>
                  <Badge className={getStatusColor(systemHealth.database.status)}>
                    {systemHealth.database.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600">
                      {systemHealth.memory.percentage}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatBytes(systemHealth.memory.used)} / {formatBytes(systemHealth.memory.total)}
                    </span>
                  </div>
                  <Progress value={systemHealth.memory.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* CPU Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {systemHealth.cpu.percentage}%
                    </span>
                    <span className="text-xs text-gray-500">
                      Load: {systemHealth.cpu.loadAverage[0]?.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={systemHealth.cpu.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {systemHealth.errorRate}%
                </div>
                <p className="text-sm text-gray-500">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {systemHealth.activeConnections}
                </div>
                <p className="text-sm text-gray-500">Current sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-indigo-600">
                    {systemHealth.disk.percentage}%
                  </div>
                  <Progress value={systemHealth.disk.percentage} className="h-2" />
                  <p className="text-sm text-gray-500">
                    {formatBytes(systemHealth.disk.used)} / {formatBytes(systemHealth.disk.total)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {apiPerformance.summary.healthy}
                  </div>
                  <div className="text-sm text-gray-500">Healthy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {apiPerformance.summary.slow}
                  </div>
                  <div className="text-sm text-gray-500">Slow</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {apiPerformance.summary.error}
                  </div>
                  <div className="text-sm text-gray-500">Error</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {apiPerformance.summary.total}
                  </div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiPerformance.endpoints.length > 0 ? (
                  apiPerformance.endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {endpoint.method}
                        </Badge>
                        <span className="font-medium">{endpoint.endpoint}</span>
                        <Badge className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{endpoint.responseTime}ms</span>
                        <span>{endpoint.successRate}% success</span>
                        <span>{endpoint.errorCount} errors</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No endpoint data available. Endpoints will appear as they receive traffic.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
