# GenieBuild File Structure Explanation

## Why Two Types of Files?

### Structure:
```
apps/geniebuild/components/sections/
├── HeroSection.tsx          ← ROUTER FILE (outside folder)
├── hero/                    ← VARIANT FOLDER
│   ├── HeroCenter.tsx       ← VARIANT FILE (actual component)
│   ├── HeroSplitLeft.tsx    ← VARIANT FILE (actual component)
│   └── HeroSplitRight.tsx   ← VARIANT FILE (actual component)
│
├── NavbarSection.tsx         ← ROUTER FILE (outside folder)
├── navbar/                  ← VARIANT FOLDER
│   ├── NavbarSimple.tsx     ← VARIANT FILE (actual component)
│   ├── NavbarCentered.tsx   ← VARIANT FILE (actual component)
│   └── NavbarApi.tsx        ← VARIANT FILE (actual component)
```

---

## Purpose of Each File Type

### 1. **Router Files** (Outside Folders)
**Files**: `HeroSection.tsx`, `NavbarSection.tsx`, `FooterSection.tsx`, etc.

**Purpose**: 
- **Router/Dispatcher** - Decides which variant to render
- Reads `section.styles.variant` (e.g., `HeroCenter`, `NavbarApi`)
- Routes to the correct variant component

**Example**:
```tsx
// HeroSection.tsx (Router)
export const HeroSection = (props) => {
  const variant = props.section.styles.variant || 'HeroCenter';
  
  switch (variant) {
    case 'HeroCenter':      return <HeroCenter {...props} />;
    case 'HeroSplitLeft':   return <HeroSplitLeft {...props} />;
    case 'HeroSplitRight':  return <HeroSplitRight {...props} />;
  }
};
```

**Why needed?**
- `SectionRenderer.tsx` calls `<HeroSection />` (doesn't know about variants)
- `HeroSection.tsx` routes to the correct variant based on `variant` prop

---

### 2. **Variant Files** (Inside Folders)
**Files**: `hero/HeroCenter.tsx`, `hero/HeroSplitLeft.tsx`, `navbar/NavbarApi.tsx`, etc.

**Purpose**:
- **Actual Component Implementation** - The real UI code
- Each file contains the actual JSX/TSX for that specific variant
- These are the components that render on screen

**Example**:
```tsx
// hero/HeroCenter.tsx (Variant - Actual Component)
export const HeroCenter = ({ section, onTextEdit, ... }) => {
  return (
    <div className="text-center">
      <h1>{section.content.title}</h1>
      <p>{section.content.subtitle}</p>
      {/* Actual UI code here */}
    </div>
  );
};
```

**Why needed?**
- Contains the actual design/layout code
- Different variants = Different designs (center, split-left, split-right)

---

## Complete Flow

```
1. SectionRenderer.tsx
   ↓ (calls)
2. HeroSection.tsx (Router)
   ↓ (reads variant: "HeroCenter")
   ↓ (routes to)
3. hero/HeroCenter.tsx (Variant - Actual Component)
   ↓ (renders)
4. UI on Screen
```

---

## Why This Structure?

### ✅ **Separation of Concerns**
- **Router** = Logic (which variant to show)
- **Variant** = UI (what to show)

### ✅ **Organization**
- All hero variants in `hero/` folder
- All navbar variants in `navbar/` folder
- Easy to find and manage

### ✅ **Scalability**
- Add new variant? Just add file to folder
- Router automatically picks it up (if you add case)

### ✅ **Clean Code**
- Router file = Small (just switch statement)
- Variant files = Focused (one design per file)

---

## Can We Simplify?

**Current Structure**:
```
HeroSection.tsx (router) → hero/HeroCenter.tsx (variant)
```

**Alternative (Simpler)**:
```
hero/HeroCenter.tsx (everything in one file)
```

**But then**:
- ❌ No router - would need to import all variants everywhere
- ❌ Harder to add new variants
- ❌ Less organized

**Current structure is better** because:
- ✅ Router handles routing logic
- ✅ Variants are organized in folders
- ✅ Easy to add new variants
- ✅ Clean separation

---

## Summary

| File Type | Location | Purpose | Example |
|-----------|----------|---------|---------|
| **Router** | Outside folder | Routes to correct variant | `HeroSection.tsx` |
| **Variant** | Inside folder | Actual component code | `hero/HeroCenter.tsx` |

**Both are needed**:
- Router = "Which variant?" (logic)
- Variant = "What to show?" (UI)
