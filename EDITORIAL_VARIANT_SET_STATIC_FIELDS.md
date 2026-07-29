# "Editorial" Homepage Variant Set — Static / Non-Dynamic Fields

A complete, consistent new homepage variant set (design language: **Editorial** —
clean, asymmetric, generous whitespace, accent-highlighted headings, industry-neutral).
**One new variant per homepage section.** Every variant renders through real
`ElementsSection` elements only (nothing rendered without an element), reuses each
section's existing element-id prefix so **content carries over when the user switches
variants**, and reads all colours from the theme (light palette `tc.light` for light
sections, dark tokens for Hero/CTA).

The random-variant picker will now include these automatically (auto-discovered via
`sectionDiscovery.ts`; light ones added to `ALWAYS_LIGHT_VARIANTS`).

Everything below is a variant that is **fully dynamic** from the existing backend keys,
**except** the items listed under "STATIC / NOT DYNAMIC YET" for each section. Those are
small presentational extras I added for polish. They are safe (they fall back cleanly and
never block dynamic content) — but if you want them driven from the admin panel later,
here is exactly what to add to each section's content payload.

---

## Files added

| Section | File | Section bg |
|---|---|---|
| Hero | `homepage/hero/HeroEditorial.tsx` | dark |
| About | `homepage/about/AboutEditorial.tsx` | light |
| Features | `homepage/features/FeaturesEditorial.tsx` | light |
| Services | `homepage/services/ServicesEditorial.tsx` | light |
| Process | `homepage/process/ProcessEditorial.tsx` | light |
| Testimonials | `homepage/testimonials/TestimonialsEditorial.tsx` | light |
| Why-Choose | `homepage/why-choose-us/WhyChooseEditorial.tsx` | light |
| Guarantee | `homepage/guarantee/GuaranteeEditorial.tsx` | light |
| FAQ | `homepage/faq/FAQEditorial.tsx` | light |
| Areas | `homepage/areas/AreasEditorial.tsx` | light |
| CTA | `homepage/cta/CTAEditorial.tsx` | dark |

Registered in: `apps/geniebuild/components/sections/sectionDiscovery.ts` and
`apps/geniebuild/components/SectionRenderer.tsx` (`ALWAYS_LIGHT_VARIANTS`).

---

## Per-section: dynamic keys used + STATIC extras to make dynamic later

### 1. Hero — `HeroEditorial`
**Dynamic (already used):** `title`, `subtitle`, `badgeText`, `ctaText`, `ctaHref`,
`trustStripItems[]{icon,label}`, hero image (`content.data.images[0].url/src` →
`content.imageUrl`).

**STATIC / NOT DYNAMIC YET:**
- **Secondary CTA button** — text `secondaryCtaText`, link `secondaryCtaHref`.
  Falls back to `"See our work"` / `#`. → add `secondaryCtaText` + `secondaryCtaHref` to hero content.
- **Floating "100% / Satisfaction" chip** on the image — the number `100%` and label
  `Satisfaction` are hardcoded. → add e.g. `heroStat = {value, label}` if you want it dynamic
  (or reuse `trustStripItems`/a stat field). Currently a decorative constant.

---

### 2. About — `AboutEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`/`description`, `ctaText`, `ctaHref`,
`featureBoxes[]{icon,heading,description}` (first 2), image (`content.data.images[0]` →
`content.imageUrl`).

**STATIC / NOT DYNAMIC YET:** none. (The accent frame around the image is pure decoration.)

---

### 3. Features — `FeaturesEditorial`
**Dynamic:** `title`, `subtitle`, `badgeText`, `items[]{id,icon,title,description}`.
Add/remove wired.

**STATIC / NOT DYNAMIC YET:**
- **Numbered index (01, 02, …)** on each card — derived from position, not content.
  Purely presentational; no action needed unless you want custom labels per item
  (then add `item.code`, like the Bento variant already supports).

---

### 4. Services — `ServicesEditorial`
**Dynamic:** `badgeText`, `title`, `description`/`subtitle`,
`items[]{id,icon,title,description, link/slug/href, items[]}`, `learnMoreText`,
`serviceNavMode` (`card`|`button`), nav/modal contract (same as other services variants).
Add/remove wired.

**STATIC / NOT DYNAMIC YET:**
- **Numbered index (01, 02, …)** per row — derived from position. Presentational only.

*(Unlike the two existing services variants, this one does NOT show `code`/`label`/`price`
chips, so there are no static price/label fields here to convert.)*

---

