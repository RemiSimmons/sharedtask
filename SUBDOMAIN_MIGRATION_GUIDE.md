# 🚀 Main App Subdomain Migration Guide

**Migration:** `sharedtask.ai` → `app.sharedtask.ai`

This guide walks you through migrating the main SharedTask application to the `app.sharedtask.ai` subdomain, while keeping the landing page at `sharedtask.ai`.

---

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] Access to Vercel dashboard for the main app project
- [ ] Access to Supabase dashboard
- [ ] Access to Resend email service
- [ ] `.env.local` file ready for updates
- [ ] Git repository pushed to latest version

---

## 📋 Part 1: Code Changes (✅ COMPLETED)

The following code changes have been made to the repository:

### 1. CORS Configuration Updated ✅
**File:** `lib/cors-middleware.ts`
- Added `https://app.sharedtask.ai` to allowed origins
- Maintains backward compatibility with existing domains

### 2. CSRF Protection Updated ✅
**File:** `lib/csrf-protection.ts`
- Added `https://app.sharedtask.ai` to allowed origins
- Security policies now include app subdomain

### 3. Landing Page Links Updated ✅
**File:** `app/project/[id]/page.tsx`
- "Create Your Own Project" button now points to `https://sharedtask.ai`
- Opens in new tab with proper security attributes

### 4. Footer Links Updated ✅
**File:** `components/powered-by-footer.tsx`
- "Upgrade" links now point to `https://sharedtask.ai/pricing`
- Opens in new tab for seamless user experience

### 5. Environment Variable Documentation Updated ✅
**File:** `env.example`
- Added clear comments for production domains
- Updated examples to use `https://app.sharedtask.ai`

---

## 🔧 Part 2: Vercel Configuration

### Step 1: Add Custom Domain to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your main app project
   - Go to **Settings** → **Domains**

2. **Add the Subdomain**
   - Click **Add Domain**
   - Enter: `app.sharedtask.ai`
   - Click **Add**

3. **Configure DNS (if not already done)**
   - Vercel will show you the DNS records needed
   - Add a **CNAME** record in your DNS provider:
     ```
     Type: CNAME
     Name: app
     Value: cname.vercel-dns.com
     TTL: 3600 (or automatic)
     ```

4. **Wait for Verification**
   - DNS propagation usually takes 5-15 minutes
   - Vercel will automatically verify the domain
   - You'll see a green checkmark when ready

### Step 2: Update Environment Variables in Vercel

1. **Go to Settings → Environment Variables**

2. **Update or Add These Variables:**

   ```bash
   # Update NEXTAUTH_URL for all environments
   NEXTAUTH_URL=https://app.sharedtask.ai
   
   # Add or update NEXT_PUBLIC_APP_URL
   NEXT_PUBLIC_APP_URL=https://app.sharedtask.ai
   ```

3. **Apply to Environments:**
   - ✅ Production
   - ⚠️ Preview (optional, keep as Vercel preview URLs)
   - ⚠️ Development (keep as localhost)

4. **Save Changes**

### Step 3: Redeploy the Application

1. **Trigger a new deployment:**
   - Go to **Deployments** tab
   - Click on latest deployment
   - Click **Redeploy** button
   - Select **Use existing Build Cache** (faster)

2. **Or push a new commit:**
   ```bash
   git add .
   git commit -m "Configure app subdomain"
   git push origin main
   ```

3. **Monitor the deployment**
   - Wait for build to complete
   - Check for any errors in build logs

---

## 🗄️ Part 3: Supabase Configuration

### Step 1: Update Redirect URLs

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **URL Configuration**

2. **Add New Site URL:**
   ```
   https://app.sharedtask.ai
   ```

3. **Update Redirect URLs:**
   - Add to **Redirect URLs** list:
     ```
     https://app.sharedtask.ai/**
     https://app.sharedtask.ai/auth/callback
     https://app.sharedtask.ai/auth/verify-email
     https://app.sharedtask.ai/auth/reset-password
     ```

4. **Keep existing URLs for backward compatibility:**
   - Keep `https://sharedtask.ai/**` temporarily
   - Keep `http://localhost:3000/**` for development

5. **Save Changes**

### Step 2: Update RLS Policies (if domain-specific)

Only if you have domain-specific RLS policies:

```sql
-- Check for any hardcoded domain references
SELECT * FROM pg_policies 
WHERE definition LIKE '%sharedtask.ai%';

-- Update if needed (example)
-- ALTER POLICY ... ON table_name ...
```

Most likely, your RLS policies don't reference domains, so this step can be skipped.

