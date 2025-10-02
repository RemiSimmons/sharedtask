# Stripe Products Setup Guide

This guide walks you through setting up the required Stripe products and prices for SharedTask.

## Step 1: Create Products in Stripe Dashboard

Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products) and create these products:

### 1. Basic Plan
- **Name**: SharedTask Basic
- **Description**: Perfect for small teams and personal projects
- **Statement Descriptor**: SharedTask Basic

### 2. Pro Plan  
- **Name**: SharedTask Pro
- **Description**: Ideal for growing teams and professional use
- **Statement Descriptor**: SharedTask Pro

### 3. Team Plan
- **Name**: SharedTask Team  
- **Description**: Built for large teams and enterprise needs
- **Statement Descriptor**: SharedTask Team

## Step 2: Create Prices for Each Product

For each product, create both monthly and yearly prices:

### Basic Plan Prices
- **Monthly**: $2.99/month
  - Billing period: Monthly
  - Price ID: `price_basic_monthly` (copy this ID)
- **Yearly**: $29.99/year  
  - Billing period: Yearly
  - Price ID: `price_basic_yearly` (copy this ID)

### Pro Plan Prices
- **Monthly**: $9.99/month
  - Billing period: Monthly
  - Price ID: `price_pro_monthly` (copy this ID)
- **Yearly**: $99.99/year
  - Billing period: Yearly  
  - Price ID: `price_pro_yearly` (copy this ID)

### Team Plan Prices
- **Monthly**: $24.99/month
  - Billing period: Monthly
  - Price ID: `price_team_monthly` (copy this ID)
- **Yearly**: $249.99/year
  - Billing period: Yearly
  - Price ID: `price_team_yearly` (copy this ID)

## Step 3: Update Environment Variables

Add the price IDs to your `.env.local` file:

```bash
# Stripe Price IDs - Replace with your actual price IDs
BASIC_PRICE_ID_MONTHLY=price_1234567890abcdef
BASIC_PRICE_ID_YEARLY=price_0987654321fedcba
PRO_PRICE_ID_MONTHLY=price_abcdef1234567890
PRO_PRICE_ID_YEARLY=price_fedcba0987654321
TEAM_PRICE_ID_MONTHLY=price_567890abcdef1234
TEAM_PRICE_ID_YEARLY=price_321fedcba0987654
```

## Step 4: Configure Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Step 5: Configure Customer Portal

1. Go to [Stripe Dashboard > Settings > Billing](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the customer portal
3. Configure these features:
   - ✅ Update payment method
   - ✅ Update billing address
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ✅ Pause subscription (optional)
   - ✅ Switch plans (optional)

## Step 6: Test Configuration

### Test Mode Setup
1. Use test API keys during development
2. Create test products with test prices
3. Use test webhook endpoints
4. Test with Stripe's test card numbers

### Test Card Numbers
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Step 7: Production Checklist

Before going live:

- [ ] Switch to live API keys
- [ ] Update webhook endpoint to production URL
- [ ] Test live payment flow
- [ ] Verify webhook delivery
- [ ] Test customer portal access
- [ ] Confirm email notifications work

## Pricing Strategy Notes

### Current Pricing Structure
- **Basic**: $2.99/month ($29.99/year) - 17% savings yearly
- **Pro**: $9.99/month ($99.99/year) - 17% savings yearly  
- **Team**: $24.99/month ($249.99/year) - 17% savings yearly

### Pricing Considerations
- Competitive with similar SaaS tools
- Clear value progression between tiers
- Yearly discount encourages longer commitments
- Team plan positioned for enterprise value

### Future Pricing Updates
To update pricing:
1. Create new prices in Stripe (don't modify existing)
2. Update environment variables
3. Update pricing display in app
4. Existing customers keep their current prices

## Troubleshooting

### Common Issues

**Price IDs not working**
- Verify price IDs are copied correctly
- Check that prices are active in Stripe
- Ensure you're using the right mode (test vs live)

**Webhooks not receiving events**
- Check webhook URL is accessible
- Verify webhook secret is correct
- Check Stripe webhook delivery logs

**Customer portal not working**
- Ensure portal is enabled in Stripe settings
- Check customer has valid subscription
- Verify API keys have correct permissions

### Support Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [SharedTask Support](mailto:support@sharedtask.ai)

