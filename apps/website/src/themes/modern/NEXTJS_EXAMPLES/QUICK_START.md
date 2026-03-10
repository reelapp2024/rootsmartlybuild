# Quick Start - Next.js Migration

## Step-by-Step Commands

### 1. Create Next.js Project

```bash
# Navigate to themes folder
cd apps/website/src/themes/modern

# Create Next.js app
npx create-next-app@latest nextjs-modern --typescript --tailwind --app --no-src-dir --yes

# Navigate to new project
cd nextjs-modern
```

### 2. Install Dependencies

```bash
# Install existing dependencies
npm install axios lucide-react react-helmet-async @tanstack/react-query

# Install Radix UI components (if not already installed)
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip

# Install form libraries
npm install react-hook-form @hookform/resolvers zod

# Install other utilities
npm install class-variance-authority clsx tailwind-merge date-fns
```

### 3. Copy Files

```bash
# From nextjs-modern directory
# Copy components (no changes needed!)
cp -r ../components ./components
cp -r ../contexts ./contexts
cp -r ../hooks ./hooks
cp -r ../lib ./lib
cp -r ../utils ./utils

# Copy styles
cp ../index.css ./app/globals.css
```

### 4. Create Configuration Files

```bash
# Copy example config files
cp NEXTJS_EXAMPLES/next-config-example.js ./next.config.js
cp NEXTJS_EXAMPLES/config-nextjs-example.ts ./config.ts
```

### 5. Create App Structure

```bash
# Create app directory structure
mkdir -p app/about
mkdir -p app/services/drain-cleaning
mkdir -p app/areas/\[areaName\]
mkdir -p app/contact
```

### 6. Create Root Layout

```bash
# Copy layout example
cp NEXTJS_EXAMPLES/app-layout-example.tsx ./app/layout.tsx
```

### 7. Create Home Page

```bash
# Copy home page examples
cp NEXTJS_EXAMPLES/home-page-example.tsx ./app/page.tsx
cp NEXTJS_EXAMPLES/home-page-client-example.tsx ./app/HomePageClient.tsx
```

### 8. Setup Environment Variables

```bash
# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_ID=your-project-id
EOF
```

### 9. Update ThemeContext

Add `'use client'` directive at the top of:
- `contexts/ThemeContext.tsx`
- All components that use hooks or client-side features

### 10. Update All Components

For each component that uses:
- `useState`, `useEffect`, `useRouter`, etc. → Add `'use client'` at top
- `Link` from react-router → Change to `Link` from `next/link`
- `useNavigate` → Change to `useRouter` from `next/navigation`
- `useParams` → Use Next.js params prop instead

### 11. Test

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### 12. Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## File Structure After Migration

```
nextjs-modern/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                 # Home page
│   ├── HomePageClient.tsx       # Client component
│   ├── globals.css              # Global styles
│   ├── about/
│   │   └── page.tsx
│   ├── services/
│   │   ├── page.tsx
│   │   └── drain-cleaning/
│   │       └── page.tsx
│   ├── areas/
│   │   ├── page.tsx
│   │   └── [areaName]/
│   │       └── page.tsx
│   └── contact/
│       └── page.tsx
├── components/                  # Copied as-is
├── contexts/                    # Copied as-is
├── hooks/                       # Copied as-is
├── lib/                         # Copied as-is
├── utils/                       # Copied as-is
├── config.ts                    # Updated for Next.js
├── next.config.js               # Next.js config
├── package.json
├── tsconfig.json
└── .env.local                   # Environment variables
```

---

## Common Issues & Solutions

### Issue 1: "use client" directive missing
**Solution:** Add `'use client'` at the top of any component using hooks

### Issue 2: Import errors
**Solution:** Update path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue 3: Environment variables not working
**Solution:** Use `NEXT_PUBLIC_` prefix for client-side variables

### Issue 4: Routing not working
**Solution:** Use Next.js `Link` and `useRouter` instead of react-router

### Issue 5: Images not loading
**Solution:** Add image domains to `next.config.js` images.domains array

---

## Next Steps

1. ✅ Complete all steps above
2. ✅ Test each page
3. ✅ Verify SEO metadata
4. ✅ Check all API calls work
5. ✅ Test navigation
6. ✅ Deploy to production

Good luck! 🚀


