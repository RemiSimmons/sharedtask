import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signupSchema } from '@/lib/validation'
import { validateAuthRequest } from '@/lib/validation-middleware-v2'
import { withAuthErrorTracking } from '@/lib/error-tracking-middleware'
import { trackError } from '@/lib/error-tracker'
import { logger } from '@/lib/logger'

async function signupHandler(request: NextRequest) {
  try {
    // Comprehensive request validation with auth-specific rate limiting
    const validation = await validateAuthRequest(request, signupSchema, {
      maxBodySize: 1024,
    })

    if (!validation.success) {
      // Validation errors are automatically tracked by the error tracking middleware
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
      // Track business logic error with context
      await trackError(new Error('Signup attempt with existing email'), {
        endpoint: '/api/auth/signup',
        method: 'POST',
        metadata: {
          email: email.substring(0, 3) + '***', // Masked email
          existingUserId: existingUser.id,
          errorType: 'business_logic'
        }
      }, {
        severity: 'low', // This is expected behavior
        impact: 'user',
        tags: ['signup', 'existing-email', 'expected-error']
      })

      return NextResponse.json(
        { 
          error: 'Account already exists',
          message: 'An account with this email address already exists. Please sign in instead.'
        },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user with validated and sanitized data
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        email_verified: false,
      })
      .select('id, name, email, created_at, email_verified')
      .single()

    if (error) {
      // Database errors are critical and automatically tracked
      // But we can add additional context
      await trackError(new Error(`Database error during user creation: ${error.message}`), {
        endpoint: '/api/auth/signup',
        method: 'POST',
        metadata: {
          email: email.substring(0, 3) + '***',
          errorCode: error.code,
          errorDetails: error.details,
          postgresError: true
        }
      }, {
        severity: error.code === '23505' ? 'medium' : 'critical', // Unique constraint vs other errors
        impact: 'system',
        tags: ['database', 'signup', 'user-creation']
      })
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Account already exists with this email' },
          { status: 409 }
        )
      }
      
      // Generic database error
      throw new Error(`Failed to create user account: ${error.message}`)
    }

    // Log successful signup (business event, not an error)
    logger.business('info', 'new_user_registered', {
      userId: newUser.id,
      endpoint: '/api/auth/signup',
      metadata: {
        email: email.substring(0, 3) + '***',
        registrationMethod: 'email'
      }
    })

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
    // Unexpected errors are automatically tracked by the middleware
    // But we can add additional context for critical signup failures
    await trackError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/auth/signup',
      method: 'POST',
      component: 'signup_handler',
      metadata: {
        unexpectedError: true,
        criticalFlow: 'user_registration'
      }
    }, {
      severity: 'critical', // Signup failures are critical for business
      impact: 'business',
      tags: ['signup', 'critical-path', 'unexpected-error']
    })
    
    // Re-throw to let middleware handle the response
    throw error
  }
}

// Export the handler wrapped with authentication-specific error tracking
export const POST = withAuthErrorTracking(signupHandler)
