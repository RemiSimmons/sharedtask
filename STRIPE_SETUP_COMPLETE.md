# 🚀 Complete Stripe Setup & Trial Reset

## 🎯 **Current Issues**
1. ❌ **"Price ID not found for pro yearly"** - Stripe products not configured
2. ❌ **"You have already used your free trial"** - User has existing trial record

## ✅ **Solution: 3-Step Fix**

### **Step 1: Create Stripe Test Products (5 minutes)**

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)

**Create exactly these 6 prices:**

#### Basic Plan
1. **Product Name**: `SharedTask Basic`
2. **Monthly Price**: `$2.99/month` → Copy price ID
3. **Yearly Price**: `$29.99/year` → Copy price ID

#### Pro Plan  
1. **Product Name**: `SharedTask Pro`
2. **Monthly Price**: `$9.99/month` → Copy price ID
3. **Yearly Price**: `$99.99/year` → Copy price ID

#### Team Plan
1. **Product Name**: `SharedTask Team`
2. **Monthly Price**: `$24.99/month` → Copy price ID  
3. **Yearly Price**: `$249.99/year` → Copy price ID

### **Step 2: Configure Environment Variables**

Create/update your `.env.local` file:

```bash
# Authentication
NEXTAUTH_SECRET=your-random-secret-string-here
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# CRITICAL: Add all 6 price IDs from Step 1
BASIC_PRICE_ID_MONTHLY=price_1234567890abcdef
BASIC_PRICE_ID_YEARLY=price_abcdef1234567890
PRO_PRICE_ID_MONTHLY=price_fedcba0987654321
PRO_PRICE_ID_YEARLY=price_567890fedcba1234
TEAM_PRICE_ID_MONTHLY=price_1234fedcba567890
TEAM_PRICE_ID_YEARLY=price_abcdef567890fedcba

# Optional
EMAIL_FROM="SharedTask <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=another-random-secret
```

### **Step 3: Reset Trial for Testing**

Since you've already used your trial, let's reset it for testing:

**Option A: Reset in Supabase Dashboard**
1. Go to **Supabase Dashboard** → **Table Editor** → **user_trials**
2. Find your trial record and **delete it**
3. This allows you to test the trial flow again

**Option B: Use SQL Query**
Run this in your **Supabase SQL Editor**:
```sql
-- Replace 'your-user-id' with your actual user ID
DELETE FROM user_trials WHERE user_id = 'your-user-id';
```

### **Step 4: Restart & Test**

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

## 🧪 **Testing Checklist**

After setup, test these flows:

### Trial Flow ✅
1. Go to `/pricing`
2. Select **"Start free trial"** (default)
3. Choose any plan → **"Try free for 14 days"**
4. Should redirect to trial welcome page

### Payment Flow ✅  
1. Go to `/pricing`
2. Toggle to **"Pay now"**
3. Choose any plan → **"Subscribe to [Plan]"**
4. Should redirect to Stripe checkout

### Both Monthly & Yearly ✅
1. Test **Monthly** billing cycle
2. Test **Yearly** billing cycle  
3. All 6 combinations should work

## 🔍 **Verify Setup**

### Check Environment Variables
Create this test file to verify your setup:

**`test-env.js`**:
```javascript
// Run: node test-env.js
console.log('🔍 Environment Check:')
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing')
console.log('PRO_MONTHLY:', process.env.PRO_PRICE_ID_MONTHLY ? '✅ Set' : '❌ Missing')
console.log('PRO_YEARLY:', process.env.PRO_PRICE_ID_YEARLY ? '✅ Set' : '❌ Missing')
console.log('BASIC_MONTHLY:', process.env.BASIC_PRICE_ID_MONTHLY ? '✅ Set' : '❌ Missing')
console.log('BASIC_YEARLY:', process.env.BASIC_PRICE_ID_YEARLY ? '✅ Set' : '❌ Missing')
console.log('TEAM_MONTHLY:', process.env.TEAM_PRICE_ID_MONTHLY ? '✅ Set' : '❌ Missing')
console.log('TEAM_YEARLY:', process.env.TEAM_PRICE_ID_YEARLY ? '✅ Set' : '❌ Missing')
```

### Expected Results
- ✅ **Trial signup**: Works for new/reset users
- ✅ **Payment flow**: All 6 plan/billing combinations work  
- ✅ **Error handling**: Clear messages for missing data
- ✅ **Redirects**: Proper success/error page routing

## 🆘 **Troubleshooting**

### "Price ID not found"
- ✅ Check all 6 price IDs are in `.env.local`
- ✅ Restart dev server after env changes
- ✅ Verify price IDs start with `price_`

### "Already used trial"  
- ✅ Delete trial record from `user_trials` table
- ✅ Or create new test user account

### "Failed to start trial"
- ✅ Apply `production-rls-policies.sql` 
- ✅ Add `SUPABASE_SERVICE_ROLE_KEY` to env
- ✅ Restart server

## 🎉 **Success!**

Once complete, you'll have:
- ✅ **Working trials**: 14-day free trials for new users
- ✅ **Working payments**: All plan/billing combinations  
- ✅ **Professional UX**: Smooth trial-to-paid conversion
- ✅ **Stripe integration**: Full webhook sync
- ✅ **Production ready**: Secure, scalable subscription system

**Your subscription system will be 100% functional!** 🚀

