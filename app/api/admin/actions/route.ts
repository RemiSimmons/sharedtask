import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'
import { isAdminUser } from '@/lib/admin'
import { adminActionSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function POST(request: NextRequest) {
  // Check if user is authenticated and is admin
  const session = await auth()
  
  if (!session || !session.user?.email || !isAdminUser(session.user)) {
    await AuditLogger.logAuthAction(
      session?.user?.email || 'unknown',
      'access_denied',
      request,
      { endpoint: '/api/admin/actions', reason: 'not_admin' }
    )
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    )
  }
  try {
    // Validate request with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: adminActionSchema,
      rateLimit: {
        identifier: session.user.email,
        maxRequests: 20, // 20 admin actions per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024,
    })

    if (!validation.success) {
      return validation.response
    }

    const { action, params } = validation.data.body!

    switch (action) {
      case 'export_users':
        return await exportUsers(session.user!.email!, request)
      
      case 'export_projects':
        return await exportProjects(session.user!.email!, request)
      
      case 'clear_cache':
        return await clearCache(session.user!.email!, request)
      
      case 'system_health':
        return await getSystemHealth(session.user!.email!, request)
      
      case 'verify_user':
        if (!params?.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        return await verifyUser(params.userId, session.user!.email!, request)
      
      case 'suspend_user':
        if (!params?.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        return await suspendUser(params.userId, session.user!.email!, request)
      
      case 'activate_user':
        if (!params?.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        return await activateUser(params.userId, session.user!.email!, request)
      
      case 'reset_user_password':
        if (!params?.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        return await resetUserPassword(params.userId, session.user!.email!, request)
      
      case 'delete_user':
        if (!params?.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        return await deleteUser(params.userId, session.user!.email!, request)
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in admin actions API:', error)
    return NextResponse.json(
      { error: 'Failed to execute admin action' },
      { status: 500 }
    )
  }
}

async function exportUsers(adminEmail: string, request: NextRequest) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, email_verified, created_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Convert to CSV format
    const csvHeader = 'ID,Name,Email,Email Verified,Created At\n'
    const csvData = users?.map((user: any) => 
      `${user.id},"${user.name}",${user.email},${user.email_verified},${user.created_at}`
    ).join('\n') || ''
    
    const csvContent = csvHeader + csvData

    // Log the export action
    await AuditLogger.logDataExport(
      adminEmail,
      'users',
      request,
      { recordCount: users?.length || 0, format: 'csv' }
    )

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users_export.csv"'
      }
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    )
  }
}

async function exportProjects(adminEmail: string, request: NextRequest) {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        created_at,
        users!inner (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Convert to CSV format
    const csvHeader = 'ID,Project Name,Owner Name,Owner Email,Created At\n'
    const csvData = projects?.map((project: any) => 
      `${project.id},"${project.name}","${project.users?.name}",${project.users?.email},${project.created_at}`
    ).join('\n') || ''
    
    const csvContent = csvHeader + csvData

    // Log the export action
    await AuditLogger.logDataExport(
      adminEmail,
      'projects',
      request,
      { recordCount: projects?.length || 0, format: 'csv' }
    )

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="projects_export.csv"'
      }
    })
  } catch (error) {
    console.error('Error exporting projects:', error)
    return NextResponse.json(
      { error: 'Failed to export projects' },
      { status: 500 }
    )
  }
}

