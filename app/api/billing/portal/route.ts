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

    // Get user's subscription state - check ANY subscription, not just active
    const subscriptionState = await getUserSubscriptionState(session.user.id)

    console.log('🔍 Billing Portal Debug:', {
      userId: session.user.id,
      hasActiveSubscription: subscriptionState.hasActiveSubscription,
      subscription: subscriptionState.subscription ? {
        status: subscriptionState.subscription.status,
        stripe_customer_id: subscriptionState.subscription.stripe_customer_id,
        plan: subscriptionState.subscription.plan
      } : 'NO SUBSCRIPTION'
    })

    // Check if we have a Stripe customer ID (even if subscription is past_due, we still want them to update payment)
    const stripeCustomerId = subscriptionState.subscription?.stripe_customer_id

    if (!stripeCustomerId) {
      // No Stripe customer found - user needs to subscribe first
      console.error('❌ No Stripe customer ID found for user:', session.user.id)
      return NextResponse.json(
        { 
          error: 'No subscription found',
          message: 'Please subscribe to a plan first to access the billing portal.'
        },
        { status: 400 }
      )
    }

    console.log('✅ Found Stripe customer ID:', stripeCustomerId)

    // Get the origin for return URL
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    console.log('🔄 Creating Stripe billing portal session...', {
      customer: stripeCustomerId,
      return_url: `${origin}/account/billing`
    })

    // Create billing portal session
    // This works even if subscription is past_due, canceled, etc.
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/account/billing`
    })

    console.log('✅ Billing portal session created:', portalSession.url)

    return NextResponse.json({ url: portalSession.url })

  } catch (error) {
    console.error('Billing portal API error:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    
    return NextResponse.json(
      { 
        error: 'Failed to create billing portal session',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
