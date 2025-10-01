import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { changePasswordSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Comprehensive request validation with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: changePasswordSchema,
      rateLimit: {
        identifier: session.user.id, // Rate limit per user
        maxRequests: 5, // 5 password change attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024, // 1KB max for password change requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { currentPassword, newPassword } = validation.data.body!

    // Get current user data using admin client for security
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('password_hash, email')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      console.error('User not found during password change:', session.user.id)
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    
    if (!isValidPassword) {
      // Log potential unauthorized password change attempt
      console.warn(`Invalid current password attempt for user: ${user.email} (${session.user.id})`)
      
      return NextResponse.json(
        { 
          error: 'Current password incorrect',
          message: 'The current password you entered is incorrect.'
        },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash)
    if (isSamePassword) {
      return NextResponse.json(
        { 
          error: 'Password unchanged',
          message: 'New password must be different from your current password.'
        },
        { status: 400 }
      )
    }

    // Hash new password with secure settings
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        // Clear any existing reset tokens for security
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Database error during password change:', updateError)
      return NextResponse.json(
        { error: 'Failed to change password. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful password change for security monitoring
    console.log(`Password changed successfully for: ${user.email} (${session.user.id})`)

    return NextResponse.json(
      { 
        message: 'Password changed successfully',
        success: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
