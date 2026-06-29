# Dynamic Content Testing - Quick Guide

## ✅ Testing Steps

### 1. Backend Start करें
```bash
cd aiwebbuilder/aibackend
npm start
# या node ai.js
```

**Verify:** Browser में open करें:
- `http://localhost:1111/api/monorepo/hero` 
- Response में title: "Best smm panel in the world!" दिखना चाहिए

### 2. Site App में Test करें (Existing Template)

```bash
cd aiwebbuilder/apps/site
npm run dev
# या pnpm dev
```

**Test:**
1. Browser में site app open करें
2. HeroWithBackground component automatically API से data fetch करेगा
3. Title: "Best smm panel in the world!" दिखना चाहिए
4. Description: "Fully flexible smm panel..." दिखना चाहिए
5. Background image load होना चाहिए

**Live Update Test:**
1. `aibackend/controllers/monorepoController.js` में title change करें
2. Backend restart करें
3. Site app refresh करें
4. नया title दिखना चाहिए

### 3. Studio Builder में Test करें (New Element APIs)

```bash
cd aiwebbuilder/apps/smartlybuildadmin
pnpm dev
```

**Test Steps:**

#### Heading Element:
1. Builder open करें: `http://localhost:5173/builder`
2. Templates dropdown से कोई template add करें
3. Heading element add करें
4. Element select करें
5. **Advanced Tab** में जाएं
6. **API Configuration** section में:
   - ✅ "Enable Dynamic Content" toggle ON करें
   - API URL: `http://localhost:1111/api/monorepo/heading-content`
   - Save करें
7. Heading में "Dynamic Heading from API" दिखना चाहिए

#### Auto-Refresh Test:
1. Element settings में **Auto Refresh Interval** = `5000` (5 seconds) set करें
2. `monorepoController.js` में heading content change करें
3. Backend restart करें
4. 5 seconds wait करें
5. Content automatically update होना चाहिए

### 4. API Endpoints Test

Browser में directly test करें:

```
✅ GET http://localhost:1111/api/monorepo/hero
✅ GET http://localhost:1111/api/monorepo/heading-content
✅ GET http://localhost:1111/api/monorepo/text-content
✅ GET http://localhost:1111/api/monorepo/description-content
✅ GET http://localhost:1111/api/monorepo/button-content
```

### 5. Live Update Test Script

Backend में change करके test करें:

**File:** `aibackend/controllers/monorepoController.js`

```javascript
// Line 8 - Title change करें
title: "TEST - Updated Title!",  // Change this

// Line 109 - Heading content change करें  
heading: 'TEST - Updated Heading!',  // Change this
```

**Result:**
- Site app refresh करें → Hero title update होगा
- Builder में element refresh करें → Heading update होगा

### 6. Expected Results

#### Site App (HeroWithBackground):
- ✅ Title: "Best smm panel in the world!"
- ✅ Description: "Fully flexible smm panel..."
- ✅ Background image visible

#### Studio Builder (New Elements):
- ✅ Heading: "Dynamic Heading from API"
- ✅ Text: "Dynamic text content from API"
- ✅ Description: "Dynamic description content from API"
- ✅ Button: "Dynamic Button Text"

### 7. Troubleshooting

**Problem:** API not responding
- ✅ Check backend is running on port 1111
- ✅ Check `http://localhost:1111/api/monorepo/hero` in browser

**Problem:** Content not updating
- ✅ Check "Enable Dynamic Content" is ON
- ✅ Check API URL is correct
- ✅ Check browser console for errors
- ✅ Check Network tab for API calls

**Problem:** CORS error
- ✅ Backend में CORS enable है (line 16: `cors()`)

### 8. Quick Test Commands

```bash
# Terminal 1 - Backend
cd aiwebbuilder/aibackend
npm start

# Terminal 2 - Site App (Existing Template Test)
cd aiwebbuilder/apps/site
npm run dev

# Terminal 3 - Studio Builder (New Element Test)
cd aiwebbuilder/apps/smartlybuildadmin
pnpm dev
```

**Test URLs:**
- Site App: `http://localhost:5173` (check port)
- Studio Builder: `http://localhost:5173/builder`
- API Test: `http://localhost:1111/api/monorepo/hero`


