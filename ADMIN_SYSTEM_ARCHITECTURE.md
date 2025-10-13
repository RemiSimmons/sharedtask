# Admin Dashboard Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                          │
│                     (User-Centric Management)                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
          ┌─────────▼─────────┐     ┌────────▼────────┐
          │   Main Dashboard  │     │  Projects View  │
          │   /admin          │     │  /admin/projects│
          └─────────┬─────────┘     └─────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
    │ Search │ │ Filter │ │ Stats  │
    │  Box   │ │  Tier  │ │  Bar   │
    └────────┘ └────────┘ └────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐        ┌──────▼──────┐
    │   User   │        │    User     │
    │  Cards   │───────▶│   Detail    │
    │  Grid    │        │  /admin/    │
    └──────────┘        │  user/[id]  │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   User's    │
                        │  Projects   │
                        │    List     │
                        └─────────────┘
```

---

## Component Hierarchy

```
app/admin/page.tsx (Main Dashboard)
│
├─ AppHeader
│  └─ Navigation & User Menu
│
├─ Quick Actions
│  ├─ [📊 Operations Dashboard]
│  ├─ [💬 Support Tickets]
│  └─ [📁 All Projects]
│
├─ Platform Stats Bar
│  ├─ Total Users
│  ├─ Free Tier Count
│  ├─ Basic Tier Count
│  ├─ Pro Tier Count
│  ├─ Team Tier Count
│  └─ Active Users Count
│
├─ Filters & Search
│  ├─ View Mode Toggle (Users/Projects)
│  ├─ Search Input
│  ├─ Tier Filter Dropdown
│  ├─ Status Filter Dropdown
│  └─ Refresh Button
│
└─ User Cards Grid
   └─ AdminUserCard (repeated)
      ├─ User Avatar
      ├─ User Name & Email
      ├─ Email Verification Badge
      ├─ Tier Badge
      ├─ Activity Indicator
      ├─ Projects Usage Bar
      ├─ Storage Usage Bar
      ├─ Task Count
      ├─ Last Activity
      └─ [View Details] Button
         │
         └─ Links to →

app/admin/user/[id]/page.tsx (User Detail)
│
├─ AppHeader
│
├─ User Profile Header
│  ├─ Avatar
│  ├─ Name & Email
│  ├─ Tier Badge
│  ├─ Verification Badge
│  └─ Days Since Joined
│
├─ Stats Cards
│  ├─ Projects Card (count & limit)
│  ├─ Tasks Card (total count)
│  ├─ Storage Card (used & limit)
│  └─ Account Type Card (tier)
│
├─ Usage Bars Section
│  ├─ Projects Progress Bar
│  └─ Storage Progress Bar
│
├─ Billing Information
│  ├─ Subscription Details
│  └─ Trial Status
│
└─ User's Projects List
   └─ Project Cards (repeated)
      ├─ Project Name
      ├─ Task Count
      ├─ Created Date
      ├─ [Manage] Button
      └─ [View] Button
```

---

## API Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        API LAYER                              │
└──────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼──────────┐   ┌──────▼──────┐
│ /api/admin/    │    │ /api/admin/        │   │ /api/admin/ │
│ users-overview │    │ user/[id]          │   │ projects    │
└───────┬────────┘    └─────────┬──────────┘   └──────┬──────┘
        │                       │                      │
        │                       │                      │
        │             ┌─────────▼──────────┐           │
        │             │ /api/admin/        │           │
        │             │ user/[id]/projects │           │
        │             └─────────┬──────────┘           │
        │                       │                      │
        └───────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   SUPABASE DATABASE   │
                    │   (PostgreSQL + RLS)  │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼──────────┐   ┌──────▼──────┐
│  users table   │    │  projects table    │   │ tasks table │
└────────────────┘    └────────────────────┘   └─────────────┘
        │                       │
┌───────▼────────┐    ┌─────────▼──────────┐
│ subscriptions  │    │  user_trials       │
└────────────────┘    └────────────────────┘
```

