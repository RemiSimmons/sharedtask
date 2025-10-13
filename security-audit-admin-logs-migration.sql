-- Security Audit: Admin Access Logs Table Migration
-- This creates a comprehensive admin access logging system for security auditing
-- Run this in your Supabase SQL Editor

-- Create admin_access_logs table
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  target_user_email text,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_admin_email ON admin_access_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON admin_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_action ON admin_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_success ON admin_access_logs(success);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_target_user ON admin_access_logs(target_user_email);

-- Enable Row Level Security
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access admin logs (highest security)
CREATE POLICY "Service role can manage admin access logs" ON admin_access_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON admin_access_logs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE admin_access_logs IS 'Security audit log for all admin actions. Only accessible via service role.';
COMMENT ON COLUMN admin_access_logs.admin_email IS 'Email address of the admin who performed the action';
COMMENT ON COLUMN admin_access_logs.action IS 'Type of action performed (e.g., view_operations, delete_user, export_data)';
COMMENT ON COLUMN admin_access_logs.resource IS 'Resource type affected (e.g., user, project, system)';
COMMENT ON COLUMN admin_access_logs.target_user_email IS 'Email of the user affected by the action (if applicable)';
COMMENT ON COLUMN admin_access_logs.metadata IS 'Additional context data in JSON format';

-- Create a function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_email text,
  p_action text,
  p_resource text,
  p_resource_id text DEFAULT NULL,
  p_target_user_email text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_access_logs (
    admin_email,
    action,
    resource,
    resource_id,
    target_user_email,
    ip_address,
    user_agent,
    success,
    metadata
  ) VALUES (
    p_admin_email,
    p_action,
    p_resource,
    p_resource_id,
    p_target_user_email,
    p_ip_address,
    p_user_agent,
    true,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the logging function
GRANT EXECUTE ON FUNCTION log_admin_action TO service_role;

-- Example usage (commented out):
-- SELECT log_admin_action(
--   'admin@example.com',
--   'delete_user',
--   'user',
--   'user-uuid-here',
--   'target@example.com',
--   '192.168.1.1',
--   'Mozilla/5.0...',
--   '{"reason": "policy violation"}'::jsonb
-- );

