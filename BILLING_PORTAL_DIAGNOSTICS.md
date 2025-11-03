# 🔍 Billing Portal Error Diagnostics

## Current Issue
Getting error: **"Failed to create billing portal session"**

---

## ✅ Step 1: Check Terminal Logs

After restarting the server and clicking "Manage Billing", look at your **terminal** for these debug logs:

### What to Look For:

#### ✅ **Good Output (Should see this):**
```
🔍 Billing Portal Debug: {
  userId: 'bda789e8-0256-4234-8b0f-d175a55da03f',
  hasActiveSubscription: false,
  subscription: {
    status: 'active',  // or 'past_due'
    stripe_customer_id: 'cus_TABJPaPH2KCgXL',
    plan: 'basic'
  }
}
✅ Found Stripe customer ID: cus_TABJPaPH2KCgXL
🔄 Creating Stripe billing portal session...
```

#### ❌ **Bad Output (Problem):**
```
🔍 Billing Portal Debug: {
  userId: 'bda789e8-0256-4234-8b0f-d175a55da03f',
  hasActiveSubscription: false,
  subscription: 'NO SUBSCRIPTION'
}
❌ No Stripe customer ID found
```

---

## 🎯 Step 2: Based on Terminal Output

### Scenario A: No Subscription Found
**Terminal shows:** `subscription: 'NO SUBSCRIPTION'`

**Fix:** The subscription record is not in the database. Run:
```bash
node fix-stripe-connection.js cus_TABJPaPH2KCgXL sub_1SDqwkCpMnKkZ7kq4LInbs5T
```
*(Already done, shouldn't be this)*

---

### Scenario B: Subscription Found but Stripe Portal Fails
**Terminal shows:** 
- ✅ `subscription: { ... }` 
- ✅ `Found Stripe customer ID`
- Then **error** when creating portal session

**Likely causes:**

#### 1. **Stripe Billing Portal Not Configured** ⚠️ MOST COMMON

The Stripe Customer Portal needs to be enabled in your Stripe Dashboard.

**How to Fix:**
1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Click **"Activate Test Link"** or **"Activate"**
3. Configure portal settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to view invoices
   - ✅ (Optional) Allow cancellation
4. Click **"Save"**

**Error if not configured:**
```
Error: The Customer Portal is not available for this Stripe account
```

---

#### 2. **Wrong Stripe API Key**

**Symptoms:** 
```
Error: Invalid API Key provided
```

**Fix:** Check `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_... # Test mode key
# OR
STRIPE_SECRET_KEY=sk_live_... # Live mode key
```

Make sure it matches the mode your customer is in (test vs live).

---

#### 3. **Customer ID Format Invalid**

**Symptoms:**
```
Error: No such customer: 'cus_...'
```

**Fix:** The customer ID in database doesn't match Stripe. Verify in Stripe dashboard:
1. Go to: https://dashboard.stripe.com/customers
2. Search for: `cus_TABJPaPH2KCgXL`
3. Make sure it exists

---

## 🔧 Step 3: Quick Test Commands

### Test 1: Verify Database Has Correct Data
```bash
node check-user.js
```

**Expected output:**
```
✅ Stripe Customer ID: cus_TABJPaPH2KCgXL
✅ Stripe Subscription ID: sub_1SDqwkCpMnKkZ7kq4LInbs5T
```

---

### Test 2: Check Stripe Connection
Create a test file `test-stripe-portal.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

async function testPortal() {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: 'cus_TABJPaPH2KCgXL',
      return_url: 'http://localhost:3000/account/billing'
    })
    console.log('✅ Success!', session.url)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testPortal()
```

Run:
```bash
node test-stripe-portal.js
```

---

## 📋 Checklist

Go through this checklist:

- [ ] Server restarted (`npm run dev`)
- [ ] Page refreshed in browser
- [ ] Terminal shows debug logs when clicking "Manage Billing"
- [ ] Database has Stripe customer ID (run `node check-user.js`)
- [ ] Stripe billing portal is **activated** in Stripe dashboard
- [ ] Using correct Stripe API key (test vs live)
- [ ] Customer exists in Stripe dashboard

---

## 🎯 Most Likely Issue

**90% chance:** Stripe Customer Portal is not activated in your Stripe dashboard.

**Quick fix:**
1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Click **"Activate"**
3. Save settings
4. Try again

---

## 📞 What to Share

If still not working, share:

1. **Terminal output** after clicking "Manage Billing"
2. **Console error details** (full error message)
3. **Stripe mode** (test or live?)
4. **Portal activation status** (screenshot of Stripe settings)

---

## ✨ Expected Working Flow

When everything is configured correctly:

**Terminal:**
```
🔍 Billing Portal Debug: { subscription: {...} }
✅ Found Stripe customer ID: cus_TABJPaPH2KCgXL
🔄 Creating Stripe billing portal session...
✅ Billing portal session created: https://billing.stripe.com/session/...
```

**Browser:**
- Redirects to Stripe Customer Portal
- Shows payment method update form
- Can view invoices
- Can manage subscription

---

## 🚀 Next Steps

1. **Restart dev server** (already done)
2. **Refresh browser**
3. **Click "Manage Billing"**
4. **Check terminal for debug logs**
5. **Follow diagnostics based on output**

Most likely you just need to activate the Stripe Customer Portal in your dashboard!

