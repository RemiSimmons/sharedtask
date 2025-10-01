import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signupSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'

export async function POST(request: NextRequest) {
  try {
    // Comprehensive request validation with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: signupSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 5, // 5 signup attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024, // 1KB max for signup requests
    })

    if (!validation.success) {
      return validation.response
    }

    const { name, email, password } = validation.data.body!

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Account already exists',
          message: 'An account with this email address already exists. Please sign in instead.'
        },
        { status: 409 } // Conflict status code
      )
    }

    // Hash password with secure settings
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user with validated and sanitized data
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        email_verified: false, // Require email verification
      })
      .select('id, name, email, created_at, email_verified')
      .single()

    if (error) {
      console.error('Database error during signup:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Account already exists with this email' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful signup for security monitoring
    console.log(`New user signup: ${newUser.email} (${newUser.id})`)

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          emailVerified: newUser.email_verified,
          createdAt: newUser.created_at,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
