---
phase: 01-foundation
plan: 03
subsystem: infra, shared-types
tags: [docker, docker-compose, nginx, prisma-migration, shared-types, bun]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: Nx monorepo with apps/api, apps/web, libs/shared, libs/db
  - phase: 01-foundation/02
    provides: Prisma schema with 6 models, client singleton, Fastify db plugin, seed script
provides:
  - Docker Compose orchestration with PostgreSQL, API, and web services
  - Named pgdata volume for data persistence across restarts
  - API Dockerfile (multi-stage, bun, prisma migrate deploy on startup)
  - Web Dockerfile (multi-stage, bun build + nginx serving)
  - Shared domain types mirroring Prisma schema (office, agent, task, message, activity, ws-events)
  - Barrel export in libs/shared/src/index.ts
  - First Prisma migration applied (init)
  - Seed script creating default Headquarters office
  - .env.example documenting all environment variables
affects: [all subsequent phases]

# Tech tracking
tech-stack:
  added: [docker-compose, nginx, postgres:17-alpine]
  patterns: [multi-stage-docker-build, named-volume-persistence, healthcheck-dependency, bun-runtime-in-docker, prisma-migrate-deploy-on-startup, barrel-exports, domain-type-mirroring]

key-files:
  created:
    - docker-compose.yml
    - apps/api/Dockerfile
    - apps/web/Dockerfile
    - apps/web/nginx.conf
    - .env.example
    - libs/shared/src/types/office.types.ts
    - libs/shared/src/types/agent.types.ts
    - libs/shared/src/types/task.types.ts
    - libs/shared/src/types/message.types.ts
    - libs/shared/src/types/activity.types.ts
    - libs/shared/src/types/ws-events.ts
    - libs/db/prisma/migrations/20260324200834_init/migration.sql
  modified:
    - libs/shared/src/index.ts
    - libs/db/.env.example

key-decisions:
  - "DB port mapped to 5433 on host (configurable via DB_PORT env var) to avoid conflicts with local PostgreSQL"
  - "Dockerfiles use oven/bun:1 base image instead of node:22-alpine (project uses bun as package manager)"
  - "API Dockerfile runs prisma migrate deploy on startup via CMD"
  - "Web Dockerfile uses nginx:alpine for serving static build output with SPA routing"
  - "Shared types are plain TypeScript interfaces/enums mirroring Prisma schema -- no Prisma dependency in frontend"

patterns-established:
  - "Domain types in libs/shared/src/types/ mirror Prisma models as plain TS interfaces"
  - "Barrel re-exports in libs/shared/src/index.ts for all type modules"
  - "Docker Compose healthcheck gates API startup on PostgreSQL readiness"

requirements-completed: [INFR-02, INFR-04]

# Metrics
duration: ~10min
completed: 2026-03-24
---

# Phase 1 Plan 03: Docker Compose, Shared Types & First Migration Summary

**Docker Compose orchestration with persistent PostgreSQL, multi-stage Dockerfiles for API and web, shared domain types mirroring Prisma schema, and first migration applied**

## Performance

- **Completed:** 2026-03-24
- **Tasks:** 1 (+ post-fix commits)
- **Files created/modified:** 14

## Accomplishments
- Created docker-compose.yml with 3 services (db, api, web) and pgdata named volume for persistence
- API service depends on db with `condition: service_healthy` ensuring PostgreSQL is ready before startup
- Multi-stage API Dockerfile using oven/bun:1 with prisma migrate deploy in CMD
- Multi-stage web Dockerfile with bun build + nginx:alpine serving with SPA routing
- Created 6 shared domain type files mirroring all Prisma models (Office, Agent, Task, Message, Activity, WsEvents)
- Barrel export in libs/shared/src/index.ts re-exports all type modules
- First Prisma migration (init) created and applied
- Seed script creates default "Headquarters" office
- .env.example files documenting all environment variables

## Task Commits

1. **feat(01-03): add Docker Compose, Dockerfiles, shared types, and first migration** - `1665a8c`
2. **fix(01-03): correct Prisma generated client path in API Dockerfile** - `c3e79f3`
3. **build(deps): migrate from node to bun runtime in Dockerfiles** - `e129aa8`
4. **build(db): relocate Prisma generated client to src directory** - `8f40ea1`

## Files Created/Modified
- `docker-compose.yml` - Full-stack orchestration with PostgreSQL, API, and web services + pgdata volume
- `apps/api/Dockerfile` - Multi-stage bun build with prisma migrate deploy on startup
- `apps/web/Dockerfile` - Multi-stage bun build + nginx:alpine for static serving
- `apps/web/nginx.conf` - Nginx config with SPA routing on port 4200
- `.env.example` - Root environment variable documentation
- `libs/db/.env.example` - Database-specific environment variables
- `libs/shared/src/types/office.types.ts` - Office domain types
- `libs/shared/src/types/agent.types.ts` - Agent domain types with AgentRole enum
- `libs/shared/src/types/task.types.ts` - Task domain types with TaskStatus enum
- `libs/shared/src/types/message.types.ts` - Message domain types
- `libs/shared/src/types/activity.types.ts` - Activity domain types with ActivityType enum
- `libs/shared/src/types/ws-events.ts` - WebSocket event types (placeholder for Phase 3)
- `libs/shared/src/index.ts` - Updated barrel export for all type modules
- `libs/db/prisma/migrations/20260324200834_init/migration.sql` - Initial migration

## Deviations from Plan

### Adapted
1. **DB port changed from 5432 to 5433 (host side)** - Avoids conflicts with local PostgreSQL; configurable via `DB_PORT` env var
2. **Dockerfiles use oven/bun:1 instead of node:22-alpine** - Project standardized on bun as package manager
3. **Prisma generated client relocated to src directory** - Fixed path issues in subsequent commit (8f40ea1)

**Total deviations:** 3 adaptations (all improvements, no regressions)

## Issues Encountered
- Prisma generated client path needed correction after initial implementation (fixed in c3e79f3 and 8f40ea1)

## Next Phase Readiness
- Complete local development environment operational
- `docker compose up` starts full stack; `docker compose up db` for native dev workflow
- All shared types available via `@office-jam/shared` for both API and web
- Database schema migrated and seeded, ready for Phase 2 (Agent Orchestration)

## Self-Check: PASSED

All planned artifacts verified present. Docker Compose valid. Shared types mirror Prisma schema.

---
*Phase: 01-foundation*
*Completed: 2026-03-24*
