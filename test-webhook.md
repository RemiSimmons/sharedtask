# Testing Stripe Webhooks Locally

## Option 1: Stripe CLI (Recommended for Development)

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe**: `stripe login`
3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. **Copy the webhook secret** from the CLI output
5. **Add to .env.local**: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

## Option 2: ngrok (For Public Testing)

1. **Install ngrok**: https://ngrok.com/
2. **Expose local server**:
   ```bash
   ngrok http 3000
   ```
3. **Use the ngrok URL** in Stripe dashboard:
   `https://abc123.ngrok.io/api/webhooks/stripe`

## Test Events

Your webhook handles these events:
- ✅ `checkout.session.completed` - New subscription
- ✅ `customer.subscription.updated` - Plan changes
- ✅ `customer.subscription.deleted` - Cancellations
- ✅ `invoice.payment_failed` - Failed payments
- ✅ `invoice.payment_succeeded` - Successful payments

## Webhook Features

Your webhook automatically:
- ✅ **Creates/updates subscriptions** in your database
- ✅ **Sends welcome emails** to new subscribers
- ✅ **Handles payment failures** (marks as past_due)
- ✅ **Processes cancellations** (updates status)
- ✅ **Logs all events** for monitoring
- ✅ **Verifies signatures** for security
