/**
 * Admin Action Logger
 * Logs all admin actions to admin_access_logs table for security auditing
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface AdminLogEntry {
  adminEmail: string
  action: string
  resource: string
  resourceId?: string
  targetUserEmail?: string
  ipAddress?: string
  userAgent?: string
  success?: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Log an admin action to the database
 * This creates an immutable audit trail of all admin activities
 */
export async function logAdminAction(entry: AdminLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('admin_access_logs')
      .insert({
        admin_email: entry.adminEmail,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId || null,
        target_user_email: entry.targetUserEmail || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        success: entry.success ?? true,
        error_message: entry.errorMessage || null,
        metadata: entry.metadata || {}
      })

    if (error) {
      console.error('Failed to log admin action:', error)
      // Don't throw - logging failure shouldn't break the operation
    }
  } catch (error) {
    console.error('Error in logAdminAction:', error)
    // Never let audit logging break the application
  }
}

/**
 * Get admin action logs with filtering and pagination
 */
export async function getAdminLogs(options: {
  limit?: number
  offset?: number
  adminEmail?: string
  action?: string
  success?: boolean
  startDate?: string
  endDate?: string
}) {
  try {
    let query = supabaseAdmin
      .from('admin_access_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options.adminEmail) {
      query = query.eq('admin_email', options.adminEmail)
    }

    if (options.action) {
      query = query.eq('action', options.action)
    }

    if (options.success !== undefined) {
      query = query.eq('success', options.success)
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate)
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      logs: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching admin logs:', error)
    return {
      logs: [],
      total: 0
    }
  }
}

/**
 * Get admin action statistics
 */
export async function getAdminLogStats(timeframe: '24h' | '7d' | '30d' = '24h') {
  try {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
    }

    const { data, error } = await supabaseAdmin
      .from('admin_access_logs')
      .select('action, success, admin_email, created_at')
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw error
    }

    // Calculate statistics
    const stats = {
      totalActions: data.length,
      successfulActions: data.filter(log => log.success).length,
      failedActions: data.filter(log => !log.success).length,
      uniqueAdmins: new Set(data.map(log => log.admin_email)).size,
      actionsByType: data.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      adminActivity: data.reduce((acc, log) => {
        acc[log.admin_email] = (acc[log.admin_email] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentActivity: data.slice(0, 10).map(log => ({
        action: log.action,
        admin: log.admin_email,
        success: log.success,
        timestamp: log.created_at
      }))
    }

    return stats
  } catch (error) {
    console.error('Error fetching admin log stats:', error)
    return null
  }
}

/**
 * Helper function to extract IP and User Agent from Next.js request
 */
export function getRequestInfo(request: Request) {
  const headers = new Headers(request.headers)
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown'
  }
}

