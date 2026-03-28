# Surf Rental

Surfboard and wetsuit rental service with delivery to your accommodation in the Aljezur, Arrifana, and Vale da Telha area (Costa Vicentina, Portugal).

## Tech Stack

- **Monorepo**: Turborepo
- **Framework**: Next.js 16 (App Router)
- **Linting & Formatting**: Biome
- **Package Manager**: pnpm

## Project Structure

```
apps/
  web/          → Next.js landing page & future booking app
packages/
  ui/           → Shared React components
  typescript-config/ → Shared tsconfig presets
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Lint & format check (Biome) |
| `pnpm lint:fix` | Auto-fix lint & format issues |
| `pnpm format` | Format all files |
| `pnpm check-types` | TypeScript type checking |
