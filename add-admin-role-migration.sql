-- Add admin role support to users table
-- Run this SQL in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update constraint to ensure valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create admin_access_logs table for security auditing
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

-- Create index for admin access logs
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON admin_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_action ON admin_access_logs(action);

-- Enable RLS on admin access logs
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access logs (only service role can access)
CREATE POLICY "Service role can manage admin access logs" ON admin_access_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON admin_access_logs TO service_role;

-- Insert a default super admin (replace with your email)
-- You'll need to update this with your actual email address
-- INSERT INTO users (name, email, password_hash, role, email_verified) 
-- VALUES (
--   'System Admin', 
--   'your-admin-email@example.com', 
--   '$2a$12$placeholder_hash_replace_with_real_hash', 
--   'super_admin', 
--   true
-- );

-- Note: To create the first admin user, you can either:
-- 1. Manually insert via SQL (uncomment above and replace values)
-- 2. Create a regular account first, then update the role via SQL
-- 3. Use the admin promotion API endpoint (once implemented)

COMMENT ON TABLE admin_access_logs IS 'Logs all admin actions for security auditing';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or super_admin';







