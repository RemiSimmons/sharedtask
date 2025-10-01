-- Fix the users table by adding the missing name column
-- Run this SQL in your Supabase SQL Editor

-- Add the missing name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'User';

-- Update the default value to be more reasonable for existing users
ALTER TABLE users ALTER COLUMN name DROP DEFAULT;
ALTER TABLE users ALTER COLUMN name SET DEFAULT 'User';

-- If there are existing users without names, update them
UPDATE users SET name = 'User' WHERE name IS NULL OR name = '';

-- Make sure the name column is NOT NULL
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
