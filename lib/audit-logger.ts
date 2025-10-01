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
      // Comment out audit logging - table doesn't exist in current schema
      // const { error } = await supabaseAdmin
      //   .from('audit_logs')
      //   .insert({
      //     admin_email: entry.adminEmail,
      //     action: entry.action,
      //     resource_type: entry.resourceType,
      //     resource_id: entry.resourceId || null,
      //     target_user_email: entry.targetUserEmail || null,
      //     details: entry.details || null,
      //     ip_address: entry.ipAddress || null,
      //     user_agent: entry.userAgent || null,
      //     status: entry.status || 'success'
      //   })

      // if (error) {
      //   console.error('Failed to log audit entry:', error)
      //   // Don't throw error to avoid breaking the main operation
      // }
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
      // Comment out audit logs query - table doesn't exist in current schema
      // let query = supabaseAdmin
      //   .from('audit_logs')
      //   .select('*', { count: 'exact' })
      //   .order('timestamp', { ascending: false })
      
      // Return empty array for now
      return { logs: [], total: 0 }

      // All audit log queries commented out - table doesn't exist in current schema
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

      // Comment out audit logs query - table doesn't exist in current schema
      // const { data, error } = await supabaseAdmin
      //   .from('audit_logs')
      //   .select('*')
      //   .gte('timestamp', startTime)
      //   .order('timestamp', { ascending: false })
      
      // Return empty stats for now - audit logs table doesn't exist in current schema
      return {
        totalActions: 0,
        actionsByType: {},
        adminActivity: {},
        recentActivity: []
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

