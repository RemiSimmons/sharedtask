# Quick Fix for Admin Monitoring Page

## The Issue
The admin operations page is trying to access `monitoring.systemHealth.status` but the new monitoring API returns a different data structure, causing a TypeError.

## Quick Fix Instructions

**Replace the entire monitoring tab section** in `app/admin/operations/page.tsx` (lines 893-1166) with this:

```tsx
{/* System Monitoring Tab */}
{activeTab === 'monitoring' && (
  <div className="space-y-8">
    {/* Import the new production monitoring component */}
    <AdminSystemMonitor />
  </div>
)}
```

## Steps to Fix:

### 1. Add the import at the top of the file

Add this import to the top of `app/admin/operations/page.tsx`:

```tsx
import AdminSystemMonitor from '@/components/admin-system-monitor'
```

### 2. Replace the monitoring section

Find this line (around line 893):
```tsx
{/* System Monitoring Tab */}
{activeTab === 'monitoring' && (
```

And replace everything until this line (around line 1166):
```tsx
          )}
```

With just:
```tsx
{/* System Monitoring Tab */}
{activeTab === 'monitoring' && (
  <div className="space-y-8">
    <AdminSystemMonitor />
  </div>
)}
```

### 3. Remove old monitoring state (optional cleanup)

You can also remove these lines from the state section:
```tsx
const [monitoring, setMonitoring] = useState<any>(null)
const [monitoringLoading, setMonitoringLoading] = useState(false)
```

And remove the `loadMonitoringData` function.

## Result

This will give you a **production-level monitoring dashboard** with:
- ✅ Real CPU, memory, disk usage
- ✅ Live database performance metrics  
- ✅ API endpoint health monitoring
- ✅ System alerts and error tracking
- ✅ Auto-refresh capabilities
- ✅ Professional UI with tabs and charts

The new component handles all the data fetching and error handling internally, so you won't get the TypeError anymore.







