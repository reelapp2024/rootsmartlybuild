# Container Code Structure Guide

## Overview
This document explains the container-related code structure for fixing design issues. Containers are the core layout elements that support Flex and Grid layouts.

---

## 📁 File Structure

### **Primary Files to Work On:**

#### 1. **Container Rendering & Logic**
- **`packages/ui/src/utils/renderElement.tsx`** ⭐ **MAIN FILE**
  - Location: Lines 700-900 (container rendering logic)
  - Purpose: Renders container elements with Flex/Grid layouts
  - Key Functions:
    - `renderElement()` - Main rendering function
    - Container style application
    - Responsive gap handling for containers

#### 2. **Container Properties & Settings**
- **`packages/builder/src/elementProperties/container.ts`** ⭐ **SETTINGS**
  - Purpose: Defines all container properties (display, flexDirection, gap, etc.)
  - Contains: Property definitions for Flex/Grid options
  - Used by: Settings sidebar to show container controls

#### 3. **Container Defaults**
- **`packages/ui/src/constants/unifiedDefaults.ts`**
  - Location: Lines 65-108
  - Purpose: Default styles for containers
  - Contains: `container` defaultStyle object

#### 4. **Container Hover Overlay**
- **`packages/ui/src/utils/containerHoverOverlay.tsx`** ⭐ **VISUAL FEEDBACK**
  - Purpose: Shows container hierarchy on hover (parent/child relationships)
  - Architecture: 3-phase data-driven system
  - Used for: Visual debugging of container nesting

#### 5. **Canvas Rendering**
- **`packages/builder/src/components/canvas/BuilderCanvas.tsx`**
  - Location: Lines 538-551 (container rendering)
  - Purpose: Renders container in builder canvas
  - Note: Simple div rendering - main logic is in `renderElement.tsx`

#### 6. **Container Creation**
- **`packages/ui/src/utils/elementStorage.ts`**
  - Location: Lines 284-340
  - Purpose: Creates root container for new sections
  - Function: `createEmptySectionWithRootContainer()`

---

## 🏗️ Architecture Overview

### **Container Hierarchy:**
```
Section
  └── Root Container (always exists, parentElId = null)
      ├── Child Container (parentElId = root container's elId)
      │   └── Nested Elements (heading, text, etc.)
      └── Direct Elements (heading, text, button, etc.)
```

### **Container Types:**
1. **Flex Container** (`display: 'flex'`)
   - Properties: `flexDirection`, `justifyContent`, `alignItems`, `gap`, `flexWrap`
   
2. **Grid Container** (`display: 'grid'`)
   - Properties: `gridColumns`, `gridRows`, `gap`

3. **Box Container** (`display: 'block'` or default)
   - Basic block-level container

---

## 🔧 Key Code Sections

### **1. Container Rendering (renderElement.tsx)**

**Location:** `packages/ui/src/utils/renderElement.tsx`

**Key Function:**
```typescript
// Around line 700-900
// Container rendering logic
if (elementType === 'container') {
  // Apply container styles
  // Handle Flex/Grid display
  // Render children recursively
}
```

**What to Fix:**
- Container style application
- Flex/Grid layout calculations
- Responsive behavior
- Child element positioning

---

### **2. Container Properties (container.ts)**

**Location:** `packages/builder/src/elementProperties/container.ts`

**Structure:**
```typescript
export const containerProperties: ElementPropertyGroup = {
  elementId: 'container',
  displayName: 'Container',
  properties: {
    style: [
      { key: 'display', ... },        // Flex/Grid selector
      { key: 'flexDirection', ... },  // Row/Column
      { key: 'gridColumns', ... },    // Grid columns
      { key: 'gap', ... },            // Spacing
      // ... more properties
    ]
  }
}
```

**What to Fix:**
- Property definitions
- Default values
- Conditional property visibility (showWhen: 'flex' or 'grid')

---

### **3. Container Defaults (unifiedDefaults.ts)**

**Location:** `packages/ui/src/constants/unifiedDefaults.ts` (Lines 65-108)

**Structure:**
```typescript
container: {
  defaultStyle: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    // ... more defaults
  }
}
```

**What to Fix:**
- Default container styles
- Initial display type
- Default spacing values

---

### **4. Container Hover Overlay (containerHoverOverlay.tsx)**

**Location:** `packages/ui/src/utils/containerHoverOverlay.tsx`

**Purpose:** Visual debugging tool showing container hierarchy

