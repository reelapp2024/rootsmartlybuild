# Routing Changes: React Router → Next.js

## Navigation Links

### Before (React Router):
```typescript
import { Link } from 'react-router-dom'

<Link to="/about">About</Link>
<Link to="/services/drain-cleaning">Drain Cleaning</Link>
```

### After (Next.js):
```typescript
import Link from 'next/link'

<Link href="/about">About</Link>
<Link href="/services/drain-cleaning">Drain Cleaning</Link>
```

---

## Programmatic Navigation

### Before (React Router):
```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/contact')
navigate('/about', { replace: true })
```

### After (Next.js):
```typescript
'use client'
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/contact')
router.replace('/about')
router.back()
router.forward()
```

---

## Route Parameters

### Before (React Router):
```typescript
import { useParams } from 'react-router-dom'

const { areaName } = useParams()
```

### After (Next.js):
```typescript
// In app/areas/[areaName]/page.tsx
export default function AreaDetailPage({ params }: { params: { areaName: string } }) {
  const { areaName } = params
  // ...
}
```

---

## Query Parameters

### Before (React Router):
```typescript
import { useSearchParams } from 'react-router-dom'

const [searchParams] = useSearchParams()
const theme = searchParams.get('theme')
```

### After (Next.js):
```typescript
'use client'
import { useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const theme = searchParams.get('theme')
```

---

## Location/Pathname

### Before (React Router):
```typescript
import { useLocation } from 'react-router-dom'

const location = useLocation()
const pathname = location.pathname
```

### After (Next.js):
```typescript
'use client'
import { usePathname } from 'next/navigation'

const pathname = usePathname()
```

---

## File Structure Mapping

### React Router Structure:
```
pages/
  Index.tsx          → app/page.tsx
  About.tsx          → app/about/page.tsx
  Services.tsx       → app/services/page.tsx
  Contact.tsx        → app/contact/page.tsx
  Areas.tsx          → app/areas/page.tsx
  AreaDetail.tsx     → app/areas/[areaName]/page.tsx
  DrainCleaning.tsx  → app/services/drain-cleaning/page.tsx
```

### Next.js App Router Structure:
```
app/
  page.tsx                           # Home (/)
  about/
    page.tsx                         # About (/about)
  services/
    page.tsx                         # Services (/services)
    drain-cleaning/
      page.tsx                       # Drain Cleaning (/services/drain-cleaning)
  areas/
    page.tsx                         # Areas List (/areas)
    [areaName]/
      page.tsx                       # Area Detail (/areas/:areaName)
  contact/
    page.tsx                         # Contact (/contact)
```

---

## Dynamic Routes

### React Router:
```typescript
<Route path="/areas/:areaName" element={<AreaDetail />} />
```

### Next.js:
Create folder: `app/areas/[areaName]/page.tsx`
```typescript
export default function AreaDetailPage({ params }: { params: { areaName: string } }) {
  return <AreaDetail areaName={params.areaName} />
}
```

---

## Catch-All Routes

### React Router:
```typescript
<Route path="*" element={<NotFound />} />
```

### Next.js:
Create: `app/not-found.tsx`
```typescript
export default function NotFound() {
  return <div>404 - Page Not Found</div>
}
```

---

## Important Notes:

1. **All navigation components must be Client Components** (`'use client'`)
2. **File-based routing** - No need for `<Routes>` or `<Route>` components
3. **Server Components by default** - Pages are server components unless you add `'use client'`
4. **Link prefetching** - Next.js automatically prefetches linked pages
5. **No BrowserRouter needed** - Next.js handles routing automatically


