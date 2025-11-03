-- Add headcount column to task_assignments table
-- Run this in your Supabase SQL Editor

ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS headcount integer DEFAULT 1 NOT NULL;

-- Update any existing assignments to have headcount of 1
UPDATE task_assignments 
SET headcount = 1 
WHERE headcount IS NULL;