async function clearCache(adminEmail: string, request: NextRequest) {
  try {
    // In a real application, you would clear Redis cache, CDN cache, etc.
    // For now, we'll just simulate the action
    console.log('Cache clearing simulated')
    
    // Log the cache clear action
    await AuditLogger.logSystemAction(
      adminEmail,
      'clear_cache',
      request,
      { timestamp: new Date().toISOString() }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

async function getSystemHealth(adminEmail: string, request: NextRequest) {
  try {
    // Test database connection
    const dbStart = Date.now()
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    const dbResponseTime = Date.now() - dbStart

    // Get database stats
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    const { count: projectCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
    
    const { count: taskCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    const health = {
      database: {
        status: dbError ? 'error' : 'healthy',
        responseTime: `${dbResponseTime}ms`,
        error: dbError?.message || null
      },
      statistics: {
        users: userCount || 0,
        projects: projectCount || 0,
        tasks: taskCount || 0
      },
      timestamp: new Date().toISOString()
    }

    // Log the system health check
    await AuditLogger.logSystemAction(
      adminEmail,
      'system_health_check',
      request,
      { health }
    )

    return NextResponse.json(health)
  } catch (error) {
    console.error('Error getting system health:', error)
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}

// User Management Functions
async function verifyUser(userId: string, adminEmail: string, request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        email_verified: true, 
        email_verified_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select('name, email')
      .single()

    if (error) throw error

    // Log the user verification
    await AuditLogger.logUserAction(
      adminEmail,
      'verify_user',
      data.email,
      request,
      { userId, userName: data.name }
    )

    return NextResponse.json({
      success: true,
      message: `User ${data.name} (${data.email}) has been verified`,
      user: data
    })
  } catch (error) {
    console.error('Error verifying user:', error)
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    )
  }
}

async function suspendUser(userId: string, adminEmail: string, request: NextRequest) {
  try {
    // Add a suspended field to track suspended users
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        email_verified: false,
        reset_token: 'SUSPENDED', // Use reset_token field to mark as suspended
        reset_token_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      .eq('id', userId)
      .select('name, email')
      .single()

    if (error) throw error

    // Log the user suspension
    await AuditLogger.logUserAction(
      adminEmail,
      'suspend_user',
      data.email,
      request,
      { userId, userName: data.name }
    )

    return NextResponse.json({
      success: true,
      message: `User ${data.name} (${data.email}) has been suspended`,
      user: data
    })
  } catch (error) {
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 }
    )
  }
}

async function activateUser(userId: string, adminEmail: string, request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        email_verified: true,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', userId)
      .select('name, email')
      .single()

    if (error) throw error

    // Log the user activation
    await AuditLogger.logUserAction(
      adminEmail,
      'activate_user',
      data.email,
      request,
      { userId, userName: data.name }
    )

    return NextResponse.json({
      success: true,
      message: `User ${data.name} (${data.email}) has been activated`,
      user: data
    })
  } catch (error) {
    console.error('Error activating user:', error)
    return NextResponse.json(
      { error: 'Failed to activate user' },
      { status: 500 }
    )
  }
}

async function resetUserPassword(userId: string, adminEmail: string, request: NextRequest) {
  try {
    // Generate a temporary password reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        reset_token: resetToken,
        reset_token_expires: resetExpires
      })
      .eq('id', userId)
      .select('name, email')
      .single()

    if (error) throw error

    // Log the password reset
    await AuditLogger.logUserAction(
      adminEmail,
      'reset_password',
      data.email,
      request,
      { userId, userName: data.name, resetToken }
    )

    // In a real app, you'd send an email with the reset link
    // For now, we'll return the token for admin use
    return NextResponse.json({
      success: true,
      message: `Password reset initiated for ${data.name} (${data.email})`,
      resetToken: resetToken,
      resetLink: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`,
      user: data
    })
  } catch (error) {
    console.error('Error resetting user password:', error)
    return NextResponse.json(
      { error: 'Failed to reset user password' },
      { status: 500 }
    )
  }
}

async function deleteUser(userId: string, adminEmail: string, request: NextRequest) {
  try {
    // First get user info for the response
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Delete user (this will cascade delete projects and tasks due to foreign key constraints)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    // Log the user deletion
    await AuditLogger.logUserAction(
      adminEmail,
      'delete_user',
      userData.email,
      request,
      { userId, userName: userData.name, permanent: true }
    )

    return NextResponse.json({
      success: true,
      message: `User ${userData.name} (${userData.email}) and all associated data has been permanently deleted`,
      user: userData
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
