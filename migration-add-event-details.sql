-- Migration: Add event details fields to projects table
-- Run this SQL in your Supabase SQL Editor

-- Add new columns for event details
ALTER TABLE projects 
ADD COLUMN event_location text,
ADD COLUMN event_time text,
ADD COLUMN event_attire text;

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('event_location', 'event_time', 'event_attire');

-- Optional: Update existing projects to have NULL values for the new fields
-- (This is already the default behavior, but we can be explicit)
UPDATE projects 
SET 
  event_location = NULL,
  event_time = NULL,
  event_attire = NULL
WHERE 
  event_location IS NULL 
  AND event_time IS NULL 
  AND event_attire IS NULL;
