# Next.js Migration Guide - Modern Theme

## Overview
This guide will help you convert the modern theme from React (Vite) to Next.js for better SEO and performance.

---

## Step 1: Create Next.js Project Structure

### 1.1 Create new Next.js app (in a separate folder first for testing)

```bash
cd apps/website/src/themes/modern
npx create-next-app@latest nextjs-modern --typescript --tailwind --app --no-src-dir
```

### 1.2 Install Required Dependencies

```bash
cd nextjs-modern
npm install axios lucide-react react-helmet-async @tanstack/react-query
npm install @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu
# ... (all other @radix-ui packages you're using)
```

---

## Step 2: Setup Next.js Configuration

### 2.1 Create `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'your-api-domain.com'],
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.VITE_PROJECT_URL || 'http://localhost:3000',
    NEXT_PUBLIC_PROJECT_ID: process.env.VITE_PROJECT_ID,
  },
  // Enable experimental features if needed
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

### 2.2 Update `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 3: Copy Components (No Changes Needed!)

### 3.1 Copy Components Folder
```bash
# Components folder can be copied as-is
cp -r components/ ../nextjs-modern/components/
cp -r contexts/ ../nextjs-modern/contexts/
cp -r hooks/ ../nextjs-modern/hooks/
cp -r lib/ ../nextjs-modern/lib/
cp -r utils/ ../nextjs-modern/utils/
```

**Note:** Components don't need changes! They're pure React components.

---

## Step 4: Create Next.js App Router Structure

### 4.1 Create App Directory Structure

```
nextjs-modern/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (Index.tsx)
│   ├── about/
│   │   └── page.tsx        # About page
│   ├── services/
│   │   ├── page.tsx        # Services page
│   │   └── drain-cleaning/
│   │       └── page.tsx    # Drain cleaning page
│   ├── areas/
│   │   ├── page.tsx        # Areas list
│   │   └── [areaName]/
│   │       └── page.tsx    # Area detail
│   └── contact/
│       └── page.tsx        # Contact page
```

---

## Step 5: Create Root Layout (`app/layout.tsx`)

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/index.css'

const queryClient = new QueryClient()

