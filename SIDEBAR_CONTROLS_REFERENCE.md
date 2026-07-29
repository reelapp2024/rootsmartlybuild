# Sidebar Controls Reference (har element ka editable-kya)

> **RULE (bahut zaroori):** Jab bhi koi element banau/use karu, pehle yahan dekho ki
> us element ke sidebar me user kya-kya change kar sakta hai. Woh saari cheezein
> **user ke change se override honi chahiye** — main render pe hardcode/force NA karu,
> warna user ka sidebar change kaam nahi karega.

## Architecture
- 3 tabs: **Content** | **Design** | **Advanced**
- Content tab → `builder/layout/ElementContentFormSelector.tsx` → per-element content form
- Design tab  → `builder/style-editor/<Element>StylesBlock.tsx` → per-element style controls
- Element rendering → `components/sections/ElementsSection.tsx` (reads style keys)

## Golden rules for building variants
1. Element ka style pe `existing` element ko spread karo, phir apne defaults —
   taaki user ka saved change WIN kare (default sirf pehli baar).
   `style: { ...myDefault, ...(existing?.style) }`  ✅  (existing last = wins)
   NOT `{ ...existing, ...myForced }` on keys the user edits. ❌
2. Colors theme se do as DEFAULT, par user override allow karo.
3. Kisi style key ko har render pe force mat karo agar sidebar me woh control hai.

---

## Per-element editable controls

### button / call-to-action
- **Content tab:** Button Text, Button Link (URL), Icon + position, Size (sm/md/lg/xl),
  Width (auto/full/fixed), Hover Effect, Open-in-new-tab, Loading state, Reveal animation
- **Design tab:** **Variant** (primary/secondary/outline/ghost) ← user khud choose karta hai!,
  Background Color, Text Color, Border Color, Border Width, Border Style, Border Radius,
  Hover Background, Hover Border, Hover Text Color, Padding, Icon Size, Icon Rotation, Custom Shadow
- ⚠️ NOTE: Variant + saare colors user-editable hain → inhe render me FORCE mat karo.
  Default variant + theme secondary colors do, baaki user pe chhodo.

### heading
- Content: text, htmlTag, textBefore/highlightedText/textAfter
- Design: Preset, Font Family/Size/Weight/Style, Letter Spacing, Line Height, Text Transform,
  **Primary Color**, **Highlight Color** (accent word), Kicker Color, Decoration,
  Gradient From/To, Custom Shadow

### text
- Design: Preset, Font Family/Size/Weight/Style, Letter Spacing, Line Height, Text Transform,
  **Text Color**, Paragraph Spacing, Decoration, Drop Cap Color/Size, Inline Link Color, Custom Shadow

### badge
- Content: text, icon, iconPosition
- Design: Background Color, Text Color, Border Color, Border Radius, Font Family/Size/Weight/Style,
  Letter Spacing, Line Height, Text Transform, Padding, Entry Animation

### trust-strip  (marquee/slider — items {icon,label})
- Content: items list (add/edit/remove) via TrustStripContentForm
- Design: Icon Color, Icon Background, Icon Size, Container Size, Label Color,
  Font Family/Size/Weight, Gap Between Items

### image-box  (service card: image+title+desc+button)
- Content: imageUrl (upload), title, description, button text/link, showButton
- Design: Border Width, Heading Level, Text Size, Font Family (+ image layout keys via style)

### feature-box
- Content: icon, text (title), subText (desc)
- Design: Icon Color/Background/Size, Container Size, Color (title), Text (desc), Font *,
  Border Color/Style/Width, Radius (corners), Padding, Width, Shadow, Chip/Badge/Stat/Link colors

### Others (dekhne ke liye style-editor/ me): image, video, icon, list, nav-menu, accordion,
  tabs, pricing-item/table, stat-card, icon-box, testimonial-card, star-rating, divider,
  spacer, alert-box, progress-bar, countdown-timer, flip-box, review-carousel, user-avatars,
  logo-cloud, counter, blockquote, highlight-text, toggle, card

---

## ⚠️ Learnings / mistakes to avoid
- **Secondary button:** button element me "Variant" control HAI (user khud primary/secondary/
  outline/ghost choose kar sakta hai) + bg/border/text colors editable. Isliye secondary ko
  render pe FORCE (custom `<a>` ya forced transparent) karna GALAT — user ka change override
  ho jata hai. Sahi: `buttonVariant: 'secondary'` default + theme ke secondaryButton* colors,
  baaki user pe chhodo.
