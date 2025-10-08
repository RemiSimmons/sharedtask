import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { validateRequest } from '@/lib/validation-middleware-v2'
import { z } from 'zod'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

const changeEmailSchema = z.object({
  newEmail: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
})

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
      bodySchema: changeEmailSchema,
      rateLimitType: 'custom',
      rateLimitConfig: {
        identifier: session.user.id, // Rate limit per user
        maxRequests: 3, // 3 email change attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024, // 1KB max for email change requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { newEmail } = validation.data.body!

    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('User not found during email change:', session.user.id)
      }
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    // Check if new email is different from current
    if (newEmail === user.email) {
      return NextResponse.json(
        {
          error: 'Email unchanged',
          message: 'New email must be different from your current email.'
        },
        { status: 400 }
      )
    }

    // Check if email is already in use
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      if (process.env.NODE_ENV === 'development') {
        console.error('Database error checking email:', checkError)
      }
      return NextResponse.json(
        { error: 'Failed to check email availability. Please try again.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email in use',
          message: 'This email address is already registered to another account.'
        },
        { status: 400 }
      )
    }

    // Generate email verification token
    const verificationToken = crypto.randomUUID()
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new email and verification token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email: newEmail,
        email_verified: false,
        email_verified_at: null,
        // Store verification token for email change
        reset_token: verificationToken,
        reset_token_expires: tokenExpires.toISOString(),
      })
      .eq('id', session.user.id)

    if (updateError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database error during email change:', updateError)
      }
      return NextResponse.json(
        { error: 'Failed to change email. Please try again.' },
        { status: 500 }
      )
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(newEmail)}`
      
      await resend.emails.send({
        from: 'SharedTask <noreply@sharedtask.app>',
        to: [newEmail],
        subject: 'Verify your new email address - SharedTask',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Verify Your New Email Address</h2>
            <p>Hello ${user.name},</p>
            <p>You've requested to change your email address to <strong>${newEmail}</strong>.</p>
            <p>Please click the button below to verify your new email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this change, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The SharedTask Team
            </p>
          </div>
        `,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`Email change verification sent to: ${newEmail} for user: ${session.user.id}`)
      }
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send verification email:', emailError)
      }
      // Don't fail the request if email sending fails
      // The user can request a new verification email
    }

    return NextResponse.json(
      {
        message: 'Email change request processed. Please check your new email for verification.',
        success: true
      },
      { status: 200 }
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Change email error:', error)
    }
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
