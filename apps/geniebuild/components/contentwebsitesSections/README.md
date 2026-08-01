# Content website sections (funky)

Same code structure as `components/sections` (business / bulk) — only the **look** is different.

```
contentwebsitesSections/
  homepage/hero/HeroFunky.tsx
  homepage/featuredposts/FeaturedPostsFunky.tsx
  blog/bloghero/BlogHeroFunky.tsx
  article/articlehero/ArticleHeroFunky.tsx
  about/abouthero/AboutHeroFunky.tsx
  contact/contactform/ContactFormFunky.tsx
  legal/privacybody/PrivacyBodyFunky.tsx
  author/authorhero/AuthorHeroFunky.tsx
  headerfooter/header/HeaderFunky.tsx
  headerfooter/footer/FooterFunky.tsx
  homepage/ElementsSection.ts   ← re-export of shared ElementsSection
  sectionDiscovery.ts
  funkyTheme.ts
```

## Compatibility

- Props: `section`, `onTextEdit`, `buttonClass`, `onElementSelect`, `onElementUpdate`, `selectedElementId`, `readOnly`, `themeColors`
- Editable UI via shared `ElementsSection` (badge, heading, text, CTA, FAQ, forms, nav…)
- Funky chrome: Syne/Caveat fonts, sticker borders, lime/coral/teal palette

## Regenerate

```bash
node apps/geniebuild/components/contentwebsitesSections/_generate.mjs
```