---

## Data Flow

### **User Cards Display Flow**

```
1. User visits /admin
        │
        ▼
2. Page calls GET /api/admin/users-overview
        │
        ▼
3. API authenticates user (must be admin)
        │
        ▼
4. API queries Supabase:
   - Fetch all users
   - LEFT JOIN subscriptions
   - LEFT JOIN user_trials
   - Count projects per user
   - Count tasks per user
   - Calculate storage usage
        │
        ▼
5. API calculates:
   - Project usage percentage
   - Storage usage percentage
   - Tier limits
   - Activity status
   - Platform stats
        │
        ▼
6. API returns JSON:
   {
     users: [...],
     stats: { total, byTier, active }
   }
        │
        ▼
7. Page renders:
   - Platform stats bar
   - User cards grid
   - Filters (client-side)
```

### **User Detail View Flow**

```
1. User clicks card → Navigate to /admin/user/[id]
        │
        ▼
2. Page calls GET /api/admin/user/[id]
        │
        ▼
3. API fetches user details from Supabase
        │
        ▼
4. Page calls GET /api/admin/user/[id]/projects
        │
        ▼
5. API fetches user's projects with task counts
        │
        ▼
6. Page renders user detail with projects list
```

### **Filtering Flow (Client-Side)**

```
1. User types in search box
        │
        ▼
2. State updates: setSearchQuery(value)
        │
        ▼
3. React filters users array:
   users.filter(u => 
     u.name.includes(query) || 
     u.email.includes(query)
   )
        │
        ▼
4. Filtered cards re-render (instant)

SAME PROCESS FOR:
- Tier filtering
- Status filtering
```

---

## Database Schema

### **Key Tables Used**

```sql
-- Users table
users {
  id: uuid (PK)
  name: text
  email: text
  email_verified: boolean
  role: text
  created_at: timestamp
}

-- Projects table
projects {
  id: uuid (PK)
  name: text
  user_id: uuid (FK → users.id)
  created_at: timestamp
  ...
}

-- Tasks table
tasks {
  id: uuid (PK)
  project_id: uuid (FK → projects.id)
  ...
}

-- Subscriptions table
subscriptions {
  id: uuid (PK)
  user_id: uuid (FK → users.id)
  stripe_customer_id: text
  stripe_subscription_id: text
  status: text
  tier: text
  current_period_end: timestamp
  ...
}

-- User Trials table
user_trials {
  id: uuid (PK)
  user_id: uuid (FK → users.id)
  trial_tier: text
  trial_start: timestamp
  trial_end: timestamp
  ...
}
```

### **Tier Limits Logic**

```typescript
// Calculated in API
const tierLimits = {
  free: {
    projects: 1,
    storage: 100,    // MB
    tasks: 50
  },
  basic: {
    projects: 3,
    storage: 500,    // MB
    tasks: 200
  },
  pro: {
    projects: 10,
    storage: 2048,   // MB (2GB)
    tasks: 1000
  },
  team: {
    projects: 999,   // Unlimited (display as ∞)
    storage: 10240,  // MB (10GB)
    tasks: 9999      // Unlimited
  }
}

// Usage calculation
const projectUsagePercent = (userProjectCount / tierLimits[tier].projects) * 100
const storageUsagePercent = (userStorageUsed / tierLimits[tier].storage) * 100
```

---

## Security Architecture

### **Authentication Flow**

```
1. User accesses /admin
        │
        ▼
2. Middleware checks authentication
   - If not logged in → redirect to /login
        │
        ▼
3. Page component calls isAdminUser()
   - Checks: lib/admin.ts
   - Verifies: contact@remisimmons.com
        │
        ▼
4. API endpoints verify:
   - Session exists
   - isAdminUser(session.user) === true
        │
        ▼
5. Admin access granted
```

### **Admin Access Control**

