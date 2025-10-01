# SharedTask Subscription & Pricing Setup Guide

This guide covers the complete setup and configuration of the subscription and pricing system for SharedTask.

## Overview

The subscription system implements:
- 14-day free trials (no credit card required)
- Stripe-powered paid subscriptions (Monthly/Yearly)
- Automated trial reminder emails (Day 10 and Day 14)
- Manual upgrade policy (no auto-conversion)
- Webhook-driven subscription state sync
- Access control based on subscription status

## Quick Setup Checklist

### 1. Database Setup

Run the subscription schema in your Supabase SQL Editor:

```bash
# Apply the subscription schema
psql -f subscription-schema.sql
```

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (create these in Stripe Dashboard)
BASIC_PRICE_ID_MONTHLY=price_...
BASIC_PRICE_ID_YEARLY=price_...
PRO_PRICE_ID_MONTHLY=price_...
PRO_PRICE_ID_YEARLY=price_...
TEAM_PRICE_ID_MONTHLY=price_...
TEAM_PRICE_ID_YEARLY=price_...

# Cron Job Security
CRON_SECRET=your-secure-random-string

# Email Configuration
EMAIL_FROM="SharedTask <noreply@sharedtask.com>"
EMAIL_REPLY_TO="support@sharedtask.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Email Service (choose one)
SENDGRID_API_KEY=SG.xxx
# OR
MAILGUN_API_KEY=xxx
# OR
AWS_SES_ACCESS_KEY_ID=xxx
AWS_SES_SECRET_ACCESS_KEY=xxx
```

### 3. Stripe Setup

1. **Create Products in Stripe Dashboard:**
   - Basic Plan ($2.99/month, $29.99/year)
   - Pro Plan ($9.99/month, $99.99/year)
   - Team Plan ($24.99/month, $249.99/year)

2. **Configure Webhooks:**
   - Endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

3. **Set up Billing Portal:**
   - Enable customer portal in Stripe Dashboard
   - Configure allowed features (cancel, update payment method, etc.)

### 4. Email Service Integration

Choose and configure one email service:

#### SendGrid (Recommended)
```bash
npm install @sendgrid/mail
```

#### Mailgun
```bash
npm install mailgun.js
```

#### AWS SES
```bash
npm install @aws-sdk/client-ses
```

### 5. Cron Job Setup

Set up daily cron job for trial reminders:

#### Vercel (Recommended)
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

#### External Service
```bash
# Daily at 9 AM UTC
curl -X POST https://your-domain.com/api/cron/trial-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

## Architecture Overview

### Database Schema

```
users
├── user_subscriptions (Stripe subscription data)
├── user_trials (14-day trial tracking)
└── email_logs (audit trail for all emails)
```

### API Endpoints

```
/api/checkout              # Trial start & Stripe checkout
/api/webhooks/stripe       # Stripe webhook handler
/api/subscription/state    # User subscription status
/api/subscription/features # Feature flags
/api/billing/portal       # Stripe billing portal
/api/cron/trial-reminders # Daily reminder job
```

### Key Components

- **Subscription Service** (`lib/subscription-service.ts`): Core business logic
- **Email Service** (`lib/email-service.ts`): Trial reminders & notifications
- **Access Control** (`lib/access-control.ts`): Feature gating & permissions
- **React Hooks** (`hooks/use-subscription.ts`): Client-side subscription state

## User Flow

### Trial Flow
1. User visits pricing page
2. Selects "Start Free Trial" 
3. Signs up/in if needed
4. Trial starts immediately (no Stripe)
5. Receives Day 5 and Day 7 reminder emails
6. Must manually subscribe before trial ends

### Paid Flow
1. User selects "Pay Now"
2. Redirected to Stripe Checkout
3. Payment processed
4. Webhook updates subscription status
5. User redirected to success page
6. Welcome email sent

### Access Control
- **Free**: 1 project, basic features
- **Trial**: All features for 14 days
- **Basic**: 3 projects, basic features
- **Pro**: Unlimited projects, advanced features
- **Team**: Everything + custom branding, API access

