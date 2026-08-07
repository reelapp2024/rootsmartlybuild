# Style system QA matrix

Run after style unification foundation. Check GenieBuild canvas + save/reload + SiteNextJS live.

## Coverage status (engineering)

| Area | Status |
|------|--------|
| Section bg shared resolver (Default + Funky + heroes/header/footer) | Done |
| Nested `styles.background` normalize + legacy flat sync | Done |
| Wave A–D Inherited labels on ColorInputs | Done |
| Explicit element color wins (`resolveElementColor`) | Done |
| Element SSOT `resolveSectionElement` (API > DNA) | Done — business + Funky + header/footer + Canvas + legacy |
| DNA source hygiene (no theme colors in DNA / `*Style` bags) | Done — strip scripts pass 1+2 |
| Wave A DNA packages (`elements/heading\|text\|button\|badge`) | Done |
| Canvas seed sanitize | Done |
| Per-type Design StylesBlocks in `App.tsx` | Done — TypographyBlock only for unmapped types |
| Manual visual QA checkboxes below | Pending human pass |

## Section background

| Check | bulk | business | content |
|-------|------|----------|---------|
| Hero bg type = color | | | |
| Hero bg type = gradient | | | |
| Hero bg type = image + overlay | | | |
| FAQ / About / CTA bg color/gradient/image | | | |
| Header / footer bg color or image | | | |
| Funky section respects sidebar bg (content) | — | — | |

## Element colors (Wave A)

| Check | Notes |
|-------|-------|
| Heading color change sticks after save/reload | Sidebar shows Inherited when reset |
| Text color change sticks | |
| Button bg/text change sticks | |
| Badge bg/text change sticks | |
| Feature-box title/desc/icon colors | |
| Nav-menu link/hover/active | |
| Margin / padding / align on heading + button | Layout Advanced tab |

## Element colors (Wave B–D)

| Check | Notes |
|-------|-------|
| List text + marker colors | Inherited label when empty |
| Accordion question/answer/icon colors | |
| Card / alert / icon / blockquote colors | |
| Pricing / tabs / toggle / counter colors | |
| Tablet/mobile fontSize or padding override | Requires `data-element-id` |

## Cross-cutting

| Check | Pass? |
|-------|-------|
| Theme switch then re-edit element colors still stick | |
| Live SiteNextJS matches GenieBuild for same page | |
| Refresh Variant never lands Funky on bulk/business | |
| No empty `background.type` after save | Inspect network payload |

## Resolvers used

- `@geniebuild/utils/sectionBackground`
- `@geniebuild/utils/normalizeSectionStyles`
- `@geniebuild/utils/applyElementComputedStyle`
- `@geniebuild/elements/resolveSectionElement` + `inheritedColorKeys`
- `buildResponsiveOverrideCss` + `resolveSectionForBreakpoint`
