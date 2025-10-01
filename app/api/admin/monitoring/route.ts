import { NextRequest, NextResponse } from 'next/server'
import { logAnalytics } from '@/lib/log-analytics'
import { systemMonitor } from '@/lib/system-monitor'
import { withAdminAccess } from '@/lib/admin-access-control'

async function monitoringHandler(request: NextRequest, adminUser: any) {
  try {
    // Admin access is already verified by withAdminAccess wrapper
    
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') as 'hour' | 'day' | 'week') || 'day'
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        // Get real system metrics and analytics
        const [systemMetrics, errorAnalytics, performanceAnalytics, securityAnalytics] = await Promise.all([
          systemMonitor.getSystemMetrics(),
          logAnalytics.getErrorAnalytics(timeframe),
          logAnalytics.getPerformanceAnalytics(timeframe),
          logAnalytics.getSecurityAnalytics(timeframe)
        ])

        return NextResponse.json({
          timeframe,
          // Real system health data
          systemHealth: systemMetrics.systemHealth,
          apiPerformance: systemMetrics.apiPerformance,
          recentAlerts: systemMetrics.recentAlerts,
          // Analytics overview
          overview: {
            errors: {
              topErrors: errorAnalytics.topErrors.slice(0, 5),
              errorRates: errorAnalytics.errorRates.slice(0, 5)
            },
            performance: {
              slowEndpoints: performanceAnalytics.slowEndpoints.slice(0, 5),
              avgResponseTime: performanceAnalytics.performanceTrends[0]?.avg_response_time || 0
            },
            security: {
              recentEvents: securityAnalytics.securityEvents.slice(0, 5),
              topThreats: securityAnalytics.topThreats.slice(0, 3)
            }
          }
        })

      case 'system':
        // Get detailed system metrics
        const detailedMetrics = await systemMonitor.getSystemMetrics()
        return NextResponse.json({
          timeframe,
          system: detailedMetrics
        })

      case 'errors':
        const errorData = await logAnalytics.getErrorAnalytics(timeframe)
        return NextResponse.json({
          timeframe,
          errors: errorData
        })

      case 'performance':
        const perfData = await logAnalytics.getPerformanceAnalytics(timeframe)
        return NextResponse.json({
          timeframe,
          performance: perfData
        })

      case 'security':
        const securityData = await logAnalytics.getSecurityAnalytics(timeframe)
        return NextResponse.json({
          timeframe,
          security: securityData
        })

      case 'logs':
        const limit = parseInt(searchParams.get('limit') || '50')
        const level = searchParams.getAll('level')
        const category = searchParams.getAll('category')
        const search = searchParams.get('search') || undefined

        const logsData = await logAnalytics.queryLogs({
          level: level.length > 0 ? level : undefined,
          category: category.length > 0 ? category : undefined,
          search,
          limit,
          startTime: new Date(Date.now() - (timeframe === 'hour' ? 60 * 60 * 1000 : 
                                           timeframe === 'day' ? 24 * 60 * 60 * 1000 : 
                                           7 * 24 * 60 * 60 * 1000))
        })

        return NextResponse.json({
          timeframe,
          logs: logsData
        })

      case 'search':
        const searchTerm = searchParams.get('q')
        if (!searchTerm) {
          return NextResponse.json({ error: 'Search term required' }, { status: 400 })
        }

        const searchResults = await logAnalytics.searchLogs(searchTerm, {
          limit: parseInt(searchParams.get('limit') || '50'),
          category: searchParams.getAll('category'),
          level: searchParams.getAll('level'),
          timeframe
        })

        return NextResponse.json({
          timeframe,
          searchTerm,
          results: searchResults
        })

      case 'request':
        const requestId = searchParams.get('requestId')
        if (!requestId) {
          return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
        }

        const requestLogs = await logAnalytics.getRequestLogs(requestId)

        return NextResponse.json({
          requestId,
          logs: requestLogs
        })

      default:
        return NextResponse.json({ error: 'Invalid monitoring type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAccess(monitoringHandler, 'system.monitoring')
