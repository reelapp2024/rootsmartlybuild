# Next.js Structure Plan - Multiple Themes

## Recommended Structure

### Option 1: Single Next.js Project (Recommended) ✅

```
apps/
└── website-nextjs/                    # Single Next.js project
    ├── app/
    │   ├── layout.tsx                 # Root layout
    │   ├── page.tsx                   # Home (theme selector)
    │   ├── [theme]/                   # Dynamic theme route
    │   │   ├── layout.tsx             # Theme-specific layout
    │   │   ├── page.tsx               # Home page
    │   │   ├── about/
    │   │   │   └── page.tsx
    │   │   ├── services/
    │   │   │   └── page.tsx
    │   │   ├── contact/
    │   │   │   └── page.tsx
    │   │   └── areas/
    │   │       └── page.tsx
    │   └── api/                       # API routes if needed
    ├── themes/                        # Shared theme components
    │   ├── modern/
    │   │   ├── components/
    │   │   ├── contexts/
    │   │   └── hooks/
    │   ├── multicolor/
    │   │   ├── components/
    │   │   ├── contexts/
    │   │   └── hooks/
    │   ├── cleaning/
    │   │   ├── components/
    │   │   └── pages/
    │   └── shared/                    # Shared utilities
    │       ├── config.ts
    │       ├── api.ts
    │       └── utils.ts
    ├── components/                    # Shared UI components
    │   └── ui/
    ├── lib/
    ├── public/
    ├── next.config.js
    ├── package.json
    └── tsconfig.json
```

**URL Structure:**
- `http://localhost:3000/modern` → Modern theme
- `http://localhost:3000/multicolor` → Multicolor theme
- `http://localhost:3000/cleaning` → Cleaning theme
- `http://localhost:3000/modern/about` → Modern theme about page

---

### Option 2: Separate Next.js Projects (Not Recommended)

```
apps/
├── website-nextjs-modern/
│   ├── app/
│   └── ...
├── website-nextjs-multicolor/
│   ├── app/
│   └── ...
└── website-nextjs-cleaning/
    ├── app/
    └── ...
```

**Issues:**
- Code duplication
- Hard to maintain
- Separate deployments

---

## Recommended: Option 1 Implementation

### Folder Location

```
C:\iCloudDrive\desktop 17-11-25\ai project\aiwebbuilder\
└── apps/
    ├── website/                       # Current React app (keep for now)
    │   └── src/
    │       └── themes/
    │           ├── modern/
    │           ├── multicolor/
    │           └── cleaning/
    │
    └── website-nextjs/                # NEW: Next.js project
        ├── app/
        ├── themes/
        ├── components/
        └── ...
```

---

## Step-by-Step Setup

### Step 1: Create Next.js Project

```bash
# Navigate to apps folder
cd "C:\iCloudDrive\desktop 17-11-25\ai project\aiwebbuilder\apps"

# Create Next.js project
npx create-next-app@latest website-nextjs --typescript --tailwind --app --no-src-dir
```

### Step 2: Create Theme Structure

```bash
cd website-nextjs

# Create themes folder
mkdir -p themes/modern/components
mkdir -p themes/modern/contexts
mkdir -p themes/modern/hooks
mkdir -p themes/multicolor/components
mkdir -p themes/multicolor/contexts
mkdir -p themes/cleaning/components
mkdir -p themes/shared
```

### Step 3: Copy Existing Themes

```bash
# Copy modern theme
cp -r ../website/src/themes/modern/components themes/modern/
cp -r ../website/src/themes/modern/contexts themes/modern/
cp -r ../website/src/themes/modern/hooks themes/modern/

# Copy multicolor theme
cp -r ../website/src/themes/multicolor/components themes/multicolor/
cp -r ../website/src/themes/multicolor/contexts themes/multicolor/

# Copy cleaning theme
cp -r ../website/src/themes/cleaning/components themes/cleaning/
```

### Step 4: Create Dynamic Theme Route

```
app/
└── [theme]/
    ├── layout.tsx          # Theme-specific layout
    ├── page.tsx            # Home page
    ├── about/
    │   └── page.tsx
    ├── services/
    │   └── page.tsx
    └── contact/
        └── page.tsx
```

---

## Implementation Details

### 1. Root Layout (`app/layout.tsx`)

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### 2. Theme Layout (`app/[theme]/layout.tsx`)

```typescript
import { ThemeProvider } from '@/themes/[theme]/contexts/ThemeContext'

export default function ThemeLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode
  params: { theme: string }
}) {
  const { theme } = params
  
  // Dynamic import based on theme
  const ThemeProvider = getThemeProvider(theme)
  
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
```

### 3. Theme Home Page (`app/[theme]/page.tsx`)

```typescript
import { getThemeComponent } from '@/themes/shared/utils'

export default async function ThemePage({ 
  params 
}: { 
  params: { theme: string }
}) {
  const { theme } = params
  
  // Get theme-specific home component
  const HomeComponent = await getThemeComponent(theme, 'Index')
  
  return <HomeComponent />
}
```

### 4. Theme Selector Utility (`themes/shared/utils.ts`)

```typescript
export function getThemeComponent(theme: string, component: string) {
  switch(theme) {
    case 'modern':
      return require(`@/themes/modern/pages/${component}`).default
    case 'multicolor':
      return require(`@/themes/multicolor/pages/${component}`).default
    case 'cleaning':
      return require(`@/themes/cleaning/pages/${component}`).default
    default:
      return require(`@/themes/modern/pages/${component}`).default
  }
}
```

---

## Benefits of This Structure

✅ **Single Codebase** - All themes in one project
✅ **Easy to Add Themes** - Just add new folder in `themes/`
✅ **Shared Components** - Common UI components shared
✅ **Single Deployment** - One deployment for all themes
✅ **Easy Maintenance** - Update once, affects all themes
✅ **Better SEO** - Each theme has its own route

---

## Adding New Theme (Future)

### Step 1: Create Theme Folder

```bash
mkdir -p themes/new-theme/components
mkdir -p themes/new-theme/contexts
mkdir -p themes/new-theme/pages
```

### Step 2: Add to Theme Selector

```typescript
// themes/shared/utils.ts
case 'new-theme':
  return require(`@/themes/new-theme/pages/${component}`).default
```

### Step 3: Create Pages

```
app/
└── [theme]/
    └── ... (already exists, works for all themes)
```

**That's it!** New theme automatically works with existing routes.

---

## Migration Strategy

### Phase 1: Setup Structure
1. Create `apps/website-nextjs/`
2. Setup Next.js project
3. Create theme folders

### Phase 2: Migrate Modern Theme
1. Copy modern theme components
2. Convert to Next.js pages
3. Test modern theme

### Phase 3: Migrate Other Themes
1. Copy multicolor theme
2. Copy cleaning theme
3. Test all themes

### Phase 4: Production
1. Deploy Next.js app
2. Keep old React app as backup
3. Switch DNS/routing when ready

---

## File Locations Summary

```
Current Location:
apps/website/src/themes/modern/

Next.js Location:
apps/website-nextjs/themes/modern/
apps/website-nextjs/app/[theme]/
```

---

## Recommendation

**Use Option 1: Single Next.js Project**

- ✅ Best for scalability
- ✅ Easy to maintain
- ✅ Single deployment
- ✅ Shared code
- ✅ Future-proof

**Folder Location:**
```
apps/website-nextjs/
```

**Start Command:**
```bash
cd apps
npx create-next-app@latest website-nextjs --typescript --tailwind --app
```

Is structure se aap easily multiple themes add kar sakte hain! 🚀


