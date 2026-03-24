---
phase: 01-foundation
plan: 02
subsystem: database
tags: [prisma, postgresql, prisma7, driver-adapter, fastify-plugin, singleton, seed]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: Nx monorepo with apps/api Fastify app, libs/db library scaffold, tsconfig path aliases
provides:
  - Prisma 7 schema with 6 models (Office, Agent, Task, TaskAssignment, Message, Activity)
  - PrismaClient singleton with PrismaPg driver adapter
  - Fastify db plugin decorating server with prisma client
  - Seed script for default Headquarters office
  - Nx targets for prisma-generate, prisma-validate, prisma-migrate, prisma-seed, db-push
affects: [01-foundation/03, 02-orchestration, 03-realtime, 04-frontend]

# Tech tracking
tech-stack:
  added: [prisma@7, @prisma/client@7, @prisma/adapter-pg, pg, dotenv, tsx, @types/pg]
  patterns: [prisma-singleton-with-driver-adapter, fastify-autoload-plugin, multi-office-isolation-via-officeId]

key-files:
  created:
    - libs/db/prisma/schema.prisma
    - libs/db/prisma.config.ts
    - libs/db/src/client.ts
    - libs/db/prisma/seed.ts
    - libs/db/package.json
    - libs/db/.env.example
    - .env.example
    - apps/api/src/app/plugins/db.ts
    - apps/api/src/app/routes/health.ts
  modified:
    - libs/db/src/index.ts
    - libs/db/project.json
    - package.json
    - package-lock.json

key-decisions:
  - "Import from generated/client/client.ts (Prisma 7 no longer generates index.ts)"
  - "Place db plugin in apps/api/src/app/plugins/ to leverage existing @fastify/autoload pattern"
  - "Add /health route as autoloaded route file rather than inline in app.ts"

patterns-established:
  - "Prisma singleton: globalForPrisma pattern with PrismaPg driver adapter in libs/db/src/client.ts"
  - "Barrel export: libs/db/src/index.ts re-exports prisma client and all generated types"
  - "Fastify plugin: fp-wrapped plugins in apps/api/src/app/plugins/ auto-registered by @fastify/autoload"
  - "Multi-office isolation: every model except Office has officeId FK with @@index"

requirements-completed: [INFR-03, INFR-05]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 1 Plan 2: Database Layer Summary

**Prisma 7 database layer with 6-model schema, PrismaPg driver adapter singleton, seed script, and Fastify plugin integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T19:49:26Z
- **Completed:** 2026-03-24T19:55:10Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Complete Prisma 7 schema with Office, Agent, Task, TaskAssignment, Message, and Activity models
- Multi-office data isolation via officeId foreign keys with indexes on all child entities
- PrismaClient singleton with PrismaPg driver adapter prevents connection pool issues during hot reload
- Fastify db plugin auto-registered via @fastify/autoload, with graceful shutdown hook
- Seed script ready to create default "Headquarters" office
- Five Nx targets for Prisma workflows (generate, validate, migrate, seed, db-push)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Prisma 7 dependencies and create schema with all models** - `4cc4269` (feat)
2. **Task 2: Create Prisma client singleton, seed script, and Fastify database plugin** - `e568757` (feat)

## Files Created/Modified
- `libs/db/prisma/schema.prisma` - Complete database schema with 6 models, 3 enums, relations, and indexes
- `libs/db/prisma.config.ts` - Prisma 7 config with defineConfig, datasource URL from env
- `libs/db/src/client.ts` - Singleton PrismaClient with PrismaPg driver adapter
- `libs/db/src/index.ts` - Barrel export of prisma client and generated types
- `libs/db/prisma/seed.ts` - Database seeding with default Headquarters office
- `libs/db/package.json` - ESM package config for Prisma 7 compatibility
- `libs/db/project.json` - Nx targets for Prisma workflows
- `libs/db/.env.example` - Database connection string template
- `.env.example` - Root database connection string template
- `apps/api/src/app/plugins/db.ts` - Fastify plugin decorating server with prisma client
- `apps/api/src/app/routes/health.ts` - Health check endpoint returning { status: "ok" }
- `package.json` - Added prisma, @prisma/client, @prisma/adapter-pg, pg, dotenv deps
- `package-lock.json` - Lock file updated with new dependencies

## Decisions Made
- **Import path for Prisma 7 generated client:** Prisma 7 generates `client.ts` directly without an `index.ts` barrel, so imports use `../generated/client/client` instead of `../generated/client`
- **Plugin placement:** Placed db plugin in `apps/api/src/app/plugins/db.ts` to leverage the existing `@fastify/autoload` pattern from the Nx generator, rather than creating a new `apps/api/src/plugins/` directory
- **Health route as separate file:** Added `/health` route as `apps/api/src/app/routes/health.ts` auto-loaded by the existing route autoloader, keeping the app.ts factory unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted import path for Prisma 7 generated client**
- **Found during:** Task 2 (client.ts creation)
- **Issue:** Plan specified `import { PrismaClient } from "../generated/client"` but Prisma 7.5.0 generates `client.ts` without an `index.ts` barrel file
- **Fix:** Used `import { PrismaClient } from "../generated/client/client"` instead
- **Files modified:** libs/db/src/client.ts, libs/db/src/index.ts
- **Verification:** Build passes, TypeScript resolves PrismaClient type correctly
- **Committed in:** e568757 (Task 2 commit)

**2. [Rule 3 - Blocking] Placed db plugin in autoload directory instead of separate plugins dir**
- **Found during:** Task 2 (Fastify plugin creation)
- **Issue:** Plan specified `apps/api/src/plugins/db.ts` but the existing app uses `@fastify/autoload` from `apps/api/src/app/plugins/`
- **Fix:** Created plugin at `apps/api/src/app/plugins/db.ts` to be auto-loaded by existing infrastructure
- **Files modified:** apps/api/src/app/plugins/db.ts
- **Verification:** Build passes, plugin is in autoload directory
- **Committed in:** e568757 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for correct module resolution and Fastify plugin loading. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Database connection will be set up in Plan 03 (Docker Compose).

## Next Phase Readiness
- Database schema and client are ready for Plan 03 (Docker Compose + PostgreSQL)
- Prisma migrations cannot be run until PostgreSQL is available (Plan 03)
- Seed script is ready to run after migrations
- All subsequent phases can import `prisma` and generated types from `@office-jam/db`
- Fastify app has db plugin and health endpoint ready for integration testing

## Self-Check: PASSED

All 11 created files verified present. Both task commits (4cc4269, e568757) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-24*
