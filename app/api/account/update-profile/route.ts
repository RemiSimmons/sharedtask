import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { updateProfileSchema } from '@/lib/validation'
import { validateRequest } from '@/lib/validation-middleware'
import { sanitizeInput } from '@/lib/validation'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Comprehensive request validation with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: updateProfileSchema,
      rateLimit: {
        identifier: session.user.id, // Rate limit per user
        maxRequests: 20, // 20 profile update attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024, // 1KB max for profile update requests
    })

    if (!validation.success) {
      return validation.response
    }

    const updateData = validation.data.body!

    // Check if there's actually something to update
    if (!updateData.name && !updateData.email) {
      return NextResponse.json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update.'
      }, { status: 400 })
    }

    const updates: any = {}

    // Handle name update
    if (updateData.name) {
      updates.name = sanitizeInput(updateData.name)
    }

    // Handle email update
    if (updateData.email) {
      const newEmail = updateData.email.toLowerCase().trim()
      
      // Check if email is actually different
      if (newEmail === session.user.email) {
        return NextResponse.json({
          error: 'Email unchanged',
          message: 'The new email address is the same as your current email.'
        }, { status: 400 })
      }

      // Check if email is already taken
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .neq('id', session.user.id)
        .single()

      if (existingUser) {
        return NextResponse.json({
          error: 'Email already taken',
          message: 'An account with this email address already exists.'
        }, { status: 409 })
      }

      updates.email = newEmail
      // Reset email verification when email changes
      updates.email_verified = false
      updates.email_verified_at = null
    }

    // Update user profile using admin client for security
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select('id, name, email, email_verified, created_at')
      .single()

    if (error) {
      console.error('Database error during profile update:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Email address is already taken by another account.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update profile. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful profile update for security monitoring
    const updatedFields = Object.keys(updates).join(', ')
    console.log(`Profile updated for user ${session.user.id}: ${updatedFields}`)

    // If email was changed, log it specifically for security
    if (updates.email) {
      console.log(`Email changed for user ${session.user.id}: ${session.user.email} -> ${updates.email}`)
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        emailVerified: updatedUser.email_verified,
        createdAt: updatedUser.created_at
      },
      updatedFields: Object.keys(updates)
    }, { status: 200 })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
