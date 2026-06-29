# Database Structure Update - Website Builder

## Overview
This document describes the updated database structure for storing website design data, including default website styles, page-level styles, component-level styles, and element-level data.

## Database Models

### 1. WebsiteDesignsData Model
Stores the overall design configuration for a project.

**Structure:**
```javascript
{
  projectId: ObjectId,        // Reference to userProjects
  userId: ObjectId,           // Reference to User
  colorScheme: String,        // Theme color scheme
  colorPrimary: String,       // Primary color
  colorSecondary: String,    // Secondary color
  colorAccent: String,        // Accent color
  
  // Default styles for the whole website
  pageStyles: {
    style: Object            // CSS properties for default website styles
  },
  
  // Pages array with page-level styles, components, and elements
  pages: [{
    pageId: ObjectId,         // Reference to WebsitePage
    style: Object,            // Main style of this whole page
    componentIds: [{
      componentId: ObjectId,  // Reference to WebsiteComponent
      style: Object,          // Component-level styles
      elementIds: [{          // Elements within this component
        elementId: String,    // Unique identifier (e.g., "title", "description")
        style: Object,        // Element-level styles
        data: Object          // Element data (props/content)
      }]
    }]
  }],
  
  timestamps: true
}
```

### 2. WebsiteElement Model (Optional - for advanced use cases)
Stores individual elements with default code and styles for templates.

**Structure:**
```javascript
{
  projectId: ObjectId,        // Reference to userProjects
  componentId: ObjectId,      // Reference to WebsiteComponent
  pageId: ObjectId,           // Reference to WebsitePage
  elementId: String,         // Unique identifier
  elementType: String,       // Type: "heading", "text", "button", etc.
  order: Number,             // Order within the component
  props: Object,              // Element properties
  style: Object,              // Element styles
  defaultCode: String,        // Default HTML/JSX code for template
  defaultStyle: Object,      // Default styles for template
  timestamps: true
}
```

## API Endpoints

### 1. Save Website Design Data
**POST** `/admin/v1/saveWebsiteDesignData`

**Request Body:**
```json
{
  "projectId": "string",
  "colorScheme": "string",
  "colorPrimary": "string",
  "colorSecondary": "string",
  "colorAccent": "string",
  "pageStyles": {
    "style": {
      "fontFamily": "Inter, sans-serif",
      "backgroundColor": "#ffffff"
    }
  },
  "pages": [
    {
      "pageId": "string",
      "style": {
        "padding": "20px",
        "backgroundColor": "#f5f5f5"
      },
      "componentIds": [
        {
          "componentId": "string",
          "style": {
            "margin": "20px",
            "padding": "10px"
          },
          "elementIds": [
            {
              "elementId": "title",
              "style": {
                "fontSize": "48px",
                "color": "#000000",
                "fontWeight": "bold"
              },
              "data": {
                "text": "Welcome to Our Service",
                "heading": "Welcome to Our Service"
              }
            },
            {
              "elementId": "description",
              "style": {
                "fontSize": "18px",
                "color": "#666666"
              },
              "data": {
                "text": "We provide exceptional service",
                "description": "We provide exceptional service"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Get Website Design Data
**GET** `/admin/v1/getWebsiteDesignData/:projectId`

**Response:**
Returns design data with populated page and component references.

### 3. Save Website Element (Optional - for template defaults)
**POST** `/admin/v1/saveWebsiteElement`

**Request Body:**
```json
{
  "projectId": "string",
  "componentId": "string",
  "pageId": "string",
  "elementId": "string",
  "elementType": "heading",
  "order": 0,
  "props": {
    "text": "Welcome to Our Service"
  },
  "style": {
    "fontSize": "48px",
    "color": "#000000"
  },
  "defaultCode": "<h1>{text}</h1>",
  "defaultStyle": {
    "fontSize": "48px",
    "color": "#000000"
  }
}
```

### 4. Get Website Elements (Optional)
**GET** `/admin/v1/getWebsiteElements?projectId=xxx&componentId=xxx&pageId=xxx`

Returns all elements for a specific component on a page.

### 5. Delete Website Element (Optional)
**DELETE** `/admin/v1/deleteWebsiteElement/:elementId?projectId=xxx&componentId=xxx&pageId=xxx`

Deletes a specific element.

## Data Flow

1. **Website Level**: Default styles stored in `pageStyles.style`
   - Applied as default styles for the whole website
   - Can be overridden by page-level styles

2. **Page Level**: Styles stored in `pages[].style`
   - Main style of each individual page
   - Overrides website default styles for that page

3. **Component Level**: Styles stored in `pages[].componentIds[].style`
   - Component-specific styles
   - Applied to the component container

4. **Element Level**: Styles and data stored in `pages[].componentIds[].elementIds[]`
   - Each element has:
     - `elementId`: Unique identifier
     - `style`: CSS properties for the element
     - `data`: Element content/props (text, images, links, etc.)

## Structure Hierarchy

```
WebsiteDesignsData
├── pageStyles
│   └── style {}                    // Default styles for whole website
└── pages[]
    ├── pageId
    ├── style {}                    // Main style of this whole page
    └── componentIds[]
        ├── componentId
        ├── style {}                // Component-level styles
        └── elementIds[]
            ├── elementId
            ├── style {}            // Element-level styles
            └── data {}             // Element data (props/content)
```

## Benefits

1. **Simple & Clean**: All data stored in a single hierarchical structure
2. **Flexibility**: Users can customize styles at website, page, component, and element levels
3. **Self-Contained**: Elements stored directly in the component structure (no separate collection needed)
4. **Easy to Query**: All related data in one place
5. **Version Control**: Timestamps track when changes were made
6. **Performance**: No need for multiple joins - all data in one document

## Migration Notes

- `pageStyles` is now a single object with `style` key (not an array)
- `selectPages` has been renamed to `pages`
- Elements are now stored directly in `pages[].componentIds[].elementIds[]` with `elementId`, `style`, and `data`
- `WebsiteElement` collection is optional and can be used for storing default templates if needed
- Backward compatibility: Old format with `selectPages` can be automatically converted
