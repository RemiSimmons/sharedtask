import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFeatureFlags } from '@/lib/access-control'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get feature flags
    const featureFlags = await getFeatureFlags(session.user.id)

    return NextResponse.json(featureFlags)

  } catch (error) {
    console.error('Feature flags API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get feature flags' },
      { status: 500 }
    )
  }
}
