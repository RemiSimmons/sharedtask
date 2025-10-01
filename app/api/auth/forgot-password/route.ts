import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { forgotPasswordSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function POST(request: NextRequest) {
  try {
    // Comprehensive request validation with strict rate limiting for security
    const validation = await validateRequest(request, {
      bodySchema: forgotPasswordSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 3, // Only 3 password reset attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 512, // 512 bytes max for forgot password requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { email } = validation.data.body!

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, reset_token_expires')
      .eq('email', email)
      .single()

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with that email exists, we\'ve sent you a password reset link.'

    if (userError || !user) {
      // Log potential reconnaissance attempt
      console.warn(`Password reset attempt for non-existent email: ${email} from IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`)
      
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      )
    }

    // Check if there's already a recent reset token (prevent spam)
    if (user.reset_token_expires) {
      const existingTokenExpiry = new Date(user.reset_token_expires)
      const now = new Date()
      const timeSinceLastRequest = now.getTime() - (existingTokenExpiry.getTime() - 3600000) // Token valid for 1 hour
      
      // If last reset was less than 5 minutes ago, don't send another
      if (timeSinceLastRequest < 5 * 60 * 1000) {
        console.warn(`Password reset rate limit hit for ${email}`)
        return NextResponse.json(
          { message: successMessage },
          { status: 200 }
        )
      }
    }

    // Generate cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error during password reset:', updateError)
      return NextResponse.json(
        { error: 'Failed to process password reset request. Please try again.' },
        { status: 500 }
      )
    }

    // Create password reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    
    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not found - logging password reset link instead:')
      console.log('Password reset link for', email, ':', resetLink)
    } else {
      try {
        console.log('📧 Attempting to send password reset email via Resend...')
        
        const emailResponse = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'SharedTask <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset your SharedTask password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Reset Your Password</h1>
              </div>
              
              <p style="font-size: 16px; line-height: 1.5; color: #374151;">
                Hi ${user.name || 'there'},
              </p>
              
              <p style="font-size: 16px; line-height: 1.5; color: #374151;">
                We received a request to reset your password for your SharedTask account. Click the button below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">
                This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
              </p>
              
              <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
              </p>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #9ca3af; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} SharedTask. All rights reserved.</p>
              </div>
            </div>
          `,
        })
        
        console.log('✅ Resend API response:', { data: emailResponse.data, error: emailResponse.error })
        
        if (emailResponse.error) {
          throw new Error(emailResponse.error.message)
        }
        
        console.log('✅ Password reset email sent successfully to:', user.email)
      } catch (emailError: any) {
        console.error('❌ Failed to send password reset email:', emailError)
        console.log('📧 Fallback - password reset link for', user.email, ':', resetLink)
        // Don't fail the request if email sending fails - still return success for security
      }
    }

    // Log successful password reset request for security monitoring
    console.log(`Password reset requested for: ${user.email} (${user.id})`)

    return NextResponse.json(
      { message: successMessage },
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
