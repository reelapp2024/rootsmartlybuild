# SmartlyBuild Monorepo

## Structure

```
smartlybuild/
├── backend/                 # Node.js API (nodeprojects, npm — outside pnpm workspace)
├── apps/
│   ├── smartlybuildadmin/   # Admin panel (Vite)
│   ├── geniebuild/          # @geniebuild — builder + section components
│   ├── sitenextjs/          # custom-sites — Next.js public sites
│   └── schema/              # @schema/core — fonts, themes, typography
├── nixpacks.toml            # Railway Node 20 + pnpm at workspace root
└── package.json             # pnpm workspace root (apps/* only)
```

## Setup

```bash
pnpm install
cd backend && npm install
```

## Development

```bash
pnpm dev:backend
pnpm dev:admin
pnpm dev:geniebuild
pnpm dev:sitenextjs
```

## Railway

Deploy **from the monorepo root** (Root Directory empty / `.`). Do **not** set Root Directory to `apps/...` — that breaks workspace linking for `@geniebuild` / `@schema/core`.

| Service | Build | Start |
|---------|-------|-------|
| sitenextjs | `pnpm run build:sitenextjs` | `pnpm run start:sitenextjs` |
| admin | `pnpm run build:admin` | `pnpm run start:admin` |
| backend | `npm --prefix backend install` | `npm --prefix backend run start:prod` |
