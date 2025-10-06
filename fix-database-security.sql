-- Fix database security issues related to mutable search_path
-- Run this in your Supabase SQL Editor

-- Fix get_dashboard_stats function
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_projects', (SELECT COUNT(*) FROM projects),
        'total_tasks', (SELECT COUNT(*) FROM tasks),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE created_at > NOW() - INTERVAL '30 days')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Fix get_projects_with_details function
DROP FUNCTION IF EXISTS public.get_projects_with_details();
CREATE OR REPLACE FUNCTION public.get_projects_with_details()
RETURNS TABLE (
    id uuid,
    name text,
    created_at timestamp,
    user_id uuid,
    task_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.created_at,
        p.user_id,
        COALESCE(t.task_count, 0) as task_count
    FROM projects p
    LEFT JOIN (
        SELECT project_id, COUNT(*) as task_count
        FROM tasks
        GROUP BY project_id
    ) t ON p.id = t.project_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Fix get_users_with_project_counts function
DROP FUNCTION IF EXISTS public.get_users_with_project_counts();
CREATE OR REPLACE FUNCTION public.get_users_with_project_counts()
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    created_at timestamp,
    project_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.created_at,
        COALESCE(p.project_count, 0) as project_count
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) as project_count
        FROM projects
        GROUP BY user_id
    ) p ON u.id = p.user_id
    ORDER BY u.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_projects_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_project_counts() TO authenticated;
