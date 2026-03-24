# Phase 1: Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A working local development environment with a persistent database schema that supports the full application data model. Delivers: Nx monorepo structure, Prisma/PostgreSQL schema (offices, agents, tasks, messages, activities), Docker Compose for single-command startup, and data persistence across restarts.

</domain>

<decisions>
## Implementation Decisions

### Monorepo layout
- Nx workspace with `apps/` + `libs/` convention
- Two apps: `apps/web` (React + PixiJS frontend), `apps/api` (Fastify backend)
- Start with 2 libs: `libs/shared` (types + utils combined) and `libs/db` (Prisma schema + generated client). Split into more granular libs only when complexity demands it
- All packages use `@office-jam/` scope prefix: `@office-jam/web`, `@office-jam/api`, `@office-jam/shared`, `@office-jam/db`

### Shared types organization
- Types organized by domain within `libs/shared/src/types/`: `agent.types.ts`, `task.types.ts`, `office.types.ts`, `message.types.ts`, `activity.types.ts`, `ws-events.ts`
- Barrel export from `libs/shared/src/index.ts`
- Utils in `libs/shared/src/utils/`

### Claude's Discretion
- Database schema design: entity relationships, field types, indexes, constraints
- Docker Compose configuration: services, volumes, networking, hot-reload strategy
- Dev workflow: local dev servers vs containerized development
- Seed data approach
- Prisma migration strategy
- TypeScript configuration (tsconfig paths, strict mode, etc.)
- Nx configuration files and build targets

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project architecture
- `.planning/PROJECT.md` -- Stack decisions (Nx, Fastify, Prisma, LangGraph, LangChain), constraints, and key decisions table
- `.planning/REQUIREMENTS.md` -- INFR-01 through INFR-05 define Phase 1 requirements
- `.planning/ROADMAP.md` -- Phase 1 success criteria (5 criteria that must be TRUE)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None -- greenfield project, no existing code

### Established Patterns
- None yet -- Phase 1 establishes the foundational patterns for all subsequent phases

### Integration Points
- Prisma schema in `libs/db` will be consumed by `apps/api` for all database operations
- Shared types in `libs/shared` will be imported by both `apps/web` and `apps/api`
- Docker Compose will orchestrate PostgreSQL + app services

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-24*
