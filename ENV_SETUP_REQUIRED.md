# 🚨 CRITICAL: Environment Variable Missing

## Error You're Seeing

```
CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY is required for admin operations.
This key must be set in environment variables for the application to function properly.
```

---

## 🔍 What Happened

As part of the security fixes, we removed the insecure fallback to the anonymous key for admin operations. Now the application **explicitly requires** `SUPABASE_SERVICE_ROLE_KEY` to be set.

This is a **good security practice** but it means you need to add this key to your environment variables.

---

## ✅ How to Fix (2 minutes)

### **Step 1: Get Your Service Role Key from Supabase**

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click "Settings" (gear icon) in the left sidebar
4. Click "API"
5. Scroll down to "Project API keys"
6. Find "**service_role**" key (labeled "secret")
7. Click "Copy" to copy the key

**⚠️ IMPORTANT:** This is a **secret key** - never commit it to git or share it publicly!

---

### **Step 2: Add to Your .env.local File**

Open your `.env.local` file and add or update this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Replace with your actual service role key from Step 1)

---

### **Step 3: Restart Your Development Server**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 📋 Complete .env.local Example

Your `.env.local` file should look like this:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← ADD THIS!

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Email Configuration
RESEND_API_KEY=re_...

# Email Routing Configuration
EMAIL_FROM=SharedTask Support <support@sharedtask.ai>
EMAIL_REPLY_TO=contact@remisimmons.com

# App Configuration
NODE_ENV=development
```

---

## 🔐 Security Notes

### **What is the Service Role Key?**

- **Purpose:** Bypasses Row Level Security (RLS) for admin operations
- **Used for:** Server-side admin operations, user management, data queries
- **Security:** Should ONLY be used on the server, never exposed to the client
- **Access Level:** Full database access (like a superuser)

### **Why the Change?**

Previously, the code had a dangerous fallback:

```typescript
// OLD (INSECURE):
const key = supabaseServiceKey || supabaseAnonKey  // ❌ Falls back to weak key
```

Now it's explicit:

```typescript
// NEW (SECURE):
if (!supabaseServiceKey) {
  throw new Error('Service key required!')  // ✅ Fails loudly if missing
}
```

This ensures admin operations **always** use the proper privileged key.

---

## 🧪 After Setup - Test It

Once you've added the key and restarted:

1. ✅ Visit `/admin` - should load without errors
2. ✅ Click on a user card - should open user details
3. ✅ View user projects - should work
4. ✅ Check browser console - no security errors

---

## ❓ Troubleshooting

### **Still getting the error?**

1. **Check the key is correct:**
   - Should start with `eyJ...`
   - Should be very long (~200+ characters)
   - Should be labeled "service_role" in Supabase (not "anon")

2. **Restart the dev server:**
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

3. **Check for typos:**
   - No quotes around the key
   - No extra spaces
   - No line breaks in the key

4. **Verify the file:**
   ```bash
   # Make sure .env.local exists and has the key
   cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
   ```

---

## 📚 Additional Resources

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ Quick Checklist

- [ ] Got service_role key from Supabase Dashboard
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY=...` to `.env.local`
- [ ] Restarted dev server
- [ ] Tested admin dashboard
- [ ] Verified no errors in console

---

**After completing these steps, your admin dashboard should work perfectly!** 🎉

If you're still having issues, let me know and I can help troubleshoot further.

