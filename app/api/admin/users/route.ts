import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAdminAccess, promoteToAdmin, revokeAdminAccess, getAdminAccessLogs } from '@/lib/admin-access-control'

async function usersHandler(request: NextRequest, adminUser: any) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (request.method) {
      case 'GET':
        return await handleGetUsers(searchParams, adminUser)
      
      case 'POST':
        return await handleUserAction(request, action, adminUser)
      
      case 'PUT':
        return await handleUpdateUser(request, adminUser)
      
      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Failed to process user management request' },
      { status: 500 }
    )
  }
}

async function handleGetUsers(searchParams: URLSearchParams, adminUser: any) {
  const action = searchParams.get('action') || 'list'
  
  switch (action) {
    case 'list':
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      const role = searchParams.get('role')
      const search = searchParams.get('search')
      
      // Build query
      let query = supabaseAdmin
        .from('users')
        .select('id, name, email, role, email_verified, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (role) {
        query = query.eq('role', role)
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }
      
      const { data: users, error, count } = await query
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({
        users: users || [],
        total: count || 0,
        limit,
        offset
      })

    case 'admins':
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, created_at')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: false })
      
      if (adminError) {
        throw adminError
      }
      
      return NextResponse.json({
        admins: adminUsers || []
      })

    case 'audit':
      // Get admin access logs
      const auditLimit = parseInt(searchParams.get('limit') || '100')
      const auditOffset = parseInt(searchParams.get('offset') || '0')
      const userId = searchParams.get('userId')
      const actionFilter = searchParams.get('actionFilter')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      
      const auditLogs = await getAdminAccessLogs(auditLimit, auditOffset, {
        userId: userId || undefined,
        action: actionFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      
      return NextResponse.json(auditLogs)

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleUserAction(request: NextRequest, action: string, adminUser: any) {
  const { z } = await import('zod')
  const { validateRequest } = await import('@/lib/validation-middleware')
  const { adminUserActionSchema } = await import('@/lib/validation')
  
  const validation = await validateRequest(request, {
    bodySchema: adminUserActionSchema,
    maxBodySize: 2048,
  })

  if (!validation.success) {
    return validation.response
  }
  
  const body = validation.data.body!
  
  switch (action) {
    case 'promote':
      const { userId, role } = body
      
      if (!userId || !role) {
        return NextResponse.json({ error: 'User ID and role required' }, { status: 400 })
      }
      
      const promoteResult = await promoteToAdmin(userId, role, adminUser.id)
      
      if (!promoteResult.success) {
        return NextResponse.json({ error: promoteResult.error }, { status: 403 })
      }
      
      return NextResponse.json({
        message: `User promoted to ${role} successfully`
      })

    case 'revoke':
      const { userId: revokeUserId } = body
      
      if (!revokeUserId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 })
      }
      
      const revokeResult = await revokeAdminAccess(revokeUserId, adminUser.id)
      
      if (!revokeResult.success) {
        return NextResponse.json({ error: revokeResult.error }, { status: 403 })
      }
      
      return NextResponse.json({
        message: 'Admin access revoked successfully'
      })

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleUpdateUser(request: NextRequest, adminUser: any) {
  const { validateRequest } = await import('@/lib/validation-middleware')
  const { adminUserActionSchema } = await import('@/lib/validation')
  
  const validation = await validateRequest(request, {
    bodySchema: adminUserActionSchema,
    maxBodySize: 2048,
  })

  if (!validation.success) {
    return validation.response
  }
  
  const body = validation.data.body!
  const { userId, updates } = body
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  if (!updates) {
    return NextResponse.json({ error: 'Updates object required' }, { status: 400 })
  }
  
  // Only allow updating certain fields
  const allowedUpdates: any = {}
  if (updates.email_verified !== undefined) {
    allowedUpdates.email_verified = updates.email_verified
  }
  
  if (Object.keys(allowedUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update(allowedUpdates)
    .eq('id', userId)
  
  if (error) {
    throw error
  }
  
  return NextResponse.json({
    message: 'User updated successfully'
  })
}

// Export handlers with appropriate permissions
export const GET = withAdminAccess(usersHandler, 'users.view')
export const POST = withAdminAccess(usersHandler, 'users.manage')
export const PUT = withAdminAccess(usersHandler, 'users.manage')