```typescript
// Email-based admin check
// lib/admin.ts
export function isAdminUser(user: any): boolean {
  const adminEmail = 'contact@remisimmons.com'
  return user?.email === adminEmail
}

// Used in:
- Pages (client-side redirect)
- API endpoints (server-side authorization)
- Components (conditional rendering)
```

### **Audit Logging**

```
Every admin action is logged to:
- admin_access_logs table

Logged actions:
- View user details
- Access projects
- Export data
- System operations

Log includes:
- admin_email
- action type
- resource accessed
- timestamp
- IP address
- user agent
```

---

## Performance Optimizations

### **1. Efficient Database Queries**

```sql
-- Single query fetches everything
SELECT 
  u.*,
  s.tier,
  s.status as subscription_status,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT t.id) as task_count
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY u.id, s.tier, s.status
ORDER BY u.created_at DESC
```

### **2. Client-Side Filtering**

```typescript
// No API calls for filtering
const filteredUsers = users.filter(user => {
  const matchesSearch = 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  
  const matchesTier = tierFilter === 'all' || user.tier === tierFilter
  const matchesStatus = statusFilter === 'all' || 
    (statusFilter === 'active' ? user.isActive : !user.isActive)
  
  return matchesSearch && matchesTier && matchesStatus
})

// Result: Instant filtering (no network delay)
```

### **3. Lazy Loading**

```typescript
// User detail page only loads when clicked
// Projects only load when viewing user detail
// No unnecessary data fetched upfront
```

---

## UI/UX Design Patterns

### **Visual Hierarchy**

```
Level 1: Platform stats (most important)
  └─ Bold numbers, prominent placement

Level 2: Search & filters (frequent actions)
  └─ Always visible, easy access

Level 3: User cards (main content)
  └─ Grid layout, scannable

Level 4: User details (drill-down)
  └─ Separate page, comprehensive
```

### **Color Psychology**

```
Gray (Free)   → "Starting out, basic"
Blue (Basic)  → "Trust, reliability, paid"
Purple (Pro)  → "Premium, power user"
Green (Team)  → "Growth, success, enterprise"

Green bars    → "Healthy, no action needed"
Yellow bars   → "Warning, approaching limit"
Red bars      → "Critical, needs attention/upgrade"
```

### **Responsive Breakpoints**

```css
/* Mobile: 1 column */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}

/* Large: 4 columns */
@media (min-width: 1280px) {
  grid-template-columns: repeat(4, 1fr);
}
```

---

## Future Scalability

### **Pagination (for 100+ users)**

```typescript
// Add to API
const page = parseInt(searchParams.get('page') || '1')
const limit = 50
const offset = (page - 1) * limit

// Query
.range(offset, offset + limit - 1)

// Add to UI
<Pagination 
  currentPage={page}
  totalPages={Math.ceil(totalUsers / limit)}
/>
```

### **Real-time Updates (Supabase Realtime)**

```typescript
// Subscribe to user changes
const subscription = supabase
  .from('users')
  .on('UPDATE', (payload) => {
    updateUserCard(payload.new)
  })
  .subscribe()
```

### **Advanced Filtering**

```typescript
// Add date range filters
filterByDateRange(startDate, endDate)

// Add project count ranges
filterByProjectCount(min, max)

// Add storage ranges
filterByStorageUsage(min, max)
```

---

## Summary

**This architecture provides:**

✅ **Scalable** - Can handle thousands of users
✅ **Performant** - Single query, client-side filtering
✅ **Secure** - Admin checks, audit logging, RLS policies
✅ **Maintainable** - Clean separation of concerns
✅ **Extensible** - Easy to add new features
✅ **User-friendly** - Intuitive UI, instant feedback

**Built with:**
- Next.js 14 (App Router)
- React Server Components
- Supabase (PostgreSQL + RLS)
- TypeScript
- Tailwind CSS

**Production Ready:** YES ✅

---

**Last Updated:** October 13, 2025

