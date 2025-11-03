import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription-service'
import { sendSubscriptionWelcomeEmail } from '@/lib/email-service'
import { supabase } from '@/lib/supabase'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Only require webhook secret in actual production deployment
// Skip check during build process or development
if (!webhookSecret && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_WEBHOOK_SECRET not set - webhook verification disabled')
}

/**
 * Get user ID from Stripe customer or checkout session
 */
async function getUserIdFromStripeData(
  customerId?: string, 
  sessionId?: string,
  subscriptionMetadata?: Record<string, string>
): Promise<string | null> {
  try {
    // First try to get user_id from metadata
    if (subscriptionMetadata?.user_id) {
      return subscriptionMetadata.user_id
    }

    // If we have a checkout session, get metadata from there
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.metadata?.user_id) {
        return session.metadata.user_id
      }
      if (session.customer_email) {
        // Look up user by email
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.customer_email)
          .single()
        
        if (user) {
          return user.id
        }
      }
    }

    // If we have a customer ID, try to find user by Stripe customer ID
    if (customerId) {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()
      
      if (subscription) {
        return subscription.user_id
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user ID from Stripe data:', error)
    return null
  }
}

/**
 * Handle checkout session completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout.session.completed:', session.id)

    if (session.mode !== 'subscription' || !session.subscription) {
      console.log('Skipping non-subscription checkout session')
      return
    }

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Get user ID
    const userId = await getUserIdFromStripeData(
      session.customer as string,
      session.id,
      subscription.metadata
    )

    if (!userId) {
      console.error('Could not find user ID for checkout session:', session.id)
      return
    }

    // Upsert subscription in database
    await upsertSubscription(userId, subscription as any)

    // Get user details for welcome email
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (user && subscription.status === 'active') {
      // Send welcome email
      console.log('🎯 Attempting to send welcome email to:', user.email)
      try {
        await sendSubscriptionWelcomeEmail(user, {
          plan: subscription.metadata.plan || 'basic',
          interval: subscription.items.data[0]?.price.recurring?.interval || 'monthly'
        })
        console.log('✅ Welcome email sent successfully to:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError)
      }
    } else {
      console.log('⚠️ Skipping welcome email - user:', !!user, 'status:', subscription.status)
    }

    console.log('✅ Successfully processed checkout session:', session.id)
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
    throw error
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing customer.subscription.updated:', subscription.id)

    // Get user ID
    const userId = await getUserIdFromStripeData(
      subscription.customer as string,
      undefined,
      subscription.metadata
    )

    if (!userId) {
      console.error('Could not find user ID for subscription:', subscription.id)
      return
    }

    // Update subscription in database
    await upsertSubscription(userId, subscription as any)

    console.log('✅ Successfully updated subscription:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Processing customer.subscription.deleted:', subscription.id)

    // Update subscription status to canceled in database
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating canceled subscription:', error)
      throw error
    }

    console.log('✅ Successfully canceled subscription:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice.payment_failed:', invoice.id)

    if (!(invoice as any).subscription) {
      console.log('Skipping invoice without subscription')
      return
    }

    const subscriptionId = (invoice as any).subscription as string

    // Update subscription status to past_due
    const { data: subscriptionData, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due'
      })
      .eq('stripe_subscription_id', subscriptionId)
      .select('user_id, plan')
      .single()

    if (error) {
      console.error('Error updating past due subscription:', error)
      throw error
    }

    // Send payment failed email to user
    if (subscriptionData) {
      try {
        // Get user details
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', subscriptionData.user_id)
          .single()

        if (userData) {
          // Import email service dynamically
          const { sendPaymentFailedEmail } = await import('@/lib/email-service')
          
          await sendPaymentFailedEmail(
            userData,
            {
              plan: subscriptionData.plan || 'basic',
              amountDue: invoice.amount_due 
                ? `$${(invoice.amount_due / 100).toFixed(2)}` 
                : '$2.99'
            },
            subscriptionId
          )
        }
      } catch (emailError) {
        // Log but don't fail the webhook if email fails
        console.error('Failed to send payment failed email:', emailError)
      }
    }

    console.log('✅ Successfully marked subscription as past due:', subscriptionId)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
    throw error
  }
}

/**
 * Handle invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice.payment_succeeded:', invoice.id)

    if (!(invoice as any).subscription) {
      console.log('Skipping invoice without subscription')
      return
    }

    // Get the subscription to update status
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
    
    // Get user ID
    const userId = await getUserIdFromStripeData(
      subscription.customer as string,
      undefined,
      subscription.metadata
    )

    if (!userId) {
      console.error('Could not find user ID for subscription:', subscription.id)
      return
    }

    // Update subscription in database (this will set status to active if payment succeeded)
    await upsertSubscription(userId, subscription as any)

    console.log('✅ Successfully processed payment for subscription:', subscription.id)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature (skip in development if secret not set)
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        // Development mode - parse without verification
        event = JSON.parse(body)
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log('📥 Received Stripe webhook:', event.type, event.id)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        console.log('Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    
    // Return 500 so Stripe will retry the webhook
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs'

