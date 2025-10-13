import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { adminAuthSchema, sanitizeInput, isValidUuid } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

/**
 * SECURE PROJECT PASSWORD VERIFICATION
 * This endpoint verifies a project password using bcrypt.compare()
 * It requires both projectId and password for secure verification
 */
export async function POST(request: NextRequest) {
  try {
    // Comprehensive request validation with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: adminAuthSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 10, // 10 attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 512, // 512 bytes max
    })

    if (!validation.success) {
      return validation.response
    }

    const { projectId, password } = validation.data.body!

    // Additional validation for UUID format
    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    // Get the specific project with its hashed password
    // Use admin client to read admin_password field (restricted by RLS)
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, admin_password')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Database error during password verification:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has no password set
    if (!project.admin_password || project.admin_password === 'no_password_set') {
      // Project has no password protection - allow access
      return NextResponse.json({ success: true, requiresPassword: false })
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, project.admin_password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Password is valid - return success
    return NextResponse.json({ 
      success: true, 
      requiresPassword: true,
      projectId: project.id 
    })
    
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

