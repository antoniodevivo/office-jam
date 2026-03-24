---
phase: 02-agent-orchestration
plan: 02
subsystem: api
tags: [langchain, openai, anthropic, google, ollama, zod, fastify, crud, encryption]

# Dependency graph
requires:
  - phase: 02-agent-orchestration/01
    provides: "Prisma schema (Agent, Task, OfficeLlmConfig, Activity models), encryption service, shared types, vitest config"
provides:
  - "createChatModel factory function for OpenAI, Anthropic, Google, and Ollama LLM providers"
  - "Agent CRUD routes with office LLM config inheritance"
  - "Task CRUD routes with optional agent assignments"
  - "Office LLM config routes with encrypted API key storage"
affects: [02-agent-orchestration/03, 02-agent-orchestration/04]

# Tech tracking
tech-stack:
  added: ["@langchain/core", "@langchain/openai", "@langchain/anthropic", "@langchain/google-genai", "@langchain/ollama", "zod"]
  patterns: ["LLM factory pattern (switch on provider)", "Zod inline schema validation for routes", "Encrypted API key storage with boolean flag responses", "Office LLM config inheritance for agents"]

key-files:
  created:
    - "apps/api/src/app/services/llm-factory.ts"
    - "apps/api/src/app/services/llm-factory.test.ts"
    - "apps/api/src/app/routes/agents/index.ts"
    - "apps/api/src/app/routes/agents/_agentId/index.ts"
    - "apps/api/src/app/routes/tasks/index.ts"
    - "apps/api/src/app/routes/tasks/_taskId/index.ts"
    - "apps/api/src/app/routes/offices/_officeId/llm-config.ts"
  modified:
    - "apps/api/src/app/plugins/db.ts"
    - "package.json"

key-decisions:
  - "Fastify type augmentation for prisma decorator added to db plugin file"
  - "Zod schemas defined inline per route file rather than shared schema library"
  - "Office LLM config returns boolean flags (hasOpenaiKey) instead of raw API keys"

patterns-established:
  - "LLM factory: switch on provider string to instantiate correct ChatModel from @langchain packages"
  - "Route structure: Fastify autoload with _paramName directories for path parameters"
  - "Zod validation: parse request.query/body at start of handler, throw on invalid input"
  - "API key security: encrypt on write, boolean flags on read, null to clear"
  - "Agent LLM inheritance: create agents with explicit provider/model or fall back to office defaults"

requirements-completed: [ORCH-02, ORCH-03, ORCH-04, ORCH-08]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 2 Plan 2: LLM Factory, Agent/Task CRUD, and Office Config Routes Summary

**LLM factory with 4 provider support (OpenAI, Anthropic, Google, Ollama), Agent and Task CRUD with Zod validation, and encrypted Office LLM config routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T22:46:21Z
- **Completed:** 2026-03-24T22:51:46Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- LLM factory creates correct ChatModel for all 4 providers with 9 unit tests
- Agent CRUD routes with automatic LLM config inheritance from office defaults
- Task CRUD routes with optional multi-agent assignment and activity logging
- Office LLM config routes with AES-256-GCM encrypted API key storage and boolean flag responses
- Full Zod validation on all route inputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LLM factory and install LangChain provider packages** - `3a907f5` (feat)
2. **Task 2: Create Agent CRUD and Task CRUD routes with Zod validation** - `1751755` (feat)
3. **Task 3: Create Office LLM config routes with encrypted API key storage** - `21b1919` (feat)

## Files Created/Modified
- `apps/api/src/app/services/llm-factory.ts` - Factory function creating ChatModel for 4 providers via switch
- `apps/api/src/app/services/llm-factory.test.ts` - 9 unit tests covering all providers, key validation, custom Ollama URL
- `apps/api/src/app/routes/agents/index.ts` - GET /agents (list by office), POST /agents (create with LLM defaults)
- `apps/api/src/app/routes/agents/_agentId/index.ts` - GET/PUT/DELETE single agent by ID
- `apps/api/src/app/routes/tasks/index.ts` - GET /tasks (list with assignments), POST /tasks (create with agent assignments)
- `apps/api/src/app/routes/tasks/_taskId/index.ts` - GET/PUT/DELETE single task with status change activity logging
- `apps/api/src/app/routes/offices/_officeId/llm-config.ts` - GET/PUT office LLM config with encrypted keys
- `apps/api/src/app/plugins/db.ts` - Added Fastify type augmentation for prisma decorator
- `package.json` - Added @langchain/* packages and zod

## Decisions Made
- Added Fastify type augmentation (`declare module "fastify"`) in the db plugin file where `prisma` is decorated, so all route files get proper PrismaClient typing without importing it
- Zod schemas are defined inline in each route file rather than a shared validation library -- keeps route files self-contained and avoids premature abstraction
- Office LLM config GET returns boolean flags (`hasOpenaiKey`, `hasAnthropicKey`, `hasGoogleKey`) instead of raw keys -- API keys never leave the server in plaintext

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Fastify type augmentation for prisma decorator**
- **Found during:** Task 2 (Agent CRUD routes)
- **Issue:** `fastify.prisma` had no TypeScript type information, causing implicit `any` and no autocomplete on Prisma methods
- **Fix:** Added `declare module "fastify"` type augmentation in `apps/api/src/app/plugins/db.ts` mapping `prisma` to `PrismaClient`
- **Files modified:** `apps/api/src/app/plugins/db.ts`
- **Verification:** API build passes with full type safety on all prisma calls
- **Committed in:** `1751755` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type augmentation was necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LLM factory ready for the orchestration engine (Plan 03) to instantiate provider-specific chat models
- Agent and Task CRUD routes provide the complete API surface for Plans 03 and 04
- Office LLM config routes allow users to configure provider API keys before running tasks
- All routes build and all 13 tests pass (4 encryption + 9 LLM factory)

## Self-Check: PASSED

All 7 created files verified on disk. All 3 task commits (3a907f5, 1751755, 21b1919) verified in git log.

---
*Phase: 02-agent-orchestration*
*Completed: 2026-03-24*
