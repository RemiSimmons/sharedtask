import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getClientSubscriptionState } from '@/lib/access-control'

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

    // Get subscription state
    const subscriptionState = await getClientSubscriptionState(session.user.id)

    return NextResponse.json(subscriptionState)

  } catch (error) {
    console.error('Subscription state API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get subscription state' },
      { status: 500 }
    )
  }
}
