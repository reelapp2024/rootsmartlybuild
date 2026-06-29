# Theme Generation Flow - Implementation Summary

## Overview
This document describes the two-phase save system and theme generation flow for the business website builder.

## Database Structure

### WebsiteComponent Model
- `name`: Component name (e.g., "hero", "testimonials")
- `variant`: Variant letter (e.g., "A", "B", "C", "D", "E")
- `uniqueId`: Unique identifier (e.g., "hero-section-variant-a")
- `displayName`: Display name
- `description`: Description
- `category`: Category

### WebsiteDesignsData Model
- Phase 1 (Structure Only):
  ```javascript
  {
    pages: [{
      pageId: ObjectId,
      componentIds: [{
        componentId: ObjectId  // No variant, style, elementIds yet
      }]
    }]
  }
  ```

- Phase 2 (Complete Design):
  ```javascript
  {
    pages: [{
      pageId: ObjectId,
      style: {},
      componentIds: [{
        componentId: ObjectId,  // Selected variant's componentId
        variant: String,        // Selected variant (A, B, C, etc.)
        style: {},
        elementIds: [{
          elementId: String,
          style: {},
          data: {}
        }]
      }]
    }]
  }
  ```

## Flow

### Step 1: User Selects Pages & Components
- User selects pages and sections in BusinessWebsiteCreate
- Calls `saveDesignStructure()` (Phase 1)
- Saves only structure: pages + componentIds (no variants/styles)

### Step 2: Theme Generation
- Calls `generateTheme()` API
- API picks random variants for each component
- Returns selected componentIds (with variants)
- Updates WebsiteDesignsData with selected componentIds

### Step 3: Preview
- Opens website app in preview mode
- URL: `/preview?projectId=xxx`
- Website app loads design data and renders components

### Step 4: User Approval
- If user likes → Proceed to Step 7
- If user doesn't like → Regenerate theme (pick different variants)

### Step 5: Finalization (After Approval)
- Calls `saveDesignData()` (Phase 2)
- Saves complete design: variants, styles, elementIds

## API Endpoints

1. **GET /admin/v1/getComponentVariants?name=hero**
   - Returns all variants for a component name

2. **POST /admin/v1/generateTheme**
   - Body: `{ projectId, componentNames: ["hero", "testimonials"] }`
   - Returns: `[{ componentName, componentId, variant, uniqueId }]`

3. **POST /admin/v1/saveWebsiteDesignData**
   - Phase 1: Saves structure only
   - Phase 2: Saves complete design with variants

## Component Requirements

Each component in monorepo must have:
1. **uniqueId**: Hardcoded in component (e.g., "hero-section-variant-a")
2. **Static Data**: Hardcoded default data (used until API data available)
3. **API Integration**: Check projectId, fetch from API if available

## Preview Mode

Website app (`apps/website`) should:
1. Check URL for `projectId` parameter
2. If present, fetch design data from `/admin/v1/getWebsiteDesignData/:projectId`
3. Render components based on selected componentIds
4. Use static data if API data not available

