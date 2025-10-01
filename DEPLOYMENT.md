# Deployment Guide

This guide covers deploying SharedTask to production.

## 🚀 Quick Deployment (Vercel - Recommended)

### 1. Prepare Your Repository

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SharedTask production-ready app"

# Push to GitHub
git remote add origin https://github.com/yourusername/sharedtask.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your SharedTask repository

2. **Configure Environment Variables**
   Add these in Vercel dashboard → Settings → Environment Variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

   # NextAuth
   NEXTAUTH_URL=https://yourdomain.vercel.app
   NEXTAUTH_SECRET=your_production_nextauth_secret

   # Stripe
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_stripe_webhook_secret

   # Resend
   RESEND_API_KEY=re_your_production_resend_api_key

   # App
   NODE_ENV=production
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://yourproject.vercel.app`

### 3. Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

## 🔧 Production Setup Checklist

### Database (Supabase)
- [ ] Create production Supabase project
- [ ] Run database migrations
- [ ] Enable Row Level Security (RLS)
- [ ] Configure database backups
- [ ] Set up connection pooling

### Stripe
- [ ] Switch to live mode
- [ ] Create live products and prices
- [ ] Configure webhook endpoints
- [ ] Test payment flows
- [ ] Set up Stripe dashboard monitoring

### Email (Resend)
- [ ] Verify production domain
- [ ] Test email delivery
- [ ] Configure email templates
- [ ] Set up email monitoring

### Security
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure CSP (Content Security Policy)

### Monitoring
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

## 🗄️ Database Migration

### 1. Create Production Database

```sql
-- Run these in your production Supabase SQL editor:

-- 1. Main schema
\i database-schema.sql

-- 2. Subscription schema  
\i subscription-schema.sql

-- 3. Production RLS policies
\i production-rls-policies.sql

-- 4. Performance indexes
\i database-performance-indexes.sql
```

### 2. Verify Database Setup

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXTAUTH_URL` | App URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | `random-secret-key` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_APP_URL` | App URL for links | `NEXTAUTH_URL` |

## 🚨 Post-Deployment Tasks

### 1. Test Core Functionality
- [ ] User registration/login
- [ ] Task creation and management
- [ ] Team collaboration features
- [ ] Subscription flow
- [ ] Payment processing
- [ ] Email notifications

### 2. Performance Optimization
- [ ] Enable CDN
- [ ] Optimize images
- [ ] Configure caching
- [ ] Monitor Core Web Vitals

### 3. Security Hardening
- [ ] Enable security headers
- [ ] Configure CSP
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable DDoS protection

### 4. Backup Strategy
- [ ] Database backups
- [ ] Code repository backups
- [ ] Environment variable backups
- [ ] Document recovery procedures

## 🔍 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Check build logs
vercel logs your-deployment-url

# Common fixes
npm install
npm run build
```

**Database Connection Issues**
- Verify Supabase URL and keys
- Check network connectivity
- Verify RLS policies

**Stripe Webhook Issues**
- Verify webhook endpoint URL
- Check webhook secret
- Test webhook events

**Email Delivery Issues**
- Verify Resend API key
- Check domain verification
- Test email templates

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 📊 Monitoring & Maintenance

### Daily Tasks
- [ ] Check application uptime
- [ ] Monitor error rates
- [ ] Review user registrations
- [ ] Check payment processing

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check database performance
- [ ] Review security logs
- [ ] Update dependencies

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Cost optimization review

---

**Need Help?** Check the troubleshooting section or create an issue in the GitHub repository.
