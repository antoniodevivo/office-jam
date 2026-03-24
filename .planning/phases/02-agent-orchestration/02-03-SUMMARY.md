---
phase: 02-agent-orchestration
plan: 03
subsystem: api
tags: [langgraph, langchain, supervisor, multi-agent, guardrails, zod, workflow, orchestration]

# Dependency graph
requires:
  - phase: 02-agent-orchestration/01
    provides: "Prisma schema, encryption service, shared orchestration types (GuardrailConfig, DEFAULT_GUARDRAILS, AgentOutput)"
  - phase: 02-agent-orchestration/02
    provides: "createChatModel LLM factory, Agent/Task CRUD routes, Office LLM config routes"
provides:
  - "WorkflowState Annotation-based state schema with messages, task metadata, guardrail fields, agentOutputs"
  - "createAgentNode factory that builds compiled LangGraph agents from role + system prompt + ChatModel"
  - "checkGuardrails function for post-invocation timeout/iteration/budget breach detection"
  - "buildWorkflow assembles a LangGraph supervisor graph from task assignments and office config"
  - "WorkflowResult type returning compiled graph + guardrailConfig for caller enforcement"
  - "TaskOutputSchema and AgentHandoffSchema Zod validation schemas for structured agent output"
affects: [02-agent-orchestration/04]

# Tech tracking
tech-stack:
  added: ["@langchain/langgraph", "@langchain/langgraph-supervisor", "@langchain/langgraph-checkpoint", "langchain"]
  patterns: ["LangGraph Annotation.Root for state schema with custom reducers", "createAgent + builder.compile for named agent nodes", "createSupervisor for multi-agent delegation topology", "Post-invocation guardrail enforcement (not conditional edges)", "Role-specific system prompt templates for agent behavior"]

key-files:
  created:
    - "apps/api/src/app/services/orchestration/state.ts"
    - "apps/api/src/app/services/orchestration/agent-node.ts"
    - "apps/api/src/app/services/orchestration/guardrails.ts"
    - "apps/api/src/app/services/orchestration/schemas/task-output.schema.ts"
    - "apps/api/src/app/services/orchestration/schemas/agent-handoff.schema.ts"
    - "apps/api/src/app/services/orchestration/workflow.ts"
    - "apps/api/src/app/services/orchestration/guardrails.test.ts"
    - "apps/api/src/app/services/orchestration/workflow.test.ts"
  modified:
    - "package.json"

key-decisions:
  - "Used Annotation.Root (not StateSchema) for LangGraph state definition -- more widely documented in LangGraph.js examples"
  - "Guardrails enforced post-invocation by caller, not as conditional edges -- createSupervisor topology is fixed"
  - "Agent nodes compiled via agent.builder.compile({ name }) to produce CompiledStateGraph for createSupervisor"
  - "Return type of createAgentNode uses TypeScript inference instead of explicit CompiledStateGraph generic"

patterns-established:
  - "LangGraph state: Annotation.Root with custom reducers for numeric fields (last-write-wins) and array fields (append)"
  - "Agent creation: createAgent -> builder.compile({ name }) to produce named CompiledStateGraph for supervisor"
  - "Supervisor: createSupervisor({ agents, llm, prompt }) -> compile() for multi-agent delegation"
  - "Guardrails: checkGuardrails(state) returns continue|timeout|max_iterations|budget_exceeded for caller to map to ExecutionStatus"
  - "Role prompts: ROLE_PROMPTS lookup table with CUSTOM fallback, optional systemPrompt appended"

requirements-completed: [ORCH-01, ORCH-05, ORCH-07]

# Metrics
duration: 6min
completed: 2026-03-25
---

# Phase 2 Plan 3: LangGraph Orchestration Engine Summary

