# Supabase Database Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account if you don't have one
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Set up Environment Variables

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon key
3. Create a `.env.local` file in your project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project URL and anon key.

## 3. Create Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Run the following SQL commands to create the required tables:

```sql
-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Project',
  task_label text DEFAULT 'Task Name',
  admin_password text NOT NULL,
  allow_multiple_tasks boolean DEFAULT false,
  allow_multiple_contributors boolean DEFAULT false,
  max_contributors_per_task integer,
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
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we're not using auth)
-- In a production app, you'd want more restrictive policies
CREATE POLICY "Allow public access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow public access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow public access to task_assignments" ON task_assignments FOR ALL USING (true);
CREATE POLICY "Allow public access to task_comments" ON task_comments FOR ALL USING (true);
```

## 4. Switch to Supabase Context

To use the Supabase-powered version:

1. Update your `app/layout.tsx` to import from the new context:

```typescript
// Change this line:
import { TaskProvider } from '@/contexts/TaskContext'

// To this:
import { TaskProvider } from '@/contexts/TaskContextWithSupabase'
```

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. The app should automatically create a default project on first load
3. Try adding tasks, claiming them, and adding comments
4. Check your Supabase dashboard to see the data being stored

## 6. Optional: Add Sample Data

You can add some sample data to test with:

```sql
-- Insert a sample project
INSERT INTO projects (name, task_label, admin_password, allow_multiple_contributors, max_contributors_per_task)
VALUES ('Family Potluck', 'Food Items', 'admin123', true, 3);

-- Get the project ID (replace with actual ID from the insert)
-- INSERT INTO tasks (project_id, name, description, status) VALUES 
-- ('your-project-id-here', 'Bring appetizers', 'Finger foods and dips', 'available'),
-- ('your-project-id-here', 'Main course', 'Casserole or main dish', 'available'),
-- ('your-project-id-here', 'Dessert', 'Cake, pie, or cookies', 'available');
```

## Troubleshooting

- Make sure your environment variables are correctly set
- Check the browser console and Supabase logs for any errors
- Verify that RLS policies allow the operations you're trying to perform
- Make sure your Supabase project is active and not paused

