-- ============================================================================
-- STRUCTURED LOGGING DATABASE SCHEMA
-- ============================================================================

-- Create application_logs table for structured logging
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    category VARCHAR(20) NOT NULL CHECK (category IN (
        'auth', 'api', 'database', 'security', 'performance', 
        'business', 'system', 'validation', 'rate_limit', 'email'
    )),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    environment VARCHAR(20) NOT NULL DEFAULT 'development',
    service VARCHAR(50) NOT NULL DEFAULT 'sharedtask-api',
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON application_logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_environment ON application_logs(environment);
CREATE INDEX IF NOT EXISTS idx_logs_level_category ON application_logs(level, category);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp_level ON application_logs(timestamp DESC, level);

-- Create GIN index for JSONB context searching
CREATE INDEX IF NOT EXISTS idx_logs_context ON application_logs USING GIN(context);

-- Create partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_errors ON application_logs(timestamp DESC) 
    WHERE level IN ('error', 'fatal');
CREATE INDEX IF NOT EXISTS idx_logs_security ON application_logs(timestamp DESC) 
    WHERE category = 'security';
CREATE INDEX IF NOT EXISTS idx_logs_auth ON application_logs(timestamp DESC) 
    WHERE category = 'auth';

-- Create error_tracking table for detailed error analysis
CREATE TABLE IF NOT EXISTS error_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_hash VARCHAR(64) NOT NULL, -- Hash of error message + stack
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    category VARCHAR(20) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    service VARCHAR(50) NOT NULL,
    context_sample JSONB DEFAULT '{}', -- Sample context from latest occurrence
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for error tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_error_tracking_hash ON error_tracking(error_hash);
CREATE INDEX IF NOT EXISTS idx_error_tracking_last_seen ON error_tracking(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_count ON error_tracking(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_status ON error_tracking(status);

-- Create performance_metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20) NOT NULL DEFAULT 'ms',
    endpoint VARCHAR(255),
    method VARCHAR(10),
    user_id UUID,
    session_id VARCHAR(100),
    environment VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perf_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_perf_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_perf_user ON performance_metrics(user_id);

-- Create security_events table for security monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source_ip INET,
    user_id UUID,
    session_id VARCHAR(100),
    user_agent TEXT,
    endpoint VARCHAR(255),
    event_data JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'resolved', 'false_positive')),
    environment VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_risk ON security_events(risk_score DESC);

-- ============================================================================
-- AUTOMATIC FUNCTIONS FOR LOG MANAGEMENT
-- ============================================================================

-- Function to automatically create error tracking entries
CREATE OR REPLACE FUNCTION process_error_log()
RETURNS TRIGGER AS $$
DECLARE
    error_hash_val VARCHAR(64);
    error_msg TEXT;
    stack_trace_val TEXT;
BEGIN
    -- Only process error and fatal level logs
    IF NEW.level NOT IN ('error', 'fatal') THEN
        RETURN NEW;
    END IF;
    
    -- Extract error information from context
    error_msg := COALESCE(NEW.context->>'error', NEW.message);
    stack_trace_val := NEW.context->>'stack';
    
    -- Create hash of error message and stack trace
    error_hash_val := encode(digest(error_msg || COALESCE(stack_trace_val, ''), 'sha256'), 'hex');
    
    -- Insert or update error tracking
    INSERT INTO error_tracking (
        error_hash, error_message, stack_trace, category, 
        environment, service, context_sample
    ) VALUES (
        error_hash_val, error_msg, stack_trace_val, NEW.category,
        NEW.environment, NEW.service, NEW.context
    )
    ON CONFLICT (error_hash) DO UPDATE SET
        last_seen = NOW(),
        occurrence_count = error_tracking.occurrence_count + 1,
        context_sample = EXCLUDED.context_sample,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for error processing
