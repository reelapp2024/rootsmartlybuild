# Environment Variables Setup Guide

## Issue
The Next.js website was using hardcoded `localhost:3000` URLs, which don't work in production. 

## Solution
All API URLs now use environment variables. You **must** set these in production.

## Required Environment Variables

### 1. `NEXT_PUBLIC_API_URL` (REQUIRED for production)
This is your backend API URL.

**Examples:**
- Local development: `http://localhost:3000`
- Production (same server): `http://localhost:3000` or `http://127.0.0.1:3000`
- Production (different server): `http://your-server-ip:3000`
- Production (domain): `https://api.yoursite.com`

**How to set:**
1. Create a `.env.local` file in `apps/website-next/` directory
2. Add: `NEXT_PUBLIC_API_URL=http://your-backend-url:3000`
3. Restart your Next.js development server

### 2. `NEXT_PUBLIC_PROJECT_ID` (REQUIRED)
Your project ID from the backend/admin panel.

**How to set:**
```
NEXT_PUBLIC_PROJECT_ID=your-project-id-here
```

### 3. `NEXT_PUBLIC_SITE_URL` (Optional)
Your website URL (for SEO metadata). If not set, will use `NEXT_PUBLIC_API_URL`.

**Example:**
```
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

## Setup Instructions

### For Local Development
1. Create `apps/website-next/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

2. Start your backend server on port 3000
3. Start Next.js: `npm run dev`

### For Production Deployment

#### Option 1: Using .env.local (not recommended for production)
Create `.env.local` with production values:
```env
NEXT_PUBLIC_API_URL=http://your-production-api-url:3000
NEXT_PUBLIC_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

#### Option 2: Using System Environment Variables (Recommended)
Set environment variables in your deployment platform:

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `http://your-api-url:3000`
   - `NEXT_PUBLIC_PROJECT_ID` = `your-project-id`

**For Docker:**
```dockerfile
ENV NEXT_PUBLIC_API_URL=http://backend:3000
ENV NEXT_PUBLIC_PROJECT_ID=your-project-id
```

**For PM2/Node:**
```bash
export NEXT_PUBLIC_API_URL=http://your-api-url:3000
export NEXT_PUBLIC_PROJECT_ID=your-project-id
```

**For Nginx/Server:**
In your startup script:
```bash
export NEXT_PUBLIC_API_URL=http://localhost:3000
export NEXT_PUBLIC_PROJECT_ID=your-project-id
npm start
```

## Troubleshooting

### API calls failing with "network error" or "CORS error"
- Check if `NEXT_PUBLIC_API_URL` is set correctly
- Verify your backend is accessible at that URL
- Check backend CORS settings allow your Next.js domain

### Still seeing localhost:3000 in production
- Make sure you set `NEXT_PUBLIC_API_URL` before building
- Next.js embeds env vars at build time, so rebuild after changing `.env.local`
- For production builds: `npm run build` (env vars must be set before this)

### Where to check current API URL
The API URL is configured in:
- `apps/website-next/config.ts` - Main API configuration
- `apps/website-next/app/layout.tsx` - Site metadata URL

## Notes
- All `NEXT_PUBLIC_*` variables are exposed to the browser (they're embedded in the bundle)
- Never put secrets in `NEXT_PUBLIC_*` variables
- Changes to `.env.local` require server restart
- For production, environment variables must be set before running `npm run build`

