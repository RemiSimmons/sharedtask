import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPriceId } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { getUserSubscriptionState, startTrial } from '@/lib/subscription-service'
import { PlanType } from '@/types/database'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation-middleware'

// Checkout-specific schema
const checkoutSchema = z.object({
  plan: z.enum(['basic', 'pro', 'team'], {
    errorMap: () => ({ message: 'Invalid plan. Must be basic, pro, or team' })
  }),
  start: z.enum(['trial', 'paid'], {
    errorMap: () => ({ message: 'Invalid start type. Must be trial or paid' })
  }),
  billing: z.enum(['monthly', 'yearly'], {
    errorMap: () => ({ message: 'Invalid billing cycle. Must be monthly or yearly' })
  }),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checkout API called')
    
    // Validate request with rate limiting
    const validation = await validateRequest(request, {
      bodySchema: checkoutSchema,
      rateLimit: {
        identifier: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous',
        maxRequests: 10, // 10 checkout attempts per 15 minutes
        windowMs: 15 * 60 * 1000
      },
      maxBodySize: 1024,
    })

    if (!validation.success) {
      return validation.response
    }

    const { plan, start, billing } = validation.data.body!
    console.log('📝 Validated request:', { plan, start, billing })

    // Get user session - required for both trial and paid flows
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's current subscription state
    const subscriptionState = await getUserSubscriptionState(userId)

    // Handle trial start (no Stripe checkout needed)
    if (start === 'trial') {
      // Check if user can start a trial
      if (!subscriptionState.canStartTrial) {
        if (subscriptionState.hasActiveSubscription) {
          return NextResponse.json(
            { error: 'You already have an active subscription. Trials are not available for existing subscribers.' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: 'You have already used your free trial. Please subscribe to continue using SharedTask.' },
            { status: 400 }
          )
        }
      }

      // Start the trial
      const trial = await startTrial(userId, plan as PlanType)
      
      // Return success with trial details
      return NextResponse.json({
        success: true,
        type: 'trial',
        trial: {
          id: trial.id,
          plan: trial.plan,
          endsAt: trial.ends_at,
          daysRemaining: Math.ceil((new Date(trial.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        },
        redirectUrl: `/app/trial-welcome?plan=${plan}`
      })
    }

    // Handle paid subscription (Stripe checkout)
    // Check if user already has an active subscription to prevent duplicates
    if (subscriptionState.hasActiveSubscription) {
      return NextResponse.json(
        { error: `You already have an active ${subscriptionState.plan} subscription. Please cancel your current subscription before subscribing to a new plan, or contact support for plan changes.` },
        { status: 400 }
      )
    }

    // Get price ID for Stripe checkout
    const priceId = getPriceId(plan, billing)
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not found for ${plan} ${billing}. Please check your Stripe configuration.` },
        { status: 400 }
      )
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create Stripe checkout session for paid subscription
    const checkoutSessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/app/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancel&plan=${plan}&billing=${billing}`,
      metadata: {
        plan,
        billing,
        start,
        user_id: userId,
      },
      subscription_data: {
        // No trial_end for paid subscriptions - start billing immediately
        metadata: {
          plan,
          billing,
          user_id: userId,
        }
      },
      customer_email: session.user.email,
      allow_promotion_codes: true, // Allow discount codes
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams)

    return NextResponse.json({ 
      url: checkoutSession.url,
      type: 'checkout'
    })

  } catch (error) {
    console.error('❌ Checkout API error:', error)
    
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