### 5. Process — `ProcessEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`,
`items[]{id,icon,title,description}` (backend `data[]` is normalized to `items[]`),
per-step number is an editable text element (`pp-step-num<i>`). Add/remove wired.

**STATIC / NOT DYNAMIC YET:** none new. (The timeline rail + node styling is decoration.
Step numbers default to `i+1` but are already editable elements.)

---

### 6. Testimonials — `TestimonialsEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`/`description`,
`items[]{id,author,role,service,rating,avatar,quote}`. Add/remove wired. Never invents
stock reviews in `readOnly`.

**STATIC / NOT DYNAMIC YET:**
- **Aggregate rating chip** (big average number + "N verified reviews") — the average is
  **computed** from each item's `rating`; the word `"verified"` and the star row are
  presentational. → if you want an explicit headline rating (e.g. a Google rating) rather
  than the computed average, add `aggregateRating = {value, count, label}` to content.

---

### 7. Why-Choose — `WhyChooseEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`,
`items[]{id,icon,title,description}`. **Add/remove wired** (the Plumbing variant did not
have add/remove; this one does — it materializes `content.items` on first edit).

**STATIC / NOT DYNAMIC YET:** none.

---

### 8. Guarantee — `GuaranteeEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`/`description`,
stat via `statValue`/`statLabel`/`statCard{value,label,icon}` (defaults `100%` / `Satisfaction`),
guarantee list via `guaranteeList[]{line}` OR `items[]`, `ctaText`, `ctaHref`.

**STATIC / NOT DYNAMIC YET:**
- **"Guaranteed in writing" ribbon** under the stat seal — hardcoded label + check icon.
  → add e.g. `statCard.caption` (or a `guaranteeSealText`) if you want it editable.
  Currently a constant.

---

### 9. FAQ — `FAQEditorial`
**Dynamic:** `badgeText`, `title`/`heading`, `subtitle`/`description`,
`items[]{question,answer,openByDefault}`, support CTA: `faqCtaTitle`/`ctaTitle`,
`faqCtaDescription`/`ctaSubtitle`, `ctaButtonText`, `ctaButtonLink`.

**STATIC / NOT DYNAMIC YET:** none new. (Support-CTA button icon defaults to `fa-headset`,
already overridable via the element.)

---

### 10. Areas — `AreasEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`, `ctaText`/`ctaHref`, `phoneText`/`phoneHref`,
`items[]{id,title/city,link,locationId}` (cities come from the **BusinessLocation** table via
`contentRef.source = "business_locations"`, injected into `content.items`). Add/remove wired.
Phone button only shows when `phoneText` **and** `phoneHref` are present.

**STATIC / NOT DYNAMIC YET:**
- **"Don't see your area? We may still cover it." note** — this is the `ap-note` **element**,
  so it is already editable on canvas, but its default text is a constant (same as the
  Plumbing variant). Fine as-is; make dynamic only if you want it API-driven (add `areasNote`).

---

### 11. CTA — `CTAEditorial`
**Dynamic:** `badgeText`, `title`, `subtitle`/`description`,
CTA button text/link (`ctaText`/`ctaHref`, falls back to backend-injected
`contactText`/`contactHref`), `phoneNumber`, `phoneSubText` (via `getCtaPhoneSubText`),
trust stats `items[]{label,icon}` (via `mapCtaTrustItems`, first 3).

**STATIC / NOT DYNAMIC YET:**
- **Badge default text** `"Ready when you are"` and **phone-sub default** `"Call us direct"`
  — only used when `badgeText` / `phoneSubText` are empty. Both are real editable elements;
  make dynamic just by sending `badgeText` / `phoneSubText`.
- The phone block only renders when `phoneNumber` exists; trust row only when `items[]` exist.

---

## Summary of what to add to go 100% dynamic (optional, later)

| Section | New content key(s) to add |
|---|---|
| Hero | `secondaryCtaText`, `secondaryCtaHref`, (optional) `heroStat{value,label}` |
| Testimonials | (optional) `aggregateRating{value,count,label}` instead of computed avg |
| Guarantee | (optional) `statCard.caption` / `guaranteeSealText` |
| CTA | already dynamic — just send `badgeText`, `phoneSubText` if you want to override defaults |
| Features / Services | (optional) `item.code` for custom numeral labels (else auto 01,02,…) |
| Areas | (optional) `areasNote` |

Everything else in the set is already driven by the existing backend keys. No section
renders any text/image/list without a proper element, and all colours are theme-dynamic.