**Architecture:**
- **Phase 1:** Build logical tree from data
- **Phase 2:** Resolve hierarchy (parent/child relationships)
- **Phase 3:** Measure DOM positions

**What to Fix:**
- Overlay positioning
- Hierarchy detection
- Visual feedback accuracy

---

## 🎯 Common Issues & Where to Fix

### **Issue 1: Container Layout Not Working**
- **File:** `packages/ui/src/utils/renderElement.tsx`
- **Look for:** Container style application around line 700-900
- **Check:** Flex/Grid display property application

### **Issue 2: Container Properties Not Showing**
- **File:** `packages/builder/src/elementProperties/container.ts`
- **Check:** Property definitions and `showWhen` conditions

### **Issue 3: Container Defaults Wrong**
- **File:** `packages/ui/src/constants/unifiedDefaults.ts`
- **Check:** `container.defaultStyle` object

### **Issue 4: Container Hover Overlay Issues**
- **File:** `packages/ui/src/utils/containerHoverOverlay.tsx`
- **Check:** Hierarchy resolution and position calculation

### **Issue 5: Container Not Creating Properly**
- **File:** `packages/ui/src/utils/elementStorage.ts`
- **Function:** `createEmptySectionWithRootContainer()`

---

## 📝 Data Structure

### **Container Element Structure:**
```typescript
{
  id: string,              // Element ID
  type: 'container',       // Element type
  elId: string,            // Unique element ID
  order: number,           // Display order
  parentElId?: string,     // Parent container ID (null for root)
  data: {},               // Container data
  styles: {               // Container styles
    display: 'flex' | 'grid',
    flexDirection: 'column' | 'row',
    gap: '16px',
    // ... more styles
  }
}
```

---

## 🔍 How to Debug

### **1. Check Container Rendering:**
- Open browser DevTools
- Inspect container elements
- Check computed styles (display, flexDirection, gap)
- Verify styles are applied correctly

### **2. Check Container Properties:**
- Open Settings sidebar
- Select a container
- Verify all properties show correctly
- Test property changes

### **3. Check Container Hierarchy:**
- Enable builder mode
- Hover over containers
- Verify overlay shows correct parent/child relationships

---

## ⚠️ Important Notes

1. **Root Container Invariant:**
   - Every section MUST have exactly ONE root container
   - Root container has `parentElId = null`
   - Defined in: `createEmptySectionWithRootContainer()`

2. **Container Nesting:**
   - Containers can be nested infinitely
   - Child containers have `parentElId` pointing to parent
   - Hierarchy is data-driven, not DOM-driven

3. **Style Application:**
   - Container styles come from `element.styles` object
   - Responsive styles applied via `addResponsiveStyles()`
   - Breakpoint-specific styles supported

4. **Single Source of Truth:**
   - Defaults: `packages/ui/src/constants/unifiedDefaults.ts`
   - Properties: `packages/builder/src/elementProperties/container.ts`
   - Rendering: `packages/ui/src/utils/renderElement.tsx`

---

## 🚀 Quick Start for Developer

1. **Start Here:** `packages/ui/src/utils/renderElement.tsx` (container rendering)
2. **Then Check:** `packages/builder/src/elementProperties/container.ts` (properties)
3. **Verify Defaults:** `packages/ui/src/constants/unifiedDefaults.ts` (defaults)
4. **Test:** Create a container, change properties, verify rendering

---

## 📞 Key Functions Reference

| Function | File | Purpose |
|----------|------|---------|
| `renderElement()` | `renderElement.tsx` | Main container rendering |
| `createEmptySectionWithRootContainer()` | `elementStorage.ts` | Create root container |
| `ContainerHoverOverlay` | `containerHoverOverlay.tsx` | Visual hierarchy overlay |
| `containerProperties` | `container.ts` | Property definitions |
| `getElementDefaults('container')` | `unifiedDefaults.ts` | Get container defaults |

---

## 🎨 Container Visual Structure

```
┌─────────────────────────────────────┐
│ Section                             │
│  ┌───────────────────────────────┐  │
│  │ Root Container (Flex/Grid)   │  │
│  │  ┌─────────┐  ┌───────────┐  │  │
│  │  │ Heading │  │ Container │  │  │
│  │  └─────────┘  │ (Nested)  │  │  │
│  │               │  └───────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

**Last Updated:** 2025-01-29
**Maintained By:** AI WebGen Team
