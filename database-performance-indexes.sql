-- Performance Optimization Indexes for SharedTask
-- Run this SQL in your Supabase SQL Editor for better query performance

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Users table optimizations
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified, created_at DESC);

-- Projects table optimizations  
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name_search ON projects USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- Tasks table optimizations
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Task assignments optimizations
CREATE INDEX IF NOT EXISTS idx_assignments_task_contributor ON task_assignments(task_id, contributor_name);
CREATE INDEX IF NOT EXISTS idx_assignments_claimed_at ON task_assignments(claimed_at DESC);

-- Task comments optimizations  
CREATE INDEX IF NOT EXISTS idx_comments_task_created ON task_comments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON task_comments(author_name, created_at DESC);

-- Subscription and billing optimizations
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON user_subscriptions(user_id, status, current_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON user_subscriptions(stripe_customer_id, stripe_subscription_id);

-- Logging and monitoring optimizations
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp ON application_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_category_timestamp ON application_logs(category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_timestamp ON application_logs(user_id, timestamp DESC) WHERE user_id IS NOT NULL;

-- Error tracking optimizations
CREATE INDEX IF NOT EXISTS idx_error_tracking_status_severity ON error_tracking(status, severity, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_environment ON error_tracking(environment, service, last_seen DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================================================

-- Project statistics view for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS project_stats AS
SELECT 
  p.user_id,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE p.created_at > NOW() - INTERVAL '7 days') as projects_this_week,
  COUNT(*) FILTER (WHERE p.created_at > NOW() - INTERVAL '30 days') as projects_this_month,
  MAX(p.created_at) as last_project_created
FROM projects p
GROUP BY p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_stats_user ON project_stats(user_id);

-- Task statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS task_stats AS
SELECT 
  t.project_id,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE t.status = 'available') as available_tasks,
  COUNT(*) FILTER (WHERE t.status = 'claimed') as claimed_tasks,
  COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
  COUNT(DISTINCT ta.contributor_name) as unique_contributors,
  MAX(t.created_at) as last_task_created
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.project_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_stats_project ON task_stats(project_id);

-- ============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh project stats
CREATE OR REPLACE FUNCTION refresh_project_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh task stats  
CREATE OR REPLACE FUNCTION refresh_task_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY task_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Optimized function to get project with task counts
CREATE OR REPLACE FUNCTION get_project_with_stats(project_uuid UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP,
  total_tasks BIGINT,
  available_tasks BIGINT,
  claimed_tasks BIGINT,
  completed_tasks BIGINT,
  unique_contributors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at,
    COALESCE(ts.total_tasks, 0),
    COALESCE(ts.available_tasks, 0),
    COALESCE(ts.claimed_tasks, 0),
    COALESCE(ts.completed_tasks, 0),
    COALESCE(ts.unique_contributors, 0)
  FROM projects p
  LEFT JOIN task_stats ts ON p.id = ts.project_id
  WHERE p.id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Enable query performance tracking
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = 'all';

-- Create performance monitoring view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  stddev_time
FROM pg_stat_statements 
WHERE mean_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_users_email_role IS 'Optimizes admin user lookups and authentication';
COMMENT ON INDEX idx_projects_user_created IS 'Optimizes user project listings';
COMMENT ON INDEX idx_tasks_project_status IS 'Optimizes task filtering and project views';
COMMENT ON MATERIALIZED VIEW project_stats IS 'Pre-computed project statistics for dashboard performance';
COMMENT ON MATERIALIZED VIEW task_stats IS 'Pre-computed task statistics for project views';

-- ============================================================================
-- REFRESH SCHEDULE (Run these periodically)
-- ============================================================================

-- Refresh materialized views every hour for better performance
-- You can set up a cron job or use Supabase Edge Functions for this:
-- SELECT cron.schedule('refresh-stats', '0 * * * *', 'SELECT refresh_project_stats(); SELECT refresh_task_stats();');

SELECT 'Performance indexes and optimizations applied successfully!' as result;













