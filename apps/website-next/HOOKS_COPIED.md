# ✅ All Hooks Copied and Adapted

## 🐛 Error Fixed

**Error:** `Module not found: Can't resolve '../../../hooks/getProjectId'`

**Solution:** Copied all required hooks from original project and adapted them for Next.js.

---

## ✅ Hooks Copied

### 1. **getProjectId.js**
- ✅ Copied from `apps/website/src/hooks/getProjectId.js`
- ✅ Updated: `import.meta.env.VITE_PROJECT_ID` → `process.env.NEXT_PUBLIC_PROJECT_ID`
- ✅ Location: `apps/website-nextjs/hooks/getProjectId.js`

### 2. **useHeaderData.js**
- ✅ Copied from `apps/website/src/hooks/useHeaderData.js`
- ✅ Updated: `import.meta.env.VITE_PROJECT_ID` → `process.env.NEXT_PUBLIC_PROJECT_ID`
- ✅ Updated: Import paths (`../config.js` → `../config`)
- ✅ Location: `apps/website-nextjs/hooks/useHeaderData.js`

### 3. **useFooterData.js**
- ✅ Copied from `apps/website/src/hooks/useFooterData.js`
- ✅ Updated: `import.meta.env.VITE_PROJECT_ID` → `process.env.NEXT_PUBLIC_PROJECT_ID`
- ✅ Updated: Import paths
- ✅ Location: `apps/website-nextjs/hooks/useFooterData.js`

### 4. **useGuaranteeData.js**
- ✅ Copied from `apps/website/src/hooks/useGuaranteeData.js`
- ✅ Updated: Import paths
- ✅ Location: `apps/website-nextjs/hooks/useGuaranteeData.js`

### 5. **useMySiteData.js**
- ✅ Copied from `apps/website/src/hooks/useMySiteData.js`
- ✅ Updated: `import.meta.env.VITE_PROJECT_ID` → `process.env.NEXT_PUBLIC_PROJECT_ID`
- ✅ Updated: Import paths
- ✅ Location: `apps/website-nextjs/hooks/useMySiteData.js`

### 6. **useSchemaMarkup.ts**
- ✅ Copied from `apps/website/src/hooks/useSchemaMarkup.ts`
- ✅ No changes needed (TypeScript, no env vars)
- ✅ Location: `apps/website-nextjs/hooks/useSchemaMarkup.ts`

### 7. **schemaMarkup.js**
- ✅ Copied from `apps/website/src/hooks/schemaMarkup.js`
- ✅ Contains: `generateFAQSchema`, `generateReviewSchema`, `generateServicesSchema`
- ✅ Location: `apps/website-nextjs/hooks/schemaMarkup.js`

---

## ✅ Services Copied

### 1. **apiCache.js**
- ✅ Copied from `apps/website/src/services/apiCache.js`
- ✅ No changes needed (pure JavaScript, no env vars)
- ✅ Location: `apps/website-nextjs/services/apiCache.js`

---

## 📁 File Structure

```
apps/website-nextjs/
├── hooks/
│   ├── getProjectId.js ✅
│   ├── useHeaderData.js ✅
│   ├── useFooterData.js ✅
│   ├── useGuaranteeData.js ✅
│   ├── useMySiteData.js ✅
│   ├── useSchemaMarkup.ts ✅
│   ├── schemaMarkup.js ✅
│   └── useSEO.js ✅ (already existed)
├── services/
│   └── apiCache.js ✅
└── themes/
    └── modern/
        └── components/
            ├── Header.tsx → uses hooks ✅
            ├── Footer.tsx → uses hooks ✅
            └── ...
```

---

## 🔄 Changes Made

### Environment Variables
All hooks updated to use Next.js environment variables:
- ❌ `import.meta.env.VITE_PROJECT_ID`
- ✅ `process.env.NEXT_PUBLIC_PROJECT_ID`

### Import Paths
All hooks updated to use correct import paths:
- ❌ `../config.js`
- ✅ `../config`

---

## ✅ Import Paths in Components

### Relative Paths (Working)
- `themes/modern/components/Header.tsx` → `../../../hooks/getProjectId` ✅
- `themes/modern/components/Footer.tsx` → `../../../hooks/useFooterData` ✅
- `themes/modern/components/services/ServicesGrid.tsx` → `../../../../hooks/getProjectId` ✅

### Absolute Paths (Using @ alias)
- `themes/modern/components/SchemaMarkup.tsx` → `@/hooks/useSchemaMarkup` ✅
- (Works via tsconfig.json paths)

---

## ✅ Status

- ✅ All hooks copied
- ✅ All hooks adapted for Next.js
- ✅ All import paths correct
- ✅ No linter errors
- ✅ Ready to build

---

**All Hooks Copied!** ✅

The build should now work without module resolution errors.








