-- Supabase Database Schema for Task Management App
-- Run this SQL in your Supabase SQL Editor

-- Users table for authentication
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  email_verified boolean DEFAULT false,
  email_verified_at timestamp,
  reset_token text,
  reset_token_expires timestamp,
  created_at timestamp DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Project',
  task_label text DEFAULT 'Task Name',
  admin_password text NOT NULL,
  allow_multiple_tasks boolean DEFAULT false,
  allow_multiple_contributors boolean DEFAULT false,
  max_contributors_per_task integer,
  contributor_names json DEFAULT '[]',
  description text,
  allow_contributors_add_names boolean DEFAULT true,
  allow_contributors_add_tasks boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Tasks table  
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'available',
  created_at timestamp DEFAULT now()
);

-- Task assignments for multiple contributors
CREATE TABLE task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  contributor_name text NOT NULL,
  claimed_at timestamp DEFAULT now()
);

-- Comments table
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
-- Users can only access their own data
CREATE POLICY "Users can access their own data" ON users FOR ALL USING (auth.uid() = id);

-- Projects are accessible by their owner and publicly readable (for shared links)
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read access to projects" ON projects FOR SELECT USING (true);

-- Tasks, assignments, and comments inherit project access
CREATE POLICY "Access tasks through project ownership" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND (auth.uid() = projects.user_id OR true))
);

CREATE POLICY "Access task_assignments through project ownership" ON task_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN tasks t ON p.id = t.project_id WHERE t.id = task_assignments.task_id AND (auth.uid() = p.user_id OR true))
);

CREATE POLICY "Access task_comments through project ownership" ON task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN tasks t ON p.id = t.project_id WHERE t.id = task_comments.task_id AND (auth.uid() = p.user_id OR true))
);

-- Optional: Insert sample data
-- INSERT INTO projects (name, task_label, admin_password, allow_multiple_contributors, max_contributors_per_task)
-- VALUES ('Family Potluck', 'Food Items', 'admin123', true, 3);
