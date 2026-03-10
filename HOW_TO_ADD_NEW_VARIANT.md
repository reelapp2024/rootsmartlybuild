# How to Add a New Variant to GenieBuild Sections

## Complete Step-by-Step Guide

### Example: Adding `HeroFullWidth` variant to Hero section

---

## Step 1: Create the Component File

**Location**: `apps/geniebuild/components/sections/hero/HeroFullWidth.tsx`

**Template**:
```tsx
import React from 'react';
import { Section } from '../../../types';

interface HeroProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onImageClick: () => void;
  buttonClass: string;
}

export const HeroFullWidth: React.FC<HeroProps> = ({ section, onTextEdit, onImageClick, buttonClass }) => {
  const { content, styles } = section;
  
  // Your component implementation here
  return (
    <div className="w-full">
      {/* Your JSX */}
    </div>
  );
};
```

**Important**: 
- File name = Component name = Variant name = uniqueId
- Example: `HeroFullWidth.tsx` → variant: `HeroFullWidth` → uniqueId: `HeroFullWidth`

---

## Step 2: Add to Section Router

**File**: `apps/geniebuild/components/sections/HeroSection.tsx`

**Add import**:
```tsx
import { HeroFullWidth } from './hero/HeroFullWidth';
```

**Add case in switch**:
```tsx
export const HeroSection: React.FC<HeroSectionProps> = (props) => {
  const variant = props.section.styles.variant || 'HeroCenter';

  switch (variant) {
    case 'HeroFullWidth':        // ← ADD THIS
      return <HeroFullWidth {...props} />;
    case 'HeroSplitRight':
      return <HeroSplitRight {...props} />;
    case 'HeroSplitLeft':
      return <HeroSplitLeft {...props} />;
    case 'HeroCenter':
    default:
      return <HeroCenter {...props} />;
  }
};
```

---

## Step 3: Update Backend Component Refresh

**File**: `backend/controller/AdminController.js`

**Find the section type** (around line 10880):
```javascript
'hero': {
    routerFile: 'HeroSection.tsx',
    variants: ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight']  // ← ADD 'HeroFullWidth' HERE
},
```

**Update to**:
```javascript
'hero': {
    routerFile: 'HeroSection.tsx',
    variants: ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight', 'HeroFullWidth']  // ← ADDED
},
```

---

## Step 4: Update Admin Panel Variants List

**File**: `apps/smartlybuildadmin/src/components/admin/BusinessWebsiteCreate.tsx`

**Find `GENIEBUILD_VARIANTS`** (around line 1879):
```typescript
const GENIEBUILD_VARIANTS: Record<string, string[]> = {
  'hero': ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight'],  // ← ADD 'HeroFullWidth' HERE
  // ...
};
```

**Update to**:
```typescript
const GENIEBUILD_VARIANTS: Record<string, string[]> = {
  'hero': ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight', 'HeroFullWidth'],  // ← ADDED
  // ...
};
```

---

## Step 5: (Optional) Update Default Variant

**File**: `apps/smartlybuildadmin/src/components/admin/BusinessWebsiteCreate.tsx`

**Find `GENIEBUILD_SECTION_MAP`** (around line 1876):
```typescript
const GENIEBUILD_SECTION_MAP: Record<string, { type: string; variant: string }> = {
  'hero': { type: 'hero', variant: 'HeroCenter' },  // Default variant
  // ...
};
```

**Only change if you want this as the new default**:
```typescript
'hero': { type: 'hero', variant: 'HeroFullWidth' },  // Only if you want it as default
```

---

## Step 6: Refresh Components in Admin Panel

1. Go to **Plugin Management** (`/admin/plugins`)
2. Click **"Refresh Components"** button
3. This will scan GenieBuild components and sync to database

---

## ✅ That's It! Your New Variant Will:

1. ✅ **Show in GenieBuild** - Can select and use the variant
2. ✅ **Show in Admin Panel** - Available in BusinessWebsiteCreate design step
3. ✅ **Work in customSites** - Will render correctly
4. ✅ **Save to Database** - Variant ID saved as filename format
5. ✅ **Sync to websitecomponents** - Auto-synced when refreshing components

---

## Quick Checklist for Any Section Type

### For Hero Section:
- [ ] Create `apps/geniebuild/components/sections/hero/Hero[YourVariant].tsx`
- [ ] Update `HeroSection.tsx` router
- [ ] Update backend `AdminController.js` → `'hero'` variants array
- [ ] Update admin `GENIEBUILD_VARIANTS['hero']` array
- [ ] Refresh components in Plugin Management

### For Navbar Section:
- [ ] Create `apps/geniebuild/components/sections/navbar/Navbar[YourVariant].tsx`
- [ ] Update `NavbarSection.tsx` router
- [ ] Update backend `AdminController.js` → `'navbar'` variants array
- [ ] Update admin `GENIEBUILD_VARIANTS['navbar']` array
- [ ] Refresh components in Plugin Management

