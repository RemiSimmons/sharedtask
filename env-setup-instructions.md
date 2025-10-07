# Environment Setup for Performance Optimizations

## 🔑 **Required Environment Variables**

Add these to your `.env.local` file:

```bash
# Existing variables (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NEW: Required for admin operations and monitoring
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For NextAuth (if using)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: For Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## 📍 **How to Get Your Service Role Key**

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings → API**
3. **Copy the "service_role" key** (NOT the anon key)
4. **Add it to your `.env.local`**

⚠️ **IMPORTANT**: The service role key has full database access - keep it secure!

## 🧪 **Test the Fix**

After adding the service role key:

1. **Restart your dev server:**
```bash
npm run dev
```

2. **Check the browser console** - errors should be gone
3. **Monitor the Network tab** - you should see smart polling working
4. **Check your monitoring dashboard** - system health should improve

## 🔍 **Verify Smart Polling is Working**

Open browser DevTools → Network tab and look for:
- **Requests every 15+ seconds** (not every 3 seconds)
- **Longer intervals when inactive** (up to 2 minutes)
- **Reset to 15s when you interact** with the page
- **No requests when tab is inactive**

## 🎯 **Expected Results**

With the service role key properly set:
- ✅ **No more runtime errors**
- ✅ **Smart polling working** (15s intervals instead of 3s)
- ✅ **Admin monitoring functional**
- ✅ **Memory usage dropping** from 97% to 40-60%
- ✅ **System status improving** from CRITICAL to HEALTHY





