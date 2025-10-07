-- Create application_logs table for system monitoring
-- Run this SQL in your Supabase SQL Editor

-- Create the application_logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  method TEXT,
  response_time INTEGER, -- in milliseconds
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_endpoint ON application_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_application_logs_status_code ON application_logs(status_code);

-- Enable Row Level Security (RLS)
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated users can insert logs (for API logging)
CREATE POLICY "Users can insert application logs" ON application_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins can read logs
CREATE POLICY "Admins can read application logs" ON application_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create a function to clean up old logs (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_application_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM application_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Verify the table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'application_logs' 
ORDER BY ordinal_position;
