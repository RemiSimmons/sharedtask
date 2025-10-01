# Project Customization Features Guide

## Overview
SharedTask now includes powerful project customization features that give hosts full control over their projects and contributor permissions.

## New Features

### 1. 📝 Project Description
- **Purpose**: Add a custom description that contributors will see under the project title
- **Location**: Admin Dashboard → Project Settings → Project Description
- **Example**: "Annual company potluck - please bring dishes to share!"
- **Visibility**: Shows on all contributor-facing pages

### 2. 🔒 Contributor Permissions System

#### Permission: Allow Contributors to Add Their Own Names
- **Default**: Enabled ✅
- **When Enabled**: Contributors can add new names to the contributor list when claiming tasks
- **When Disabled**: Only hosts can manage the contributor list through the admin dashboard
- **Use Case**: Disable for controlled environments where you want to pre-approve all contributors

#### Permission: Allow Contributors to Add Custom Tasks  
- **Default**: Enabled ✅
- **When Enabled**: Contributors can create new tasks when claiming (using "Add Custom Task" option)
- **When Disabled**: Only hosts can add tasks through the admin dashboard
- **Use Case**: Disable when you have a fixed list of tasks and don't want contributors adding their own

## Database Changes

### New Database Fields (migration-add-project-customization.sql)
```sql
-- Add to projects table
ALTER TABLE projects 
ADD COLUMN description text DEFAULT NULL,
ADD COLUMN allow_contributors_add_names boolean DEFAULT true,
ADD COLUMN allow_contributors_add_tasks boolean DEFAULT true;
```

## User Experience Changes

### For Hosts (Admin Dashboard)
1. **New Project Description Field**: Optional textarea in Project Settings
2. **New Permissions Section**: Two checkboxes to control contributor abilities
3. **Clear Explanations**: Each permission includes helpful descriptions

### For Contributors (Project Pages)
1. **Project Title & Description**: Shows custom project name and description (if set)
2. **Conditional Options**: 
   - "Add New Name" option only appears if permission is enabled
   - "Add Custom Task" option only appears if permission is enabled
3. **Helpful Messages**: Clear warnings when permissions prevent actions
4. **Fallback Behavior**: Graceful handling when no contributors or tasks are available

## Permission Matrix

| Scenario | Add Names Enabled | Add Tasks Enabled | Contributor Experience |
|----------|-------------------|-------------------|----------------------|
| Full Access | ✅ | ✅ | Can add names and custom tasks |
| Names Only | ✅ | ❌ | Can add names, must choose from existing tasks |
| Tasks Only | ❌ | ✅ | Must choose from existing names, can add custom tasks |
| Restricted | ❌ | ❌ | Must choose from existing names and tasks only |

## Implementation Notes

### Context Updates
- Added new fields to `ProjectSettings` interface
- Updated both `TaskContext.tsx` and `TaskContextWithSupabase.tsx`
- Added permission checks in `TaskClaimForm`

### UI Components
- Enhanced admin dashboard with new settings sections
- Updated project pages to show custom descriptions
- Added conditional rendering based on permissions
- Included helpful warning messages for restricted scenarios

### Database Compatibility
- New fields have sensible defaults (both permissions enabled)
- Backwards compatible with existing projects
- Migration script provided for database updates

## Best Practices

### For Event Organizers
- **Enable both permissions** for maximum flexibility
- **Add a clear project description** explaining the event and expectations
- **Pre-populate some contributor names** to get started

### For Corporate/Controlled Environments  
- **Disable "Add Names"** to control who can participate
- **Disable "Add Tasks"** to maintain a curated task list
- **Use project description** to explain any restrictions or guidelines

### For Family/Informal Groups
- **Keep both permissions enabled** for easy participation
- **Use friendly, welcoming project descriptions**
- **Let contributors self-organize** with minimal restrictions

