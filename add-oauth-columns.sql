-- Migration: Add OAuth provider columns to users table
-- Description: Adds support for Google OAuth authentication with automatic account linking

-- Add OAuth provider columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_provider_id TEXT;

-- Add index for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_id 
ON users(oauth_provider_id) 
WHERE oauth_provider_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name (e.g., google, null for email/password)';
COMMENT ON COLUMN users.oauth_provider_id IS 'Unique user ID from OAuth provider';

-- Make password_hash nullable since OAuth users don't need passwords
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Note: No data migration needed - existing users remain unchanged
-- New Google OAuth users will have oauth_provider='google' and oauth_provider_id set
-- Existing email/password users will have both fields as NULL











