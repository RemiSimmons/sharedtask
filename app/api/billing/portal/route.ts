import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getUserSubscriptionState } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's subscription state
    const subscriptionState = await getUserSubscriptionState(session.user.id)

    if (!subscriptionState.hasActiveSubscription || !subscriptionState.subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Get the origin for return URL
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscriptionState.subscription.stripe_customer_id,
      return_url: `${origin}/account/billing`
    })

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    console.error('Billing portal API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
