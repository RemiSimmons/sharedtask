-- Migration 1: Allow NULL task_id and add project_id to task_assignments
-- This enables "attending only" guests (NULL task_id) and ensures all assignments are linked to a project
-- Run this in your Supabase SQL Editor

-- Step 1: Add project_id column (nullable initially)
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Step 2: Allow NULL task_id first (for attending-only guests)
ALTER TABLE task_assignments 
ALTER COLUMN task_id DROP NOT NULL;

-- Step 3: Backfill existing assignments with project_id from their tasks
UPDATE task_assignments 
SET project_id = tasks.project_id
FROM tasks
WHERE task_assignments.task_id = tasks.id
AND task_assignments.project_id IS NULL;

-- Step 4: Delete any orphaned assignments (those without valid task_id or project_id)
-- This shouldn't happen in a healthy database, but we clean up just in case
DELETE FROM task_assignments 
WHERE project_id IS NULL;

-- Step 5: Make project_id required (NOT NULL)
ALTER TABLE task_assignments 
ALTER COLUMN project_id SET NOT NULL;

-- Step 6: Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id 
ON task_assignments(project_id);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id 
ON task_assignments(task_id) WHERE task_id IS NOT NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN task_assignments.task_id IS 'NULL indicates guest is attending only without claiming a specific task';
COMMENT ON COLUMN task_assignments.project_id IS 'Project this assignment belongs to. Required for attending-only guests (where task_id is NULL)';

