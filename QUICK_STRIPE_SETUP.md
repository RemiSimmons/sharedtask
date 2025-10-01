# 🚀 Quick Stripe Setup (5 Minutes)

## ❌ **Current Issue**
**Error**: "Price ID not found for pro monthly"  
**Cause**: Stripe price IDs are not configured in your environment variables.

## ✅ **Quick Fix (2 Steps)**

### **Step 1: Create Test Products in Stripe**

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/products
2. **Create 3 Products** with these exact settings:

#### **Basic Plan**
- **Name**: `SharedTask Basic`
- **Pricing**:
  - Monthly: `$2.99/month` → Copy the price ID (starts with `price_`)
  - Yearly: `$29.99/year` → Copy the price ID

#### **Pro Plan** 
- **Name**: `SharedTask Pro`
- **Pricing**:
  - Monthly: `$9.99/month` → Copy the price ID
  - Yearly: `$99.99/year` → Copy the price ID

#### **Team Plan**
- **Name**: `SharedTask Team`  
- **Pricing**:
  - Monthly: `$24.99/month` → Copy the price ID
  - Yearly: `$249.99/year` → Copy the price ID

### **Step 2: Update Your Environment Variables**

1. **Copy `env-example.txt`** to `.env.local`
2. **Fill in your Stripe price IDs**:

```bash
# Replace these with your actual price IDs from Stripe
BASIC_PRICE_ID_MONTHLY=price_1234567890abcdef
BASIC_PRICE_ID_YEARLY=price_abcdef1234567890  
PRO_PRICE_ID_MONTHLY=price_fedcba0987654321
PRO_PRICE_ID_YEARLY=price_567890fedcba1234
TEAM_PRICE_ID_MONTHLY=price_1234fedcba567890
TEAM_PRICE_ID_YEARLY=price_abcdef567890fedcba
```

3. **Restart your dev server**:
```bash
# Stop current server (Ctrl+C) then restart
npm run dev
```

## 🎯 **That's It!**

After these 2 steps:
- ✅ Trial signup will work
- ✅ "Pay Now" will work  
- ✅ All pricing plans will be functional

## 📋 **Full Environment Variables Needed**

Copy this to your `.env.local` and replace with your actual values:

```bash
# Authentication  
NEXTAUTH_SECRET=generate-a-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# Supabase (from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (from your Stripe dashboard)  
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Stripe Price IDs (created above)
BASIC_PRICE_ID_MONTHLY=price_your_basic_monthly
BASIC_PRICE_ID_YEARLY=price_your_basic_yearly
PRO_PRICE_ID_MONTHLY=price_your_pro_monthly  
PRO_PRICE_ID_YEARLY=price_your_pro_yearly
TEAM_PRICE_ID_MONTHLY=price_your_team_monthly
TEAM_PRICE_ID_YEARLY=price_your_team_yearly

# Optional (for production)
EMAIL_FROM="SharedTask <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=another-random-secret
```

## 🆘 **Need Help?**

If you get stuck:
1. **Check Stripe Dashboard** → Products → Make sure all 6 prices are created
2. **Check `.env.local`** → Make sure all price IDs are copied correctly  
3. **Restart dev server** → Environment changes require restart

**Once this is done, your subscription system will be 100% functional!** 🚀

