-- Database Migration: Add Project Customization Fields
-- Run this SQL in your Supabase SQL Editor to add the new fields to existing projects table

-- Add the new columns to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS allow_contributors_add_names boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_contributors_add_tasks boolean DEFAULT true;

-- Update existing projects to have the default permission values
UPDATE projects 
SET 
  allow_contributors_add_names = true,
  allow_contributors_add_tasks = true
WHERE 
  allow_contributors_add_names IS NULL 
  OR allow_contributors_add_tasks IS NULL;

