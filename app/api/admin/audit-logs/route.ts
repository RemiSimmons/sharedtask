import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.email !== 'contact@remisimmons.com') {
      await AuditLogger.logAuthAction(
        session?.user?.email || 'unknown',
        'access_denied',
        request,
        { endpoint: '/api/admin/audit-logs', reason: 'not_admin' }
      )
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const filters = {
      adminEmail: searchParams.get('adminEmail') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }

    // Get audit logs
    const result = await AuditLogger.getLogs(filters)

    // Log the audit log access
    await AuditLogger.logSystemAction(
      session.user.email,
      'view_audit_logs',
      request,
      { filters, resultCount: result.logs.length }
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.email !== 'contact@remisimmons.com') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, timeframe } = body

    if (action === 'get_stats') {
      const stats = await AuditLogger.getStats(timeframe || '24h')
      
      // Log the stats access
      await AuditLogger.logSystemAction(
        session.user.email,
        'view_audit_stats',
        request,
        { timeframe }
      )

      return NextResponse.json(stats)
    }

    if (action === 'export') {
      const { format = 'csv', ...exportFilters } = body
      
      // Get all logs for export (no pagination)
      const result = await AuditLogger.getLogs({
        ...exportFilters,
        limit: 10000 // Large limit for export
      })

      // Log the export action
      await AuditLogger.logDataExport(
        session.user.email,
        'audit_logs',
        request,
        { format, filters: exportFilters, recordCount: result.logs.length }
      )

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Timestamp',
          'Admin Email',
          'Action',
          'Resource Type',
          'Resource ID',
          'Target User',
          'Status',
          'IP Address',
          'Details'
        ]

        const csvRows = [
          headers.join(','),
          ...result.logs.map(log => [
            new Date(log.timestamp).toISOString(),
            log.admin_email,
            log.action,
            log.resource_type,
            log.resource_id || '',
            log.target_user_email || '',
            log.status,
            log.ip_address || '',
            JSON.stringify(log.details || {}).replace(/"/g, '""')
          ].map(field => `"${field}"`).join(','))
        ]

        return NextResponse.json({
          data: csvRows.join('\n'),
          filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        })
      }

      // Return JSON format
      return NextResponse.json({
        data: result.logs,
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.json`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in audit logs POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

