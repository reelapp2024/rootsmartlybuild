# Theme Effects on Elements - Complete Reference

This document lists all elements and how they are affected by theme settings in geniebuild.

## Theme Properties Available

From `@ui/blocks` ThemeProvider:
- `heading` - Main heading color
- `description` - Text/description color  
- `surface` - Background surface color
- `overlay` - { color, blend } - Overlay color and blend mode
- `primaryButton` - { bg, text, hover } - Primary button colors
- `secondaryButton` - { bg, text, border, hover } - Secondary button colors
- `accent` - Accent color for highlights
- `gradient` - { from, to } - Gradient colors
- `ring` - Ring/border color
- `shadow` - Shadow color
- `badge` - { text, background } - Badge colors
- `trust` - { text, dot1, dot2, dot3 } - Trust indicator colors
- `headingSizes` - { h1, h2, h3, h4, h5, h6 } - Heading font sizes
- `buttonSizes` - { small, medium, large, fontSize } - Button sizes
- `textSizes` - { base, small, large, xl } - Text font sizes
- `fontFamily` - Default font family

---

## Elements and Their Theme Effects

### 1. **Heading** (`heading`)
**Theme Properties Used:**
- `themeData.heading` → **Color** (text color)
- `themeData.headingSizes` → **Font Size** (h1-h6 sizes)
- `themeData.fontFamily` → **Font Family** (via titleFontFamily)

**Fallback Hierarchy:**
1. Element style.color (if set)
2. Section styles.titleColor
3. `themeData.heading`
4. Default: `#F8FAFC`

**Additional Theme Effects:**
- Font weight: Uses `titleFontWeight` or `fontWeight` from section/theme
- Text align: Uses `titleAlign` or `textAlign` from section/theme
- Font size: Uses `titleSize` from section or `headingSizes` from theme

---

### 2. **Text** (`text`)
**Theme Properties Used:**
- `themeData.description` → **Color** (text color)
- `themeData.textSizes` → **Font Size** (base, small, large, xl)
- `themeData.fontFamily` → **Font Family** (via subtitleFontFamily)

**Fallback Hierarchy:**
1. Element style.color (if set)
2. Section styles.textColor
3. `themeData.description`
4. Default: `#D1D5DB`

**Additional Theme Effects:**
- Font weight: Uses `subtitleFontWeight` or `fontWeight` from section/theme
- Text align: Uses `subtitleAlign` or `textAlign` from section/theme
- Font size: Uses `subtitleSize` from section or `textSizes` from theme

---

### 3. **Button** (`button`)
**Theme Properties Used:**
- `themeData.primaryButton.bg` → **Background Color**
- `themeData.primaryButton.text` → **Text Color**
- `themeData.buttonSizes` → **Padding & Font Size**
- `themeData.fontFamily` → **Font Family** (via buttonFontFamily)

**Fallback Hierarchy:**
- Background: Element style.backgroundColor → Section styles.buttonBackgroundColor → `themeData.primaryButton.bg` → Default: `#E11D48`
- Text: Element style.color → Section styles.buttonTextColor → `themeData.primaryButton.text` → Default: `#FFFFFF`

**Additional Theme Effects:**
- Font weight: Uses `buttonFontWeight` or `fontWeight` from section/theme
- Font size: Uses `buttonFontSize` from section or `buttonSizes.fontSize` from theme
- Alignment: Uses `buttonAlign` or `textAlign` from section/theme

---

### 4. **Call-to-Action** (`call-to-action`)
**Theme Properties Used:**
- Same as Button (uses `primaryButton` theme colors)
- `themeData.primaryButton.bg` → **Background Color**
- `themeData.primaryButton.text` → **Text Color**

**Additional:** Includes subText below button (uses text color from theme)

---

