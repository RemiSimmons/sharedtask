import { supabaseAdmin } from './supabase'
import { NextRequest } from 'next/server'

export interface AuditLogEntry {
  adminEmail: string
  action: string
  resourceType: string
  resourceId?: string
  targetUserEmail?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failed' | 'error'
}

export class AuditLogger {
  /**
   * Log an admin action to the audit trail
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Log to admin_access_logs table (created via security-audit-admin-logs-migration.sql)
      const { error } = await supabaseAdmin
        .from('admin_access_logs')
        .insert({
          admin_email: entry.adminEmail,
          action: entry.action,
          resource: entry.resourceType,
          resource_id: entry.resourceId || null,
          target_user_email: entry.targetUserEmail || null,
          metadata: entry.details || {},
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
          success: entry.status !== 'failed' && entry.status !== 'error',
          error_message: entry.status === 'failed' || entry.status === 'error' ? JSON.stringify(entry.details) : null
        })

      if (error) {
        console.error('Failed to log audit entry:', error)
        // Don't throw error to avoid breaking the main operation
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Create audit log entry from NextRequest
   */
  static createEntry(
    adminEmail: string,
    action: string,
    resourceType: string,
    request?: NextRequest,
    additionalData?: Partial<AuditLogEntry>
  ): AuditLogEntry {
    return {
      adminEmail,
      action,
      resourceType,
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      ...additionalData
    }
  }

  /**
   * Log user management actions
   */
  static async logUserAction(
    adminEmail: string,
    action: 'verify_user' | 'suspend_user' | 'activate_user' | 'reset_password' | 'delete_user',
    targetUserEmail: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(adminEmail, action, 'user', request, {
      targetUserEmail,
      details
    })
    await this.log(entry)
  }

  /**
   * Log system actions
   */
  static async logSystemAction(
    adminEmail: string,
    action: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(adminEmail, action, 'system', request, {
      details
    })
    await this.log(entry)
  }

  /**
   * Log project management actions
   */
  static async logProjectAction(
    adminEmail: string,
    action: string,
    projectId: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(adminEmail, action, 'project', request, {
      resourceId: projectId,
      details
    })
    await this.log(entry)
  }

  /**
   * Log data export actions
   */
  static async logDataExport(
    adminEmail: string,
    exportType: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(adminEmail, `export_${exportType}`, 'data', request, {
      details
    })
    await this.log(entry)
  }

  /**
   * Log authentication events
   */
  static async logAuthAction(
    adminEmail: string,
    action: 'login' | 'logout' | 'access_denied',
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(adminEmail, action, 'auth', request, {
      details
    })
    await this.log(entry)
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getLogs(filters: {
    adminEmail?: string
    action?: string
    resourceType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  } = {}): Promise<{
    logs: any[]
    total: number
  }> {
    try {
      // Query admin_access_logs table
      let query = supabaseAdmin
        .from('admin_access_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (filters.adminEmail) {
        query = query.eq('admin_email', filters.adminEmail)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.resourceType) {
        query = query.eq('resource', filters.resourceType)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error querying admin_access_logs:', error)
        return { logs: [], total: 0 }
      }

      return { 
        logs: data || [], 
        total: count || 0 
      }
    } catch (error) {
      console.error('Error in getLogs:', error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalActions: number
    actionsByType: Record<string, number>
    adminActivity: Record<string, number>
    recentActivity: any[]
  }> {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      // Query admin_access_logs table
      const { data, error } = await supabaseAdmin
        .from('admin_access_logs')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error querying admin_access_logs for stats:', error)
        return {
          totalActions: 0,
          actionsByType: {},
          adminActivity: {},
          recentActivity: []
        }
      }

      const logs = data || []

      // Calculate statistics
      const actionsByType: Record<string, number> = {}
      const adminActivity: Record<string, number> = {}

      logs.forEach(log => {
        // Count by action type
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
        
        // Count by admin
        adminActivity[log.admin_email] = (adminActivity[log.admin_email] || 0) + 1
      })

      return {
        totalActions: logs.length,
        actionsByType,
        adminActivity,
        recentActivity: logs.slice(0, 10).map(log => ({
          action: log.action,
          admin: log.admin_email,
          success: log.success,
          timestamp: log.created_at
        }))
      }
    } catch (error) {
      console.error('Error in getStats:', error)
      return {
        totalActions: 0,
        actionsByType: {},
        adminActivity: {},
        recentActivity: []
      }
    }
  }
}

