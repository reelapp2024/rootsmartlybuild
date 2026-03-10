# 🎯 HOW THE ELEMENT SYSTEM WORKS - SIMPLE EXPLANATION

## 📚 For Beginners - Complete Flow Explained

---

## 🏗️ **STEP 1: WHERE DEFAULTS COME FROM**

### Location: `packages/ui/src/constants/unifiedDefaults.ts`

This is the **SINGLE SOURCE OF TRUTH** for all defaults.

```typescript
UNIFIED_DEFAULTS = {
  container: {
    defaultStyle: { display: 'flex', height: 'auto', ... },  // CSS styles
    defaultProps: {},                                          // Content/data
    propertyDefaults: [                                       // Sidebar UI defaults
      { key: 'display', defaultValue: 'flex', category: 'style' },
      { key: 'height', defaultValue: 'auto', category: 'style' },
      // ... all properties
    ]
  },
  heading: {
    defaultStyle: { fontWeight: 700, color: '#000000', ... },
    defaultProps: { text: 'Heading', headingTag: 'h1' },
    propertyDefaults: [...]
  },
  // ... all other elements
}
```

**What this means:**
- When you create a NEW element → it gets these defaults
- When sidebar shows a property → it shows the `defaultValue` from `propertyDefaults`

---

## 💾 **STEP 2: HOW DATABASE STYLES ARE LOADED**

### When Page Loads:

1. **API Call** → Gets page data from database
2. **Database Returns** → Only CHANGED values (not defaults!)

Example from Database:
```json
{
  "elementId": "heading-123",
  "style": {
    "color": "#ff0000",        // ✅ User changed this
    "fontSize": "2.5rem"        // ✅ User changed this
    // ❌ fontWeight NOT saved (using default 700)
  },
  "data": {
    "text": "My Custom Heading" // ✅ User changed this
  }
}
```

3. **Stored in Builder Store** → `customElementStyles[elementId]` and `customElementProps[elementId]`

**Important:** Database only stores what user CHANGED, not defaults!

---

## 🔄 **STEP 3: HOW DEFAULTS + DB STYLES ARE MERGED**

### When Rendering an Element:

**Location:** `packages/ui/src/utils/renderElement.tsx`

```typescript
// 1. Get defaults from unifiedDefaults.ts
const defaults = getElementDefaults('heading');
// Returns: { fontWeight: 700, color: '#000000', ... }

// 2. Get DB styles from store
const dbStyles = getCustomElementStyle(sectionId, elId);
// Returns: { color: '#ff0000', fontSize: '2.5rem' } (only changed values)

// 3. MERGE: Defaults + DB Styles (DB wins!)
const finalStyles = {
  ...defaults.defaultStyle,  // Start with defaults
  ...dbStyles                // Override with DB values
};
// Result: { fontWeight: 700, color: '#ff0000', fontSize: '2.5rem', ... }
```

**Visual Example:**

```
DEFAULTS (from unifiedDefaults.ts):
┌─────────────────────────┐
│ fontWeight: 700        │
│ color: '#000000'        │
│ fontSize: undefined    │
│ marginBottom: 24        │
└─────────────────────────┘
           +
DATABASE STYLES (only changed):
┌─────────────────────────┐
│ color: '#ff0000'        │
│ fontSize: '2.5rem'      │
└─────────────────────────┘
           =
FINAL STYLES (merged):
┌─────────────────────────┐
│ fontWeight: 700         │ ← From defaults
│ color: '#ff0000'        │ ← From DB (overrides default)
│ fontSize: '2.5rem'      │ ← From DB (overrides default)
│ marginBottom: 24        │ ← From defaults
└─────────────────────────┘
```

---

## 💾 **STEP 4: HOW STYLES ARE SAVED TO DATABASE**

### When User Clicks "Save":

**Location:** `packages/ui/src/utils/elementStorage.ts` → `prepareElementForStorage()`

```typescript
// 1. Get current merged styles (defaults + user changes)
const currentStyles = {
  fontWeight: 700,        // From defaults
  color: '#ff0000',       // User changed
  fontSize: '2.5rem',     // User changed
  marginBottom: 24        // From defaults
};

// 2. Get defaults
const defaults = getElementDefaults('heading');
// { fontWeight: 700, color: '#000000', marginBottom: 24, ... }

// 3. Compare: Only save what's DIFFERENT
const changedStyles = getChangedValues(currentStyles, defaults);
// Result: { color: '#ff0000', fontSize: '2.5rem' }
// ❌ fontWeight NOT saved (same as default)
// ❌ marginBottom NOT saved (same as default)

// 4. Save to Database
// Only { color: '#ff0000', fontSize: '2.5rem' } is saved!
```

**Why?** 
- Saves database space
- If defaults change, elements automatically get new defaults
- Only user's custom changes are stored

---

