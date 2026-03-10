# Quick Start Guide

## ⚠️ Important: Use pnpm, not npm

This is a **pnpm workspace**. The `workspace:*` protocol is not supported by npm.

## Installation

### From Workspace Root (Recommended)
```bash
# Install all workspace dependencies
pnpm install
```

### From Builder Package
```bash
cd packages/builder
pnpm install
```

## Running the Dev App

The dev app is a standalone test environment for the builder:

```bash
# First, ensure vite is installed (it's in root devDependencies)
pnpm install

# Then run the dev app
cd packages/builder/dev
pnpm dev
```

This will start the dev server on `http://localhost:3002`

**Note**: Vite is installed at the workspace root, so make sure you run `pnpm install` from the root first.

## Using in Admin Panel

The admin panel already uses the builder package. Just run:

```bash
cd apps/smartlybuildadmin
pnpm dev
```

Navigate to `/builder` or `/studio` to see the builder.

## Troubleshooting

### Error: "Unsupported URL Type workspace:*"
**Solution**: Use `pnpm` instead of `npm`. This is a pnpm workspace.

### Error: "vite is not recognized" or "@vitejs/plugin-react not found"
**Solution**: Run `pnpm install` from the workspace root first. These packages are installed at the root level to be shared across the workspace.

### Error: "Module not found"
**Solution**: Make sure you've run `pnpm install` from the workspace root to install all workspace dependencies.

## For Third-Party Developers

If you're sharing this package:

1. **Option 1: Git Submodule** (Recommended)
   - Add as submodule in their repo
   - They run `pnpm install` from their workspace root
   - Workspace dependencies resolve automatically

2. **Option 2: Separate Repository**
   - They clone `packages/builder` separately
   - They need to also have `packages/ui` and `packages/schema` in their workspace
   - Or replace `workspace:*` with actual package versions/paths

## Package Manager Requirements

- ✅ **pnpm** - Fully supported (recommended)
- ✅ **yarn** - Should work (uses same workspace protocol)
- ❌ **npm** - Does NOT support `workspace:*` protocol