---

## 📧 Part 4: Resend Email Configuration

### Step 1: Update Email Templates (if needed)

If you have any hardcoded domain links in email templates, update them:

1. **Check files:**
   - `lib/email-service.ts` ✅ (Already uses environment variables)
   - Any custom email templates

2. **Verify environment variable is used:**
   ```typescript
   // ✅ Good - uses environment variable
   const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
   
   // ❌ Bad - hardcoded domain
   const resetLink = `https://sharedtask.ai/auth/reset-password?token=${token}`
   ```

3. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://app.sharedtask.ai
   NEXTAUTH_URL=https://app.sharedtask.ai
   ```

### Step 2: Test Email Links

1. **Trigger a test email:**
   - Password reset
   - Email verification
   - Support contact form

2. **Verify links point to `app.sharedtask.ai`**

3. **Test clicking the links**

---

## 🔄 Part 5: Local Environment Updates

### Update Your Local `.env.local`

For local development, **keep localhost**:

```bash
# .env.local (for local development)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=SharedTask Support <support@sharedtask.ai>
EMAIL_REPLY_TO=your_email@domain.com
```

### Test Locally

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

---

## ✅ Part 6: Testing Checklist

After deployment, test all critical flows:

### Authentication Flow
- [ ] User signup at `app.sharedtask.ai/signup`
- [ ] User login at `app.sharedtask.ai/login`
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Session persistence (refresh page, still logged in)
- [ ] Logout functionality

### Email Links
- [ ] Password reset emails link to `app.sharedtask.ai`
- [ ] Verification emails link to `app.sharedtask.ai`
- [ ] Support emails have correct reply-to address
- [ ] All email links are clickable and work

### Navigation Between Domains
- [ ] Landing page CTAs (`sharedtask.ai`) redirect to app
- [ ] App "Create Your Own Project" links to landing page
- [ ] "Upgrade" buttons link to landing page pricing
- [ ] Logo on project pages links to landing page

### Project Functionality
- [ ] Create new project
- [ ] View existing project
- [ ] Edit project settings
- [ ] Share project link
- [ ] Project links work for non-logged-in users
- [ ] Real-time updates work

### API Endpoints
- [ ] `/api/projects` - CRUD operations
- [ ] `/api/auth/*` - Authentication endpoints
- [ ] `/api/checkout` - Stripe checkout
- [ ] `/api/webhooks/stripe` - Webhook handling
- [ ] `/api/support/*` - Support endpoints

### Security
- [ ] CORS works correctly (no console errors)
- [ ] CSRF protection active (POST/PUT/DELETE protected)
- [ ] No mixed content warnings (HTTP/HTTPS)
- [ ] SSL certificate valid for `app.sharedtask.ai`

### Mobile Testing
- [ ] Mobile signup/login flow
- [ ] Mobile navigation
- [ ] Responsive design on app subdomain
- [ ] Touch interactions work

---

## 🎯 Part 7: Final State Verification

After completing all steps, verify:

### Domain Structure
✅ `sharedtask.ai` → Landing page (separate Vercel project)
✅ `www.sharedtask.ai` → Redirects to landing page
✅ `app.sharedtask.ai` → Main application (this project)

### User Journey
1. User visits `sharedtask.ai` (landing page)
2. Clicks "Get Started" or "Sign Up"
3. Redirected to `app.sharedtask.ai/signup`
4. Creates account
5. Uses application at `app.sharedtask.ai`
6. Can return to landing page via logo/links

### Links and Redirects
✅ Landing page CTAs → `app.sharedtask.ai`
✅ App "Create Project" button → `sharedtask.ai`
✅ "Upgrade" links → `sharedtask.ai/pricing`
✅ Email links → `app.sharedtask.ai`
✅ Logo clicks → `sharedtask.ai`

---

## 🐛 Troubleshooting

### Issue: DNS not resolving

**Solution:**
```bash
# Check DNS propagation
nslookup app.sharedtask.ai

# Or use online tool
# https://dnschecker.org
```

Wait 5-15 minutes and try again.

### Issue: SSL Certificate Error

**Solution:**
- Vercel automatically provisions SSL
- Wait a few minutes after domain verification
- Check Vercel dashboard for SSL status
- Contact Vercel support if it doesn't resolve

### Issue: Authentication Redirect Loop

**Symptoms:** Login redirects back to login page repeatedly

**Solution:**
1. Check `NEXTAUTH_URL` in Vercel environment variables
2. Must be: `https://app.sharedtask.ai` (no trailing slash)
3. Redeploy after changing
4. Clear browser cookies and try again