## Configuration

### Plan Configuration

Edit plans in `app/pricing/page.tsx`:

```typescript
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: billingCycle === 'monthly' ? 2.99 : 29.99,
    features: [...]
  }
  // ...
]
```

### Feature Flags

Modify feature access in `lib/access-control.ts`:

```typescript
export function getPlanLimits(state: UserSubscriptionState) {
  switch (plan) {
    case 'basic':
      return { maxProjects: 3, hasAdvancedFeatures: false }
    // ...
  }
}
```

### Email Templates

Customize emails in `lib/email-service.ts`:

```typescript
const EMAIL_TEMPLATES = {
  trial_day_5: {
    subject: '5 days left in your trial',
    getHtml: (data) => `...`
  }
}
```

## Monitoring & Operations

### Health Checks

Monitor these endpoints:
- `GET /api/subscription/state` - User subscription status
- `POST /api/cron/trial-reminders` - Daily reminder job
- Stripe webhook delivery in Dashboard

### Key Metrics

Track in your analytics:
- Trial conversion rate
- Churn rate by plan
- Email delivery success
- Webhook processing errors

### Troubleshooting

#### Common Issues

1. **Webhooks not working**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Verify endpoint URL in Stripe Dashboard
   - Check server logs for webhook errors

2. **Emails not sending**
   - Verify email service API key
   - Check email logs in database
   - Test email service integration

3. **Trial not starting**
   - Check user authentication
   - Verify database permissions
   - Check for existing trials/subscriptions

4. **Access control not working**
   - Verify subscription state API
   - Check feature flag logic
   - Test with different user states

### Database Maintenance

```sql
-- Clean up old email logs (older than 90 days)
DELETE FROM email_logs WHERE sent_at < NOW() - INTERVAL '90 days';

-- Find trials that need manual expiration
SELECT * FROM user_trials 
WHERE status = 'active' AND ends_at < NOW();

-- Check subscription sync issues
SELECT * FROM user_subscriptions 
WHERE updated_at < NOW() - INTERVAL '1 day';
```

## Security Considerations

1. **Webhook Security**: Always verify Stripe webhook signatures
2. **Cron Authentication**: Use secure `CRON_SECRET` for scheduled jobs
3. **Access Control**: Validate subscription state on every request
4. **Rate Limiting**: Implement rate limits on pricing/checkout endpoints
5. **Data Privacy**: Follow GDPR/CCPA for subscription data

## Testing

### Manual Testing

1. **Trial Flow**:
   ```bash
   # Start trial
   curl -X POST /api/checkout \
     -d '{"plan":"pro","start":"trial","billing":"monthly"}'
   
   # Check state
   curl /api/subscription/state
   ```

2. **Webhook Testing**:
   ```bash
   # Use Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```

3. **Email Testing**:
   ```bash
   # Trigger reminder job
   curl -X POST /api/cron/trial-reminders \
     -H "Authorization: Bearer your-cron-secret"
   ```

### Automated Testing

Key test scenarios:
- Trial start/expiration
- Subscription creation/cancellation
- Webhook processing
- Access control enforcement
- Email delivery

## Deployment

### Pre-deployment Checklist

- [ ] Database schema applied
- [ ] Environment variables set
- [ ] Stripe products created
- [ ] Webhook endpoints configured
- [ ] Email service tested
- [ ] Cron job scheduled
- [ ] Access control tested

### Post-deployment Verification

1. Test trial signup flow
2. Test paid subscription flow
3. Verify webhook delivery
4. Check email sending
5. Test access control
6. Monitor error logs

## Support & Maintenance

### Regular Tasks

- **Weekly**: Review subscription metrics
- **Monthly**: Clean up old email logs
- **Quarterly**: Review and update pricing
- **As needed**: Update email templates

### Scaling Considerations

- **High Volume**: Consider email service limits
- **Global Users**: Set up email localization
- **Enterprise**: Add SSO integration
- **API Usage**: Implement rate limiting

For additional support, see the troubleshooting section or contact the development team.

