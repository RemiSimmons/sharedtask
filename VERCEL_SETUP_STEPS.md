# ⚡ Quick Vercel Setup for app.sharedtask.ai

## Step-by-Step Checklist

### 1️⃣ Add Domain (5 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your main app project (SharedTask)
3. Click **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `app.sharedtask.ai`
6. Click **Add**

**DNS Configuration:**
Vercel will show you the DNS records. Add in your DNS provider:
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com (or value shown by Vercel)
TTL: 3600
```

7. Wait 5-15 minutes for DNS propagation
8. Vercel will automatically verify and provision SSL

---

### 2️⃣ Update Environment Variables (3 minutes)

1. In same project, go to **Settings** → **Environment Variables**
2. Find or add these variables:

#### NEXTAUTH_URL
- **Current value:** `https://sharedtask.ai` (or similar)
- **New value:** `https://app.sharedtask.ai`
- **Environment:** Production ✅
- Click **Save**

#### NEXT_PUBLIC_APP_URL
- **Current value:** May not exist or be different
- **New value:** `https://app.sharedtask.ai`
- **Environment:** Production ✅
- Click **Save**

**Important Notes:**
- ⚠️ Do NOT add trailing slash: ~~`https://app.sharedtask.ai/`~~
- ✅ Correct format: `https://app.sharedtask.ai`
- Leave other environment variables (Supabase, Stripe, etc.) unchanged

---

### 3️⃣ Deploy (5 minutes)

**Option A: Automatic (if you pushed changes to GitHub)**
1. Vercel will automatically deploy
2. Monitor deployment in **Deployments** tab

**Option B: Manual Redeploy**
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **...** menu → **Redeploy**
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

**Wait for deployment to complete:**
- ✅ Building...
- ✅ Deploying...
- ✅ Ready!

---

### 4️⃣ Verify Domain (2 minutes)

1. Go to **Settings** → **Domains**
2. Check that `app.sharedtask.ai` shows:
   - ✅ SSL: Active
   - ✅ Status: Valid
   
3. Visit `https://app.sharedtask.ai`
4. You should see your app load!

---

## 🎯 What You Should See

### In Vercel Domains Section:
```
✅ app.sharedtask.ai
   Status: Valid
   SSL: Active
   
Other domains (if you have them):
   yourdomain.vercel.app
```

### Environment Variables (Production):
```
NEXTAUTH_URL = https://app.sharedtask.ai
NEXT_PUBLIC_APP_URL = https://app.sharedtask.ai
NEXT_PUBLIC_SUPABASE_URL = [unchanged]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [unchanged]
SUPABASE_SERVICE_ROLE_KEY = [unchanged]
STRIPE_SECRET_KEY = [unchanged]
... [other variables unchanged]
```

---

## 🐛 Troubleshooting

### DNS Not Resolving
**Check propagation:**
```bash
nslookup app.sharedtask.ai
```
Or visit: https://dnschecker.org

**Solution:** Wait 5-15 more minutes. DNS can take time to propagate.

---

### SSL Certificate Pending
**Symptoms:** Browser shows "Not Secure" or SSL warning

**Solution:** 
1. Wait a few minutes for Vercel to provision SSL
2. Refresh the Domains page in Vercel
3. If still pending after 10 minutes, contact Vercel support

---

### Deployment Failed
**Symptoms:** Build fails with errors

**Solution:**
1. Check build logs in Vercel
2. Common issues:
   - Linter errors (should pass with current code)
   - Missing environment variables (check all are set)
   - Cache issues (try "Clear Cache and Redeploy")

---

### App Loads but Shows Errors
**Symptoms:** App loads but features don't work

**Solution:**
1. Open browser console (F12)
2. Look for errors:
   - CORS errors → Check code is deployed (refresh and wait)
   - Auth errors → Check `NEXTAUTH_URL` is set correctly
   - API errors → Check Supabase configuration (next step)

---

## ✅ Success Criteria

After completing these steps, you should have:

- ✅ `app.sharedtask.ai` resolves in browser
- ✅ Valid SSL certificate (green padlock)
- ✅ App loads without errors
- ✅ Can navigate to login/signup pages
- ⏳ Authentication may not work yet (needs Supabase setup)

---

## 📋 Next Steps

After completing Vercel setup:

1. **Configure Supabase** (see SUBDOMAIN_MIGRATION_GUIDE.md)
   - Add redirect URLs
   - Update site URL
   
2. **Update Stripe webhooks** (if applicable)
   - Change webhook URL to app subdomain
   
3. **Test authentication flows**
   - Signup
   - Login
   - Password reset
   
4. **Test all functionality**
   - Create projects
   - Share links
   - API calls

---

## 📞 Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Support:** support@vercel.com
- **DNS Issues:** Check with your DNS provider

---

## ⏰ Time Estimate

- Add domain: 2 min
- DNS propagation: 5-15 min
- Update env vars: 3 min
- Redeploy: 5 min
- Verify: 2 min
- **Total: ~20-30 minutes**

---

**Current Status:** Code is ready, follow these steps to deploy! 🚀

