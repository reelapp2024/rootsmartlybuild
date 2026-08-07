# Element SSOT (Single Source of Truth)

## Location

`apps/geniebuild/elements/`

| Path | Role |
|------|------|
| `resolveSectionElement.ts` | API/DB element by id **wins**; DNA fills holes; **strips theme color keys from DNA** |
| `inheritedColorKeys.ts` | Keys theme owns at render (`color`, `titleColor`, …) |
| `heading/dna.ts`, `text/dna.ts`, `button/dna.ts`, `badge/dna.ts` | Structural defaults (no colors) |
| `index.ts` | Registry + re-exports |

## Cascade

1. `section.elements[]` (API/DB) — content + explicit style overrides  
2. DNA (variant default) — structural style only  
3. Theme / `globalElementStyles` — applied in `ElementsSection` at render  

**Never** bake `titleColor` / `textColor` / accent into DNA `style` or force them after merge (`..., color: titleColor`).

## Section usage

```ts
import { resolveSectionElement } from '../../../../elements';

const titleEl = resolveSectionElement(section, {
  id: `${section.id}-title`,
  type: 'heading',
  content: { text: content.title || 'Default', htmlTag: 'h2' },
  style: { fontWeight: '800', fontSize: 'clamp(...)', textAlign: 'center' }, // no color
});
```

If you already `find`'d the element:

```ts
import { elementFromExistingOrDna } from '../../../../elements';
const base = elementFromExistingOrDna(existing, { id, type: 'heading', content: {...}, style: {...} });
```

Canvas seeds go through `sanitizeSeedElements` in `useCanvasVariantSeed`.

Funky (content) variants use `mergeFunkyElement` → `resolveSectionElement`, or call `resolveSectionElement` directly.

Header/footer dynamic About Us fields use `mergeDynamicElement` (strips DNA theme colors, then re-applies live contact content).

## Source hygiene (DNA)

Variant DNA style bags must not assign theme expressions (`titleColor`, `accent`, `btnBg`, …).  
Runtime still strips via `resolveSectionElement`; `scripts/strip-dna-theme-colors.cjs` keeps source aligned.

Hardcoded chrome JSX (`style={{ color: titleColor }}` on non-element UI) is allowed — it is not DNA.

## Sidebar

- Design: per-type `*StylesBlock` in `App.tsx` Design tab (heading, text, button, badge, accordion, list, nav, …)  
- `TypographyBlock` remains only as fallback for unknown/unmapped types  
- Content: `ElementContentFormSelector`  
- Render: `ElementsSection`  

Full “one folder owns StylesBlock + render case” file split is optional cleanup; wiring + DNA + resolve is the contract today.
