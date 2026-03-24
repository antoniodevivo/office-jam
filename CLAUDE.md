# Project Rules for Claude

Don't use the claude email in the git commits.

## Workspace Structure

This is an **Nx monorepo** (`office-jam`).

- **Apps:**
  - `apps/api/` - Fastify backend application (esbuild, Node runtime)
  - `apps/web/` - React frontend application (Vite)
- **Libs:**
  - `libs/db/` - Prisma schema, migrations, generated client
  - `libs/shared/` - Shared types

## Package Manager

This project uses **Bun** as the package manager.

- Use `bun` instead of `npm` for package management
- Use `bunx` instead of `npx` for running package binaries
- Use `bun run` instead of `npm run` for running scripts

## Nx Commands

```bash
# Install all workspace dependencies
bun install

# Run Nx targets
bunx nx run api:build       # Build the API
bunx nx run api:serve       # Dev server with --watch
bunx nx run web:build       # Build the web app
bunx nx run web:serve       # Dev server for web

# Build all projects
bunx nx run-many -t build

# Lint all projects
bunx nx run-many -t lint
```

## Prisma Commands

Prisma schema and migrations live in `libs/db/`:

```bash
bunx nx run db:prisma-generate    # Generate Prisma client
bunx nx run db:prisma-validate    # Validate schema
bunx nx run db:prisma-migrate     # Run migrations (dev)
bunx nx run db:prisma-seed        # Seed database
bunx nx run db:db-push            # Push schema to DB
```

## Docker

```bash
docker compose up db          # Start only Postgres
docker compose up             # Start all services (db, api, web)
docker compose build          # Build Docker images
```

## Git Safety

- **NEVER** use `git reset` in any form (`--soft`, `--mixed`, `--hard`). This command is absolutely forbidden.
- Use `git revert` only as an absolute last resort, and only after explicitly asking for user confirmation.
