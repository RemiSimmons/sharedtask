-- Production-Ready RLS Policies for Subscription Tables
-- Run this in your Supabase SQL Editor to secure your database

-- First, re-enable RLS on all subscription tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own trials" ON user_trials;
DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage trials" ON user_trials;
DROP POLICY IF EXISTS "Service role can manage email logs" ON email_logs;

-- USER SUBSCRIPTIONS POLICIES
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks and admin operations)
CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can insert their own subscription records (for trial conversion)
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own subscription records (for cancellation)
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- USER TRIALS POLICIES
-- Users can view their own trials
CREATE POLICY "Users can view own trials" ON user_trials
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all trials (for trial creation and management)
CREATE POLICY "Service role can manage all trials" ON user_trials
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can insert their own trial (one per user)
CREATE POLICY "Users can insert own trial" ON user_trials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own trial
CREATE POLICY "Users can update own trial" ON user_trials
    FOR UPDATE USING (auth.uid() = user_id);

-- EMAIL LOGS POLICIES
-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all email logs (for email sending and audit)
CREATE POLICY "Service role can manage all email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Only service role can insert email logs (emails are sent server-side)
CREATE POLICY "Service role can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better performance on RLS queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id_status ON user_trials(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id_type ON email_logs(user_id, email_type);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_trials TO authenticated;
GRANT SELECT ON email_logs TO authenticated;

-- Ensure service_role has full access (should already be granted)
GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON user_trials TO service_role;
GRANT ALL ON email_logs TO service_role;

