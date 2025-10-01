# Project Customization Features

This document outlines the new project customization features that have been added to SharedTask.

## 🆕 New Features

### 1. Optional Project Description
- **Feature**: Hosts can add a description to their projects
- **Location**: Admin Dashboard → Project Settings → Project Description
- **Display**: Contributors see the description under the project title on the project page
- **Implementation**: 
  - Database field: `description` (text, nullable)
  - UI: Textarea in admin dashboard
  - Display: Shown prominently on contributor-facing project page

### 2. Contributor Permission System
Two new permission controls allow hosts to grant/restrict contributor abilities:

#### 2.1 Allow Contributors to Add Names (`allow_contributors_add_names`)
- **Default**: `true` (enabled)
- **When Enabled**: Contributors can add new names to the contributor list when claiming tasks
- **When Disabled**: Only hosts can manage the contributor list
- **UI Feedback**: Shows appropriate messages when permissions are restricted

#### 2.2 Allow Contributors to Add Custom Tasks (`allow_contributors_add_tasks`)
- **Default**: `true` (enabled) 
- **When Enabled**: Contributors can add custom tasks to the project via "Add Custom Task" option
- **When Disabled**: Only hosts can add tasks to the project
- **UI Feedback**: Shows appropriate messages when permissions are restricted

## 🗃️ Database Changes

### New Fields Added to `projects` Table:
```sql
-- Add these fields to existing projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS allow_contributors_add_names boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_contributors_add_tasks boolean DEFAULT true;
```

### Migration File
- Created `database-migration.sql` for existing installations
- Updates both `database-schema.sql` and `supabase-setup.md` with new fields

## 🎨 UI Implementation

### Admin Dashboard (Host View)
- **Project Description**: Large textarea for entering project description
- **Permission Controls**: Two checkboxes with clear explanations:
  - 👤 Allow contributors to add their own names
  - ➕ Allow contributors to add custom tasks

### Contributor View (Project Page)
- **Description Display**: Shows project description prominently under the project title
- **Permission Enforcement**:
  - "Add New Name" option only appears when permission is granted
  - "Add Custom Task" option only appears when permission is granted
  - Warning messages shown when permissions are disabled and no alternatives exist

## 🔧 Technical Implementation

### Files Modified:
1. **Database Schema**:
   - `database-schema.sql` - Updated projects table
   - `supabase-setup.md` - Updated setup instructions
   - `database-migration.sql` - New migration file

2. **TypeScript Types**:
   - `types/database.ts` - Added new fields to projects Row/Insert/Update types

3. **Context Layer**:
   - `contexts/TaskContextWithSupabase.tsx` - Added permission logic and database handling
   - Permission fields already included in ProjectSettings interface
   - updateProjectSettings() function already handles new fields

4. **API Routes**:
   - `app/api/projects/route.ts` - Project creation includes default permission values
   - `lib/supabase.ts` - getOrCreateDefaultProject includes default values

5. **UI Components**:
   - `components/admin-dashboard.tsx` - Permission controls already implemented
   - `components/task-claim-form.tsx` - Permission enforcement already implemented
   - `app/project/[id]/page.tsx` - Description display already implemented

## 🚀 How to Use

### For Hosts:
1. Go to Admin Dashboard
2. Scroll to "Project Description" section to add a description
3. Use "Contributor Permissions" section to configure:
   - Whether contributors can add their own names
   - Whether contributors can add custom tasks

### For Contributors:
- Project description appears automatically under the project title
- Permission restrictions are enforced automatically with helpful messages
- When permissions are disabled, clear warnings explain what the host needs to do

## ✅ Testing Status

- ✅ Build passes without errors
- ✅ No linting errors
- ✅ TypeScript types are properly defined
- ✅ Database schema is consistent
- ✅ UI components handle permissions correctly
- ✅ API endpoints create projects with default values

## 🔄 Backward Compatibility

- All new fields have sensible defaults (`true` for permissions, `null` for description)
- Existing projects will work without modification
- Migration script provided for adding fields to existing databases
- No breaking changes to existing functionality

## 📋 Default Values

When creating new projects, the system uses these defaults:
- `description`: `null` (no description)
- `allow_contributors_add_names`: `true` (contributors can add names)
- `allow_contributors_add_tasks`: `true` (contributors can add custom tasks)

This ensures new projects are maximally collaborative by default while giving hosts full control to restrict permissions as needed.

