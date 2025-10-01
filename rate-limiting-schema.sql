-- ============================================================================
-- RATE LIMITING DATABASE SCHEMA
-- ============================================================================

-- Create rate_limits table for production rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or API key
    count INTEGER NOT NULL DEFAULT 0,
    limit_value INTEGER NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    violations INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_violations ON rate_limits(violations DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(window_end) WHERE window_end < NOW();

-- Create composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, window_start, window_end);

-- Create rate_limit_violations table for detailed logging
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    violation_count INTEGER NOT NULL DEFAULT 1,
    request_count INTEGER NOT NULL,
    limit_value INTEGER NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for violation tracking
CREATE INDEX IF NOT EXISTS idx_violations_identifier ON rate_limit_violations(identifier);
CREATE INDEX IF NOT EXISTS idx_violations_endpoint ON rate_limit_violations(endpoint);
CREATE INDEX IF NOT EXISTS idx_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_violations_time ON rate_limit_violations(created_at DESC);

-- Create blocked_ips table for automatic IP blocking
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    violation_count INTEGER NOT NULL DEFAULT 0,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255), -- 'system' or user ID
    notes TEXT
);

-- Create indexes for IP blocking
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(blocked_until) WHERE blocked_until > NOW() OR is_permanent = TRUE;

-- ============================================================================
-- AUTOMATIC CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up expired rate limit records
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits 
    WHERE window_end < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup
    INSERT INTO rate_limit_violations (
        identifier, endpoint, violation_count, request_count, 
        limit_value, window_start, window_end
    ) VALUES (
        'system_cleanup', 'cleanup', 0, deleted_count, 
        0, NOW() - INTERVAL '1 day', NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically block IPs with excessive violations
CREATE OR REPLACE FUNCTION auto_block_abusive_ips()
RETURNS INTEGER AS $$
DECLARE
    blocked_count INTEGER := 0;
    abuse_record RECORD;
BEGIN
    -- Find IPs with more than 100 violations in the last hour
    FOR abuse_record IN
        SELECT 
            ip_address,
            COUNT(*) as violation_count,
            SUM(violation_count) as total_violations
        FROM rate_limit_violations 
        WHERE created_at > NOW() - INTERVAL '1 hour'
            AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING COUNT(*) > 100
    LOOP
        -- Block the IP for 24 hours
        INSERT INTO blocked_ips (ip_address, reason, violation_count, blocked_until, created_by)
        VALUES (
            abuse_record.ip_address,
            'Automatic block due to excessive rate limit violations',
            abuse_record.total_violations,
            NOW() + INTERVAL '24 hours',
            'system'
        )
        ON CONFLICT (ip_address) DO UPDATE SET
            violation_count = EXCLUDED.violation_count,
            blocked_until = GREATEST(blocked_ips.blocked_until, EXCLUDED.blocked_until),
            notes = COALESCE(blocked_ips.notes, '') || ' | Additional violations: ' || EXCLUDED.violation_count;
        
        blocked_count := blocked_count + 1;
    END LOOP;
    
    RETURN blocked_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED CLEANUP (Run these as CRON jobs)
-- ============================================================================

-- Daily cleanup of expired records (run at 2 AM)
-- SELECT cleanup_expired_rate_limits();

-- Hourly check for abusive IPs (run every hour)
-- SELECT auto_block_abusive_ips();

-- ============================================================================
-- RLS POLICIES FOR RATE LIMITING TABLES
-- ============================================================================

-- Enable RLS on rate limiting tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limiting data
CREATE POLICY "Service role can manage rate limits" ON rate_limits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage violations" ON rate_limit_violations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage blocked IPs" ON blocked_ips
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to service role
GRANT ALL ON rate_limits TO service_role;
GRANT ALL ON rate_limit_violations TO service_role;
GRANT ALL ON blocked_ips TO service_role;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View for rate limit analytics
CREATE OR REPLACE VIEW rate_limit_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    identifier,
    endpoint,
    COUNT(*) as request_count,
    SUM(violation_count) as total_violations,
    AVG(request_count) as avg_requests_per_window,
    MAX(violation_count) as max_violations
FROM rate_limit_violations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), identifier, endpoint
ORDER BY hour DESC, total_violations DESC;

-- View for top violators
CREATE OR REPLACE VIEW top_rate_limit_violators AS
SELECT 
    identifier,
    ip_address,
    COUNT(DISTINCT endpoint) as endpoints_violated,
    SUM(violation_count) as total_violations,
    MAX(created_at) as last_violation,
    COUNT(*) as violation_events
FROM rate_limit_violations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY identifier, ip_address
HAVING SUM(violation_count) > 10
ORDER BY total_violations DESC
LIMIT 50;

-- Grant read access to analytics views
GRANT SELECT ON rate_limit_analytics TO service_role;
GRANT SELECT ON top_rate_limit_violators TO service_role;

-- ============================================================================
-- SAMPLE QUERIES FOR MONITORING
-- ============================================================================

/*
-- Get current active rate limits
SELECT identifier, count, limit_value, violations, window_end 
FROM rate_limits 
WHERE window_end > NOW() 
ORDER BY violations DESC;

-- Get top violators in last 24 hours
SELECT * FROM top_rate_limit_violators;

-- Get hourly violation trends
SELECT * FROM rate_limit_analytics 
WHERE hour > NOW() - INTERVAL '24 hours';

-- Check if IP is blocked
SELECT * FROM blocked_ips 
WHERE ip_address = '192.168.1.1' 
    AND (blocked_until > NOW() OR is_permanent = TRUE);

-- Manual IP block
INSERT INTO blocked_ips (ip_address, reason, blocked_until, created_by)
VALUES ('192.168.1.100', 'Manual block - suspicious activity', NOW() + INTERVAL '1 week', 'admin');

-- Remove IP block
DELETE FROM blocked_ips WHERE ip_address = '192.168.1.100';
*/
