# Phase 2: Agent Orchestration - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create agents with specialized roles, configure their LLM providers, assign tasks, and watch agents collaborate through a safe, async orchestration pipeline. Covers: CRUD API for agents and tasks, LangGraph stateful workflows, LangChain multi-provider LLM integration, agent collaboration, loop protection, structured output validation, and async execution that never blocks the event loop.

</domain>

<decisions>
## Implementation Decisions

### LLM provider configuration
- All 4 providers must work in v1: OpenAI (GPT-4o), Anthropic (Claude), Google Gemini, Ollama (local + cloud)
- API keys stored per-office in the database (encrypted at rest) — not environment variables
- Each office has a default LLM provider/model; new agents inherit it unless overridden
- Ollama endpoint is configurable per-office (supports both localhost:11434 for local and remote/cloud Ollama URLs)
- Ollama must support both local models and cloud-hosted models — user decides where to point the endpoint

### Claude's Discretion
- Agent collaboration model: how agents work together on a task (sequential, parallel, lead-agent delegation) — LangGraph workflow topology
- Task execution lifecycle: from creation to completion, assignment logic, status transitions
- Safety guardrails implementation: max iterations, token budgets, execution timeouts, and what happens when limits are hit
- Structured output validation between agent handoffs
- API route design for agent/task CRUD
- Database schema changes needed (e.g., office-level LLM config table, API key encryption)
- LangGraph graph structure and state management
- Error handling and retry strategies

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project architecture
- `.planning/PROJECT.md` — Stack decisions (LangGraph for orchestration, LangChain for LLM integration), constraints, key decisions
- `.planning/REQUIREMENTS.md` — ORCH-01 through ORCH-08 define Phase 2 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 criteria that must be TRUE)

### Phase 1 foundation
- `.planning/phases/01-foundation/01-CONTEXT.md` — Monorepo layout, shared types organization, Claude's discretion areas
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — Prisma schema details (6 models), client singleton pattern, Fastify db plugin
- `.planning/phases/01-foundation/01-03-SUMMARY.md` — Docker setup, shared domain types, established patterns

### Existing code
- `libs/db/prisma/schema.prisma` — Current schema with Agent (role, llmProvider, llmModel), Task, TaskAssignment, Message, Activity models
- `libs/shared/src/types/agent.types.ts` — AgentRole enum (CEO, CTO, DEVELOPER, DESIGNER, MARKETING, LEGAL, CUSTOM), Agent/CreateAgentInput interfaces
- `libs/shared/src/types/task.types.ts` — TaskStatus enum, Task/CreateTaskInput/TaskAssignment interfaces
- `apps/api/src/app/app.ts` — Fastify app with autoload for plugins and routes
- `apps/api/src/app/plugins/db.ts` — Prisma client decorated on Fastify instance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `libs/db/prisma/schema.prisma`: Agent model already has `llmProvider` (default "openai") and `llmModel` (default "gpt-4o") fields — needs extension for per-office config and API key storage
- `libs/shared/src/types/agent.types.ts`: AgentRole enum and Agent interface ready for API consumption
- `libs/shared/src/types/task.types.ts`: TaskStatus enum and Task interface ready for status tracking
- `apps/api/src/app/plugins/db.ts`: Prisma singleton via Fastify decorator — all new routes can access `fastify.prisma`
- Fastify autoload pattern: new route files in `apps/api/src/app/routes/` are auto-registered

### Established Patterns
- Autoload plugin/route discovery in Fastify — add new files, they register automatically
- Prisma singleton with PrismaPg driver adapter via `globalForPrisma` pattern
- Domain types in `libs/shared/src/types/` mirror Prisma models as plain TS interfaces
- `@office-jam/*` scope for all cross-package imports

### Integration Points
- New routes go in `apps/api/src/app/routes/` (autoloaded)
- New plugins go in `apps/api/src/app/plugins/` (autoloaded)
- Schema changes in `libs/db/prisma/schema.prisma` → generate client → update shared types
- LangGraph/LangChain will likely become a new plugin or service layer in the API

</code_context>

<specifics>
## Specific Ideas

- Ollama cloud support is important — not just local models. The configurable endpoint handles both use cases (local: `http://localhost:11434`, cloud: remote URL)
- Per-office API key storage means different offices can use different provider accounts — important for isolation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-agent-orchestration*
*Context gathered: 2026-03-24*
