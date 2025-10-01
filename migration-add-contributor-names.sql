-- Migration: Add contributor_names JSON field to projects table
-- Run this SQL in your Supabase SQL Editor to add contributor name functionality

-- Add the contributor_names column to the projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_names json DEFAULT '[]';

-- Update existing projects to have empty contributor arrays
UPDATE projects SET contributor_names = '[]' WHERE contributor_names IS NULL;

-- Optional: Add some sample contributor names to existing projects (remove this if not needed)
-- UPDATE projects SET contributor_names = '["John Doe", "Jane Smith", "Team Member"]' WHERE contributor_names = '[]';

-- Verify the change
SELECT id, name, contributor_names FROM projects LIMIT 5;

