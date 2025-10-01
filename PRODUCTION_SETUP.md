# 🚀 Production-Ready Setup Guide

Congratulations! Your subscription system is working. Here's how to make it production-ready.

## ✅ **Current Status**
- ✅ Trial system working (14-day free trials)
- ✅ Database tables created
- ✅ Authentication working
- ✅ API endpoints functional

## 🛡️ **Step 1: Secure Database (IMPORTANT)**

Your database currently has RLS disabled for development. For production security:

### 1. Get Your Service Role Key
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy the **service_role** key (starts with `eyJ...`)
3. **⚠️ NEVER expose this key publicly** - it bypasses all security

### 2. Add Service Role Key to Environment
```bash
# Add to your .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_service_key_here
```

### 3. Apply Production RLS Policies
Run `production-rls-policies.sql` in your Supabase SQL Editor to:
- ✅ Re-enable Row Level Security
- ✅ Set up proper access policies
- ✅ Allow users to see only their own data
- ✅ Allow service role to manage subscriptions

### 4. Restart Your Application
```bash
# Stop and restart to load the new environment variable
npm run dev
```

## 💳 **Step 2: Set Up Stripe Products**

### 1. Create Products in Stripe Dashboard
Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

**Basic Plan**:
- Name: `SharedTask Basic`
- Monthly: $2.99/month → Copy price ID
- Yearly: $29.99/year → Copy price ID

**Pro Plan**:
- Name: `SharedTask Pro` 
- Monthly: $9.99/month → Copy price ID
- Yearly: $99.99/year → Copy price ID

**Team Plan**:
- Name: `SharedTask Team`
- Monthly: $24.99/month → Copy price ID
- Yearly: $249.99/year → Copy price ID

### 2. Add Price IDs to Environment
```bash
# Add to your .env.local
BASIC_PRICE_ID_MONTHLY=price_1234567890abcdef
BASIC_PRICE_ID_YEARLY=price_0987654321fedcba
PRO_PRICE_ID_MONTHLY=price_abcdef1234567890
PRO_PRICE_ID_YEARLY=price_fedcba0987654321
TEAM_PRICE_ID_MONTHLY=price_567890abcdef1234
TEAM_PRICE_ID_YEARLY=price_321fedcba0987654
```

### 3. Set Up Webhooks
1. **Stripe Dashboard** → **Webhooks** → **Add endpoint**
2. **URL**: `https://your-domain.com/api/webhooks/stripe`
3. **Events**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret** → Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 4. Enable Customer Portal
1. **Stripe Dashboard** → **Settings** → **Billing**
2. **Enable customer portal**
3. **Configure**: Allow payment method updates, invoice history, cancellations

## 📧 **Step 3: Set Up Email Service**

### Option 1: SendGrid (Recommended)
```bash
npm install @sendgrid/mail

# Add to .env.local
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM="SharedTask <noreply@yourdomain.com>"
```

Update `lib/email-service.ts`:
```typescript
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  await sgMail.send({
    to,
    from: EMAIL_CONFIG.from,
    subject,
    html,
    text
  })
}
```

### Option 2: Other Services
- **Resend**: Modern, developer-friendly
- **Mailgun**: Reliable, good deliverability  
- **AWS SES**: Cost-effective for high volume

## ⏰ **Step 4: Set Up Cron Jobs**

### For Vercel (Recommended)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### For Other Platforms
Set up daily cron job:
```bash
# Add to your server's crontab (runs daily at 9 AM)
0 9 * * * curl -X POST https://your-domain.com/api/cron/trial-reminders \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

Add to `.env.local`:
```bash
CRON_SECRET=your-secure-random-string-here
```

## 🔐 **Step 5: Complete Environment Variables**

Your production `.env.local` should have:

```bash
# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key  # Use sk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key

# Stripe Price IDs
BASIC_PRICE_ID_MONTHLY=price_your_basic_monthly
BASIC_PRICE_ID_YEARLY=price_your_basic_yearly
PRO_PRICE_ID_MONTHLY=price_your_pro_monthly
PRO_PRICE_ID_YEARLY=price_your_pro_yearly
TEAM_PRICE_ID_MONTHLY=price_your_team_monthly
TEAM_PRICE_ID_YEARLY=price_your_team_yearly

# Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM="SharedTask <noreply@yourdomain.com>"
EMAIL_REPLY_TO="support@yourdomain.com"
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Security
CRON_SECRET=your-secure-random-string
```

## 🚀 **Step 6: Deploy to Production**

### Pre-deployment Checklist
- [ ] Service role key added to environment
- [ ] RLS policies applied
- [ ] Stripe products created
- [ ] Stripe webhooks configured
- [ ] Email service set up
- [ ] Cron jobs scheduled
- [ ] All environment variables set

### Test in Production
1. **Trial Flow**: Sign up → Start trial → Check database
2. **Payment Flow**: Try "Pay Now" → Complete Stripe checkout
3. **Webhooks**: Verify subscription status updates
4. **Emails**: Check reminder emails are queued (Day 5/7)

## 📊 **Step 7: Monitor & Maintain**

### Key Metrics to Track
- Trial-to-paid conversion rate
- Churn rate by plan
- Email delivery success rate
- Webhook processing success

### Regular Maintenance
- **Weekly**: Review subscription metrics
- **Monthly**: Clean up old email logs
- **Quarterly**: Review and optimize pricing

## 🆘 **Troubleshooting**

### Common Issues
1. **"Failed to start trial"** → Check service role key is set
2. **"Webhook signature failed"** → Verify webhook secret
3. **Emails not sending** → Check email service API key
4. **RLS errors** → Ensure policies are applied correctly

### Support Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🎉 **You're Ready for Production!**

Your subscription system is now:
- ✅ **Secure**: Proper RLS policies protecting user data
- ✅ **Scalable**: Webhook-driven state management
- ✅ **Reliable**: Automated email reminders and trial management
- ✅ **Professional**: Complete payment and billing flow

**Next Steps**: Deploy to your production environment and start growing your business! 🚀

