-- Migration: Add project customization features
-- Add project description and permission controls

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN description text DEFAULT NULL,
ADD COLUMN allow_contributors_add_names boolean DEFAULT true,
ADD COLUMN allow_contributors_add_tasks boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN projects.description IS 'Optional project description shown to contributors';
COMMENT ON COLUMN projects.allow_contributors_add_names IS 'Whether contributors can add their own names to the contributor list';
COMMENT ON COLUMN projects.allow_contributors_add_tasks IS 'Whether contributors can add custom tasks to the project';

