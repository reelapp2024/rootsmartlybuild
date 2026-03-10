# 🎨 ELEMENT PROPERTIES FILES - COMPLETE EXPLANATION

## 📁 Location: `packages/builder/src/elementProperties/`

---

## 🎯 **WHAT ARE THESE FILES?**

These files define **WHAT CONTROLS APPEAR IN THE SIDEBAR** when you select an element in the builder.

**They are NOT the actual default values** - those are in `unifiedDefaults.ts`.

**They ARE the UI configuration** - telling the sidebar:
- What input fields to show
- What type of control (text input, color picker, dropdown, etc.)
- What tabs to organize them in (Content, Style, Advanced)
- When to show/hide certain controls

---

## 🔍 **KEY DIFFERENCE**

### ❌ **NOT These Files:**
- `unifiedDefaults.ts` = **Actual default values** (what element gets when created)
- `renderElement.tsx` = **How element is rendered** (applies styles to DOM)

### ✅ **THESE Files:**
- `elementProperties/*.ts` = **Sidebar UI configuration** (what controls user sees)

---

## 📊 **HOW IT WORKS - STEP BY STEP**

### **Step 1: User Selects an Element**

```
User clicks on a "Heading" element in the builder
↓
System calls: getElementProperties('heading')
↓
Returns: headingProperties from heading.ts
```

**File:** `packages/builder/src/elementProperties/index.ts`
```typescript
export const getElementProperties = (elementId: string) => {
  return elementPropertiesRegistry[elementId.toLowerCase()] || null;
};
```

---

### **Step 2: Sidebar Reads the Configuration**

**File:** `packages/builder/src/components/sidebar/SettingsSidebar.tsx`

```typescript
// Get the property configuration for this element
const elementProps = getElementProperties('heading');

// Pass to ElementPropertyEditor
<ElementPropertyEditor
  elementProperties={elementProps}  // ← This is from heading.ts
  currentProps={...}
  currentStyles={...}
/>
```

---

### **Step 3: ElementPropertyEditor Renders Controls**

**File:** `packages/builder/src/components/sidebar/ElementPropertyEditor.tsx`

```typescript
// Loop through properties defined in heading.ts
elementProperties.properties[activeTab].forEach(property => {
  // Render the appropriate control based on property.type
  if (property.type === 'text') {
    // Show text input
  } else if (property.type === 'color') {
    // Show color picker
  } else if (property.type === 'select') {
    // Show dropdown
  }
  // ... etc
});
```

---

## 📝 **EXAMPLE: badge.ts File Breakdown**

```typescript
export const badgeProperties: ElementPropertyGroup = {
  elementId: 'badge',           // ← Which element this is for
  displayName: 'Badge',          // ← Name shown in sidebar
  
  properties: {
    // CONTENT TAB - Text, data, content properties
    content: [
      {
        key: 'text',              // ← Property name (saved to DB)
        label: 'Badge Text',      // ← Label shown in sidebar
        type: 'text',             // ← Control type (text input)
        defaultValue: 'Badge',    // ← Default shown in input (from unifiedDefaults)
        placeholder: 'Enter badge text',
        category: 'content',       // ← Which tab it appears in
      },
    ],
    
    // STYLE TAB - CSS properties
    style: [
      {
        key: 'backgroundColor',
        label: 'Background Color',
        type: 'color',            // ← Shows color picker
        defaultValue: '#ffffff',
        category: 'style',
      },
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'text',             // ← Shows text input
        defaultValue: '12px',
        placeholder: 'e.g., 12px, 50%',
        category: 'style',
      },
      {
        key: 'opacity',
        label: 'Opacity',
        type: 'range',            // ← Shows slider
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        category: 'style',
      },
    ],
    
    // ADVANCED TAB - Advanced properties
    advanced: [
      {
        key: 'className',
        label: 'CSS Class',
        type: 'text',
        defaultValue: '',
        category: 'advanced',
      },
    ],
  },
};
```

---

## 🎨 **CONTROL TYPES AVAILABLE**