### 5. **Image** (`image`)
**Theme Properties Used:**
- None directly (image itself doesn't use theme colors)
- **Overlay Support:** Can have custom overlayColor and overlayOpacity (not from theme)

**Note:** Image element can have opacity control, but overlay colors are set per-element, not from theme.

---

### 6. **Video** (`video`)
**Theme Properties Used:**
- None (video element doesn't use theme colors)

---

### 7. **Icon** (`icon`)
**Theme Properties Used:**
- `themeData.accent` → **Icon Color**

**Fallback Hierarchy:**
1. Element style.color (if set)
2. Element style.accentColor
3. Section styles.accentColor
4. `themeData.accent`
5. Default: `#F59E0B`

**Additional:** Font size can be set per element

---

### 8. **Icon Box** (`icon-box`)
**Theme Properties Used:**
- `themeData.accent` → **Icon Color**
- `themeData.heading` → **Title Color** (via titleColor)
- `themeData.description` → **Description Color** (via textColor)

**Fallback Hierarchy:**
- Icon: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#F59E0B`
- Title: Section styles.titleColor → `themeData.heading`
- Description: Section styles.textColor → `themeData.description`

---

### 9. **Image Box** (`image-box`)
**Theme Properties Used:**
- `themeData.heading` → **Title Color** (via titleColor)
- `themeData.description` → **Description Color** (via textColor)

**Fallback Hierarchy:**
- Title: Section styles.titleColor → `themeData.heading`
- Description: Section styles.textColor → `themeData.description`

---

### 10. **List** (`list`)
**Theme Properties Used:**
- `themeData.description` → **List Item Text Color**

**Fallback Hierarchy:**
1. Element style.color (if set)
2. Section styles.textColor
3. `themeData.description`
4. Default: `#D1D5DB`

---

### 11. **Star Rating** (`star-rating`)
**Theme Properties Used:**
- `themeData.accent` → **Active Star Color**

**Fallback Hierarchy:**
1. Element style.color (if set)
2. Section styles.accentColor
3. `themeData.accent`
4. Default: `#F59E0B`

**Note:** Inactive stars use `rgba(255, 255, 255, 0.2)`

---

### 12. **Badge** (`badge`)
**Theme Properties Used:**
- `themeData.accent` → **Background Color**
- `themeData.badge.text` → **Text Color** (if available)
- `themeData.badge.background` → **Background Color** (if available, overrides accent)

**Fallback Hierarchy:**
- Background: Element style.backgroundColor → Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Text: Always `#fff` (white)

---

### 13. **Highlight Text** (`highlight-text`)
**Theme Properties Used:**
- `themeData.accent` → **Highlight Background Color**
- `themeData.description` → **Text Color**

**Fallback Hierarchy:**
- Highlight: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#facc15`
- Text: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

**Note:** Highlighted text uses black (`#000`) for contrast

---

### 14. **Blockquote** (`blockquote`)
**Theme Properties Used:**
- `themeData.accent` → **Left Border Color**
- `themeData.description` → **Text Color**

**Fallback Hierarchy:**
- Border: Element style.borderColor → Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#fff`
- Text: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 15. **Accordion** (`accordion`)
**Theme Properties Used:**
- `themeData.heading` → **Question/Title Color**
- `themeData.accent` → **Chevron Icon Color**
- `themeData.description` → **Answer Text Color**

**Fallback Hierarchy:**
- Title: Section styles.titleColor → `themeData.heading` → Default: `#F8FAFC`
- Icon: Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Content: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 16. **Toggle** (`toggle`)
**Theme Properties Used:**
- `themeData.heading` → **Title Color**
- `themeData.description` → **Content Text Color**

**Fallback Hierarchy:**
- Title: Section styles.titleColor → `themeData.heading`
- Content: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

**Note:** Toggle switch uses fixed green color (`bg-green-500`) when open

---

### 17. **Tabs** (`tabs`)
**Theme Properties Used:**
- `themeData.accent` → **Active Tab Border Color**
- `themeData.description` → **Tab Content Text Color**

**Fallback Hierarchy:**
- Active Border: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Content: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 18. **Progress Bar** (`progress-bar`)
**Theme Properties Used:**
- `themeData.accent` → **Progress Fill Color**
- `themeData.description` → **Label Text Color**

**Fallback Hierarchy:**
- Fill: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Text: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 19. **Counter** (`counter`)
**Theme Properties Used:**
- `themeData.accent` → **Number Color**
- `themeData.description` → **Label Text Color**

**Fallback Hierarchy:**
- Number: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#ffffff`
- Label: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 20. **Alert Box** (`alert-box`)
**Theme Properties Used:**
- **None** - Uses fixed color scheme based on alert type:
  - Success: Green (`#22c55e`)
  - Warning: Yellow (`#eab308`)
  - Error: Red (`#ef4444`)
  - Info: Blue (`#3b82f6`)

**Note:** Alert boxes don't use theme colors, they use semantic colors based on alert type.

---

### 21. **Testimonial** (`testimonial`)
**Theme Properties Used:**
- `themeData.heading` → **Author Name Color**
- `themeData.description` → **Quote Text Color**

**Fallback Hierarchy:**
- Author: Section styles.titleColor → `themeData.heading`
- Quote: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

**Note:** Stars use fixed yellow (`text-yellow-500`)

---

### 22. **Pricing Table** (`pricing-table`)
**Theme Properties Used:**
- `themeData.heading` → **Plan Name Color**
- `themeData.accent` → **Price Color** & **Border Color**
- `themeData.description` → **Feature List Text Color**
- `themeData.primaryButton` → **Button Colors** (via buttonClass)

**Fallback Hierarchy:**
- Plan Name: Section styles.titleColor → `themeData.heading`
- Price: Section styles.accentColor → `themeData.accent`
- Border: Element style.borderColor → Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Features: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 23. **Flip Box** (`flip-box`)
**Theme Properties Used:**
- `themeData.accent` → **Icon Color** & **Back Side Background Color**
- `themeData.heading` → **Title Color**
- `themeData.description` → **Description Text Color**

**Fallback Hierarchy:**
- Icon/Back BG: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#3b82f6`
- Title: Section styles.titleColor → `themeData.heading`
- Description: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 24. **Countdown Timer** (`countdown-timer`)
**Theme Properties Used:**
- `themeData.accent` → **Timer Box Border Color**
- `themeData.description` → **Label Text Color**

**Fallback Hierarchy:**
- Border: Element style.accentColor → Section styles.accentColor → `themeData.accent` → Default: `#F59E0B`
- Label: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

---

### 25. **Review Carousel** (`review-carousel`)
**Theme Properties Used:**
- `themeData.heading` → **Author Name Color**
- `themeData.description` → **Review Text Color**

**Fallback Hierarchy:**
- Author: Section styles.titleColor → `themeData.heading`
- Review: Element style.color → Section styles.textColor → `themeData.description` → Default: `#D1D5DB`

**Note:** Stars use fixed yellow (`text-yellow-500`)

---

## Section-Level Theme Effects

### Background & Overlay
**Theme Properties Used:**
- `themeData.surface` → **Section Background Color** (if no background set)
- `themeData.overlay.color` → **Overlay Color** (if background image exists and no overlay set)
- `themeData.overlay.blend` → **Blend Mode** (multiply, screen, etc.)

**When Applied:**
- Background: Falls back to `themeData.surface` if section has no background color/image
- Overlay: Applied automatically to background images if no custom overlay is set

---

## Typography Theme Effects

### Font Sizes
- `themeData.headingSizes` → Applied to all heading elements (h1-h6)
- `themeData.textSizes` → Applied to all text elements
- `themeData.buttonSizes` → Applied to all button elements

### Font Family
- `themeData.fontFamily` → Applied to all elements unless overridden
- Can be overridden per element type:
  - `titleFontFamily` → Headings
  - `subtitleFontFamily` → Text elements
  - `buttonFontFamily` → Buttons

---

## Priority Order (Fallback Hierarchy)

For all elements, the priority order is:
1. **Element-level styles** (highest priority - explicit element.style values)
2. **Section-level styles** (section.styles values)
3. **Theme defaults** (`themeData` from ThemeProvider)
4. **Hard-coded defaults** (lowest priority)

**Important:** If an element has an explicit color/style set, it will NOT use theme colors. Theme colors only apply when element styles are empty/undefined.

---

## Summary Table

| Element | Theme Colors Used | Primary Effect |
|---------|------------------|----------------|
| Heading | `heading`, `headingSizes`, `fontFamily` | Text color, font size, font family |
| Text | `description`, `textSizes`, `fontFamily` | Text color, font size, font family |
| Button | `primaryButton.bg`, `primaryButton.text`, `buttonSizes`, `fontFamily` | Background, text color, padding, font |
| Icon | `accent` | Icon color |
| Icon Box | `accent`, `heading`, `description` | Icon, title, description colors |
| Image Box | `heading`, `description` | Title, description colors |
| Badge | `accent` or `badge.background` | Background color |
| Star Rating | `accent` | Active star color |
| Highlight Text | `accent`, `description` | Highlight background, text color |
| Blockquote | `accent`, `description` | Border color, text color |
| Accordion | `heading`, `accent`, `description` | Title, icon, content colors |
| Tabs | `accent`, `description` | Active border, content color |
| Progress Bar | `accent`, `description` | Fill color, label color |
| Counter | `accent`, `description` | Number color, label color |
| Testimonial | `heading`, `description` | Author name, quote color |
| Pricing Table | `heading`, `accent`, `description`, `primaryButton` | Plan name, price, border, button |
| Flip Box | `accent`, `heading`, `description` | Icon, back BG, title, description |
| Countdown Timer | `accent`, `description` | Border color, label color |
| Review Carousel | `heading`, `description` | Author name, review text color |
| Sections | `surface`, `overlay` | Background color, overlay on images |

---

## Notes

1. **Element Override Priority:** If you set a color directly on an element, it will NOT use theme colors. Theme colors are fallbacks.

2. **Section Styles:** Section-level styles (like `section.styles.titleColor`) take precedence over theme defaults but are overridden by element-level styles.

3. **Typography:** Font sizes and families from theme are applied globally unless overridden at section or element level.

4. **Overlay:** Section overlays use theme overlay colors automatically when background images are present, unless a custom overlay is set.

5. **Alert Boxes:** Don't use theme colors - they use semantic colors (success=green, error=red, etc.) for better UX.
