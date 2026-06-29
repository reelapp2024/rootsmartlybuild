# aiwebbuilder

Monorepo containing the AI Web Builder application with Next.js website.

## Structure

- `apps/` - Application workspaces
  - `website-next/` - Next.js website application
- `packages/` - Shared packages
- `aibackend/` - Backend API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install
```

### Development

```bash
# Run development server for website-next
cd apps/website-next
pnpm dev

# Or from root
pnpm --filter website-next dev
```

## Website Next.js

Next.js version of the website with modern theme support.

### Getting Started

```bash
cd apps/website-next

# Install dependencies (from root)
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

### Structure

- `app/` - Next.js app router pages
- `themes/` - Theme components
- `components/` - Shared components

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a merge request

## License

[Add your license here]