### Issue: Email Links Go to Wrong Domain

**Solution:**
1. Verify `.env.local` has correct `NEXTAUTH_URL`
2. Check Vercel environment variables
3. Redeploy application
4. Test with new email (old emails have old links)

### Issue: CORS Errors in Browser Console

**Symptoms:** `Access to fetch at '...' has been blocked by CORS policy`

**Solution:**
1. Check `lib/cors-middleware.ts` includes `app.sharedtask.ai`
2. Verify changes are deployed
3. Clear browser cache
4. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Session Not Persisting

**Solution:**
1. Check browser cookie settings
2. Verify cookies are set for `.sharedtask.ai` domain
3. In NextAuth config, set:
   ```typescript
   cookies: {
     sessionToken: {
       name: '__Secure-next-auth.session-token',
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: true,
         domain: '.sharedtask.ai' // Allow across subdomains
       }
     }
   }
   ```

### Issue: Stripe Webhooks Failing

**Solution:**
1. Update webhook URL in Stripe Dashboard
2. Change from `https://sharedtask.ai/api/webhooks/stripe`
3. To: `https://app.sharedtask.ai/api/webhooks/stripe`
4. Generate new webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 📊 Monitoring After Migration

### Week 1 Checklist
- [ ] Monitor error rates in Vercel
- [ ] Check Supabase auth logs for issues
- [ ] Review email delivery logs in Resend
- [ ] Monitor user feedback/support tickets
- [ ] Check analytics for drop-offs

### Tools to Monitor
- **Vercel Dashboard:** Deployment errors, runtime errors
- **Supabase Dashboard:** Database errors, auth issues
- **Resend Dashboard:** Email delivery rates
- **Browser Console:** Client-side errors
- **Stripe Dashboard:** Payment issues

---

## ⏰ Estimated Timeline

| Task | Time Required |
|------|---------------|
| Add domain in Vercel | 2 minutes |
| DNS propagation wait | 5-15 minutes |
| Update environment variables | 3 minutes |
| Redeploy application | 5 minutes |
| Update Supabase settings | 5 minutes |
| Verify email configuration | 2 minutes |
| Test authentication flows | 10 minutes |
| Test all user journeys | 15 minutes |
| Monitor and verify | 10 minutes |
| **TOTAL** | **~1 hour** |

---

## 🎊 Success Criteria

Migration is successful when:

✅ `app.sharedtask.ai` loads without errors
✅ Users can sign up and log in
✅ Email links point to app subdomain
✅ Navigation between landing and app works seamlessly
✅ All API endpoints respond correctly
✅ No CORS or CSRF errors
✅ SSL certificate is valid
✅ Mobile experience works properly
✅ No spike in error rates
✅ Existing users can still access their accounts

---

## 📞 Support

If you encounter any issues during migration:

1. **Check this guide's Troubleshooting section**
2. **Review Vercel deployment logs**
3. **Check Supabase auth logs**
4. **Contact Vercel support** (if domain/SSL issues)
5. **Contact Supabase support** (if auth issues)

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong and you need to rollback:

1. **In Vercel:**
   - Go to Deployments
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

2. **In Supabase:**
   - Keep old redirect URLs active
   - No changes needed if you kept old URLs

3. **DNS:**
   - Keep DNS records as-is
   - Both domains can work simultaneously

4. **Environment Variables:**
   - Revert to previous values
   - Redeploy

**Note:** It's safe to keep both domains active temporarily. You can transition gradually.

---

## 📝 Additional Notes

### Backward Compatibility
- Old `sharedtask.ai` URLs should redirect to `app.sharedtask.ai`
- Set up redirects in Vercel if needed
- Keep old Supabase redirect URLs active for 1-2 weeks

### Future Considerations
- Consider setting up monitoring alerts
- Document any custom configurations
- Update any external integrations
- Update Google/social auth redirect URIs if applicable

---

## ✨ Next Steps After Migration

Once the migration is complete and verified:

1. **Update Documentation**
   - Update README.md with new URLs
   - Update any setup guides
   - Update API documentation

2. **Update External Services**
   - Google OAuth (if used)
   - GitHub OAuth (if used)
   - Other third-party integrations

3. **Marketing Updates**
   - Update any marketing materials
   - Update social media links
   - Update email signatures

4. **SEO Considerations**
   - Submit new sitemap to Google
   - Update robots.txt if needed
   - Set up analytics tracking

---

**Migration prepared on:** October 15, 2025
**Status:** Ready to execute
**Estimated completion:** ~1 hour

Good luck with your migration! 🚀

