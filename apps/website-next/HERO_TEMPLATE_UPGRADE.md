# HeroWithBackground Template Upgrade Guide

## ✅ What's Been Updated

The `HeroWithBackground` template has been upgraded to work with the new **Section/Row/Column/Element** system while maintaining all dynamic content features.

## 🎨 Design Matching

### Original Design Features:
- ✅ Background image with cover effect
- ✅ White overlay with transparency (`rgba(255, 255, 255, 0.9)`)
- ✅ Centered content with max-width
- ✅ Large heading (2.5rem, weight 800)
- ✅ Description text (1.125rem)
- ✅ Proper padding and spacing

### New System Implementation:
- **Section**: Contains background image, min-height, centered layout
- **Row**: Transparent, flexbox for centering
- **Column**: White overlay effect, max-width 600px, centered
- **Elements**: 
  - Heading element (with API support)
  - Description element (with API support)

## 🔌 API Integration

### Automatic API Configuration:
When you add a `HeroWithBackground` template, both elements are **automatically configured** to fetch from the hero API:

**Heading Element:**
- API URL: `http://localhost:1111/api/monorepo/hero`
- Data Path: `title`
- Method: `GET`
- Fallback: Enabled (uses static content if API fails)

**Description Element:**
- API URL: `http://localhost:1111/api/monorepo/hero`
- Data Path: `description`
- Method: `GET`
- Fallback: Enabled (uses static content if API fails)

### API Response Format:
```json
{
  "backgroundImage": "https://images.unsplash.com/...",
  "title": "Best smm panel in the world!",
  "description": "Fully flexible smm panel...",
  "styles": {
    "section": { "minHeight": 420, "padding": 72 },
    "title": { "fontSize": 22, "fontWeight": 800 },
    "description": { "fontSize": 18, "color": "#334155" },
    "overlay": { "background": "rgba(255,255,255,0.9)", "padding": 28 }
  }
}
```

## 📝 How to Use

### 1. Add Template:
1. Open Studio Builder (`http://localhost:5174/builder`)
2. Click "Templates" dropdown in topbar
3. Select "HeroWithBackground"
4. Template is automatically added with API enabled

### 2. Customize:
- **Section Settings**: Change background image, padding, min-height
- **Column Settings**: Adjust overlay color, padding, max-width
- **Heading Element**: Edit text, styles, or disable API
- **Description Element**: Edit text, styles, or disable API

### 3. API Configuration:
- Elements already have API enabled by default
- You can disable/enable in "Advanced" tab of element settings
- Change API URL, data path, or refresh interval as needed

## 🎯 Key Improvements

1. **Full Builder Integration**: 
   - Can edit all parts (section, row, column, elements)
   - Context menu for move/duplicate/delete
   - Section navigator support

2. **Responsive Design**:
   - Breakpoint-specific styles
   - Mobile/Tablet/Desktop support

3. **Dynamic Content**:
   - API fetching with fallback
   - Auto-refresh support (optional)
   - Live updates from backend

4. **Design Flexibility**:
   - All styles customizable
   - Can add more elements
   - Can modify structure (add rows/columns)

## 🔄 Migration from Old Template

If you have existing `HeroWithBackground` components:

1. **Old System**: Single component with hardcoded API fetch
2. **New System**: Section/Row/Column/Element structure with API per element

**Benefits:**
- ✅ More granular control
- ✅ Can edit individual elements
- ✅ Can add/remove elements
- ✅ Better responsive control
- ✅ Same dynamic content features

## 🧪 Testing

1. **Add Template**: Should create section with heading + description
2. **Check API**: Elements should fetch from `/api/monorepo/hero`
3. **Verify Content**: Title and description should match API response
4. **Test Live Update**: Change backend API, refresh builder
5. **Customize**: Edit styles, disable API, add elements

## 📋 Default Styles

**Section:**
- Background: Default image or from template
- Min Height: 420px
- Padding: 72px 40px
- Display: Flex (centered)

**Column (Overlay):**
- Background: `rgba(255, 255, 255, 0.9)`
- Padding: 28px
- Max Width: 600px
- Border Radius: 8px

**Heading:**
- Font Size: 2.5rem
- Font Weight: 800
- Color: #0f172a
- Text Align: Center

**Description:**
- Font Size: 1.125rem
- Color: #334155
- Text Align: Center

## 🚀 Next Steps

- [ ] Add section-level API for background image
- [ ] Add button element to hero template
- [ ] Add image element support
- [ ] Add animation support