## 🎨 **STEP 5: HOW SIDEBAR SHOWS DEFAULTS**

### When User Opens Sidebar:

**Location:** `packages/builder/src/elementProperties/container.ts`

```typescript
import { getPropertyDefaultValue } from './defaults';

// Get default for 'height' property
const heightDefault = getPropertyDefaultValue('container', 'height');
// Returns: 'auto' (from unifiedDefaults.ts)

// Use in property definition
{
  key: 'height',
  label: 'Height',
  type: 'text',
  defaultValue: heightDefault,  // Shows 'auto' in sidebar
}
```

**Flow:**
1. Sidebar opens → Reads `propertyDefaults` from `unifiedDefaults.ts`
2. Shows default value in input field
3. If user changes → Updates store → Saves to DB on "Save"

---

## 📊 **COMPLETE FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE NEW ELEMENT                                    │
│    ↓                                                      │
│    unifiedDefaults.ts → Get defaults                      │
│    { display: 'flex', height: 'auto', ... }              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. USER EDITS IN SIDEBAR                                 │
│    ↓                                                      │
│    Sidebar reads from unifiedDefaults.ts                 │
│    Shows: height = 'auto' (default)                      │
│    User changes to: height = '500px'                     │
│    ↓                                                      │
│    Store updated: customElementStyles[elId] = {          │
│      height: '500px'  // Only changed value              │
│    }                                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. RENDERING (Builder or Custom Site)                    │
│    ↓                                                      │
│    Get defaults: { display: 'flex', height: 'auto' }    │
│    Get DB styles: { height: '500px' }                   │
│    ↓                                                      │
│    MERGE: { display: 'flex', height: '500px' }          │
│    ↓                                                      │
│    Apply to element → Shows on screen                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. USER CLICKS "SAVE"                                    │
│    ↓                                                      │
│    Compare current vs defaults                            │
│    Changed: { height: '500px' }                          │
│    Same as default: { display: 'flex' } → Skip           │
│    ↓                                                      │
│    Save to DB: { height: '500px' }                      │
│    (Only changed values!)                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. PAGE RELOADS                                          │
│    ↓                                                      │
│    Load from DB: { height: '500px' }                     │
│    Get defaults: { display: 'flex', height: 'auto' }    │
│    ↓                                                      │
│    MERGE: { display: 'flex', height: '500px' }            │
│    ↓                                                      │
│    Element shows correctly!                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 **KEY CONCEPTS**

### 1. **Defaults** (unifiedDefaults.ts)
- What elements look like when FIRST created
- Never saved to database
- Can change anytime (all elements get new defaults)

### 2. **Database Styles** (customElementStyles)
- Only what user CHANGED
- Saved to database
- Merged with defaults when rendering

### 3. **Final Styles** (what you see)
- Defaults + Database styles merged together
- Database styles override defaults
- Applied to element when rendering

### 4. **Property Defaults** (propertyDefaults array)
- What shows in sidebar input fields
- Used for UI only
- Comes from same unifiedDefaults.ts

---

## 💡 **REAL EXAMPLE**

### Scenario: User creates a heading

**Step 1: Create Element**
```typescript
// unifiedDefaults.ts
heading: {
  defaultStyle: { fontWeight: 700, color: '#000000' },
  defaultProps: { text: 'Heading' }
}
```
→ Element created with: `fontWeight: 700, color: '#000000', text: 'Heading'`

**Step 2: User Changes Color**
```typescript
// User changes color to red in sidebar
// Store updated:
customElementStyles['heading-123'] = { color: '#ff0000' }
```

**Step 3: Rendering**
```typescript
// Get defaults
defaults = { fontWeight: 700, color: '#000000' }

// Get DB styles
dbStyles = { color: '#ff0000' }

// Merge
finalStyles = { fontWeight: 700, color: '#ff0000' }
// ✅ Shows red heading with bold font
```

**Step 4: Save**
```typescript
// Compare
current = { fontWeight: 700, color: '#ff0000' }
defaults = { fontWeight: 700, color: '#000000' }

// Only changed value
changed = { color: '#ff0000' }

// Save to DB: { color: '#ff0000' }
// ❌ fontWeight NOT saved (same as default)
```

**Step 5: Reload Page**
```typescript
// Load from DB
dbStyles = { color: '#ff0000' }

// Get defaults
defaults = { fontWeight: 700, color: '#000000' }

// Merge
finalStyles = { fontWeight: 700, color: '#ff0000' }
// ✅ Same result!
```

---

## 🎯 **SUMMARY**

1. **Defaults** = Starting point (from `unifiedDefaults.ts`)
2. **Database** = Only user changes (saves space)
3. **Merging** = Defaults + DB = Final styles
4. **Rendering** = Apply final styles to element
5. **Saving** = Compare current vs defaults, save only differences

**Single Source of Truth:** `packages/ui/src/constants/unifiedDefaults.ts` 🎯
