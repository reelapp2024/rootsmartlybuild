# 🚀 Builder Setup Instructions for Third-Party Developers

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (required - not npm or yarn)
  ```bash
  npm install -g pnpm
  ```

---

## Step 1: Clone Monorepo Structure

The builder depends on `packages/ui/` and `packages/schema/`. You need the full monorepo structure:

```bash
# Clone the main monorepo (or get the structure)
git clone <main-monorepo-url>
cd smartlybuild
```

**OR** if you only need the packages structure:

```bash
mkdir smartlybuild
cd smartlybuild
mkdir packages
```

---

## Step 2: Clone Builder Repo

```bash
cd packages
git clone https://gitlab.com/logicaldottech/smartbuilderalone.git builder
cd builder
```

---

## Step 3: Get Required Packages

You need these packages in `packages/` folder:

- `packages/builder/` ✅ (already cloned)
- `packages/ui/` (required - get from main monorepo)
- `packages/schema/` (required - get from main monorepo)

**Ask the project owner for:**
- `packages/ui/` folder
- `packages/schema/` folder
- Root `package.json`
- Root `pnpm-workspace.yaml`
- Root `tsconfig.base.json`

---

## Step 4: Install Dependencies

```bash
# From monorepo root (smartlybuild/)
pnpm install
```

**Important:** Use `pnpm`, not `npm` or `yarn`. The project uses `workspace:*` protocol which only works with pnpm.

---

## Step 5: Run Dev App

```bash
cd packages/builder/dev
pnpm dev
```

The builder will open at `http://localhost:3002`

---

## Project Structure

```
smartlybuild/
├── packages/
│   ├── builder/          ← Builder code (your repo)
│   ├── ui/                ← UI components (required)
│   └── schema/            ← Schema definitions (required)
├── package.json           ← Root package.json (required)
├── pnpm-workspace.yaml    ← Workspace config (required)
└── tsconfig.base.json     ← TypeScript base (required)
```

---

## Making Changes

1. Edit files in `packages/builder/src/`
2. Test in dev app: `cd packages/builder/dev && pnpm dev`
3. Commit and push:

```bash
cd packages/builder
git add .
git commit -m "Your changes"
git push
```

---

## Troubleshooting

### Error: `workspace:*` protocol not supported
**Solution:** Use `pnpm`, not `npm` or `yarn`

### Error: Cannot find module `@ui/blocks`
**Solution:** Make sure `packages/ui/` exists and run `pnpm install` from root

### Error: Cannot find module `@schema/core`
**Solution:** Make sure `packages/schema/` exists and run `pnpm install` from root

---

## Need Help?

Contact the project owner for:
- Access to `packages/ui/` and `packages/schema/`
- Root configuration files (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`)
