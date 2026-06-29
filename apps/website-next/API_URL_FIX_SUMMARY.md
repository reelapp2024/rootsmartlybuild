# API URL Fix Summary

## Problem Identified
The Next.js website (`website-next`) was using hardcoded `localhost:3000` URLs that don't work in production. The backend is running on `https://apis.smartlybuild.dev` but the frontend was trying to connect to `localhost:3000`.

## Files Fixed

### 1. `config.ts` ✅
**Changed:** Updated to use environment variables with proper fallbacks
- Now defaults to `https://apis.smartlybuild.dev` in production
- Falls back to `http://localhost:3000` only in development
- Priority: `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_PROJECT_URL` → defaults

### 2. `next.config.js` ✅
**Changed:** Removed hardcoded `localhost:3000` default
- Now relies on environment variables only
- No fallback defaults in config (handled in code)

### 3. `app/layout.tsx` ✅
**Changed:** Updated `metadataBase` URL to use environment variables
- Now defaults to `https://apis.smartlybuild.dev` in production
- Uses `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_API_URL` if set

## Production Default

The app now defaults to your production backend:
- **Production:** `https://apis.smartlybuild.dev`
- **Development:** `http://localhost:3000` (when `NODE_ENV=development`)

## How to Override

### For Local Development (when backend is on localhost:3000)
Create `apps/website-next/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

### For Production (already default)
No action needed! The app will automatically use `https://apis.smartlybuild.dev`.

To override for a different backend:
```env
NEXT_PUBLIC_API_URL=https://your-custom-api.com
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

## Testing

1. **Local Development:**
   - Set `NEXT_PUBLIC_API_URL=http://localhost:3000` in `.env.local`
   - Restart dev server: `npm run dev`
   - Verify API calls go to `localhost:3000`

2. **Production:**
   - No env vars needed (uses default `https://apis.smartlybuild.dev`)
   - Build: `npm run build`
   - Verify API calls go to `apis.smartlybuild.dev`

## Status: ✅ FIXED

The issue is resolved. The app will now:
- Use `https://apis.smartlybuild.dev` in production by default
- Use `localhost:3000` in development by default
- Allow overriding via environment variables