export const metadata = {
  title: 'Modern Theme - Next.js',
  description: 'Modern theme converted to Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

## Step 6: Convert Home Page (`app/page.tsx`)

### 6.1 Create Server Component for Data Fetching

```typescript
// app/page.tsx
import { Metadata } from 'next'
import HomePageClient from './HomePageClient'
import { httpFile } from '@/config'

// Server-side data fetching
async function getHomePageData() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'default'
  
  try {
    const { data } = await httpFile.post('/webapp/v1/my_site', {
      projectId,
      pageType: 'home',
      reqFrom: 'Hero'
    })
    return data
  } catch (error) {
    console.error('Error fetching home page data:', error)
    return null
  }
}

// Server-side SEO metadata
export async function generateMetadata(): Promise<Metadata> {
  // Fetch SEO data
  const seoData = await getSEOData('/home')
  
  return {
    title: seoData?.meta_title || 'Home Page',
    description: seoData?.meta_description || 'Home page description',
    keywords: seoData?.meta_keywords || '',
  }
}

export default async function HomePage() {
  const pageData = await getHomePageData()
  
  return <HomePageClient initialData={pageData} />
}
```

### 6.2 Create Client Component (`app/HomePageClient.tsx`)

```typescript
'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import AboutSection from '@/components/AboutSection'
import ServicesSection from '@/components/ServicesSection'
import Footer from '@/components/Footer'
// ... other imports

export default function HomePageClient({ initialData }: { initialData: any }) {
  // Use initialData from server, or fetch on client if needed
  const [data, setData] = useState(initialData)
  
  // Client-side logic here
  // Most of your existing Index.tsx logic goes here
  
  return (
    <>
      <Header />
      <HeroSection data={data} />
      <AboutSection />
      <ServicesSection />
      {/* ... other sections */}
      <Footer />
    </>
  )
}
```

---

## Step 7: Update Config for Next.js

### 7.1 Create `config.ts` (instead of config.js)

```typescript
import axios from 'axios'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const http = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export const httpFile = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 60000,
})

// ... other axios instances
```

---

## Step 8: Update ThemeContext for Next.js

### 8.1 Make ThemeContext Client Component

```typescript
'use client' // Add this at top

import React, { createContext, useContext, useEffect, useState } from 'react'

// ... rest of your ThemeContext code stays the same
```

---

## Step 9: Update Routing

### 9.1 Remove React Router
- Remove `react-router-dom` imports
- Remove `<BrowserRouter>`, `<Routes>`, `<Route>` components
- Use Next.js file-based routing instead

### 9.2 Update Navigation Links

**Before (React Router):**
```typescript
import { Link } from 'react-router-dom'
<Link to="/about">About</Link>
```

**After (Next.js):**
```typescript
import Link from 'next/link'
<Link href="/about">About</Link>
```

### 9.3 Update useNavigate

**Before:**
```typescript
const navigate = useNavigate()
navigate('/contact')
```

**After:**
```typescript
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/contact')
```

---

## Step 10: Update SEO Implementation

### 10.1 Remove React Helmet

**Before:**
```typescript
import { Helmet } from 'react-helmet-async'
<Helmet>
  <title>{seoData.meta_title}</title>
</Helmet>
```

**After (Server Component):**
```typescript
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Page Title',
    description: 'Page description',
  }
}
```

**After (Client Component):**
```typescript
'use client'
import { useEffect } from 'react'

useEffect(() => {
  document.title = 'Page Title'
}, [])
```

---

## Step 11: Update Environment Variables

### 11.1 Create `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

**Note:** Next.js requires `NEXT_PUBLIC_` prefix for client-side variables.

---

## Step 12: Update Imports

### 12.1 Path Aliases
- Update `@/` imports to match Next.js structure
- Update relative imports if needed

### 12.2 Remove Vite-specific imports
- Remove `import.meta.env` → Use `process.env.NEXT_PUBLIC_*`
- Remove Vite plugin imports

---

## Step 13: Copy Styles

### 13.1 Copy CSS Files
```bash
cp index.css ../nextjs-modern/app/globals.css
# Update imports in globals.css if needed
```

### 13.2 Update Tailwind Config
- Copy `tailwind.config.js` if exists
- Update content paths for Next.js structure

---

## Step 14: Test Each Page

### 14.1 Test Checklist
- [ ] Home page loads
- [ ] Data fetching works
- [ ] SEO metadata is correct
- [ ] Navigation works
- [ ] Theme switching works
- [ ] All components render
- [ ] API calls work
- [ ] Images load

---

## Step 15: Deployment

### 15.1 Build Command
```bash
npm run build
```

### 15.2 Start Production Server
```bash
npm start
```

### 15.3 Deploy Options
- Vercel (recommended for Next.js)
- Netlify
- Self-hosted (Node.js server required for SSR)

---

## Migration Checklist

- [ ] Step 1: Project setup
- [ ] Step 2: Configuration files
- [ ] Step 3: Copy components
- [ ] Step 4: Create app directory
- [ ] Step 5: Create layout
- [ ] Step 6: Convert home page
- [ ] Step 7: Update config
- [ ] Step 8: Update ThemeContext
- [ ] Step 9: Update routing
- [ ] Step 10: Update SEO
- [ ] Step 11: Environment variables
- [ ] Step 12: Update imports
- [ ] Step 13: Copy styles
- [ ] Step 14: Test pages
- [ ] Step 15: Deploy

---

## Key Differences Summary

| Feature | React (Current) | Next.js |
|---------|----------------|---------|
| Routing | react-router-dom | File-based routing |
| Data Fetching | useEffect + API | getServerSideProps/getStaticProps |
| SEO | React Helmet (client) | Metadata API (server) |
| Environment | import.meta.env | process.env.NEXT_PUBLIC_* |
| Navigation | useNavigate | useRouter from next/navigation |
| Links | Link from react-router | Link from next/link |

---

## Need Help?

If you encounter issues during migration:
1. Check Next.js documentation
2. Verify all imports are correct
3. Ensure client components have 'use client' directive
4. Check server/client component boundaries

Good luck with the migration! 🚀


