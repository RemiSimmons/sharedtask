-- ============================================================================
-- CRITICAL SECURITY MIGRATION: Hash Project Passwords
-- ============================================================================
-- This migration hashes all plaintext project passwords using PostgreSQL's
-- pgcrypto extension. Run this ONCE in your Supabase SQL Editor.
-- ============================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backup table (optional but recommended)
CREATE TABLE IF NOT EXISTS projects_password_backup AS 
SELECT id, admin_password, created_at 
FROM projects 
WHERE admin_password IS NOT NULL 
  AND admin_password != 'no_password_set'
  AND length(admin_password) < 60; -- bcrypt hashes are 60 chars

-- Show projects that will be updated
DO $$
DECLARE
  project_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO project_count
  FROM projects
  WHERE admin_password IS NOT NULL
    AND admin_password != 'no_password_set'
    AND length(admin_password) < 60;
    
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Projects to be updated: %', project_count;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- IMPORTANT: PostgreSQL/Supabase cannot hash with bcrypt directly
-- This migration identifies projects with plaintext passwords
-- You'll need to hash them via the API or manually
-- ============================================================================

-- Option 1: Mark projects with plaintext passwords for manual migration
ALTER TABLE projects ADD COLUMN IF NOT EXISTS password_needs_migration BOOLEAN DEFAULT FALSE;

UPDATE projects
SET password_needs_migration = TRUE
WHERE admin_password IS NOT NULL
  AND admin_password != 'no_password_set'
  AND length(admin_password) < 60  -- bcrypt hashes are 60 chars
  AND admin_password !~ '^\$2[aby]\$'; -- Not already a bcrypt hash

-- List projects that need password migration
SELECT 
  id,
  name,
  created_at,
  length(admin_password) as password_length,
  CASE 
    WHEN admin_password ~ '^\$2[aby]\$' THEN 'Already hashed'
    WHEN admin_password = 'no_password_set' THEN 'No password'
    ELSE 'NEEDS MIGRATION'
  END as password_status
FROM projects
ORDER BY password_needs_migration DESC, created_at DESC;

-- ============================================================================
-- VERIFICATION: Check current password status
-- ============================================================================

DO $$
DECLARE
  total_projects INTEGER;
  hashed_projects INTEGER;
  plaintext_projects INTEGER;
  no_password_projects INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_projects FROM projects;
  
  SELECT COUNT(*) INTO hashed_projects 
  FROM projects 
  WHERE admin_password ~ '^\$2[aby]\$';
  
  SELECT COUNT(*) INTO no_password_projects 
  FROM projects 
  WHERE admin_password = 'no_password_set' OR admin_password IS NULL;
  
  SELECT COUNT(*) INTO plaintext_projects 
  FROM projects 
  WHERE admin_password IS NOT NULL 
    AND admin_password != 'no_password_set'
    AND admin_password !~ '^\$2[aby]\$'
    AND length(admin_password) < 60;
  
  RAISE NOTICE '========== PASSWORD STATUS REPORT ==========';
  RAISE NOTICE 'Total projects: %', total_projects;
  RAISE NOTICE 'Properly hashed: %', hashed_projects;
  RAISE NOTICE 'No password set: %', no_password_projects;
  RAISE NOTICE 'PLAINTEXT (VULNERABLE): %', plaintext_projects;
  RAISE NOTICE '============================================';
  
  IF plaintext_projects > 0 THEN
    RAISE WARNING 'SECURITY ALERT: % project(s) have plaintext passwords!', plaintext_projects;
    RAISE WARNING 'Use the migration script to hash these passwords immediately.';
  ELSE
    RAISE NOTICE 'All project passwords are secure.';
  END IF;
END $$;

-- ============================================================================
-- RECOMMENDED NEXT STEPS
-- ============================================================================
-- 1. Review the projects listed above with 'NEEDS MIGRATION' status
-- 2. Use the Node.js migration script to hash these passwords
-- 3. Run verification query again to confirm all passwords are hashed
-- 4. Remove the password_needs_migration column when complete:
--    ALTER TABLE projects DROP COLUMN IF EXISTS password_needs_migration;
-- ============================================================================

