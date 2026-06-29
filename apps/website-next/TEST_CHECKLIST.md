# 🧪 Test Checklist - Next.js Migration

## ✅ Pre-Test Fixes Completed

1. ✅ All `import.meta.env` → `process.env.NEXT_PUBLIC_*` updated
2. ✅ All `react-router-dom` → `next/link` and `next/navigation` updated
3. ✅ All `config.js` → `config` imports updated
4. ✅ Added `'use client'` directive to all client components
5. ✅ Removed React Helmet (will use Next.js Metadata API)

---

## 🧪 Testing Steps

### Step 1: Install Dependencies
```bash
cd apps/website-nextjs
npm install
```

### Step 2: Create Environment File
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_PROJECT_URL=http://localhost:3000
```

### Step 3: Check for Missing Dependencies
```bash
npm run build
```

This will show if any packages are missing.

### Step 4: Run Dev Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## ✅ What to Test

### 1. Home Page (`/`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] API data fetches (check Network tab)
- [ ] Theme colors work
- [ ] Navigation links work
- [ ] All sections render (About, Services, Testimonials, FAQ, etc.)

### 2. Components
- [ ] Header renders and navigation works
- [ ] Footer renders and links work
- [ ] Theme switching works (if implemented)
- [ ] All API calls succeed
- [ ] No console errors

### 3. API Integration
- [ ] Check browser Network tab - all API calls should succeed
- [ ] Data displays correctly from API
- [ ] No CORS errors
- [ ] Environment variables are loaded

### 4. Build Test
```bash
npm run build
```
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies

---

## 🐛 Common Issues to Check

### Issue 1: Missing Radix UI Packages
If you see errors about `@radix-ui/*` packages:
```bash
npm install @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-toast
```

### Issue 2: Missing Hooks
If hooks are missing, check:
- `hooks/useSEO.js` exists
- `hooks/useHeaderData.js` exists (if used)
- `hooks/useFooterData.js` exists (if used)

### Issue 3: Missing Utils
Check if these exist:
- `themes/modern/utils/schemaGenerator.ts`
- `themes/modern/utils/seoUtils.ts`
- `themes/modern/extras/DynamicIcon.tsx`
- `themes/modern/extras/DynamicFAIcon.tsx`

### Issue 4: Environment Variables
Make sure `.env.local` has:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PROJECT_ID`
- `NEXT_PUBLIC_PROJECT_URL` (optional)

---

## 📝 Quick Test Commands

```bash
# 1. Install dependencies
npm install

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Run linter
npm run lint

# 4. Build (to check for errors)
npm run build

# 5. Run dev server
npm run dev
```

---

## 🎯 Expected Results

✅ **Success Indicators:**
- Home page loads at `http://localhost:3000`
- No console errors
- API calls succeed (check Network tab)
- All components render
- Navigation works
- Theme colors apply correctly

❌ **If Errors:**
- Check console for specific error messages
- Verify environment variables are set
- Check if API server is running
- Verify all dependencies are installed

---

## 📞 Next Steps After Testing

If everything works:
1. ✅ Continue with page conversions
2. ✅ Add remaining pages (About, Services, Contact, etc.)
3. ✅ Test each new page

If errors found:
1. Fix the errors
2. Re-test
3. Continue migration








