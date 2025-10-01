# SharedTask Troubleshooting Guide

## JSON Parse Error: "unexpected character at line 1 column 1"

This error typically occurs when the API returns HTML (like an error page) instead of JSON. Here's how to debug and fix it:

### Step 1: Check Environment Variables

The most common cause is missing environment variables. Create a `.env.local` file with these required variables:

```bash
# Authentication (required)
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Database (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe (required for subscription features)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Optional but recommended
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
BASIC_PRICE_ID_MONTHLY=price_your_basic_monthly_price_id
PRO_PRICE_ID_MONTHLY=price_your_pro_monthly_price_id
TEAM_PRICE_ID_MONTHLY=price_your_team_monthly_price_id
```

### Step 2: Test Environment Setup

Visit these debug endpoints in your browser (development only):

1. **Environment Check**: `http://localhost:3000/api/debug/env`
   - Shows which environment variables are set
   - All required variables should show `true`

2. **API Test**: `http://localhost:3000/api/test-checkout`
   - Tests basic API functionality
   - Should return JSON with status "ok"

### Step 3: Check Browser Console

Open browser DevTools (F12) and check the Console and Network tabs:

1. **Console Tab**: Look for error messages
2. **Network Tab**: 
   - Find the failed `/api/checkout` request
   - Check the Response tab - if it shows HTML instead of JSON, that's the issue
   - Check the Status code (should be 200 for success)

### Step 4: Check Server Logs

In your terminal where `npm run dev` is running, look for:

```
🔍 Checkout API called
📝 Request body: { plan: "pro", start: "trial", billing: "monthly" }
```

If you don't see these logs, the API isn't being reached.

If you see error messages like:
```
❌ Checkout API error: Error: Missing Supabase environment variables
```

This indicates the specific problem.

### Step 5: Common Fixes

#### Fix 1: Missing Environment Variables
```bash
# Copy the example and fill in your values
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

#### Fix 2: Restart Development Server
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

#### Fix 3: Check Supabase Connection
Visit your Supabase dashboard and verify:
- Project is active
- URL and keys are correct
- Database schema is created (run `subscription-schema.sql`)

#### Fix 4: Check Stripe Configuration
Visit your Stripe dashboard and verify:
- API keys are correct (test mode for development)
- Products and prices are created
- Keys start with `sk_test_` and `pk_test_` for test mode

### Step 6: Minimal Working Setup

For basic testing without Stripe, you can temporarily comment out Stripe imports:

```typescript
// In app/api/checkout/route.ts, temporarily comment out:
// import { stripe, getPriceId } from '@/lib/stripe'
```

And add a simple response for trial flows:

```typescript
// Add this at the start of the POST function for testing:
if (start === 'trial') {
  return NextResponse.json({
    success: true,
    type: 'trial',
    redirectUrl: `/app/trial-welcome?plan=${plan}`
  })
}
```

### Step 7: Specific Error Messages

#### "Missing Supabase environment variables"
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server

#### "STRIPE_SECRET_KEY is not set"
- Add `STRIPE_SECRET_KEY=sk_test_...`
- Get from Stripe Dashboard > Developers > API Keys

#### "Authentication required"
- Make sure you're signed in
- Check NextAuth configuration
- Verify `NEXTAUTH_SECRET` is set

#### "Price ID not found"
- Create products in Stripe Dashboard
- Add price IDs to environment variables
- See `stripe-products-setup.md` for detailed steps

### Step 8: Full Reset

If nothing works, try a complete reset:

```bash
# 1. Stop the dev server
# 2. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Clear Next.js cache
rm -rf .next

# 4. Restart
npm run dev
```

### Getting Help

If you're still having issues:

1. **Check the browser Network tab** for the exact error response
2. **Check server logs** for detailed error messages  
3. **Try the test endpoints** to isolate the issue
4. **Verify environment variables** using the debug endpoint

The enhanced error handling in the pricing page will now show more helpful error messages instead of the generic JSON parse error.

### Success Indicators

You'll know it's working when:
- ✅ Debug endpoints return JSON responses
- ✅ Browser console shows no errors
- ✅ Server logs show successful API calls
- ✅ Trial signup redirects to welcome page
- ✅ Paid signup redirects to Stripe checkout

Remember: The JSON parse error is just a symptom - the real issue is usually a missing environment variable or configuration problem that causes the API to return an error page instead of JSON.

