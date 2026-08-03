# Content website sections (funky)

Same code structure as `components/sections` (business / bulk) — only the **look** is different.

Maps 1:1 to admin Website Blueprint (`contentWebsiteConfig.ts`) via
`backend/additional/contentWebsitePagesBootstrap.js`.

```
contentwebsitesSections/
  homepage/…          Home page sections (HeroFunky, FeaturedPostsFunky, …)
  blog/…              Blog listing
  category/…          Category template
  article/…           Article / pin landing template
  about/…             About / brand
  contact/…           Contact
  author/…            Author profile template
  legal/…             Privacy / Terms / Disclaimer bodies
  headerfooter/…      HeaderFunky + FooterFunky (auto-injected on every page)
  funkyTheme.ts
  sectionDiscovery.ts
```

## Site chrome

`HeaderFunky` and `FooterFunky` are **always** prepended/appended at bootstrap so
GenieBuild and SiteNextJS show nav + footer on every page. Do not rely on
business `HeaderPlumbing` for content websites (`projectType = 2`).

## Compatibility

- Props: `section`, `onTextEdit`, `buttonClass`, `onElementSelect`, `onElementUpdate`, `selectedElementId`, `readOnly`, `themeColors`
- Editable UI via shared `ElementsSection`
- Funky chrome: Syne/Caveat fonts, sticker borders, lime/coral/teal palette

## Repair older projects missing header/footer

```http
POST /admin/v1/pinterest/v2/bootstrapContentPages
{ "projectId": "<id>" }
```
