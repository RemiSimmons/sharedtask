import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// ADMIN ROLE DEFINITIONS
// ============================================================================

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AdminAccessLog {
  action: string
  resource: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

// ============================================================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  super_admin: 2
}

const ADMIN_PERMISSIONS = {
  // Error Management
  'error_management.view': ['admin', 'super_admin'],
  'error_management.update': ['admin', 'super_admin'],
  'error_management.delete': ['super_admin'],
  
  // System Diagnostics
  'system.diagnostics': ['admin', 'super_admin'],
  'system.monitoring': ['admin', 'super_admin'],
  'system.logs': ['admin', 'super_admin'],
  
  // User Management
  'users.view': ['admin', 'super_admin'],
  'users.manage': ['super_admin'],
  'users.promote': ['super_admin'],
  
  // Admin Management
  'admin.create': ['super_admin'],
  'admin.revoke': ['super_admin'],
  'admin.audit': ['super_admin'],
  
  // Project Management
  'projects.view_all': ['admin', 'super_admin'],
  'projects.manage_all': ['super_admin'],
  
  // Analytics & Reports
  'analytics.view': ['admin', 'super_admin'],
  'analytics.export': ['super_admin'],
} as const

type Permission = keyof typeof ADMIN_PERMISSIONS

// ============================================================================
// CORE ACCESS CONTROL FUNCTIONS
// ============================================================================

/**
 * Get user with role information
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user.role as UserRole) || 'user'
    }
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = ADMIN_PERMISSIONS[permission]
  return allowedRoles.includes(userRole as any)
}

/**
 * Check if user has admin privileges (admin or super_admin)
 */
export function isAdmin(userRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY.admin
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'super_admin'
}

/**
 * Compare role hierarchy (returns true if role1 >= role2)
 */