**LangGraph supervisor workflow with Annotation state schema, createAgent node factory, post-invocation guardrails (timeout/iterations/budget), and Zod structured output schemas**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T22:55:11Z
- **Completed:** 2026-03-25T00:01:27Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- WorkflowState Annotation with messages, task metadata, and guardrail fields (iterationCount, totalTokensUsed, maxIterations, maxTokenBudget, startedAt, maxExecutionMs)
- createAgentNode factory builds named compiled agents from role-specific system prompts and ChatModel instances
- checkGuardrails detects timeout, max_iterations, and budget_exceeded with priority ordering
- buildWorkflow assembles a full LangGraph supervisor graph from task assignments, decrypts API keys, and returns WorkflowResult with compiled graph + guardrailConfig
- TaskOutputSchema and AgentHandoffSchema provide Zod validation for structured agent outputs
- 15 unit tests covering guardrails priority logic and workflow assembly/key decryption/guardrail config

## Task Commits

Each task was committed atomically:

1. **Task 1: Create orchestration state schema, agent node factory, guardrails, and validation schemas** - `652a87b` (feat)
2. **Task 2: Create workflow builder assembling LangGraph supervisor graph** - `ef8d0cf` (feat)

## Files Created/Modified
- `apps/api/src/app/services/orchestration/state.ts` - WorkflowState Annotation.Root with messages, task metadata, guardrail fields, agentOutputs
- `apps/api/src/app/services/orchestration/agent-node.ts` - createAgentNode factory using createAgent + builder.compile for named agents
- `apps/api/src/app/services/orchestration/guardrails.ts` - checkGuardrails function with timeout > iterations > budget priority
- `apps/api/src/app/services/orchestration/schemas/task-output.schema.ts` - TaskOutputSchema Zod schema (summary, details, confidence, suggestions)
- `apps/api/src/app/services/orchestration/schemas/agent-handoff.schema.ts` - AgentHandoffSchema Zod schema (fromAgent, toAgent, context, completedWork, remainingWork)
- `apps/api/src/app/services/orchestration/workflow.ts` - buildWorkflow assembling supervisor graph with key decryption and guardrail config
- `apps/api/src/app/services/orchestration/guardrails.test.ts` - 6 tests for guardrail priority logic
- `apps/api/src/app/services/orchestration/workflow.test.ts` - 9 tests for workflow assembly, mocking all LLM dependencies
- `package.json` - Added @langchain/langgraph, @langchain/langgraph-supervisor, @langchain/langgraph-checkpoint, langchain

## Decisions Made
- Used `Annotation.Root` instead of `StateSchema` for LangGraph state definition. Both are available in LangGraph.js v1, but Annotation.Root is more widely documented and used in examples. Works correctly with StateGraph.
- Guardrails are enforced **post-invocation** by the caller (execute-task.ts in Plan 04) rather than as conditional edges in the graph. This is because `createSupervisor` produces a fixed graph topology where custom conditional edges cannot be injected. LangGraph's built-in `recursionLimit` provides the hard safety net during invocation.
- Agent nodes are created via `createAgent({ model, name, systemPrompt, tools }).builder.compile({ name })` -- the `.builder.compile({ name })` step is required because `createSupervisor` expects `CompiledStateGraph` with a name property, not the `ReactAgent` object directly.
- Return type of `createAgentNode` uses TypeScript inference instead of explicit `CompiledStateGraph` generic annotation (which requires 2-9 type arguments).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CompiledStateGraph explicit return type on createAgentNode**
- **Found during:** Task 2 (API build verification)
- **Issue:** `CompiledStateGraph` is a generic type requiring 2-9 type arguments; using it bare as return type caused TS2707 error
- **Fix:** Removed explicit return type, letting TypeScript infer the compiled graph type
- **Files modified:** `apps/api/src/app/services/orchestration/agent-node.ts`
- **Verification:** API build passes cleanly
- **Committed in:** `ef8d0cf` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Orchestration engine complete: state schema, agent factory, guardrails, workflow builder all ready
- Plan 04 (execute-task.ts) can now import buildWorkflow and checkGuardrails to wire up task execution
- The caller pattern is: `buildWorkflow(task, config) -> graph.invoke({ messages }, { recursionLimit }) -> checkGuardrails(result) -> map to ExecutionStatus`
- All 15 orchestration tests pass, API build clean

## Self-Check: PASSED

---
*Phase: 02-agent-orchestration*
*Completed: 2026-03-25*