DROP TRIGGER IF EXISTS trigger_process_error_log ON application_logs;
CREATE TRIGGER trigger_process_error_log
    AFTER INSERT ON application_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_error_log();

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    retention_days INTEGER := 90; -- Keep logs for 90 days
BEGIN
    -- Delete old application logs (except errors which we keep longer)
    DELETE FROM application_logs 
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND level NOT IN ('error', 'fatal');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete very old error logs (keep errors for 1 year)
    DELETE FROM application_logs 
    WHERE created_at < NOW() - INTERVAL '1 year'
      AND level IN ('error', 'fatal');
    
    -- Clean up old performance metrics (keep for 30 days)
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up resolved security events (keep for 6 months)
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '6 months'
      AND status = 'resolved';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate error rates
CREATE OR REPLACE FUNCTION get_error_rate(
    time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TABLE(
    category VARCHAR(20),
    total_logs BIGINT,
    error_logs BIGINT,
    error_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.category,
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE l.level IN ('error', 'fatal')) as error_logs,
        ROUND(
            (COUNT(*) FILTER (WHERE l.level IN ('error', 'fatal'))::NUMERIC / COUNT(*)) * 100, 
            2
        ) as error_rate
    FROM application_logs l
    WHERE l.timestamp > NOW() - time_window
    GROUP BY l.category
    ORDER BY error_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES FOR LOGGING TABLES
-- ============================================================================

-- Enable RLS on logging tables
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access logging data
CREATE POLICY "Service role can manage logs" ON application_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage error tracking" ON error_tracking
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage performance metrics" ON performance_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage security events" ON security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to service role
GRANT ALL ON application_logs TO service_role;
GRANT ALL ON error_tracking TO service_role;
GRANT ALL ON performance_metrics TO service_role;
GRANT ALL ON security_events TO service_role;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View for log analytics
CREATE OR REPLACE VIEW log_analytics AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    level,
    category,
    COUNT(*) as log_count,
    COUNT(DISTINCT (context->>'userId')) as unique_users,
    COUNT(DISTINCT (context->>'ip')) as unique_ips
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp), level, category
ORDER BY hour DESC, log_count DESC;

-- View for error summary
CREATE OR REPLACE VIEW error_summary AS
SELECT 
    error_message,
    category,
    occurrence_count,
    first_seen,
    last_seen,
    status,
    EXTRACT(EPOCH FROM (last_seen - first_seen)) / 3600 as duration_hours
FROM error_tracking
WHERE status != 'resolved'
ORDER BY occurrence_count DESC, last_seen DESC;

-- View for performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(metric_value) as avg_response_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as median_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_response_time,
    MAX(metric_value) as max_response_time
FROM performance_metrics
WHERE metric_name = 'response_time' 
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY avg_response_time DESC;

-- View for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT source_ip) as unique_ips,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(risk_score) as avg_risk_score,
    MAX(timestamp) as latest_event
FROM security_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY avg_risk_score DESC, event_count DESC;

-- Grant read access to analytics views
GRANT SELECT ON log_analytics TO service_role;
GRANT SELECT ON error_summary TO service_role;
GRANT SELECT ON performance_summary TO service_role;
GRANT SELECT ON security_dashboard TO service_role;

-- ============================================================================
-- SAMPLE QUERIES FOR MONITORING
-- ============================================================================

/*
-- Get recent errors
SELECT * FROM application_logs 
WHERE level IN ('error', 'fatal') 
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Get error rates by category
SELECT * FROM get_error_rate(INTERVAL '24 hours');

-- Get top errors
SELECT * FROM error_summary LIMIT 10;

-- Get slow endpoints
SELECT * FROM performance_summary 
WHERE avg_response_time > 1000 
ORDER BY avg_response_time DESC;

-- Get security events
SELECT * FROM security_dashboard;

-- Search logs by context
SELECT * FROM application_logs 
WHERE context @> '{"userId": "some-user-id"}'
  AND timestamp > NOW() - INTERVAL '1 day';

-- Get logs for specific request
SELECT * FROM application_logs 
WHERE context->>'requestId' = 'some-request-id'
ORDER BY timestamp;
*/
