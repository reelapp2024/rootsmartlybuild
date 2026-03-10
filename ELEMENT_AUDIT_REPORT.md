# Builder Elements Audit Report

**Date:** Generated from codebase analysis  
**Total Elements:** 19  
**Source of Truth:** `packages/ui/src/constants/elementStructures.ts`  
**Property Definitions:** `apps/smartlybuildadmin/src/studio/elementProperties/`

---

## ELEMENT INVENTORY

### 1. heading
- **Purpose:** Displays headings (H1–H6) with semantic HTML tags
- **Default Props:**
  - `text`: "Heading"
  - `heading`: "Heading"
  - `headingTag`: "h1"
- **Default Styles:**
  - `fontWeight`: 700
  - `color`: "var(--color-heading, #0f172a)"
  - `marginBottom`: 24
  - `lineHeight`: 1.2
- **Editable Properties:**
  - **Content:**
    - `text` (textarea) - from `getDefaultPropValue('heading', 'text')`
    - `headingTag` (select: h1-h6) - from `getDefaultPropValue('heading', 'headingTag')`
  - **Style:**
    - `headingFontWeight` (select: 300-900) - hardcoded default: '700'
    - `textColor` (color) - hardcoded default: '#000000'
    - `headingTextAlign` (select: left/center/right/justify) - hardcoded default: 'left'
    - `headingLineHeight` (text) - hardcoded default: '1.2'
    - `headingLetterSpacing` (text) - hardcoded default: '0'
    - `headingTextTransform` (select) - hardcoded default: 'none'
    - `headingTextDecoration` (select) - hardcoded default: 'none'
    - `useDefaultFont` (toggle) - hardcoded default: true
    - `useDefaultSize` (toggle) - hardcoded default: true
    - `useDefaultColor` (toggle) - hardcoded default: true
    - `headingFontFamily` (select) - hardcoded default: ''
    - `marginTop`, `marginBottom`, `marginLeft`, `marginRight` (text) - hardcoded defaults: '0'
    - `padding` (text) - hardcoded default: '0'
    - `backgroundColor` (color) - hardcoded default: 'transparent'
    - `opacity` (range: 0-1) - hardcoded default: 1
  - **Advanced:**
    - `className` (text) - hardcoded default: ''
    - `id` (text) - hardcoded default: ''
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node (`elementId`, `elementType`, `style`, `data`, `order`)
- **Issues:**
  - Style property keys use `heading*` prefix (e.g., `headingFontWeight`) but default styles use standard CSS keys (`fontWeight`)
  - Many hardcoded defaults instead of using `getDefaultStyles()`

---

### 2. text
- **Purpose:** Displays paragraph text content
- **Default Props:**
  - `text`: "Text content"
- **Default Styles:**
  - `fontSize`: "var(--text-size-base, 1rem)"
  - `color`: "var(--color-description, #64748b)"
  - `lineHeight`: 1.6
  - `width`: "100%"
- **Editable Properties:**
  - **Content:**
    - `text` (textarea) - from `getDefaultPropValue('text', 'text')`
  - **Style:**
    - `fontSize` (text) - hardcoded default: '1.25rem' (⚠️ differs from defaultStyle: '1rem')
    - `fontWeight` (select: 300-700) - hardcoded default: '400'
    - `color` (color) - hardcoded default: '#f1f5f9' (⚠️ differs from defaultStyle: 'var(--color-description, #64748b)')
    - `textAlign` (select) - hardcoded default: 'center' (⚠️ not in defaultStyle)
    - `lineHeight` (text) - hardcoded default: '1.6' (✅ matches defaultStyle)
    - `useDefaultFont` (toggle) - hardcoded default: true
    - `useDefaultSize` (toggle) - hardcoded default: true
    - `useDefaultColor` (toggle) - hardcoded default: true
    - `fontFamily` (select) - hardcoded default: ''
    - `marginBottom` (text) - hardcoded default: '16px' (⚠️ not in defaultStyle)
    - `padding`, `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight` (text)
    - `marginTop`, `marginRight`, `marginLeft` (text) - hardcoded defaults: '0'
  - **Advanced:**
    - `className` (text) - hardcoded default: ''
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:**
  - Default values in sidebar don't match `defaultStyle` (fontSize, color)
  - `textAlign` and `marginBottom` have defaults in sidebar but not in `defaultStyle`

---

