# Hero Section Variants Implementation

## Overview
Created 4 different variants of Hero Section for theme generation. Each variant has a unique layout and design while maintaining the same functionality.

## Variants Created

### Variant A: `hero-section-variant-a`
- **File**: `HeroSectionVariantA.tsx` (re-exports original `HeroSection.tsx`)
- **Layout**: Gradient background, centered layout
- **Style**: Purple gradient background (#667eea to #764ba2), white text
- **Elements**: Badge, Heading, Description, Text, Icon, 2 Buttons, Divider, Image, Link

### Variant B: `hero-section-variant-b`
- **File**: `HeroSectionVariantB.tsx`
- **Layout**: Split layout with content on left, image on right
- **Style**: Light gray background (#f9fafb), dark text
- **Elements**: Badge, Heading, Description, Button, Image (on right side)
- **Unique**: Two-column grid layout

### Variant C: `hero-section-variant-c`
- **File**: `HeroSectionVariantC.tsx`
- **Layout**: Minimal centered layout with large title
- **Style**: White background, dark text, large typography
- **Elements**: Badge, Large Heading, Description, Button
- **Unique**: Extra large heading (4.5rem), minimal design

### Variant D: `hero-section-variant-d`
- **File**: `HeroSectionVariantD.tsx`
- **Layout**: Full-width image background with dark overlay
- **Style**: Image background with rgba(0,0,0,0.5) overlay, white text
- **Elements**: Badge, Heading, Description, Button
- **Unique**: Full-width background image with overlay effect

## Implementation Details

### 1. Unique IDs
Each variant exports a `uniqueId` constant:
- Variant A: `"hero-section-variant-a"`
- Variant B: `"hero-section-variant-b"`
- Variant C: `"hero-section-variant-c"`
- Variant D: `"hero-section-variant-d"`

### 2. Registry
All variants are registered in `packages/ui/src/registry.tsx`:
- `HeroSectionVariantA`
- `HeroSectionVariantB`
- `HeroSectionVariantC`
- `HeroSectionVariantD`

### 3. Builder Support
The builder (`apps/smartlybuildadmin/src/studio/App.tsx`) now:
- Checks component's `uniqueId` from database
- Maps `uniqueId` to correct variant component type
- Falls back to name-based mapping if `uniqueId` not found

### 4. Static Data
Each variant has hardcoded static/default data:
- Default text content
- Default styles
- Default element structures
- Used when no API data or element data exists

## Database Structure

When components are saved to `WebsiteComponent` model, they should include:
```javascript
{
  name: "hero",
  variant: "A", // or "B", "C", "D"
  uniqueId: "hero-section-variant-a", // Must match exported uniqueId
  displayName: "Hero Section Variant A",
  description: "Gradient background, centered layout",
  category: "hero"
}
```

## Theme Generation Flow

1. User selects pages and components
2. System calls `generateTheme` API with component names
3. API randomly picks a variant for each component
4. Selected `componentId` (with variant) is saved to `WebsiteDesignsData`
5. Builder loads component by `uniqueId` and renders correct variant

## Usage in Builder

When builder loads a page:
1. Reads `componentId` from `WebsiteDesignsData`
2. Fetches component from `WebsiteComponent` (includes `uniqueId`)
3. Maps `uniqueId` to variant component type
4. Renders the correct variant component
5. If no element data exists, uses default static data from variant

## Next Steps

To use these variants in production:
1. Insert component entries into `WebsiteComponent` database:
   - Variant A: `{ name: "hero", variant: "A", uniqueId: "hero-section-variant-a", ... }`
   - Variant B: `{ name: "hero", variant: "B", uniqueId: "hero-section-variant-b", ... }`
   - Variant C: `{ name: "hero", variant: "C", uniqueId: "hero-section-variant-c", ... }`
   - Variant D: `{ name: "hero", variant: "D", uniqueId: "hero-section-variant-d", ... }`

2. Theme generation will automatically pick random variants
3. Builder will render the correct variant based on `uniqueId`

