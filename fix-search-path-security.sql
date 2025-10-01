-- Fix for "Function Search Path Mutable" Security Issue
-- Run this SQL in your Supabase SQL Editor

-- Option A: Fix search_path to pg_catalog, public (RECOMMENDED)
CREATE OR REPLACE FUNCTION public.update_updated_at_column ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
NEW.updated_at := now();
RETURN NEW;
END;
$$;

-- Verify the fix worked by checking the function
SELECT 
    proname as function_name,
    proconfig as search_path_config
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Optional: Check if this function is used by any triggers
SELECT 
    n.nspname as schemaname,
    c.relname as tablename,
    t.tgname as triggername,
    t.tgfoid::regproc as trigger_function
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgfoid::regproc::text LIKE '%update_updated_at%';
