# Google OAuth 400 Error - Troubleshooting Guide

## Common Causes of 400 Error in Development

### Issue 1: Missing or Incorrect Environment Variables ⚠️ MOST COMMON

**Check your `.env.local` file has all these variables:**

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Quick Fix:**
```bash
# Create .env.local if it doesn't exist
cp env.example .env.local

# Then edit .env.local and add your actual Google credentials
```

**After adding/updating environment variables, you MUST restart your dev server:**
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

### Issue 2: Incorrect Redirect URI in Google Cloud Console

The redirect URI in Google Cloud Console **MUST EXACTLY MATCH** this for development:

```
http://localhost:3000/api/auth/callback/google
```

**Common mistakes:**
- ❌ `https://localhost:3000/api/auth/callback/google` (https instead of http)
- ❌ `http://127.0.0.1:3000/api/auth/callback/google` (127.0.0.1 instead of localhost)
- ❌ `http://localhost:3000/api/auth/google` (missing /callback/)
- ❌ Trailing slash: `http://localhost:3000/api/auth/callback/google/`

**How to fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Click **Save**
5. Wait 1-2 minutes for changes to propagate
6. Try signing in again

---

### Issue 3: NEXTAUTH_URL Mismatch

Your `NEXTAUTH_URL` must match your development server URL.

**For development, it should be:**
```bash
NEXTAUTH_URL=http://localhost:3000
```

**NOT:**
- ❌ `https://localhost:3000` (https in development)
- ❌ `http://127.0.0.1:3000`
- ❌ `https://app.sharedtask.ai` (production URL)

---

### Issue 4: OAuth Consent Screen Not Configured

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **OAuth consent screen**
2. Ensure you've completed:
   - ✅ App name filled in
   - ✅ User support email set
   - ✅ Developer contact email set
   - ✅ Scopes added (userinfo.email, userinfo.profile, openid)

---

### Issue 5: Server Not Restarted After Environment Changes

Environment variables are only loaded when the server starts.

**Always restart after changing .env.local:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Quick Diagnostic Steps

### Step 1: Check Environment Variables

Create a test file to verify your environment:

```bash
# In your terminal
node -e "console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET ✓' : 'MISSING ✗')"
node -e "console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET ✓' : 'MISSING ✗')"
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)"
node -e "console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET ✓' : 'MISSING ✗')"
```

### Step 2: Check Browser Console

When you click "Continue with Google", open your browser's Developer Tools (F12) and check:

**Console tab:**
- Look for any error messages
- Note the exact error

**Network tab:**
- Click on the failed request
- Look at the response body
- Check the request URL

### Step 3: Check Server Logs

In your terminal where the dev server is running, look for error messages when you try to sign in.

---

## Step-by-Step Fix Guide

### If you haven't set up Google OAuth credentials yet:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID** (or edit existing):
   - Application type: **Web application**
   - Name: **SharedTask Development**
   
3. **Add Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```

4. **Add Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. **Save and copy credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

6. **Update .env.local:**
   ```bash
   GOOGLE_CLIENT_ID=paste_your_client_id_here
   GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_existing_secret_or_generate_new_one
   ```

7. **Generate NEXTAUTH_SECRET if needed:**
   ```bash
   openssl rand -base64 32
   ```

8. **Restart your dev server:**
   ```bash
   npm run dev
   ```

9. **Test:**
   - Go to http://localhost:3000/auth/signin
   - Click "Continue with Google"
   - Should redirect to Google sign-in

---

## Specific Error Messages

### "redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's in Google Cloud Console

**Solution:**
1. Check the error URL - it will show you what Google received
2. Go to Google Cloud Console → Credentials
3. Edit your OAuth client
4. Add the **exact** redirect URI shown in the error
5. For development: `http://localhost:3000/api/auth/callback/google`

### "invalid_client"

**Problem:** Client ID or Client Secret is wrong

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Copy the Client ID and Secret again
4. Update `.env.local` with correct values
5. Restart dev server

### "access_denied"

**Problem:** OAuth consent screen not properly configured

**Solution:**
1. Go to Google Cloud Console → OAuth consent screen
2. Complete all required fields
3. Add test users if in "Testing" mode
4. Make sure your Google account is added as a test user

---

## Still Getting 400 Error?

### Enable Debug Mode

Add this to your `.env.local`:
```bash
NEXTAUTH_DEBUG=true
```

Restart the server and check the console for detailed error messages.

### Check NextAuth API Route

Visit this URL directly in your browser:
```
http://localhost:3000/api/auth/providers
```

You should see:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "http://localhost:3000/api/auth/signin/google",
    "callbackUrl": "http://localhost:3000/api/auth/callback/google"
  },
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials"
  }
}
```

If you don't see the Google provider, your environment variables aren't loading correctly.

---

## Quick Test Checklist

- [ ] `.env.local` file exists in project root
- [ ] `GOOGLE_CLIENT_ID` is set in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `.env.local`
- [ ] `NEXTAUTH_URL=http://localhost:3000` in `.env.local`
- [ ] `NEXTAUTH_SECRET` is set in `.env.local`
- [ ] Dev server restarted after adding environment variables
- [ ] Google Cloud Console has `http://localhost:3000/api/auth/callback/google` as redirect URI
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Waited 1-2 minutes after saving changes in Google Cloud Console

---

## Need More Help?

1. **Share the exact error message** from:
   - Browser console (F12 → Console tab)
   - Network tab (the response body)
   - Server terminal logs

2. **Check these URLs work:**
   - http://localhost:3000/api/auth/providers
   - http://localhost:3000/api/auth/csrf

3. **Verify Google Cloud project:**
   - OAuth consent screen is published or you're added as test user
   - APIs & Services → Credentials shows your client
   - Redirect URIs are correct











