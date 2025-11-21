# Migration: Fix Admin Templates isPublic Field

## Problem
All admin templates in the database have `isPublic=undefined` instead of `isPublic=true`, causing them not to be detected by `getAdminTemplates()`.

## Solution
Run the migration mutation to fix all existing admin templates.

## How to Run Migration

### Option 1: From Convex Dashboard (Recommended)
1. Go to https://dashboard.convex.dev/
2. Select your project
3. Go to "Functions" tab
4. Find `templates:fixAdminTemplatesIsPublic`
5. Click "Run" button
6. The mutation will update all admin templates to have `isPublic=true`

### Option 2: From Code (using useMutation)
Add this temporarily to any admin-only page:

```typescript
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Inside your component
const runMigration = useMutation(api.templates.fixAdminTemplatesIsPublic);

// Add a button
<button onClick={() => runMigration()}>
  Run Migration
</button>
```

### Option 3: Using CLI
```bash
npx convex run templates:fixAdminTemplatesIsPublic
```

## After Running Migration
Check the console logs to see:
```
[MIGRATION] Updated template "Template Name" to isPublic=true
```

The mutation will return:
```json
{
  "success": true,
  "message": "Migration completed. Updated X admin templates to isPublic=true.",
  "updatedCount": X
}
```

## Verification
After running the migration, check the logs when creating a new chat:
```
[getAdminTemplates] Admin templates found: X
[HTTP] Templates received: X
```

Should show the correct number of templates instead of 0.