### 3. button
- **Purpose:** Interactive button element with optional link behavior
- **Default Props:**
  - `buttonText`: "Button"
  - `text`: "Button"
- **Default Styles:**
  - `padding`: "var(--button-padding-medium, 12px 24px)"
  - `backgroundColor`: "var(--color-primary-bg, #2563eb)"
  - `color`: "var(--color-primary-text, #ffffff)"
  - `border`: "none"
  - `borderRadius`: "6px"
  - `cursor`: "pointer"
  - `fontSize`: "var(--button-font-size, 1rem)"
  - `fontWeight`: 600
- **Editable Properties:**
  - **Content:**
    - `buttonText` (text) - from `getDefaultPropValue('button', 'buttonText')`
    - `href` (url) - hardcoded default: '#'
    - `target` (select: _self/_blank) - hardcoded default: '_self'
  - **Style:**
    - `backgroundColor` (color) - hardcoded default: '#ffffff' (⚠️ differs from defaultStyle)
    - `color` (color) - hardcoded default: '#000000' (⚠️ differs from defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `fontWeight` (select) - hardcoded default: '600' (✅ matches defaultStyle)
    - `useDefaultFont`, `useDefaultSize`, `useDefaultColor` (toggles)
    - `fontFamily` (select)
    - `padding` (text) - hardcoded default: '12px 24px' (✅ matches defaultStyle)
    - `textAlign` (select) - hardcoded default: 'center'
    - `borderRadius` (text) - hardcoded default: '6px' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: 'none' (✅ matches defaultStyle)
    - `width` (text) - hardcoded default: 'auto'
    - `opacity` (range)
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `hoverStyle` (select: none/scale/lift/glow/shrink/rotate) - hardcoded default: 'scale'
    - `hoverBackgroundColor`, `hoverTextColor` (color)
    - `clickStyle` (select: none/press/bounce/pulse/ripple/shrink) - hardcoded default: 'press'
    - `clickBackgroundColor`, `clickTextColor` (color)
    - `onClick` (text) - JavaScript function name
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element (interactive)
- **Storage:** Hierarchical tree node
- **Issues:**
  - Default `backgroundColor` and `color` in sidebar don't match `defaultStyle`
  - Special hover/click animation properties (not in defaultStyle)

---

### 4. image
- **Purpose:** Displays images with responsive sizing
- **Default Props:**
  - `imageUrl`: "https://via.placeholder.com/600x400"
  - `imageAlt`: "Image"
- **Default Styles:**
  - `maxWidth`: "100%"
  - `height`: "auto"
  - `borderRadius`: "8px"
  - `opacity`: 1
  - `backgroundColor`: "transparent"
- **Editable Properties:**
  - **Content:**
    - `imageUrl` (url) - from `getDefaultPropValue('image', 'imageUrl')`
    - `imageAlt` (text) - from `getDefaultPropValue('image', 'imageAlt')`
    - `imageTitle` (text) - hardcoded default: '' (⚠️ not in defaultProps)
  - **Style:**
    - `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight` (text)
    - `objectFit` (select: cover/contain/fill/none/scale-down) - hardcoded default: 'cover' (⚠️ not in defaultStyle)
    - `textAlign` (select) - hardcoded default: 'center'
    - `borderRadius` (text) - hardcoded default: '8px' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: 'none'
    - `opacity` (range) - hardcoded default: 1 (✅ matches defaultStyle)
    - All margins (text) - defaults: '0'
    - `padding` (text) - hardcoded default: '0'
  - **Advanced:**
    - `lazy` (checkbox) - hardcoded default: false
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `imageTitle` property exists in sidebar but not in defaultProps
  - `objectFit` has default in sidebar but not in defaultStyle

---

### 5. video
- **Purpose:** Embeds video content with controls
- **Default Props:**
  - `videoUrl`: ""
  - `videoAlt`: "Video"
- **Default Styles:**
  - `maxWidth`: "100%"
  - `height`: "auto"
  - `borderRadius`: "8px"
- **Editable Properties:**
  - **Content:**
    - `videoUrl` (url) - from `getDefaultPropValue('video', 'videoUrl')`
    - `videoAlt` (text) - from `getDefaultPropValue('video', 'videoAlt')`
    - `poster` (url) - hardcoded default: '' (⚠️ not in defaultProps)
  - **Style:**
    - `width`, `height`, `maxWidth` (text)
    - `borderRadius` (text) - hardcoded default: '8px' (✅ matches defaultStyle)
    - `textAlign` (select) - hardcoded default: 'center'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
    - `padding` (text) - hardcoded default: '0'
  - **Advanced:**
    - `controls` (checkbox) - hardcoded default: true
    - `autoplay` (checkbox) - hardcoded default: false
    - `loop` (checkbox) - hardcoded default: false
    - `muted` (checkbox) - hardcoded default: false
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `poster` property exists in sidebar but not in defaultProps
  - Advanced properties (controls, autoplay, etc.) not in defaultProps

---

### 6. icon
- **Purpose:** Displays Font Awesome or custom icons
- **Default Props:**
  - `iconClass`: "fas fa-star"
  - `iconName`: "star"
- **Default Styles:**
  - `fontSize`: "2rem"
  - `color`: "var(--color-accent, #2563eb)"
- **Editable Properties:**
  - **Content:**
    - `iconClass` (icon) - from `getDefaultPropValue('icon', 'iconClass')`
    - `iconName` (text) - from `getDefaultPropValue('icon', 'iconName')`
  - **Style:**
    - `fontSize` (text) - from `getDefaultStyles('icon').fontSize` (✅ matches defaultStyle)
    - `color` (color) - from `getDefaultStyles('icon').color` (✅ matches defaultStyle)
    - `textAlign` (select) - hardcoded default: 'center'
    - `width`, `height` (text) - defaults: 'auto'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
    - `padding` (text) - hardcoded default: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:** None (good use of unified defaults)

---

### 7. link
- **Purpose:** Hyperlink element with text content
- **Default Props:**
  - `href`: "#"
  - `text`: "Link"
- **Default Styles:**
  - `color`: "var(--color-accent, #2563eb)"
  - `textDecoration`: "underline"
  - `fontSize`: "1rem"
- **Editable Properties:**
  - **Content:**
    - `text` (text) - from `getDefaultPropValue('link', 'text')`
    - `href` (url) - from `getDefaultPropValue('link', 'href')`
    - `target` (select) - hardcoded default: '_self'
  - **Style:**
    - `color` (color) - hardcoded default: '#ffffff' (⚠️ differs from defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `textDecoration` (select) - hardcoded default: 'underline' (✅ matches defaultStyle)
    - `fontWeight` (select) - hardcoded default: '400'
    - `textAlign` (select) - hardcoded default: 'left'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
    - `padding` (text) - hardcoded default: '0'
  - **Advanced:**
    - `rel` (text) - hardcoded default: ''
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element (interactive)
- **Storage:** Hierarchical tree node
- **Issues:**
  - Default `color` in sidebar doesn't match `defaultStyle`

---

### 8. divider
- **Purpose:** Horizontal rule/separator line
- **Default Props:** {} (empty)
- **Default Styles:**
  - `width`: "100%"
  - `border`: "none"
  - `borderTop`: "1px solid #e2e8f0"
  - `margin`: "24px 0"
- **Editable Properties:**
  - **Content:** [] (empty)
  - **Style:**
    - `width` (text) - from `getDefaultStyles('divider').width` (✅ matches defaultStyle)
    - `borderTop` (text) - from `getDefaultStyles('divider').borderTop` (✅ matches defaultStyle)
    - `textAlign` (select) - hardcoded default: 'center'
    - `marginTop` (text) - hardcoded default: '24px' (⚠️ defaultStyle uses `margin: '24px 0'`)
    - `marginBottom` (text) - hardcoded default: '24px' (⚠️ defaultStyle uses `margin: '24px 0'`)
    - `opacity` (range) - hardcoded default: 1
    - `marginLeft`, `marginRight` (text) - defaults: '0'
    - `padding` (text) - hardcoded default: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Utility element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `marginTop`/`marginBottom` separate properties vs `margin` in defaultStyle

---

### 9. spacer
- **Purpose:** Empty space/vertical spacing element
- **Default Props:** {} (empty)
- **Default Styles:**
  - `height`: "32px"
  - `width`: "100%"
- **Editable Properties:**
  - **Content:** [] (empty)
  - **Style:**
    - `height` (text) - from `getDefaultStyles('spacer').height` (✅ matches defaultStyle)
    - `width` (text) - from `getDefaultStyles('spacer').width` (✅ matches defaultStyle)
    - `backgroundColor` (color) - hardcoded default: 'transparent'
    - `textAlign` (select) - hardcoded default: 'center'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Utility element
- **Storage:** Hierarchical tree node
- **Issues:** None (good use of unified defaults)

---

### 10. container
- **Purpose:** Layout container that can hold child elements (flex/grid/block)
- **Default Props:** {} (empty)
- **Default Styles:**
  - `display`: "flex"
  - `flexDirection`: "column"
  - `gap`: "16px"
  - `padding`: undefined (explicitly set to undefined)
  - `backgroundColor`: "var(--color-surface, #0E1214)"
  - `color`: "var(--color-heading, #F8FAFC)"
  - `width`: "100%"
  - `opacity`: 0.3
- **Editable Properties:**
  - **Content:** [] (empty)
  - **Style:**
    - `display` (select: flex/grid/block) - from `getDefaultStyles('container').display` (✅ matches defaultStyle)
    - `padding` (text) - from `getDefaultStyles('container').padding` with fallback '16px' (⚠️ defaultStyle has `padding: undefined`)
    - `backgroundColor` (color) - from `getDefaultStyles('container').backgroundColor` (✅ matches defaultStyle)
    - `backgroundImage` (url) - hardcoded default: ''
    - `backgroundImageOpacity` (range) - hardcoded default: 1
    - `borderRadius` (text) - hardcoded default: '0'
    - `border` (text) - hardcoded default: 'none'
    - `width`, `height`, `minHeight`, `maxWidth` (text)
    - `flexDirection` (select) - hardcoded default: 'column' (✅ matches defaultStyle, showWhen: 'flex')
    - `gridColumns` (select) - hardcoded default: 'auto' (showWhen: 'grid')
    - `gridRows` (select) - hardcoded default: 'auto' (showWhen: 'grid')
    - `gap` (text) - hardcoded default: '16px' (✅ matches defaultStyle, showWhen: ['flex', 'grid'])
    - `justifyContent` (select) - hardcoded default: 'flex-start' (showWhen: 'flex')
    - `alignItems` (select) - hardcoded default: 'flex-start' (showWhen: 'flex')
    - `opacity` (range) - hardcoded default: 1 (⚠️ defaultStyle has 0.3)
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ✅ Yes (can contain other elements)
- **Type:** Layout element
- **Storage:** Hierarchical tree node with `children[]`
- **Issues:**
  - `padding` default in sidebar ('16px') differs from defaultStyle (undefined)
  - `opacity` default in sidebar (1) differs from defaultStyle (0.3)

---

### 11. row
- **Purpose:** Horizontal layout container (flex row by default)
- **Default Props:** {} (empty)
- **Default Styles:**
  - `display`: "flex"
  - `flexDirection`: "row"
  - `gap`: "16px"
  - `width`: "100%"
  - `backgroundColor`: "var(--color-surface, #0E1214)"
  - `color`: "var(--color-heading, #F8FAFC)"
- **Editable Properties:**
  - **Content:** [] (empty)
  - **Style:**
    - `display` (select: flex/grid/block) - from `getDefaultStyles('row').display` (✅ matches defaultStyle)
    - `flexDirection` (select) - from `getDefaultStyles('row').flexDirection` (✅ matches defaultStyle)
    - `gap` (text) - hardcoded default: '16px' (✅ matches defaultStyle)
    - `justifyContent` (select) - appears twice (lines 51-62 and 111-122) - ⚠️ DUPLICATE
    - `alignItems` (select) - appears twice (lines 65-76 and 125-136) - ⚠️ DUPLICATE
    - `padding` (text) - hardcoded default: '0'
    - `backgroundColor` (color) - hardcoded default: 'transparent' (⚠️ differs from defaultStyle)
    - `backgroundImage`, `backgroundImageOpacity` (url, range)
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ✅ Yes (can contain other elements)
- **Type:** Layout element
- **Storage:** Hierarchical tree node with `children[]`
- **Issues:**
  - **DUPLICATE PROPERTIES:** `justifyContent` and `alignItems` defined twice in properties array
  - `backgroundColor` default in sidebar doesn't match defaultStyle

---

### 12. column
- **Purpose:** Vertical layout container (flex column by default)
- **Default Props:** {} (empty)
- **Default Styles:**
  - `display`: "flex"
  - `flexDirection`: "column"
  - `gap`: "16px"
  - `width`: "100%"
  - `backgroundColor`: "var(--color-surface, #0E1214)"
  - `color`: "var(--color-heading, #F8FAFC)"
- **Editable Properties:**
  - **Content:** [] (empty)
  - **Style:**
    - `display` (select: flex/block/grid) - from `getDefaultStyles('column').display` (✅ matches defaultStyle)
    - `flexDirection` (select) - from `getDefaultStyles('column').flexDirection` (✅ matches defaultStyle)
    - `gap` (text) - hardcoded default: '16px' (✅ matches defaultStyle)
    - `width` (text) - hardcoded default: '100%' (✅ matches defaultStyle)
    - `padding` (text) - hardcoded default: '0'
    - `backgroundColor` (color) - hardcoded default: 'transparent' (⚠️ differs from defaultStyle)
    - `backgroundImage`, `backgroundImageOpacity` (url, range)
    - `justifyContent` (select) - hardcoded default: 'flex-start'
    - `alignItems` (select) - hardcoded default: 'flex-start'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ✅ Yes (can contain other elements)
- **Type:** Layout element
- **Storage:** Hierarchical tree node with `children[]`
- **Issues:**
  - `backgroundColor` default in sidebar doesn't match defaultStyle

---

### 13. html
- **Purpose:** Renders raw HTML content
- **Default Props:**
  - `htmlContent`: "<p>Custom HTML</p>"
- **Default Styles:** {} (empty)
- **Editable Properties:**
  - **Content:**
    - `htmlContent` (textarea) - from `getDefaultPropValue('html', 'htmlContent')`
  - **Style:**
    - `width` (text) - hardcoded default: '100%'
    - `padding` (text) - hardcoded default: '0'
    - `textAlign` (select) - hardcoded default: 'left'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Utility element
- **Storage:** Hierarchical tree node
- **Issues:** None

---

### 14. list
- **Purpose:** Ordered or unordered list with items
- **Default Props:**
  - `items`: "Item 1\nItem 2\nItem 3" (string format)
  - `listType`: "ul"
  - `listStyle`: "disc"
- **Default Styles:**
  - `listStyleType`: "disc"
  - `paddingLeft`: "20px"
  - `color`: "var(--color-description, #64748b)"
  - `fontSize`: "1rem"
- **Editable Properties:**
  - **Content:**
    - `items` (textarea) - from `getDefaultPropValue('list', 'items')`
    - `listType` (select: ul/ol) - from `getDefaultPropValue('list', 'listType')`
  - **Style:**
    - `listStyle` (select: disc/circle/square/none/decimal/etc.) - from `getDefaultPropValue('list', 'listStyle')`
    - `paddingLeft` (text) - hardcoded default: '20px' (✅ matches defaultStyle)
    - `padding` (text) - hardcoded default: '4px 0'
    - `color` (color) - hardcoded default: '#0f172a' (⚠️ differs from defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `lineHeight` (text) - hardcoded default: '1.5'
    - `textAlign` (select) - hardcoded default: 'left'
    - `opacity` (range) - hardcoded default: 1
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `color` default in sidebar doesn't match defaultStyle

---

### 15. input
- **Purpose:** Form input field (text, email, password, etc.)
- **Default Props:**
  - `placeholder`: "Enter text..."
  - `type`: "text"
- **Default Styles:**
  - `padding`: "12px"
  - `borderRadius`: "6px"
  - `border`: "1px solid #ccc"
  - `fontSize`: "1rem"
  - `width`: "100%"
- **Editable Properties:**
  - **Content:**
    - `placeholder` (text) - from `getDefaultPropValue('input', 'placeholder')`
    - `type` (select: text/email/password/number/tel/url/date) - from `getDefaultPropValue('input', 'type')`
    - `value` (text) - hardcoded default: '' (⚠️ not in defaultProps)
    - `name` (text) - hardcoded default: '' (⚠️ not in defaultProps)
  - **Style:**
    - `padding` (text) - hardcoded default: '12px' (✅ matches defaultStyle)
    - `borderRadius` (text) - hardcoded default: '6px' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: '1px solid #ccc' (✅ matches defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `width` (text) - hardcoded default: '100%' (✅ matches defaultStyle)
    - `backgroundColor` (color) - hardcoded default: '#ffffff'
    - `color` (color) - hardcoded default: '#000000'
    - `opacity` (range) - hardcoded default: 1
    - `textAlign` (select) - hardcoded default: 'left'
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `required` (checkbox) - hardcoded default: false
    - `disabled` (checkbox) - hardcoded default: false
    - `className` (text)
- **Children:** ❌ No
- **Type:** Form element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `value` and `name` properties exist in sidebar but not in defaultProps

---

### 16. textarea
- **Purpose:** Multi-line text input field
- **Default Props:**
  - `placeholder`: "Enter text..."
- **Default Styles:**
  - `padding`: "12px"
  - `borderRadius`: "6px"
  - `border`: "1px solid #ccc"
  - `fontSize`: "1rem"
  - `width`: "100%"
  - `minHeight`: "100px"
- **Editable Properties:**
  - **Content:**
    - `placeholder` (text) - from `getDefaultPropValue('textarea', 'placeholder')`
    - `value` (textarea) - hardcoded default: '' (⚠️ not in defaultProps)
    - `name` (text) - hardcoded default: '' (⚠️ not in defaultProps)
    - `rows` (number: 1-20) - hardcoded default: 4 (⚠️ not in defaultProps or defaultStyle)
  - **Style:**
    - `padding` (text) - hardcoded default: '12px' (✅ matches defaultStyle)
    - `borderRadius` (text) - hardcoded default: '6px' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: '1px solid #ccc' (✅ matches defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `width` (text) - hardcoded default: '100%' (✅ matches defaultStyle)
    - `minHeight` (text) - hardcoded default: '100px' (✅ matches defaultStyle)
    - `backgroundColor` (color) - hardcoded default: '#ffffff'
    - `color` (color) - hardcoded default: '#000000'
    - `opacity` (range) - hardcoded default: 1
    - `textAlign` (select) - hardcoded default: 'left'
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `required` (checkbox) - hardcoded default: false
    - `disabled` (checkbox) - hardcoded default: false
    - `className` (text)
- **Children:** ❌ No
- **Type:** Form element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `value`, `name`, and `rows` properties exist in sidebar but not in defaultProps

---

### 17. select
- **Purpose:** Dropdown select field
- **Default Props:**
  - `options`: ["Option 1", "Option 2"]
- **Default Styles:**
  - `padding`: "12px"
  - `borderRadius`: "6px"
  - `border`: "1px solid #ccc"
  - `fontSize`: "1rem"
  - `width`: "100%"
- **Editable Properties:**
  - **Content:**
    - `options` (textarea) - from `getDefaultPropValue('select', 'options')` (converted to string)
    - `placeholder` (text) - hardcoded default: 'Select an option...' (⚠️ not in defaultProps)
    - `name` (text) - hardcoded default: '' (⚠️ not in defaultProps)
  - **Style:**
    - `padding` (text) - hardcoded default: '12px' (✅ matches defaultStyle)
    - `borderRadius` (text) - hardcoded default: '6px' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: '1px solid #ccc' (✅ matches defaultStyle)
    - `fontSize` (text) - hardcoded default: '1rem' (✅ matches defaultStyle)
    - `width` (text) - hardcoded default: '100%' (✅ matches defaultStyle)
    - `backgroundColor` (color) - hardcoded default: '#ffffff'
    - `color` (color) - hardcoded default: '#000000'
    - `opacity` (range) - hardcoded default: 1
    - `textAlign` (select) - hardcoded default: 'left'
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `required` (checkbox) - hardcoded default: false
    - `disabled` (checkbox) - hardcoded default: false
    - `multiple` (checkbox) - hardcoded default: false
    - `className` (text)
- **Children:** ❌ No
- **Type:** Form element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `placeholder` and `name` properties exist in sidebar but not in defaultProps

---

### 18. label
- **Purpose:** Form label for input fields
- **Default Props:**
  - `text`: "Label"
- **Default Styles:**
  - `fontSize`: "0.875rem"
  - `fontWeight`: 500
  - `color`: "var(--color-heading, #0f172a)"
  - `marginBottom`: "8px"
  - `display`: "block"
- **Editable Properties:**
  - **Content:**
    - `text` (text) - from `getDefaultPropValue('label', 'text')`
    - `htmlFor` (text) - hardcoded default: '' (⚠️ not in defaultProps)
  - **Style:**
    - `fontSize` (text) - from `getDefaultStyles('label').fontSize` (✅ matches defaultStyle)
    - `fontWeight` (select) - hardcoded default: '500' (✅ matches defaultStyle)
    - `color` (color) - hardcoded default: '#ffffff' (⚠️ differs from defaultStyle)
    - `useDefaultColor` (toggle) - hardcoded default: true
    - `marginBottom` (text) - hardcoded default: '8px' (✅ matches defaultStyle)
    - `display` (select) - hardcoded default: 'block' (✅ matches defaultStyle)
    - `opacity` (range) - hardcoded default: 1
    - `textAlign` (select) - hardcoded default: 'left'
    - `marginTop`, `marginRight`, `marginLeft` (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Form element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `htmlFor` property exists in sidebar but not in defaultProps
  - `color` default in sidebar doesn't match defaultStyle

---

### 19. badge
- **Purpose:** Small badge/tag element for labels or status indicators
- **Default Props:**
  - `text`: "Badge"
- **Default Styles:**
  - `display`: "inline-block"
  - `padding`: "4px 12px"
  - `backgroundColor`: "var(--color-badge-bg, rgba(0,0,0,0.1))"
  - `color`: "var(--color-badge-text, #0f172a)"
  - `borderRadius`: "12px"
  - `fontSize`: "0.875rem"
  - `fontWeight`: 600
- **Editable Properties:**
  - **Content:**
    - `text` (text) - from `getDefaultPropValue('badge', 'text')`
  - **Style:**
    - `display` (select) - from `getDefaultStyles('badge').display` (✅ matches defaultStyle)
    - `padding` (text) - hardcoded default: '4px 12px' (✅ matches defaultStyle)
    - `backgroundColor` (color) - hardcoded default: '#ffffff' (⚠️ differs from defaultStyle)
    - `color` (color) - hardcoded default: '#000000' (⚠️ differs from defaultStyle)
    - `useDefaultColor` (toggle) - hardcoded default: true
    - `borderRadius` (text) - hardcoded default: '12px' (✅ matches defaultStyle)
    - `fontSize` (text) - hardcoded default: '0.875rem' (✅ matches defaultStyle)
    - `fontWeight` (select) - hardcoded default: '600' (✅ matches defaultStyle)
    - `border` (text) - hardcoded default: 'none'
    - `opacity` (range) - hardcoded default: 1
    - `textAlign` (select) - hardcoded default: 'center'
    - All margins (text) - defaults: '0'
  - **Advanced:**
    - `className` (text)
- **Children:** ❌ No
- **Type:** Content element
- **Storage:** Hierarchical tree node
- **Issues:**
  - `backgroundColor` and `color` defaults in sidebar don't match defaultStyle

---

## ELEMENT CATEGORIES

### Layout Elements (3)
- **container** - Main layout container (flex/grid/block)
- **row** - Horizontal layout container
- **column** - Vertical layout container

### Content Elements (10)
- **heading** - Headings (H1-H6)
- **text** - Paragraph text
- **button** - Interactive button
- **image** - Image display
- **video** - Video embed
- **icon** - Icon display
- **link** - Hyperlink
- **list** - Ordered/unordered list
- **badge** - Badge/tag element

### Form Elements (5)
- **input** - Text input field
- **textarea** - Multi-line text input
- **select** - Dropdown select
- **label** - Form label

### Utility Elements (2)
- **divider** - Horizontal rule
- **spacer** - Empty spacing element
- **html** - Raw HTML content

---

## IDENTIFIED ISSUES

### 1. Hardcoded Defaults (Not Using Unified Source)
**Elements with hardcoded defaults instead of `getDefaultPropValue()` or `getDefaultStyles()`:**
- **heading:** Most style properties (headingFontWeight, textColor, headingTextAlign, etc.)
- **text:** fontSize, color, textAlign, marginBottom
- **button:** backgroundColor, color
- **image:** imageTitle, objectFit
- **video:** poster, controls, autoplay, loop, muted
- **link:** color
- **divider:** marginTop, marginBottom (should use margin from defaultStyle)
- **container:** padding, opacity
- **row:** backgroundColor, duplicate justifyContent/alignItems
- **column:** backgroundColor
- **list:** color
- **input:** value, name
- **textarea:** value, name, rows
- **select:** placeholder, name
- **label:** htmlFor, color
- **badge:** backgroundColor, color

### 2. Default Value Mismatches
**Properties where sidebar default ≠ defaultStyle/defaultProps:**
- **text:** fontSize ('1.25rem' vs '1rem'), color ('#f1f5f9' vs 'var(--color-description, #64748b)')
- **button:** backgroundColor ('#ffffff' vs 'var(--color-primary-bg, #2563eb)'), color ('#000000' vs 'var(--color-primary-text, #ffffff)')
- **link:** color ('#ffffff' vs 'var(--color-accent, #2563eb)')
- **container:** padding ('16px' vs undefined), opacity (1 vs 0.3)
- **row:** backgroundColor ('transparent' vs 'var(--color-surface, #0E1214)')
- **column:** backgroundColor ('transparent' vs 'var(--color-surface, #0E1214)')
- **list:** color ('#0f172a' vs 'var(--color-description, #64748b)')
- **label:** color ('#ffffff' vs 'var(--color-heading, #0f172a)')
- **badge:** backgroundColor ('#ffffff' vs 'var(--color-badge-bg, rgba(0,0,0,0.1))'), color ('#000000' vs 'var(--color-badge-text, #0f172a)')

### 3. Missing Properties in defaultProps/defaultStyle
**Properties defined in sidebar but not in DEFAULT_ELEMENT_STRUCTURES:**
- **image:** imageTitle
- **video:** poster, controls, autoplay, loop, muted
- **input:** value, name
- **textarea:** value, name, rows
- **select:** placeholder, name
- **label:** htmlFor
- **button:** hoverStyle, hoverBackgroundColor, hoverTextColor, clickStyle, clickBackgroundColor, clickTextColor, onClick
- **image:** lazy
- **input/textarea/select:** required, disabled
- **select:** multiple

### 4. Duplicate Properties
- **row:** `justifyContent` and `alignItems` appear twice in properties array (lines 51-62 and 111-122)

### 5. Property Key Naming Inconsistencies
- **heading:** Uses prefixed keys (`headingFontWeight`, `headingTextAlign`, etc.) but defaultStyle uses standard CSS keys (`fontWeight`, `textAlign`)

### 6. Storage Format
✅ **All elements correctly save as hierarchical tree:**
- `elementId` (string)
- `elementType` (string)
- `style` (object - only changed values)
- `data` (object - only changed values)
- `order` (number)
- `children[]` (array - for container/row/column)

**No elements save flat props/styles separately** ✅

---

## FINAL SUMMARY

### Total Element Count: **19**

### Single Source of Truth Status:
❌ **NOT FULLY RESPECTED**
- Many elements still use hardcoded defaults in property definitions
- Several elements have default value mismatches between sidebar and `DEFAULT_ELEMENT_STRUCTURES`
- Some properties exist in sidebar but not in defaultProps/defaultStyle

### Unified Save/Render Model:
✅ **CONSISTENT**
- All elements follow the same hierarchical storage format
- All elements use the same rendering pipeline (`renderElement`)
- No flat element storage remains

### Elements Needing Redesign/Cleanup:

1. **heading** - Migrate all style properties to use `getDefaultStyles()`, fix property key naming
2. **text** - Fix fontSize and color defaults to match defaultStyle
3. **button** - Fix backgroundColor/color defaults, consider adding hover/click props to defaultProps
4. **row** - Remove duplicate `justifyContent`/`alignItems`, fix backgroundColor default
5. **container** - Fix padding and opacity defaults
6. **column** - Fix backgroundColor default
7. **Form elements (input/textarea/select/label)** - Add missing properties (value, name, placeholder, htmlFor, etc.) to defaultProps
8. **video** - Add missing properties (poster, controls, autoplay, etc.) to defaultProps
9. **image** - Add imageTitle to defaultProps or remove from sidebar
10. **list/label/badge** - Fix color defaults to match defaultStyle

---

## RECOMMENDATIONS

1. **Complete Migration to Unified Defaults:**
   - Replace all hardcoded `defaultValue` in property files with `getDefaultPropValue()` or `getDefaultStyles()`
   - Ensure all sidebar defaults match `DEFAULT_ELEMENT_STRUCTURES`

2. **Add Missing Properties:**
   - Add all sidebar properties to `defaultProps` or `defaultStyle` in `elementStructures.ts`
   - Or remove properties from sidebar if they're not needed

3. **Fix Duplicate Properties:**
   - Remove duplicate `justifyContent` and `alignItems` from row properties

4. **Standardize Property Keys:**
   - Consider removing `heading*` prefixes from heading properties to match CSS standard keys
   - Or document why prefixes are needed

5. **Documentation:**
   - Document which properties are "advanced" and why they're not in defaultProps
   - Document any intentional differences between sidebar defaults and defaultStyle

---

**Report Generated:** Based on codebase analysis  
**Files Analyzed:**
- `packages/ui/src/constants/elementStructures.ts`
- `apps/smartlybuildadmin/src/studio/elementProperties/*.ts`
- `packages/ui/src/utils/renderElement.tsx`
