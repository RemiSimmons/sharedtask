# Google OAuth Setup Guide for SharedTask

This guide walks you through setting up Google OAuth authentication for SharedTask.

## Overview

Google OAuth has been integrated as an **enhancement** to the existing email/password authentication. Users can now:
- Sign in with their Google account
- Sign up with Google (automatic account creation)
- Link their Google account to existing email/password accounts automatically

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to the [Google Cloud Console](https://console.cloud.google.com)
- Your SharedTask deployment URL (e.g., `https://app.sharedtask.ai` or `http://localhost:3000` for development)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a Project** → **New Project**
3. Enter a project name (e.g., "SharedTask OAuth")
4. Click **Create**

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: SharedTask
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** screen, click **Add or Remove Scopes**
7. Add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click **Update** → **Save and Continue**
9. Review and click **Back to Dashboard**

## Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the settings:

   **Name**: SharedTask Web Client

   **Authorized JavaScript origins**:
   - For development: `http://localhost:3000`
   - For production: `https://app.sharedtask.ai`

   **Authorized redirect URIs**:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://app.sharedtask.ai/api/auth/callback/google`

5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** that appear

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file (development) or your deployment environment variables (production):

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Security Note**: Never commit your `.env.local` file to version control. The Client Secret should be kept secure.

## Step 5: Run Database Migration

Before deploying, run the database migration to add OAuth support columns:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f add-oauth-columns.sql
```

Or execute the migration directly in the Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `add-oauth-columns.sql`
5. Click **Run**

## Step 6: Test the Integration

### Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Test the following scenarios:
   - ✅ Click "Continue with Google" - should redirect to Google sign-in
   - ✅ Sign in with a new Google account - should create new user
   - ✅ Sign in with email/password - should still work (existing flow)
   - ✅ Sign in with Google using an email that has an existing password account - should automatically link accounts

### Production Testing

Before going live, test thoroughly on your staging environment with the same scenarios above.

## Account Linking Behavior

The integration uses **automatic account linking (Strategy 1a)**:

- If a user signs in with Google using an email that matches an existing account, the Google account is **automatically linked** to the existing user record
- No password verification is required
- This provides a seamless experience for users who initially signed up with email/password

### What happens during automatic linking:

1. User clicks "Continue with Google"
2. User authenticates with Google
3. System checks if email exists in database
4. If exists, updates user record with:
   - `oauth_provider = 'google'`
   - `oauth_provider_id = [Google's unique ID]`
   - `email_verified = true`
5. User is signed in to their existing account

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Ensure your authorized redirect URIs in Google Cloud Console exactly match your NextAuth callback URL:
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://app.sharedtask.ai/api/auth/callback/google`

### Error: "Access blocked: This app's request is invalid"

**Solution**: Complete the OAuth consent screen configuration in Google Cloud Console, including all required fields.

### Google sign-in button doesn't work

**Solution**: 
1. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables
2. Restart your development server after adding environment variables
3. Check browser console for any error messages

### Users created via Google OAuth can't sign in with password

**Expected behavior**: Users who sign up via Google OAuth don't have a password set. They must continue using Google to sign in. If they want to add password authentication, you'll need to implement a "Set Password" feature in the account settings.

## Security Considerations

1. **Client Secret**: Keep your `GOOGLE_CLIENT_SECRET` secure. Never expose it in client-side code or commit it to version control.

2. **OAuth Scopes**: We only request minimal scopes (`email`, `profile`, `openid`). Don't add unnecessary scopes.

3. **Account Linking**: The current implementation uses automatic linking (1a). If you need more security, consider implementing password verification before linking (see `lib/auth.ts` signIn callback).

4. **Email Verification**: Google-authenticated users are automatically marked as email verified since Google handles email verification.

## Rollback Plan

If you need to disable Google OAuth:

1. Remove the Google provider from `lib/auth.ts`:
   ```typescript
   providers: [
     // Google({ ... }), // Comment out or remove this
     Credentials({ ... })
   ]
   ```

2. Restart your application

3. Existing email/password authentication will continue to work normally

4. Users who signed up via Google will need to use the password reset flow to set a password

## Support

For issues or questions:
- Check the [NextAuth.js Google Provider documentation](https://next-auth.js.org/providers/google)
- Review the implementation in `lib/auth.ts`
- Check application logs for detailed error messages

## Files Modified

- `lib/auth.ts` - NextAuth configuration with Google provider
- `app/auth/signin/page.tsx` - Sign-in page with Google button
- `app/auth/signup/page.tsx` - Sign-up page with Google button
- `types/database.ts` - Database types including OAuth columns
- `env.example` - Environment variable template
- `add-oauth-columns.sql` - Database migration

## Next Steps

After successful setup:

1. ✅ Test all authentication flows thoroughly
2. ✅ Monitor sign-in success rates
3. ✅ Consider adding "Sign in with Google" to other parts of the app if needed
4. ✅ Update your privacy policy to mention Google OAuth usage
5. ✅ Consider publishing your OAuth consent screen (currently in testing mode allows up to 100 users)

---

**Last Updated**: October 2025  
**Version**: 1.0















