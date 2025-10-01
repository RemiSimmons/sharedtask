-- Subscription and Trial Management Schema
-- Run this SQL in your Supabase SQL Editor after the existing schema

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  plan text NOT NULL CHECK (plan IN ('basic', 'pro', 'team')),
  interval text NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  status text NOT NULL CHECK (status IN ('active', 'incomplete', 'incomplete_expired', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- User trials table
CREATE TABLE user_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE, -- One trial per user
  plan text NOT NULL CHECK (plan IN ('basic', 'pro', 'team')),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'converted')),
  started_at timestamp NOT NULL DEFAULT now(),
  ends_at timestamp NOT NULL,
  day_5_reminder_sent boolean DEFAULT false,
  day_5_reminder_sent_at timestamp,
  day_7_reminder_sent boolean DEFAULT false,
  day_7_reminder_sent_at timestamp,
  converted_to_subscription_id uuid REFERENCES user_subscriptions(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Email logs for audit trail
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('trial_day_5', 'trial_day_14', 'subscription_welcome', 'subscription_canceled')),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamp DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message text,
  trial_id uuid REFERENCES user_trials(id),
  subscription_id uuid REFERENCES user_subscriptions(id)
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

CREATE INDEX idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX idx_user_trials_status ON user_trials(status);
CREATE INDEX idx_user_trials_ends_at ON user_trials(ends_at);
CREATE INDEX idx_user_trials_reminders ON user_trials(day_5_reminder_sent, day_14_reminder_sent);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

-- Triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trials_updated_at 
    BEFORE UPDATE ON user_trials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own trials" ON user_trials
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own email logs" ON email_logs
    FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all data (for webhooks and admin operations)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage trials" ON user_trials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

