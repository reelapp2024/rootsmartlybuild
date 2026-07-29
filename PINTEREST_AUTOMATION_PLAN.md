# Pinterest Content Automation — COMPLETE PLAN (rootsmartlybuild)

**Goal:** Project-first AI content business platform. Pinterest = pehla channel.
Future: Google SEO / Facebook / Instagram / YouTube / Email — sab isi Project ke andar.
**Approach:** rootsmartlybuild ko EXTEND karna hai (content engine, image engines,
queues, Project model, aur Pinterest ka half-built code already hai). Scratch se NAHI.

---

# PART A — Jo PEHLE SE hai (audit)

## A.1 Pinterest (half-built ✅)
- **Controller** `backend/controller/PinterestController.js` (1521 lines):
  `createProject`, `createCategory/fetch/update/delete`, `generatePinTitles`,
  `generatePinterestBlogs`, `generateNanoBananaImages`, `make_collage`,
  `add_numbering`, `get_variants`
- **Models:** `pinterestProject` (userId, categoryId, niche, font, websiteName),
  `pinterestCategory`, `pinterestPin` (title/desc/image/projectId), `pinterestWebsitePin`
- **Routes:** `routes/admin_v1.js` → `/pinterest/*`

## A.2 Project + Content engine (reuse ✅)
- **Project:** `models/userProjects.js` (rich: name, country, categories, niche, keywords…)
- **Article AI:** `AiblogsControllerV2`, `queue/aiblogsQueue.js`, `sections/aiblogs/*`
- **Images:** `imageengines/` (flux, gemini/nano-banana, leonardo, freepik, cloudflare)
- **SEO:** `seoprompts/`, `services/pageSeoService.js` (meta, schema, slug, canonical)
- **Queues:** Redis + Bull (async jobs)
- **Website:** geniebuild + sitenextjs (publish target) + themes/sections
- **Credits:** `CreditWallet`, `CreditTransaction`, `CreditPackage` (billing ready)
- **Admin panel pages:** CreateProject, Projects, ProjectDashboard, Calendar,
  BlogPosts, CreateBlogPostAi, ManageCredits, Analytics, Notifications

## A.3 Naya banana (bulk)
Onboarding wizard, AI-analysis scoring, keyword-type engine, silo/cluster map,
365-day calendar, **Pinterest API publishing (OAuth + create/schedule)**, Pinterest
analytics, AI-suggestions cron, auto-refresh cron, monetization suggest, clone/scale.

---

# PART B — ARCHITECTURE (Project = root)

```
Project  (extend pinterestProject/userProjects → unified "Project")
  ├─ goal        pinterest_traffic | ads | amazon | digital | local | brand | email
  ├─ country · language · category · niche
  ├─ aiResearch  { competition, monthlySearches, pinterestPotential,
  │                affiliatePotential, adsPotential, digitalPotential,
  │                difficulty, seasonality, overallScore }
  ├─ blueprint   { name, logo, colors[], fonts[], categories[], subCats[],
  │                urlStructure, homepageLayout, nav, footer, legalPages }
  ├─ websiteId   → geniebuild/sitenextjs site
  ├─ keywords[]  { text, type: main|longtail|question|pinterest|seasonal, volume, kd }
  ├─ clusters[]  { name, articleCount, articleIds[], internalLinks[] }
  ├─ calendar    { entries[]: { date, articleId, status } }   365-day
  ├─ articles[]  (blog engine + Pinterest-intent meta)
  ├─ pins[]      (pinterestPin — per article, 8-15 styles)
  ├─ pinterestAccount { oauthToken, boards[], connected }
  └─ channels{}  ← FUTURE: google, facebook, instagram, youtube, email
```

**DB models to ADD / EXTEND:**
| Model | Action | Key fields |
|---|---|---|
| `Project` (rename/extend pinterestProject) | EXTEND | goal, country, language, category, niche, aiResearch, blueprint, websiteId, status, channels |
| `Keyword` | NEW | projectId, text, type, volume, difficulty, source |
| `Cluster` | NEW | projectId, name, parentNiche, articleIds[], internalLinkMap |
| `CalendarEntry` | NEW | projectId, date, articleId, status, channel |
| `Article` (use blogs) | EXTEND | + pinterestIntent, clusterId, affiliatePlacement, schemaType |
| `pinterestPin` | EXTEND | + articleId, style, boardId, pinTitle, pinDesc, hashtags, published, scheduledAt, pinterestPinId |
| `PinterestAccount` | NEW | userId, projectId, oauthToken, refreshToken, boards[], expiresAt |
| `AiSuggestion` | NEW | projectId, type, payload, date, dismissed |
| `Analytics` | NEW | projectId, date, metrics{} (pins, clicks, visitors, revenue, ctr, rpm) |

