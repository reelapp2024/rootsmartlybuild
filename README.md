# SmartlyBuild Monorepo

## Structure

```
smartlybuild/
├── backend/                 # Node.js API
├── apps/
│   ├── smartlybuildadmin/   # Admin panel
│   ├── geniebuild/          # GenieBuild builder + section components
│   ├── sitenextjs/          # Custom sites (Next.js)
│   ├── site/                # Site renderer
│   ├── website/             # Vite website themes
│   └── website-next/        # Next.js website
└── packages/
    ├── schema/              # @schema/core — fonts, themes, typography
    └── ui/                  # @ui/blocks — theme provider + block registry
```

## What `packages/` is for (not sections)

GenieBuild page sections live in `apps/geniebuild/components/sections/`.

Root `packages/` is shared **design system** code used across apps:

| Package | Purpose | Used by |
|---------|---------|---------|
| `@schema/core` | Preset fonts, theme catalog, typography sizes | Admin wizard, GenieBuild, SiteNextJS, backend |
| `@ui/blocks` | ThemeProvider, component registry (hero_a, footer_a, …) | SiteNextJS, site, website, admin (vite alias) |

## Setup

```bash
pnpm install
cd backend && npm install
```

Copy `.env` files into `backend/` and each app.

## Development

```bash
cd backend && npm start
cd apps/smartlybuildadmin && pnpm dev
cd apps/geniebuild && pnpm dev
cd apps/sitenextjs && pnpm dev
```
