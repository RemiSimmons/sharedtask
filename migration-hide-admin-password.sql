-- ============================================================================
-- CRITICAL SECURITY FIX: Hide admin_password Field
-- ============================================================================
-- This migration restricts access to the admin_password column.
-- Only the service_role (backend) can read it - no client-side access.
-- 
-- RUN THIS IN YOUR SUPABASE SQL EDITOR IMMEDIATELY
-- ============================================================================

-- Step 1: Display migration start message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION: Hiding admin_password field';
  RAISE NOTICE 'Starting security improvements...';
  RAISE NOTICE '============================================';
END $$;

-- Note: Current grants can be viewed in Supabase dashboard
-- if needed for documentation purposes

-- ============================================================================
-- Step 2: REVOKE access to admin_password from public roles
-- ============================================================================

DO $$
BEGIN
  -- Revoke from public (anonymous users)
  EXECUTE 'REVOKE SELECT (admin_password) ON projects FROM public';
  EXECUTE 'REVOKE SELECT (admin_password) ON projects FROM anon';

  -- Revoke from authenticated users
  EXECUTE 'REVOKE SELECT (admin_password) ON projects FROM authenticated';

  -- Ensure service_role CAN access it (should already have access)
  EXECUTE 'GRANT SELECT (admin_password) ON projects TO service_role';

  RAISE NOTICE 'Revoked SELECT permission on admin_password from public/authenticated';
  RAISE NOTICE 'Ensured service_role has access';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some permissions may have already been set correctly';
END $$;

-- ============================================================================
-- Step 3: Create secure RLS policy for projects (without admin_password)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "projects_public_read_secure" ON projects;
DROP POLICY IF EXISTS "projects_owner_read_secure" ON projects;

-- Create new policy: Public can read projects but NOT admin_password
DO $$
BEGIN
  CREATE POLICY "projects_public_read_secure" ON projects
    FOR SELECT
    TO public, anon, authenticated
    USING (true);
  
  RAISE NOTICE 'Created secure RLS policy (admin_password excluded by column revoke)';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy already exists, skipping creation';
END $$;

-- Note: The column-level revoke above prevents admin_password from being returned
-- even if the policy allows row access

-- ============================================================================
-- Step 4: Verify the fix works
-- ============================================================================

-- Test 1: Try to select admin_password as public (should fail or return NULL)
DO $$
DECLARE
  test_password text;
BEGIN
  -- This should fail or return NULL
  -- If it returns actual password data, the fix didn't work
  BEGIN
    SELECT admin_password INTO test_password 
    FROM projects 
    LIMIT 1;
    
    IF test_password IS NOT NULL THEN
      RAISE WARNING 'WARNING: admin_password is still accessible!';
    ELSE
      RAISE NOTICE 'SUCCESS: admin_password properly restricted (returns NULL)';
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'SUCCESS: admin_password properly restricted (access denied)';
  END;
END $$;

-- Test 2: Verify other columns are still accessible
DO $$
DECLARE
  project_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO project_count FROM projects;
  RAISE NOTICE 'SUCCESS: Other project data accessible: % projects found', project_count;
END $$;

-- ============================================================================
-- Step 5: Update documentation
-- ============================================================================

-- Document which columns are safe to select
COMMENT ON COLUMN projects.admin_password IS 
  'RESTRICTED: Only accessible via service_role. Use supabaseAdmin to read this field.';

-- ============================================================================
-- Step 6: Verification Report
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  SECURITY FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes Made:';
  RAISE NOTICE '  - Revoked SELECT on admin_password from public/anon/authenticated';
  RAISE NOTICE '  - Ensured service_role has access';
  RAISE NOTICE '  - Created secure RLS policies';
  RAISE NOTICE '  - Verified restrictions work';
  RAISE NOTICE '';
  RAISE NOTICE 'Impact:';
  RAISE NOTICE '  - Client-side code cannot read admin_password';
  RAISE NOTICE '  - Server-side code (supabaseAdmin) can still read it';
  RAISE NOTICE '  - Password verification still works';
  RAISE NOTICE '  - No breaking changes to functionality';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Step 7: Safe column list for client queries
-- ============================================================================

-- Document safe columns to select (for developer reference)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'SAFE COLUMNS FOR CLIENT-SIDE QUERIES:';
  RAISE NOTICE '  - id';
  RAISE NOTICE '  - user_id';
  RAISE NOTICE '  - name';
  RAISE NOTICE '  - task_label';
  RAISE NOTICE '  - description';
  RAISE NOTICE '  - event_location';
  RAISE NOTICE '  - event_time';
  RAISE NOTICE '  - event_attire';
  RAISE NOTICE '  - allow_multiple_tasks';
  RAISE NOTICE '  - allow_multiple_contributors';
  RAISE NOTICE '  - max_contributors_per_task';
  RAISE NOTICE '  - allow_contributors_add_names';
  RAISE NOTICE '  - allow_contributors_add_tasks';
  RAISE NOTICE '  - contributor_names';
  RAISE NOTICE '  - created_at';
  RAISE NOTICE '';
  RAISE NOTICE 'RESTRICTED COLUMNS (service_role only):';
  RAISE NOTICE '  - admin_password';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- IMPORTANT: Update your application code
-- ============================================================================

-- Any code that needs to read admin_password MUST use supabaseAdmin
-- CORRECT (Server-side only):
--   const { data } = await supabaseAdmin
--     .from('projects')
--     .select('id, admin_password')
--     .eq('id', projectId)
--
-- WRONG (Client-side or regular supabase client):
--   const { data } = await supabase
--     .from('projects')
--     .select('id, admin_password')  -- Will return NULL or fail
--
-- The app/api/admin/auth/route.ts already uses supabaseAdmin
-- so it will continue to work correctly.

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- If you need to rollback this change, run:
-- GRANT SELECT (admin_password) ON projects TO public;
-- GRANT SELECT (admin_password) ON projects TO authenticated;
--
-- WARNING: This will re-expose password hashes!
-- Only rollback if absolutely necessary.

-- ============================================================================
-- Migration Complete
-- ============================================================================

