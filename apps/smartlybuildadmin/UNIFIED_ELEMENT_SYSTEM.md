# Unified Element System Architecture

## Overview

This document describes the unified element system that ensures consistency across:
- Auto-generated pages (from mono-repo components)
- Empty pages (manually built by users)

## Single Source of Truth

### Default Values: `packages/ui/src/constants/elementStructures.ts`

**ALL** default props and styles come from `DEFAULT_ELEMENT_STRUCTURES`. This is the ONLY source of truth for:
- Default element props (e.g., `text: 'Heading'`, `headingTag: 'h1'`)
- Default element styles (e.g., `fontWeight: 700`, `color: 'var(--color-heading, #0f172a)'`)

### Access Pattern

1. **For Rendering**: Use `getElementDefaults()` from `@ui/utils/elementStorage`
   - Used by: `renderElement()`, `getElementProps()`, `getElementStyle()`

2. **For Property Definitions**: Use `getDefaultPropValue()` from `apps/smartlybuildadmin/src/studio/elementProperties/defaults.ts`
   - Used by: `ElementPropertyGroup` definitions (heading.ts, text.ts, button.ts, etc.)

3. **For Element Creation**: Use `getElementDefaults()` from `@ui/utils/elementStorage`
   - Used by: `store.addCustomElement()`, `useElementInitialization()`

## Element Structure

All elements use the unified `customElements` structure:

```typescript
{
  id: string;           // Unique ID
  type: string;         // Element type (heading, text, button, container, etc.)
  elId: string;         // Element identifier (used for props/styles lookup)
  order: number;        // Display order
  parentElId?: string;  // Parent container ID (for hierarchical structure)
}
```

## Data Flow

### Auto-Generated Pages
1. Component defines `DEFAULT_ELEMENTS` array
2. `useElementInitialization()` creates elements via `addCustomElement()`
3. Elements stored in `section.customElements[]`
4. Rendered via `renderRootElements()` → `renderElement()`

### Empty Pages
1. User clicks "Empty Container" → creates section with `componentType` and `customElements[]`
2. User adds elements via three-dot menu → `addCustomElement()`
3. Elements stored in `section.customElements[]`
4. Rendered via `renderRootElements()` → `renderElement()`

**Both flows end up with identical structure!**

## Settings Sidebar

The sidebar uses `ElementPropertyGroup` definitions which:
- Read defaults from `DEFAULT_ELEMENT_STRUCTURES` via `getDefaultPropValue()`
- Show identical settings for same element type regardless of page origin
- All property `defaultValue` fields come from unified source

## Element Creation

When creating new elements:
- `store.addCustomElement()` uses `getElementDefaults()` to get initial props/styles
- No hardcoded defaults in store
- All elements start with same defaults as defined in `DEFAULT_ELEMENT_STRUCTURES`

## Files Updated

### Core System
- ✅ `apps/smartlybuildadmin/src/studio/elementProperties/defaults.ts` - Unified defaults helper
- ✅ `apps/smartlybuildadmin/src/studio/store.ts` - Uses unified defaults in `addCustomElement()`

### Property Definitions (Updated to use unified defaults)
- ✅ `apps/smartlybuildadmin/src/studio/elementProperties/heading.ts`
- ✅ `apps/smartlybuildadmin/src/studio/elementProperties/text.ts`
- ✅ `apps/smartlybuildadmin/src/studio/elementProperties/button.ts`
- ✅ `apps/smartlybuildadmin/src/studio/elementProperties/container.ts`

### Remaining Property Files (Should be updated)
- `image.ts`, `video.ts`, `icon.ts`, `link.ts`, `divider.ts`, `spacer.ts`, `html.ts`, `list.ts`, `input.ts`, `textarea.ts`, `select.ts`, `label.ts`, `badge.ts`, `row.ts`, `column.ts`

## Rules

1. **NEVER** hardcode defaults in:
   - Property definitions
   - Store functions
   - Component initialization
   - Any other place

2. **ALWAYS** use:
   - `getElementDefaults()` for element creation
   - `getDefaultPropValue()` for property definitions
   - `DEFAULT_ELEMENT_STRUCTURES` as the source

3. **Consistency Check**:
   - Same element type in auto-generated page = same element type in empty page
   - Same defaults, same properties, same behavior

## Validation

To verify the system is unified:
1. Create a heading in an auto-generated page
2. Create a heading in an empty page
3. Both should show:
   - Same default text: "Heading"
   - Same default headingTag: "h1"
   - Same property options
   - Same initial styles