| Type | What It Shows | Example |
|------|---------------|---------|
| `text` | Text input field | Badge text, CSS class |
| `textarea` | Multi-line text area | Long text content |
| `number` | Number input | Width, height (numeric) |
| `color` | Color picker | Background color, text color |
| `url` | URL input | Image URL, video URL |
| `select` | Dropdown menu | Display type, flex direction |
| `checkbox` | Checkbox | Enable/disable options |
| `range` | Slider | Opacity (0-1), font size |
| `image` | Image uploader | Background image |
| `icon` | Icon picker | Icon selection |

---

## 🔄 **HOW DEFAULTS ARE CONNECTED**

### **The Flow:**

```
1. elementProperties/badge.ts defines:
   {
     key: 'backgroundColor',
     defaultValue: '#ffffff'  // ← This comes from unifiedDefaults.ts
   }
   ↓
2. ElementPropertyEditor reads:
   const default = getPropertyDefaultValue('badge', 'backgroundColor');
   // Returns: '#ffffff' from unifiedDefaults.ts
   ↓
3. Sidebar shows:
   <ColorPicker defaultValue={default} />
   // User sees: #ffffff in the color picker
   ↓
4. User changes to: #ff0000
   ↓
5. Store updated:
   customElementStyles['badge-123'] = { backgroundColor: '#ff0000' }
   ↓
6. On save:
   Only { backgroundColor: '#ff0000' } saved to DB
   (default #ffffff not saved - it's in unifiedDefaults.ts)
```

---

## 🎯 **CONDITIONAL VISIBILITY**

### **Example: Container Properties**

In `container.ts`, some properties only show when display type is 'flex' or 'grid':

```typescript
{
  key: 'flexDirection',
  label: 'Flex Direction',
  type: 'select',
  showWhen: 'flex',  // ← Only show when display is 'flex'
  // ...
},
{
  key: 'gridColumns',
  label: 'Grid Columns',
  type: 'select',
  showWhen: 'grid',  // ← Only show when display is 'grid'
  // ...
},
{
  key: 'gap',
  label: 'Gap',
  type: 'text',
  showWhen: ['flex', 'grid'],  // ← Show for both flex and grid
  // ...
},
```

**How it works:**
```typescript
// In ElementPropertyEditor.tsx
const properties = elementProperties.properties[activeTab].filter(property => {
  if (property.showWhen) {
    if (Array.isArray(property.showWhen)) {
      return property.showWhen.includes(displayType);
    }
    return property.showWhen === displayType;
  }
  return true; // Show if no condition
});
```

---

## 📂 **FILE STRUCTURE**

```
packages/builder/src/elementProperties/
├── index.ts              ← Registry of all properties
├── defaults.ts           ← Helper to get defaults from unifiedDefaults.ts
├── badge.ts              ← Badge element sidebar config
├── button.ts             ← Button element sidebar config
├── container.ts           ← Container element sidebar config
├── heading.ts            ← Heading element sidebar config
├── text.ts               ← Text element sidebar config
├── image.ts              ← Image element sidebar config
├── video.ts               ← Video element sidebar config
├── icon.ts                ← Icon element sidebar config
├── link.ts                ← Link element sidebar config
├── divider.ts             ← Divider element sidebar config
├── spacer.ts              ← Spacer element sidebar config
├── list.ts                ← List element sidebar config
├── input.ts               ← Input element sidebar config
├── textarea.ts            ← Textarea element sidebar config
├── select.ts              ← Select element sidebar config
├── label.ts               ← Label element sidebar config
└── html.ts                ← HTML element sidebar config
```

---

## 🔗 **HOW IT ALL CONNECTS**

