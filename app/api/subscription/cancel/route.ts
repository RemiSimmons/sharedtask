import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: dbError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single()

    if (dbError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)

    // Update the subscription status in our database
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Error updating canceled subscription in database:', updateError)
      // Don't return error since Stripe cancellation succeeded
    }

    console.log(`✅ Subscription canceled: ${subscriptionId} for user: ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully'
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
