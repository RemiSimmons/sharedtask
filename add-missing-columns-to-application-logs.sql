-- Add missing columns to application_logs table
-- Run this SQL in your Supabase SQL Editor

-- Add missing columns to application_logs table
ALTER TABLE application_logs 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS response_time INTEGER,
ADD COLUMN IF NOT EXISTS status_code INTEGER;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_endpoint ON application_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_application_logs_status_code ON application_logs(status_code);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'application_logs' 
ORDER BY ordinal_position;