```
┌─────────────────────────────────────────────────────┐
│ 1. USER SELECTS ELEMENT                              │
│    User clicks "Heading" in builder                  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. GET PROPERTY CONFIG                               │
│    SettingsSidebar.tsx calls:                        │
│    getElementProperties('heading')                   │
│    ↓                                                 │
│    Returns: headingProperties from heading.ts       │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. RENDER SIDEBAR                                    │
│    ElementPropertyEditor receives:                   │
│    elementProperties = headingProperties              │
│    ↓                                                 │
│    Loops through:                                    │
│    - content: [text property]                        │
│    - style: [color, fontSize, fontWeight, ...]      │
│    - advanced: [className]                           │
│    ↓                                                 │
│    Renders appropriate controls for each property    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. GET DEFAULT VALUES                                │
│    For each property, reads defaultValue:            │
│    getPropertyDefaultValue('heading', 'color')       │
│    ↓                                                 │
│    Returns: '#000000' from unifiedDefaults.ts        │
│    ↓                                                 │
│    Shows in sidebar input field                      │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. USER EDITS                                        │
│    User changes color to '#ff0000'                   │
│    ↓                                                 │
│    handleStyleChange('color', '#ff0000')            │
│    ↓                                                 │
│    Store updated:                                    │
│    customElementStyles['heading-123'] = {           │
│      color: '#ff0000'                                │
│    }                                                 │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. SAVE TO DATABASE                                  │
│    On "Save" click:                                  │
│    prepareElementForStorage() compares:             │
│    - Current: { color: '#ff0000' }                   │
│    - Defaults: { color: '#000000' }                  │
│    ↓                                                 │
│    Saves only: { color: '#ff0000' }                 │
│    (defaults not saved - they're in unifiedDefaults)  │
└─────────────────────────────────────────────────────┘
```

---

## 💡 **REAL EXAMPLE: Adding a New Property**

### **Scenario:** Add "Text Shadow" to heading element

**Step 1: Add to unifiedDefaults.ts**
```typescript
heading: {
  defaultStyle: {
    // ... existing styles
    textShadow: 'none',  // ← Add default value
  },
  propertyDefaults: [
    // ... existing properties
    { key: 'textShadow', defaultValue: 'none', category: 'style' },
  ],
}
```

**Step 2: Add to heading.ts (elementProperties)**
```typescript
export const headingProperties: ElementPropertyGroup = {
  // ... existing config
  properties: {
    style: [
      // ... existing properties
      {
        key: 'textShadow',
        label: 'Text Shadow',
        type: 'text',
        defaultValue: getDefault('textShadow'),  // ← Reads from unifiedDefaults
        placeholder: 'e.g., 2px 2px 4px rgba(0,0,0,0.3)',
        category: 'style',
      },
    ],
  },
};
```

**Result:**
- ✅ Sidebar shows "Text Shadow" input field
- ✅ Default value "none" shown in input
- ✅ User can change it
- ✅ Value saved to database
- ✅ Applied when rendering

---

## 🎯 **SUMMARY**

### **What elementProperties files do:**
1. ✅ Define **what controls** appear in sidebar
2. ✅ Define **control types** (text, color, select, etc.)
3. ✅ Define **organization** (Content, Style, Advanced tabs)
4. ✅ Define **conditional visibility** (showWhen)
5. ✅ Define **default values shown in UI** (from unifiedDefaults.ts)

### **What they DON'T do:**
1. ❌ Store actual default values (that's unifiedDefaults.ts)
2. ❌ Render elements (that's renderElement.tsx)
3. ❌ Save to database (that's elementStorage.ts)

### **Key Concept:**
**elementProperties = UI Configuration**  
**unifiedDefaults = Actual Values**

---

## 🔑 **KEY FILES REFERENCE**

| File | Purpose |
|------|---------|
| `elementProperties/*.ts` | Sidebar UI configuration for each element |
| `elementProperties/index.ts` | Registry that maps elementId → property config |
| `elementProperties/defaults.ts` | Helper to read defaults from unifiedDefaults.ts |
| `ElementPropertyEditor.tsx` | Component that renders sidebar controls |
| `SettingsSidebar.tsx` | Main sidebar component that uses property configs |
| `unifiedDefaults.ts` | **Actual default values** (single source of truth) |

---

**Remember:** These files are the "blueprint" for the sidebar UI, not the actual data! 🎨
