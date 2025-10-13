import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyEmailSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function POST(request: NextRequest) {
  try {
    // Validate request with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: verifyEmailSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 10, // 10 verification attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 512,
    })

    if (!validation.success) {
      return validation.response
    }

    const { token } = validation.data.body!

    // Find user with valid verification token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, email_verified, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
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

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification email.' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