---

# PART C — 16 PHASES (detailed)

### PHASE 1 — Onboarding Wizard  [admin UI + endpoints]
**Screen:** `Create Project` → 6-step stepper (reuse `CreateProject.tsx` pattern)
1. **Goal** (7 cards) → `project.goal`
2. **Country** (USA/CA/UK/AU/Global) → SEO + language default
3. **Language** (EN/ES/DE/FR/HI)
4. **Category** (grid: Home Decor/Recipes/Gardening/Fitness/Travel/Fashion/AI/Finance/Art/DIY)
5. **Niche** (category → sub-niches; e.g. Home Decor → Bedroom/Living/Bath/Kitchen…)
6. **AI Analysis** (auto, spinner→scores): Competition, Monthly Searches, Pinterest/
   Affiliate/Ads/Digital Potential, Difficulty, Seasonality, **Overall Score**
   → *data:* GPT prompt (est.) + optional keyword API. Save `project.aiResearch`.
**Build:** stepper UI + `POST /project/analyze-niche` (AI scoring) + `POST /project/create`
**Reuse:** existing project create, credit deduct
**New:** goal/country/language/niche schema, AI-analysis prompt + scoring endpoint

### PHASE 2 — Website Planning (Blueprint)
**Screen:** AI blueprint preview → Approve
- AI generates: website name, logo, color palette, fonts, categories, sub-cats,
  URL structure, homepage layout, nav, footer, About/Contact/Privacy/Terms/Disclaimer
- User **Preview** (geniebuild) → **Approve** → website create
**Build:** `POST /project/generate-blueprint` (AI) + preview screen
**Reuse:** website/section generation engine (already builds full sites), theme system
**New:** blueprint schema + approve→create bridge

### PHASE 3 — Keyword Engine
**Screen:** Keyword Research page (per niche)
- AI generates: 100 main + 500 long-tail + 100 question + 100 Pinterest + 100 seasonal
- Save `Keyword[]` (tagged by type). Table + filter by type.
**Build:** `POST /project/generate-keywords` (batched AI) → Keyword model
**Reuse:** AI prompt infra, queue for bulk
**New:** Keyword model, type tagging, (optional) real-volume API

### PHASE 4 — Content Cluster (Silo)
**Screen:** Topic Generator — visual silo map
- niche → clusters → article counts (Bedroom Colors→20, Storage→25, Small→30…)
- internal-link map (pillar ↔ cluster ↔ articles)
**Build:** `POST /project/generate-clusters` (AI) → Cluster model + link map
**New:** Cluster model, silo/link-graph logic

### PHASE 5 — Content Calendar
**Screen:** Calendar page (reuse `Calendar.tsx`)
- 365-day schedule: Week 1→7 articles, Week 2→8… (spread clusters)
- drag/edit dates, status per entry
**Build:** `POST /project/generate-calendar` → CalendarEntry[]
**Reuse:** existing Calendar UI
**New:** CalendarEntry model + scheduler logic

### PHASE 6 — Article Generator  (per calendar entry)
**Pre-decide (AI):** search intent, Pinterest intent, competition, word count,
affiliate placement, internal/external links, FAQs, schema, images-needed → **then write**
**Build:** extend `AiblogsControllerV2` + `aiblogsQueue` with Pinterest-intent + cluster links
**Reuse:** ✅ article engine mostly done — add intent/affiliate/cluster-link layer

### PHASE 7 — Image Generator  (per article)
Featured + Pinterest images + Infographic + Comparison + Checklist + Quote + Step-by-step
**Build:** extend image pipeline; templates per type (collage/numbering already exist ✅)
**Reuse:** ✅ image engines + `generateNanoBananaImages`, `make_collage`, `add_numbering`

### PHASE 8 — Pinterest Engine 🔴 (Pinterest API — riskiest, do feasibility FIRST)
Per published article → 8-15 pins: Vertical / Minimal / Luxury / Text-heavy /
Image-heavy / Infographic / Carousel / Idea
**Build:** pin-style templates (some done) + **Pinterest OAuth connect** + **create/
schedule via official API** + board management
**Reuse:** ✅ pin image gen (collage/numbering/variants), `generatePinTitles`
**New (HARD):** Pinterest OAuth, PinterestAccount model, create-pin API, board sync,
app-review compliance

### PHASE 9 — SEO Engine
Meta title/desc, slug, alt, internal links, schema, canonical, OG, Twitter cards
**Reuse:** ✅ mostly done (`pageSeoService`, `seoprompts`) — wire per-article