### For Features Section:
- [ ] Create `apps/geniebuild/components/sections/features/Features[YourVariant].tsx`
- [ ] Update `FeaturesSection.tsx` router
- [ ] Update backend `AdminController.js` → `'features'` variants array
- [ ] Update admin `GENIEBUILD_VARIANTS['features']` array
- [ ] Refresh components in Plugin Management

### For Footer Section:
- [ ] Create `apps/geniebuild/components/sections/footer/Footer[YourVariant].tsx`
- [ ] Update `FooterSection.tsx` router
- [ ] Update backend `AdminController.js` → `'footer'` variants array
- [ ] Update admin `GENIEBUILD_VARIANTS['footer']` array
- [ ] Refresh components in Plugin Management

### For CTA Section:
- [ ] Create `apps/geniebuild/components/sections/cta/CTA[YourVariant].tsx`
- [ ] Update `CTASection.tsx` router
- [ ] Update backend `AdminController.js` → `'cta'` variants array
- [ ] Update admin `GENIEBUILD_VARIANTS['cta']` array
- [ ] Refresh components in Plugin Management

---

## File Locations Summary

| Step | File | What to Change |
|------|------|----------------|
| 1 | `apps/geniebuild/components/sections/[section]/[Variant].tsx` | Create new component file |
| 2 | `apps/geniebuild/components/sections/[Section]Section.tsx` | Add import + case in switch |
| 3 | `backend/controller/AdminController.js` | Add to `variants` array (line ~10880) |
| 4 | `apps/smartlybuildadmin/.../BusinessWebsiteCreate.tsx` | Add to `GENIEBUILD_VARIANTS` (line ~1879) |
| 5 | `apps/smartlybuildadmin/.../BusinessWebsiteCreate.tsx` | (Optional) Update default in `GENIEBUILD_SECTION_MAP` |
| 6 | Admin Panel → Plugin Management | Click "Refresh Components" |

---

## Important Rules

1. **Filename = Variant = uniqueId** (all must match exactly)
   - ✅ `HeroFullWidth.tsx` → variant: `HeroFullWidth` → uniqueId: `HeroFullWidth`
   - ❌ `HeroFullWidth.tsx` → variant: `full-width` → uniqueId: `hero_fullwidth`

2. **Component name must match filename** (without .tsx)
   - File: `HeroFullWidth.tsx`
   - Component: `export const HeroFullWidth`

3. **Add to ALL 3 places**:
   - Backend component refresh
   - Admin panel GENIEBUILD_VARIANTS
   - Section router switch statement

4. **Always refresh components** after adding new variant

---

## Example: Complete Flow for `HeroFullWidth`

### 1. Create File: `apps/geniebuild/components/sections/hero/HeroFullWidth.tsx`
```tsx
import React from 'react';
import { Section } from '../../../types';

interface HeroProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onImageClick: () => void;
  buttonClass: string;
}

export const HeroFullWidth: React.FC<HeroProps> = ({ section, onTextEdit, onImageClick, buttonClass }) => {
  const { content, styles } = section;
  
  return (
    <div className="w-full min-h-screen relative">
      {/* Full width hero implementation */}
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
      <button className={buttonClass}>{content.ctaText}</button>
    </div>
  );
};
```

### 2. Update Router: `apps/geniebuild/components/sections/HeroSection.tsx`
```tsx
import { HeroFullWidth } from './hero/HeroFullWidth';  // ← ADD

// In switch:
case 'HeroFullWidth':  // ← ADD
  return <HeroFullWidth {...props} />;
```

### 3. Update Backend: `backend/controller/AdminController.js`
```javascript
'hero': {
    variants: ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight', 'HeroFullWidth']  // ← ADD
},
```

### 4. Update Admin: `apps/smartlybuildadmin/.../BusinessWebsiteCreate.tsx`
```typescript
const GENIEBUILD_VARIANTS: Record<string, string[]> = {
  'hero': ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight', 'HeroFullWidth'],  // ← ADD
};
```

### 5. Refresh Components
- Go to `/admin/plugins`
- Click "Refresh Components"

---

## Testing Your New Variant

1. **In GenieBuild**: Select Hero section → Change variant to `HeroFullWidth`
2. **In Admin Panel**: Create new project → Select Hero → Should see `HeroFullWidth` option
3. **In customSites**: Create project with `HeroFullWidth` → Should render correctly

---

## Troubleshooting

**Variant not showing?**
- ✅ Check filename matches component name
- ✅ Check added to section router switch
- ✅ Check added to backend variants array
- ✅ Check added to admin GENIEBUILD_VARIANTS
- ✅ Refresh components in Plugin Management

**Variant not rendering?**
- ✅ Check component file exists and exports correctly
- ✅ Check router switch case matches variant name exactly
- ✅ Check component receives correct props

**Not saving to database?**
- ✅ Check variant name matches filename exactly
- ✅ Check syncGenieBuildSectionsToComponents is called
- ✅ Check backend component refresh includes it
