# Instructions to Fix the Admin Project Access Issue

## Root Cause
The `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing from your `.env.local` file. This means the `supabaseAdmin` client can't bypass Row Level Security (RLS), causing database access failures.

## Solution

1. **Get your Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "service_role" key (NOT the anon key)

2. **Add it to your `.env.local` file:**
   ```bash
   # Add this line to your .env.local file:
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C) then restart:
   npm run dev
   ```

## Why This Fixes the Issue

- **Without Service Key**: `supabaseAdmin` uses anon key → RLS still applies → queries fail
- **With Service Key**: `supabaseAdmin` bypasses RLS → authenticated operations work → admin pages accessible

## Alternative Quick Fix (Development Only)

If you can't get the service key right now, you can temporarily disable RLS entirely:

```sql
-- Run this in Supabase SQL Editor for immediate access:
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
```

**Warning**: Only use this in development. In production, always use proper RLS policies with the service key.

