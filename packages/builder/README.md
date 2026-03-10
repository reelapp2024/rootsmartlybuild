# @builder/core

Standalone builder package for the SmartlyBuild page builder.

## Installation

This package is part of a **pnpm workspace**. You must use `pnpm`:

```bash
# From workspace root (REQUIRED - installs all workspace dependencies)
pnpm install

# This installs:
# - All builder dependencies
# - Workspace dependencies (@ui/blocks, @schema/core)
# - Dev tools (vite, typescript) at root level
```

**Note**: `npm` does not support `workspace:*` protocol. Use `pnpm` or `yarn`.

## Usage

```tsx
import { BuilderApp } from '@builder/core';

function App() {
  return <BuilderApp />;
}
```

## Development

This package is part of a monorepo and uses workspace dependencies.

### Dependencies

All dependencies are listed in `package.json`. Key dependencies:
- `@ui/blocks` - UI components (workspace dependency)
- `@ui/utils/*` - Utility functions (workspace dependency)
- React, React DOM
- Zustand for state management
- Radix UI components

### Structure

```
src/
  ├── App.tsx              # Main builder app
  ├── store.ts             # Zustand store
  ├── components/          # Builder components
  ├── types/               # TypeScript types
  ├── utils/               # Utility functions
  └── elementProperties/   # Element property definitions
```

## For Third-Party Developers

1. Clone this repository
2. Install dependencies: `pnpm install` (from workspace root)
3. See `dev/` folder for standalone dev app
4. Run dev app: `cd packages/builder/dev && pnpm dev`
5. Make changes in `src/`
6. Push changes to your branch

**Important**: This is a pnpm workspace. Use `pnpm` commands, not `npm`.

## Integration with Admin Panel

The admin panel imports from this package:
```tsx
import { BuilderApp } from '@builder/core';
```

Changes here automatically reflect in the admin panel when pulled via Git submodule.
