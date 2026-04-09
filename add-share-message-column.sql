-- Add share_message column to projects table
-- This allows hosts to customize the message sent when sharing the project link
-- Run this in your Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS share_message text DEFAULT 'Help contribute to our event! Claim a task here:';

-- Add a comment to explain the column
COMMENT ON COLUMN projects.share_message IS 'Custom message shown when sharing the project link with guests';









