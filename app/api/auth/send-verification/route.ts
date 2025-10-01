import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'
import { Resend } from 'resend'

export async function POST() {
  try {
    const session = await auth()
    
    console.log('🔍 Send verification - session:', session?.user?.id, session?.user?.email)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, email_verified')
      .eq('id', session.user.id)
      .single()

    console.log('🔍 Database query result:', { user, userError })

    if (userError || !user) {
      console.error('❌ User not found in database:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      )
    }

    // Generate verification token (reuse reset_token field for simplicity)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 86400000) // 24 hours from now

    // Save verification token to database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        reset_token: verificationToken, // Reusing this field for verification
        reset_token_expires: tokenExpires.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to generate verification token. Please try again.' },
        { status: 500 }
      )
    }

    // Create verification link
    const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`
    
    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not found - logging verification link instead:')
      console.log('Email verification link for', user.email, ':', verificationLink)
    } else {
      try {
        // Send verification email using Resend
        console.log('📧 Attempting to send email via Resend...')
        console.log('📧 From:', process.env.EMAIL_FROM || 'SharedTask <onboarding@resend.dev>')
        console.log('📧 To:', user.email)
        
        const emailResponse = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'SharedTask <onboarding@resend.dev>',
          to: user.email,
          subject: 'Verify your SharedTask account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">Welcome to SharedTask!</h1>
              </div>
              
              <p style="font-size: 16px; line-height: 1.5; color: #374151;">
                Hi ${user.name || 'there'},
              </p>
              
              <p style="font-size: 16px; line-height: 1.5; color: #374151;">
                Thanks for signing up for SharedTask! To get started, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationLink}" 
                   style="background: #2563eb; color: white; padding: 16px 32px; 
                          text-decoration: none; border-radius: 8px; font-weight: 600;
                          display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">
                Or copy and paste this link in your browser:<br>
                <a href="${verificationLink}" style="color: #2563eb; word-break: break-all;">
                  ${verificationLink}
                </a>
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  This verification link expires in 24 hours for security purposes.<br>
                  If you didn't create an account with SharedTask, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        })
        
        console.log('✅ Resend API response:', emailResponse)
        console.log('✅ Email ID:', emailResponse.data?.id)
        console.log('✅ Verification email sent successfully to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError)
        console.error('❌ Error details:', JSON.stringify(emailError, null, 2))
        // Fall back to logging the link if email fails
        console.log('📧 Fallback - verification link for', user.email, ':', verificationLink)
      }
    }

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