### PHASE 10 — Pinterest SEO
Pin title/desc, hashtags, keywords, board suggestion, alt, filename, rich-pin data
**Build:** AI pin-SEO prompt per pin + board-match logic
**Reuse:** `generatePinTitles`

### PHASE 11 — Publishing
Modes: Publish Now / Schedule / Draft / Manual Approval / Fully Automatic
**Build:** publish state machine per article+pins; scheduler (Bull delayed jobs)
**Reuse:** queues, website publish

### PHASE 12 — Analytics (Dashboard)
Articles, Pins, Pinterest clicks, visitors, top keywords/pins, revenue, CTR, RPM, bounce
**Build:** Analytics model + Pinterest Analytics API pull + GA/site metrics
**Reuse:** ✅ Analytics page + `ga_*` patterns (from wptaskify-style)

### PHASE 13 — AI Suggestions (daily cron)
Trending keywords, articles-to-update, low-CTR pins, expand-topic, thin-content, add-links
**Build:** daily cron → AiSuggestion[] → dashboard cards
**Reuse:** `crons/`, AI infra

### PHASE 14 — Auto Refresh (90-day cron)
Update article/images/pins/stats/SEO → republish
**Build:** 90-day cron per article → regen pipeline

### PHASE 15 — Monetization
AI suggests: Amazon products, digital products, lead magnet, email popup, ads, best affiliate links
**Reuse:** Amazon affiliate (roadmap), forms/lead engine (already in admin), ads placement

### PHASE 16 — Scaling / Clone
Clone website → change niche → regen content+pins → publish (5-min new site)
**Build:** project clone (deep-copy blueprint+website) + niche-swap regen

---

# PART D — ADMIN NAV (final)
```
Dashboard
├── AI Projects          Phase 1-2   (CreateProject + Blueprint)
├── Websites             Settings/Categories/Branding/SEO/Monetization
├── Keyword Research     Phase 3
├── Topic Generator      Phase 4  (silo map)
├── Content Calendar     Phase 5
├── AI Writer            Phase 6
├── AI Images            Phase 7
├── Pinterest Studio     Phase 8,10,11  (Pin Gen/Templates/Boards/Scheduler/Analytics)
├── Media Library
├── SEO Center           Phase 9
├── Analytics            Phase 12
├── AI Suggestions       Phase 13
└── Settings
```

---

# PART E — RISKS + DECISIONS (pehle finalize karo)

1. **Pinterest API** = app review (weeks). Pin create/schedule sirf official API
   (scraping = permanent ban). Har user ka **OAuth connect** chahiye.
   → **Phase 8 se pehle feasibility test karo** (jaise Amazon/Flipkart roadmap).
2. **AI cost** = 800+ articles + 7 images/article + 8-15 pins/article per project.
   → Billing: `CreditWallet` (already hai) — credit-per-action pricing decide karo.
   Ya BYO-AI-key (user apni key).
3. **Keyword real volume** = paid API (Semrush/keyword) ya AI-estimate. Decide.
4. **Queue scale** = 365-day × N projects = heavy. Bull hai — priority + rate-limit
   plan chahiye (Pinterest API daily limits bhi).
5. **Storage** = images/pins per article × many → S3/CDN plan.

---

# PART F — BUILD ORDER (incremental, har step shippable)

| # | Milestone | Phases | Effort | Notes |
|---|---|---|---|---|
| 1 | **Project schema extend** | — | S | goal/country/lang/niche/aiResearch/blueprint/channels |
| 2 | **Onboarding wizard** | 1 | M | 6-step + AI-analysis endpoint |
| 3 | **Blueprint + Website create** | 2 | M | reuse website engine — *ships as "AI website generator" alone* |
| 4 | **Keyword + Cluster + Calendar** | 3-5 | M | AI gen + models + 3 pages |
| 5 | **Article + Image + SEO** | 6,7,9 | M | reuse engines + Pinterest-intent layer |
| 6 | **Pinterest feasibility → Pin Engine** | 8,10,11 | L🔴 | OAuth + API + publishing (riskiest) |
| 7 | **Analytics + Suggestions + Refresh** | 12-14 | M | crons + dashboards |
| 8 | **Monetization + Scaling** | 15-16 | M | affiliate + clone |

**Key:** Milestone 1-5 (bina Pinterest) already ek complete "AI content website
generator" hai — user value milta hai. Pinterest (M6) layer baad me, jab API review clear ho.

---

# PART G — FUTURE (same Project, extra channels)
Project architecture ka fayda: `channels{}` me plug —
Google SEO · Facebook · Instagram · LinkedIn · YouTube · Email marketing.
User ko alag tools nahi chahiye → ek complete AI content business platform.
