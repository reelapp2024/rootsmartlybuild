# Quick Test Guide - Existing Dynamic Template

## 🎯 HeroWithBackground Template Test

### Step 1: Backend Start करें
```bash
cd aiwebbuilder/aibackend
npm start
```

**Verify API:**
Browser में open करें: `http://localhost:1111/api/monorepo/hero`

Expected Response:
```json
{
  "backgroundImage": "https://images.unsplash.com/...",
  "title": "Best smm panel in the world!",
  "description": "Fully flexible smm panel...",
  "styles": { ... }
}
```

### Step 2: Site App Start करें
```bash
cd aiwebbuilder/apps/site
npm run dev
# या pnpm dev
```

### Step 3: Test करें

1. **Browser में site app open करें** (usually `http://localhost:5173`)
2. **HeroWithBackground component automatically:**
   - ✅ API से data fetch करेगा (`http://localhost:1111/api/monorepo/hero`)
   - ✅ Title show होगा: **"Best smm panel in the world!"**
   - ✅ Description show होगा: **"Fully flexible smm panel..."**
   - ✅ Background image load होगा

### Step 4: Live Update Test करें

1. **Backend file edit करें:**
   ```bash
   # File: aiwebbuilder/aibackend/controllers/monorepoController.js
   # Line 8 में title change करें:
   title: "TEST - Updated Title Live!",
   ```

2. **Backend restart करें:**
   ```bash
   # Ctrl+C to stop
   npm start
   ```

3. **Site app refresh करें:**
   - Browser में refresh (F5)
   - Title **"TEST - Updated Title Live!"** दिखना चाहिए
   - ✅ **Live update working!**

### Step 5: Console में Verify करें

Browser DevTools (F12) → Console में check करें:
- API call: `GET http://localhost:1111/api/monorepo/hero`
- Response: JSON data
- No errors

### Step 6: Network Tab में Check करें

Browser DevTools → Network Tab:
1. Site app refresh करें
2. `hero` request filter करें
3. Response में updated data दिखना चाहिए

## ✅ Expected Results

**Before Change:**
- Title: "Best smm panel in the world!"
- Description: "Fully flexible smm panel..."

**After Backend Change:**
- Title: "TEST - Updated Title Live!" (या जो आपने change किया)
- Description: Same या updated

## 🔄 Auto-Refresh Test (Optional)

अगर आप auto-refresh test करना चाहते हैं:

1. `HeroWithBackground.tsx` में `useEffect` update करें:
   ```tsx
   useEffect(() => {
     const fetchData = () => {
       fetch(HERO_API)
         .then(r => (r.ok ? r.json() : null))
         .then((data: ApiData | null) => setApi(data))
         .catch(() => {});
     };
     
     fetchData(); // Initial fetch
     const interval = setInterval(fetchData, 5000); // Every 5 seconds
     return () => clearInterval(interval);
   }, []);
   ```

2. Backend में change करें
3. 5 seconds wait करें
4. Content automatically update होगा

## 🐛 Troubleshooting

**API नहीं चल रहा?**
- ✅ Backend port check: `http://localhost:1111`
- ✅ Backend logs check करें
- ✅ CORS error check करें

**Content update नहीं हो रहा?**
- ✅ Backend restart किया?
- ✅ Browser cache clear किया?
- ✅ Network tab में API call check करें

**Component render नहीं हो रहा?**
- ✅ Site app console में errors check करें
- ✅ `HeroWithBackground` component import check करें