export function hasRoleLevel(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

// ============================================================================
// MIDDLEWARE & GUARDS
// ============================================================================

/**
 * Admin authentication middleware
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean
  user?: AdminUser
  response?: NextResponse
}> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'You must be signed in to access admin features.'
          }, 
          { status: 401 }
        )
      }
    }

    const adminUser = await getAdminUser(session.user.id)
    
    if (!adminUser || !isAdmin(adminUser.role)) {
      // Log unauthorized access attempt
      await logAdminAccess(session.user.id, {
        action: 'unauthorized_access_attempt',
        resource: request.nextUrl.pathname,
        success: false,
        errorMessage: 'Insufficient privileges',
        metadata: {
          userRole: adminUser?.role || 'unknown',
          requiredRole: 'admin',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent')
        }
      })

      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Access denied',
            message: 'You do not have permission to access this resource. Admin privileges required.',
            code: 'INSUFFICIENT_PRIVILEGES'
          }, 
          { status: 403 }
        )
      }
    }

    return {
      success: true,
      user: adminUser
    }
  } catch (error) {
    console.error('Admin authentication error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Permission-based access control
 */
export async function requirePermission(
  request: NextRequest, 
  permission: Permission
): Promise<{
  success: boolean
  user?: AdminUser
  response?: NextResponse
}> {
  const adminCheck = await requireAdmin(request)
  
  if (!adminCheck.success) {
    return adminCheck
  }

  const user = adminCheck.user!
  
  if (!hasPermission(user.role, permission)) {
    // Log permission denied
    await logAdminAccess(user.id, {
      action: 'permission_denied',
      resource: request.nextUrl.pathname,
      success: false,
      errorMessage: `Permission denied: ${permission}`,
      metadata: {
        userRole: user.role,
        requiredPermission: permission,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })

    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Permission denied',
          message: `You do not have the required permission: ${permission}`,
          code: 'PERMISSION_DENIED',
          requiredPermission: permission
        }, 
        { status: 403 }
      )
    }
  }

  return {
    success: true,
    user
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log admin access for security auditing
 */
export async function logAdminAccess(
  userId: string,
  logData: AdminAccessLog,
  request?: NextRequest
): Promise<void> {
  try {
    // Get user email for logging
    const user = await getAdminUser(userId)
    if (!user) {
      console.warn('Cannot log admin access: user not found')
      return
    }

    const logEntry = {
      admin_email: user.email,
      action: logData.action,
      resource: logData.resource,
      resource_id: logData.metadata?.resourceId || null,
      target_user_email: logData.metadata?.targetEmail || null,
      success: logData.success,
      error_message: logData.errorMessage || null,
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null,
      user_agent: request?.headers.get('user-agent') || null,
      metadata: logData.metadata || {}
    }

    // Log to admin_access_logs table (created via security-audit-admin-logs-migration.sql)
    await supabaseAdmin
      .from('admin_access_logs')
      .insert(logEntry)

  } catch (error) {
    // Never let audit logging break the application
    console.error('Failed to log admin access:', error)
  }
}

/**
 * Higher-order function to wrap admin routes with access control
 */
export function withAdminAccess(
  handler: (request: NextRequest, user: AdminUser) => Promise<NextResponse>,
  permission?: Permission
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check admin access or specific permission
      const accessCheck = permission 
        ? await requirePermission(request, permission)
        : await requireAdmin(request)

      if (!accessCheck.success) {
        return accessCheck.response!
      }

      const user = accessCheck.user!

      // Log successful access
      await logAdminAccess(user.id, {
        action: permission || 'admin_access',
        resource: request.nextUrl.pathname,
        success: true,
        metadata: {
          method: request.method,
          userRole: user.role,
          permission: permission || 'admin'
        }
      }, request)

      // Call the actual handler
      return await handler(request, user)

    } catch (error) {
      console.error('Admin route error:', error)
      
      // Log the error if we have user context
      const session = await auth()
      if (session?.user?.id) {
        await logAdminAccess(session.user.id, {
          action: 'admin_route_error',
          resource: request.nextUrl.pathname,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        }, request)
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// ============================================================================
// ADMIN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Promote user to admin role
 */
export async function promoteToAdmin(
  targetUserId: string,
  newRole: 'admin' | 'super_admin',
  promotedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the promoter has super_admin privileges
    const promoter = await getAdminUser(promotedBy)
    if (!promoter || !isSuperAdmin(promoter.role)) {
      return { success: false, error: 'Only super admins can promote users' }
    }

    // Get target user
    const targetUser = await getAdminUser(targetUserId)
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Update user role
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (error) {
      throw error
    }

    // Log the promotion
    await logAdminAccess(promotedBy, {
      action: 'user_promoted',
      resource: 'admin_management',
      success: true,
      metadata: {
        targetUserId,
        targetEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole,
        promotedBy: promoter.email
      }
    })

    return { success: true }

  } catch (error) {
    console.error('Error promoting user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Revoke admin privileges
 */
export async function revokeAdminAccess(
  targetUserId: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the revoker has super_admin privileges
    const revoker = await getAdminUser(revokedBy)
    if (!revoker || !isSuperAdmin(revoker.role)) {
      return { success: false, error: 'Only super admins can revoke admin access' }
    }

    // Prevent self-revocation
    if (targetUserId === revokedBy) {
      return { success: false, error: 'Cannot revoke your own admin access' }
    }

    // Get target user
    const targetUser = await getAdminUser(targetUserId)
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Update user role to regular user
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: 'user' })
      .eq('id', targetUserId)

    if (error) {
      throw error
    }

    // Log the revocation
    await logAdminAccess(revokedBy, {
      action: 'admin_access_revoked',
      resource: 'admin_management',
      success: true,
      metadata: {
        targetUserId,
        targetEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole: 'user',
        revokedBy: revoker.email
      }
    })

    return { success: true }

  } catch (error) {
    console.error('Error revoking admin access:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get admin access logs for auditing
 */
export async function getAdminAccessLogs(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    userId?: string
    action?: string
    success?: boolean
    dateFrom?: string
    dateTo?: string
  }
): Promise<{
  logs: any[]
  total: number
}> {
  try {
    let query = supabaseAdmin
      .from('admin_access_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
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
    console.error('Error fetching admin access logs:', error)
    return { logs: [], total: 0 }
  }
}

