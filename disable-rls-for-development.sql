-- Temporary fix: Disable RLS for subscription tables during development
-- WARNING: Only use this in development! In production, use proper RLS policies.

-- Disable RLS for subscription tables
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to re-enable RLS later with proper policies, use:
-- ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY; 
-- ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

