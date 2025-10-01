# Supabase Database Error Troubleshooting Guide

## Problem: "Supabase error in fetching tasks" after adding new database fields

This error typically occurs when you've added new fields to your database schema but existing projects don't have values for these new fields.

## Quick Fix Steps

### Step 1: Run the Database Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration script from `migration-add-project-fields.sql`:

```sql
-- Update existing projects to have default values for the new fields
UPDATE projects 
SET 
  description = NULL,
  allow_contributors_add_names = true,
  allow_contributors_add_tasks = true
WHERE 
  allow_contributors_add_names IS NULL 
  OR allow_contributors_add_tasks IS NULL;

-- Verify the update worked
SELECT 
  id, 
  name, 
  description,
  allow_contributors_add_names,
  allow_contributors_add_tasks
FROM projects;
```

### Step 2: Verify Your Database Schema

Make sure your `projects` table includes these fields:
- `description` (text, nullable)
- `allow_contributors_add_names` (boolean, default true)
- `allow_contributors_add_tasks` (boolean, default true)

### Step 3: Check Console for Debug Info

The code now includes debug logging. Open your browser's developer console and look for:
- "Loading project by ID: ..." or "Getting or creating default project"
- "Loaded project data: ..." - check if the new fields are present
- "Refreshing tasks for project: ..."
- "Tasks query result: ..." - check for any errors

## Common Issues and Solutions

### Issue 1: Database Schema Mismatch
**Error**: Column doesn't exist
**Solution**: Make sure you've run the database migration and that the new columns exist in your Supabase database.

### Issue 2: Existing Projects Missing New Fields
**Error**: Null values where they shouldn't be
**Solution**: Run the migration script above to add default values to existing projects.

### Issue 3: TypeScript Type Mismatch
**Error**: Property doesn't exist on type
**Solution**: Make sure your `types/database.ts` file includes the new fields. You may need to regenerate types from Supabase.

### Issue 4: Permission Errors
**Error**: RLS (Row Level Security) blocking queries
**Solution**: Check your Supabase RLS policies to ensure they allow reading the new fields.

## Regenerating Database Types

If you need to regenerate your TypeScript types from Supabase:

1. Install the Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Generate types: `supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts`

## Verification Steps

1. Check that all projects have the new fields:
```sql
SELECT id, name, description, allow_contributors_add_names, allow_contributors_add_tasks 
FROM projects;
```

2. Test creating a new project - it should include all fields automatically

3. Check that the app loads without errors in the browser console

## Still Having Issues?

1. Clear your browser cache and localStorage
2. Check the Network tab in developer tools for failed API calls
3. Verify your Supabase environment variables are correct
4. Check Supabase dashboard logs for any server-side errors

The code has been updated with better error handling and safe defaults, so even if some fields are missing, the app should still work with reasonable fallbacks.

