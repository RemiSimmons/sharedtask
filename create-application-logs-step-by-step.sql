-- Step-by-step application_logs table creation
-- Run each section separately in your Supabase SQL Editor

-- Step 1: Create the table first
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT,
  method TEXT,
  response_time INTEGER,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes (run after table creation)
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_endpoint ON application_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_application_logs_status_code ON application_logs(status_code);

-- Step 3: Enable RLS
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Authenticated users can insert application logs" ON application_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can read application logs" ON application_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Step 5: Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_application_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM application_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Verify table creation
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'application_logs' 
ORDER BY ordinal_position;
