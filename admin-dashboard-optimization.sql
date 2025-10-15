-- Admin Dashboard Performance Optimization
-- These functions replace N+1 queries with single optimized queries

-- Function 1: Get users with project counts in a single query
CREATE OR REPLACE FUNCTION get_users_with_project_counts()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  email_verified boolean,
  created_at timestamp with time zone,
  project_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.name,
    u.email,
    u.email_verified,
    u.created_at,
    COALESCE(p.project_count, 0) as project_count
  FROM users u
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as project_count
    FROM projects
    GROUP BY user_id
  ) p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
$$;

-- Function 2: Get projects with details in a single query
CREATE OR REPLACE FUNCTION get_projects_with_details()
RETURNS TABLE (
  id uuid,
  name text,
  user_name text,
  user_email text,
  task_count bigint,
  created_at timestamp with time zone,
  last_activity timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    COALESCE(u.name, 'Unknown') as user_name,
    COALESCE(u.email, 'Unknown') as user_email,
    COALESCE(t.task_count, 0) as task_count,
    p.created_at,
    COALESCE(t.last_activity, p.created_at) as last_activity
  FROM projects p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN (
    SELECT 
      project_id,
      COUNT(*) as task_count,
      MAX(created_at) as last_activity
    FROM tasks
    GROUP BY project_id
  ) t ON p.id = t.project_id
  ORDER BY p.created_at DESC;
$$;

-- Function 3: Get dashboard statistics in a single query
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH 
  date_ranges AS (
    SELECT 
      NOW() as now,
      NOW() - INTERVAL '7 days' as one_week_ago,
      NOW() - INTERVAL '30 days' as one_month_ago
  ),
  user_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
      COUNT(*) FILTER (WHERE created_at > (SELECT one_week_ago FROM date_ranges)) as new_users_this_week,
      COUNT(*) FILTER (WHERE created_at > (SELECT one_month_ago FROM date_ranges)) as new_users_this_month
    FROM users
  ),
  project_stats AS (
    SELECT 
      COUNT(*) as total_projects,
      COUNT(*) as active_projects, -- All projects considered active for now
      COUNT(*) FILTER (WHERE created_at > (SELECT one_week_ago FROM date_ranges)) as new_projects_this_week,
      COUNT(*) FILTER (WHERE created_at > (SELECT one_month_ago FROM date_ranges)) as new_projects_this_month
    FROM projects
  ),
  task_stats AS (
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
      COUNT(*) FILTER (WHERE status = 'claimed') as claimed_tasks,
      COUNT(*) FILTER (WHERE status = 'available') as available_tasks
    FROM tasks
  )
  SELECT json_build_object(
    'users', json_build_object(
      'total', u.total_users,
      'verified', u.verified_users,
      'newThisWeek', u.new_users_this_week,
      'newThisMonth', u.new_users_this_month
    ),
    'projects', json_build_object(
      'total', p.total_projects,
      'active', p.active_projects,
      'newThisWeek', p.new_projects_this_week,
      'newThisMonth', p.new_projects_this_month
    ),
    'tasks', json_build_object(
      'total', t.total_tasks,
      'completed', t.completed_tasks,
      'claimed', t.claimed_tasks,
      'available', t.available_tasks
    )
  )
  FROM user_stats u, project_stats p, task_stats t;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_users_with_project_counts() TO service_role;
GRANT EXECUTE ON FUNCTION get_projects_with_details() TO service_role;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

COMMENT ON FUNCTION get_users_with_project_counts() IS 'Optimized function to get users with project counts in a single query';
COMMENT ON FUNCTION get_projects_with_details() IS 'Optimized function to get projects with task counts and last activity in a single query';
COMMENT ON FUNCTION get_dashboard_stats() IS 'Optimized function to get all dashboard statistics in a single query';










