# 🚀 Create Your .env.local File

## Step 1: Create the file

Create a file named `.env.local` in your project root with this content:

```bash
# Copy this entire block into your .env.local file

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-generate-a-random-string
NEXTAUTH_URL=http://localhost:3000

# Database (Get these from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe (Get these from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# THESE ARE THE MISSING PRICE IDs - CREATE IN STRIPE FIRST
BASIC_PRICE_ID_MONTHLY=price_replace_with_actual_id
BASIC_PRICE_ID_YEARLY=price_replace_with_actual_id
PRO_PRICE_ID_MONTHLY=price_replace_with_actual_id
PRO_PRICE_ID_YEARLY=price_replace_with_actual_id
TEAM_PRICE_ID_MONTHLY=price_replace_with_actual_id
TEAM_PRICE_ID_YEARLY=price_replace_with_actual_id

# Optional
EMAIL_FROM="SharedTask <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=another-random-secret
```

## Step 2: Fill in your actual values

1. **Supabase values**: Get from your Supabase dashboard → Settings → API
2. **Stripe values**: Get from your Stripe dashboard → Developers → API keys  
3. **Price IDs**: Create products in Stripe dashboard first, then copy the price IDs

## Step 3: Create Stripe Products

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products) and create:

### Basic Plan
- Product: "SharedTask Basic"  
- Monthly: $2.99/month → Copy price ID
- Yearly: $29.99/year → Copy price ID

### Pro Plan  
- Product: "SharedTask Pro"
- Monthly: $9.99/month → Copy price ID  
- Yearly: $99.99/year → Copy price ID

### Team Plan
- Product: "SharedTask Team"
- Monthly: $24.99/month → Copy price ID
- Yearly: $249.99/year → Copy price ID

## Step 4: Test

After creating `.env.local` with real values:

```bash
# Restart your server
npm run dev

# Test environment
node test-env.js
```

You should see ✅ for all values instead of ❌ Missing.

## ⚠️ IMPORTANT

- Never commit `.env.local` to git (it's already in .gitignore)
- Use `sk_test_` keys for development, `sk_live_` for production
- Price IDs start with `price_` - copy them exactly from Stripe

