# Waves B–D status

All remaining element types render through the shared `ElementsSection` path used by SiteNextJS.

## Cross-cutting (done)

- TypographyBlock exclusion includes `nav-menu` + `cta-button` (no double typography panels)
- `resolveElementStyle` drops empty-string resets (inherit)
- `stripPresetThemeColorOverrides` no longer wipes user colors on hydrate
- `normalizeSectionStyles` on load/save
- `applyElementComputedStyle` helpers for explicit color + box keys
- ColorInputs show **(Inherited)** when the style key is empty (Wave B–D StylesBlocks)
- Canvas attaches `data-element-id` for responsive CSS
- SiteNextJS merges tablet/mobile via `resolveSectionForBreakpoint` + injects `buildResponsiveOverrideCss`

## Wave B–D apply path

| Wave | Types | StylesBlock | Status |
|------|-------|-------------|--------|
| B | list, card, accordion, alert-box, icon, image-box, blockquote, highlight-text, trust-strip, testimonial-card | Dedicated blocks + Inherited labels | Controls write `element.style`; canvas applies via ElementsSection; explicit colors via `resolveElementColor` where wired |
| C | pricing-*, flip-box, toggle, tabs, counter, progress, countdown, video, logo-cloud, avatars, review-carousel, divider | Dedicated + Inherited labels | Same |
| D | star-rating, table, faq, testimonial, spacer, row, column | Minimal / intentional | LayoutSpacing still applies where shown |

## Known remaining (manual QA, not blockers)

- Spot-check every Wave C control against canvas (matrix in `style-system-qa-matrix.md`)
- Semantic responsive keys (`titleColor`, `markerColor`, …) rely on JS breakpoint merge on live (CSS skip list avoids invalid props)
