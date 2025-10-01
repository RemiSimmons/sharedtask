import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signupSchema } from '@/lib/validation'
import { validateAuthRequest } from '@/lib/validation-middleware-v2'
import { logger, logAuth, logSecurity, logDatabase, logValidation } from '@/lib/logger'
import { withAuthLogging, logSecurityEvent, PerformanceMonitor } from '@/lib/logging-middleware'

async function signupHandler(request: NextRequest) {
  const perfMonitor = new PerformanceMonitor('user_signup')
  
  try {
    // Log signup attempt start
    logAuth('info', 'signup_attempt_started', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Comprehensive request validation with auth-specific rate limiting
    const validation = await validateAuthRequest(request, signupSchema, {
      maxBodySize: 1024, // 1KB max for signup requests
    })

    if (!validation.success) {
      logValidation('warn', 'Signup validation failed', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: { validationErrors: true }
      })
      return validation.response
    }

    const { name, email, password } = validation.data.body!

    // Log sanitized signup data (never log passwords)
    logAuth('info', 'signup_data_validated', {
      metadata: { 
        email: email.substring(0, 3) + '***', // Partially mask email
        nameLength: name.length 
      }
    })

    // Check if user already exists
    logDatabase('info', 'checking_existing_user', { metadata: { email: email.substring(0, 3) + '***' } })
    
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // Log potential account enumeration attempt
      logSecurity('warn', 'signup_attempt_existing_email', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: { 
          email: email.substring(0, 3) + '***',
          existingUserId: existingUser.id 
        }
      })

      return NextResponse.json(
        { 
          error: 'Account already exists',
          message: 'An account with this email address already exists. Please sign in instead.'
        },
        { status: 409 }
      )
    }

    // Log password hashing start
    logger.debug('auth', 'Password hashing started')
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)
    logger.debug('auth', 'Password hashing completed')

    // Create user with validated and sanitized data
    logDatabase('info', 'creating_new_user', {
      metadata: { email: email.substring(0, 3) + '***' }
    })

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
      logDatabase('error', 'user_creation_failed', {
        error: error.message,
        metadata: { 
          errorCode: error.code,
          email: email.substring(0, 3) + '***'
        }
      })
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        logSecurity('warn', 'concurrent_signup_attempt', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          metadata: { email: email.substring(0, 3) + '***' }
        })
        
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

    // Log successful signup
    logAuth('info', 'signup_successful', {
      userId: newUser.id,
      metadata: { 
        email: email.substring(0, 3) + '***',
        userName: name.substring(0, 2) + '***'
      }
    })

    // Log business event
    logger.business('info', 'new_user_registered', {
      userId: newUser.id,
      metadata: {
        registrationMethod: 'email',
        emailDomain: email.split('@')[1],
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    const duration = perfMonitor.end({
      userId: newUser.id,
      metadata: { successful: true }
    })

    const response = NextResponse.json(
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

    // Log response
    logger.api('info', 'Signup response sent', {
      statusCode: 201,
      duration,
      userId: newUser.id
    })

    return response

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    perfMonitor.endWithError(error instanceof Error ? error : new Error(errorMessage), {
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    logAuth('error', 'signup_unexpected_error', {
      error: errorMessage,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Log security event for unexpected errors (could indicate attack)
    logSecurityEvent('unexpected_signup_error', 'medium', request, {
      error: errorMessage
    })
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Export the handler wrapped with authentication logging middleware
export const POST = withAuthLogging(signupHandler)
