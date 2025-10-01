import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's email verification status from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email_verified, email_verified_at')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      console.error('User not found in database:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isEmailVerified: user.email_verified || false,
      emailVerifiedAt: user.email_verified_at
    })
  } catch (error) {
    console.error('Verification status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

