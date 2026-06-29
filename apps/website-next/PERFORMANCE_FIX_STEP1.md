# STEP 1: FontAwesome Optimization (CRITICAL - Will save ~400KB)

## Current Problem:
```typescript
// ❌ BAD - Loads ALL 2000+ icons (500KB+)
import * as solidIcons from '@fortawesome/free-solid-svg-icons';
```

## Solution:
Create a mapping of only used icons and import them individually.

## Action Plan:

### 1. Find all used icons:
Run this command to find all icon classes:
```bash
grep -r "fas fa-" apps/website-nextjs/themes --include="*.tsx" --include="*.ts" | grep -o "fas fa-[a-z-]*" | sort | uniq
```

### 2. Create optimized icon loader:
Create a new file with only used icons imported individually.

### 3. Update DynamicFAIcon.tsx:
Replace the bulk import with individual imports.

## Expected Impact:
- **Bundle Size Reduction**: ~400-500KB
- **Performance Gain**: +15-20%
- **Time to Fix**: 30 minutes

## Next: After this, move to Step 2


