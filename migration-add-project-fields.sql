-- Migration: Add default values for new project fields
-- Run this SQL in your Supabase SQL Editor to fix existing projects

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

