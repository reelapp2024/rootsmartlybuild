# GenieBuild Style System Contract

Single source of truth for section + element styles across GenieBuild canvas and SiteNextJS.

**Element resolution (API → DNA → theme):** see [`element-ssot.md`](./element-ssot.md) — use `resolveSectionElement` / `elementFromExistingOrDna` from `apps/geniebuild/elements`.

## Cascade (highest wins)

1. **Element override** — `element.style` / `tabletStyle` / `mobileStyle` (explicit keys only)
2. **Section style** — `section.styles` (incl. nested `background`)
3. **globalElementStyles** — theme settings bag for heading/text/button/…
4. **Theme tokens** — preset / custom theme colors
5. **DNA default** — `ELEMENT_DEFAULTS` / `SECTION_TEMPLATES` / `elements/*/dna` (+ variantOverrides)

**Reset** = clear the override key (`''` / `undefined`), not paint the theme color into saved style.

**Sidebar display** = resolved value for the picker, labeled Inherited when no override; `onChange` writes override; `onReset` clears override.

## Background value (`styles.background`)

```ts
{
  type: 'color' | 'gradient' | 'image',
  color?: string,
  gradient?: { type: 'linear'|'radial', direction?: number, stops: { color, position }[] },
  image?: { url, position?, size?, repeat?, attachment?, overlay? },
  overlay?: { enabled, color?, opacity?, blendMode? } // mirrored onto image.overlay for images
}
```

Legacy flats (`backgroundColor`, `backgroundImage`, `overlay*`) stay in sync when the sidebar writes.

**Normalize rules:** never persist `{ type: '' }` or incomplete objects; always keep `type` + required fields when a user set a background. Render via `resolveSectionBackground` / `resolveSectionWrapperStyle` only.

## Responsive

| Breakpoint | Element | Section |
|------------|---------|---------|
| desktop | `style` | `styles` |
| tablet | `tabletStyle` | `tabletStyles` |
| mobile | `mobileStyle` | `mobileStyles` |

Overrides are deltas from desktop.

## Wave A color keys

| Element | Primary color keys |
|---------|-------------------|
| heading | `color`, `secondaryHeadingColor`, `kickerColor`, `gradientFrom`, `gradientTo` |
| text | `color`, `linkColor`, `dropCapColor` |
| button / cta-button / call-to-action | `backgroundColor`, `color`, `borderColor`, hover* |
| badge | `backgroundColor`, `color`, `borderColor` |
| image | `overlayColor`, filters (not text color) |
| feature-box / icon-box / stat-card | `titleColor`, `descriptionColor`, `iconColor`, `iconBackgroundColor`, `backgroundColor`, `borderColor` |
| nav-menu | `color`, `hoverColor`, `activeColor`, `backgroundColor` |

## Resolvers (import from `@geniebuild/utils/...`)

- `resolveSectionStyles` / `resolveElementStyle` — cascade merge
- `normalizeSectionStyles` / `normalizeBackground` — load + save
- `resolveSectionBackground` / `resolveSectionOverlay` / `resolveSectionWrapperStyle` — CSS
- `resolveElementBackground` — flat element bg keys

## Project types

Funky variants = content websites (`projectType === 2`) only.
