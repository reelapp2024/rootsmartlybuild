# Section Variants — Tracking

Ye file har naye **section variant** ka record rakhti hai:
- Variant ka naam + file
- Kya **extra / naye elements** daale (jo original me nahi the)
- Kya abhi **static (hardcoded default)** hai jo **baad me backend se dynamic** karna hai

> Jab bhi koi cheez "static → dynamic" karni ho, is file me `⚠️ DYNAMIC PENDING` markers dhundo.

---

## 🎯 Hero — HeroNeon
**File:** `apps/geniebuild/components/sections/homepage/hero/HeroNeon.tsx`
**Reference:** saas-landing `HeroNext.tsx` (aurora + spotlight dark hero)
**Registered:** `sectionDiscovery.ts` (hero dark hai → `ALWAYS_LIGHT_VARIANTS` me NAHI)
**Element id prefix:** `h4-` (baaki hero variants ke saath content carry-over)

### ✅ Fully editable (builder elements)
- `h4-badge` — availability pill text (badge)
- `h4-title` — headline (heading; last word = accent + shimmer)
- `h4-desc` — subhead (text)
- `h4-btn1` — primary CTA (button)
- `h4-btn2` — secondary CTA (button)
- `h4-stat0/1/2-value` + `-label` — 3 stats (heading + text each) — **NEW editable**
- `h4-trust` — trust marquee = SINGLE `trust-strip` element (ek click → sidebar me saari items ek saath edit; TrustStripContentForm). Mirror copy sirf seamless scroll loop ke liye (editable nahi).

### 🎨 Dynamic colors (theme se — already dynamic)
- accent, bg (dark surface), text, border, button — sab `tc` (theme) se. Cyan/black hardcode NAHI.

### 🧩 Section-level editable (builder section controls se)
- **Background** — `s.backgroundColor` (section bg control) respect karta hai
- **Padding** — top/bottom/X, Tailwind class YA raw CSS ("32px") dono accept
- Primary CTA = filled (accent), Secondary CTA = `outline` variant (transparent + accent + border) → dono visually alag

### ⚠️ DYNAMIC PENDING (abhi static default, baad me backend se)
- **Stats (3)** — abhi `content.stats` se read, warna hardcoded defaults (`4.9★`, `1,200+`, `Same day`).
  → Backend `content.stats: [{value,label}]` bhejega to auto dynamic.
- **Trust items** — abhi `content.trustStripItems` se read, warna hardcoded defaults (Fully insured, Licensed, etc.).
  → Backend `content.trustStripItems: [{label}]` bhejega to auto dynamic.
- **"Open" badge label** aur **check-icon (SVG)** — abhi hardcoded ("Open" + tick). Chaho to editable bana sakte hain.
- **Add/remove** stats ya trust items ka UI abhi nahi (fixed 3 stats, N trust). Zaroorat ho to add kar denge.

---

## 🎯 About — AboutBento
**File:** `homepage/about/AboutBento.tsx` | **Ref:** saas-landing `AboutNext.tsx`
**Registered:** discovery + ALWAYS_LIGHT_VARIANTS | **id prefix:** `about-`
- **Editable elements:** `about-badge`, `about-title` (accent last words), `about-desc`, `about-image`, `about-cta` (cta-button)
- **Animations (working):** photo tilt-on-hover (pointer), grayscale→color on hover, stat count-up on scroll, section fade/slide-in, reduced-motion safe
- **Colors:** `tc.light` accent (theme DYNAMIC — theme switch pe badalte hain)
- **✅ Pehle se dynamic:** badge/title/desc/image/cta (content + API), serviceArea/serviceAreaLabel (content keys)
- **⚠️ EXTRA / abhi STATIC (backend se dynamic karna hai):**
  - `content.stats` → `[{value,label}]` × 3  (abhi defaults: 15+/1,200+/98%)
  - `content.trustPoints` (ya `featureBoxes[].heading`) → chips  (abhi 6 defaults)
  - "Open" badge label — hardcoded text "Open"

## 🎯 Features — FeaturesBento
**File:** `homepage/features/FeaturesBento.tsx` | **Ref:** saas-landing `FeaturesNext.tsx`
**Registered:** discovery + ALWAYS_LIGHT_VARIANTS | **id prefix:** `fp-`
- **Editable elements:** `fp-badge`, `fp-title`, `fp-desc`, per-card `fp-{id}-title` + `-body`; **add/remove** features
- **Animations (working):** card hover → accent border + cursor-follow glow (spotlight) + icon border accent, staggered fade-in, reduced-motion safe
- **Colors:** `tc.light` accent (DYNAMIC)
- **✅ Pehle se dynamic:** badge/title/desc, `content.items[]` (icon/title/description), add/remove
- **⚠️ EXTRA / abhi STATIC (per item, backend se):**
  - `items[].code` — mono label ("01 / RESPONSE")
  - `items[].tags` — detail chips (string[])
  - `items[].wide` — boolean (pehla card wide span)

## 🎯 Services — ServicesCardsNext
**File:** `homepage/services/ServicesCardsNext.tsx` | **Ref:** saas-landing `ServicesNext.tsx`
**Registered:** discovery + ALWAYS_LIGHT_VARIANTS | **id prefix:** `sp2-`
- **Editable elements:** `sp2-badge`, `sp2-title`, `sp2-desc`, per-service `sp2-svc{i}-title` + `-body`; **add/remove** + service-nav/modal
- **Animations (working):** card hover → accent border + lift + shadow + cursor-follow glow + icon accent, staggered fade-in, Learn-more arrow slide, reduced-motion safe
- **Colors:** `tc.light` accent (DYNAMIC)
- **✅ Pehle se dynamic:** badge/title/desc, `content.items[]` (icon/title/description/link), service-nav (card/button) + modal, add/remove, `learnMoreText`
- **⚠️ EXTRA / abhi STATIC (per item, backend se):**
  - `items[].code` ("S.01"), `items[].label` ("Most booked")
  - `items[].price` — price pill ("Free callout")
  - `items[].items` — ticked feature list (string[])

<!-- NEXT VARIANTS YAHAN ADD HONGE -->
