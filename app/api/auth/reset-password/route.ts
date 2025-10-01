import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { resetPasswordSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function POST(request: NextRequest) {
  try {
    // Comprehensive request validation with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: resetPasswordSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 10, // 10 password reset attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024, // 1KB max for reset password requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { token, password } = validation.data.body!

    // Find user with valid reset token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, reset_token_expires, password_hash')
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      // Log potential token scanning attempt
      console.warn(`Invalid reset token attempt: ${token.substring(0, 8)}... from IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`)
      
      return NextResponse.json(
        { 
          error: 'Invalid reset token',
          message: 'The reset token is invalid or has already been used. Please request a new password reset.'
        },
        { status: 400 }
      )
    }

    // Check if token is expired
    const tokenExpires = new Date(user.reset_token_expires || '')
    const now = new Date()

    if (now > tokenExpires) {
      // Clean up expired token
      await supabaseAdmin
        .from('users')
        .update({
          reset_token: null,
          reset_token_expires: null,
        })
        .eq('id', user.id)

      console.warn(`Expired reset token used for user: ${user.email}`)

      return NextResponse.json(
        { 
          error: 'Reset token expired',
          message: 'Reset token has expired. Please request a new password reset.'
        },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(password, user.password_hash)
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
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Update user password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error during password reset:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful password reset for security monitoring
    console.log(`Password reset completed for: ${user.email} (${user.id})`)

    return NextResponse.json(
      { 
        message: 'Password updated successfully',
        success: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
