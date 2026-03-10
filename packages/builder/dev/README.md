# Builder Dev App

Standalone development environment for testing the builder package.

## Setup

1. **Install dependencies from workspace root**:
   ```bash
   # From workspace root
   pnpm install
   ```

2. **Run the dev server**:
   ```bash
   cd packages/builder/dev
   pnpm dev
   ```

3. **Open browser**: `http://localhost:3002`

## Why This Setup?

- **Vite is at workspace root**: The `vite` binary is installed in the root `node_modules` to be shared across workspace packages
- **Workspace dependencies**: Uses `@builder/core` and `@ui/blocks` from the workspace
- **Isolated testing**: Test builder changes without running the full admin panel

## Troubleshooting

### "vite is not recognized" or "@vitejs/plugin-react not found"
**Solution**: Run `pnpm install` from the workspace root first. Both `vite` and `@vitejs/plugin-react` are installed at the root level to be shared across workspace packages.

### "Module not found: @builder/core"
**Solution**: Make sure you've run `pnpm install` from the workspace root to install all workspace dependencies.

### Port already in use
**Solution**: Change the port in `vite.config.ts`:
```ts
server: {
  port: 3003, // Change to available port
}
```
