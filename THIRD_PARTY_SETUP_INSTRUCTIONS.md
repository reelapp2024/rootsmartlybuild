# 📋 Instructions to Send to Third-Party Developer

---

## Quick Setup Guide

### Prerequisites
- Node.js v18+
- pnpm installed: `npm install -g pnpm`

---

### Step 1: Get Monorepo Structure

You need the full monorepo structure. Ask for these folders/files:

```
smartlybuild/
├── packages/
│   ├── ui/                ← Required
│   └── schema/            ← Required
├── package.json           ← Required
├── pnpm-workspace.yaml    ← Required
└── tsconfig.base.json     ← Required
```

---

### Step 2: Clone Builder Repo

```bash
cd packages
git clone https://gitlab.com/logicaldottech/smartbuilderalone.git builder
```

---

### Step 3: Install Dependencies

```bash
# From monorepo root (smartlybuild/)
pnpm install
```

**⚠️ Important:** Must use `pnpm`, not `npm` or `yarn`

---

### Step 4: Run Dev App

```bash
cd packages/builder/dev
pnpm dev
```

Opens at: `http://localhost:3002`

---

### Making Changes

1. Edit code in `packages/builder/src/`
2. Test: `cd packages/builder/dev && pnpm dev`
3. Push: `cd packages/builder && git add . && git commit -m "changes" && git push`

---

### What They Need From You

Send them:
1. `packages/ui/` folder (entire folder)
2. `packages/schema/` folder (entire folder)
3. Root `package.json`
4. Root `pnpm-workspace.yaml`
5. Root `tsconfig.base.json`

**OR** give them access to clone the main monorepo (they only need these packages, not the full repo)

---

## Simple Message to Send:

```
Hi! To set up the builder:

1. Install pnpm: npm install -g pnpm

2. Create folder structure:
   mkdir smartlybuild
   cd smartlybuild
   mkdir packages

3. Clone builder:
   cd packages
   git clone https://gitlab.com/logicaldottech/smartbuilderalone.git builder

4. I'll send you packages/ui/, packages/schema/, and root config files

5. Install: cd ../.. && pnpm install

6. Run: cd packages/builder/dev && pnpm dev

Let me know when ready and I'll send the required packages!
```
