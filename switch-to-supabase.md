# Switch to Supabase Database

## Quick Setup Instructions

### 1. Set up Supabase (if not done already)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `database-schema.sql` in your Supabase SQL Editor
3. Create `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Switch to Supabase Context

Update your `app/layout.tsx` file:

**Change this import:**
```typescript
import { TaskProvider } from '@/contexts/TaskContext'
```

**To this:**
```typescript
import { TaskProvider } from '@/contexts/TaskContextWithSupabase'
```

### 3. Test the Integration

```bash
npm run dev
```

The app will:
- Automatically create a default project on first load
- Store all tasks, assignments, and comments in your Supabase database
- Show loading states while connecting to the database
- Display helpful error messages if there are connection issues

### 4. Switch Back to Mock Data (if needed)

To go back to the in-memory version, simply change the import back:

```typescript
import { TaskProvider } from '@/contexts/TaskContext'
```

## Features with Supabase Integration

✅ **Persistent Storage**: All data is saved to your Supabase database  
✅ **Real-time Updates**: Changes are immediately saved and reflected  
✅ **Error Handling**: Graceful error messages for connection issues  
✅ **Loading States**: Shows loading spinner while connecting  
✅ **Multiple Contributors**: Full support for collaborative task management  
✅ **Comments System**: Persistent comments with timestamps  
✅ **Project Settings**: Admin settings are saved to the database  

## Database Schema Overview

- **projects**: Store project settings and configuration
- **tasks**: Individual tasks with status and description  
- **task_assignments**: Track who claimed which tasks (supports multiple contributors)
- **task_comments**: Comments on tasks with author and timestamp

All tables include proper foreign key relationships and indexes for performance.

