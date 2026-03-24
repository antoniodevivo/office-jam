# Phase 2: Agent Orchestration - Research

**Researched:** 2026-03-24
**Domain:** LangGraph.js multi-agent orchestration, LangChain.js multi-provider LLM integration, async execution, structured output, API key encryption
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 implements the core agent orchestration engine: CRUD APIs for agents and tasks, a LangGraph stateful workflow that coordinates multiple agents collaboratively, LangChain for unified multi-provider LLM access (OpenAI, Anthropic, Gemini, Ollama), structured output validation between agent handoffs using Zod, and async execution with loop protection. The existing Prisma schema already has Agent, Task, TaskAssignment, Message, and Activity models with appropriate enums -- Phase 2 extends this with per-office LLM configuration and encrypted API key storage.

LangGraph.js v1.2.5 provides a mature graph-based orchestration runtime with `StateGraph`, `StateSchema`, conditional edges, and the `@langchain/langgraph-supervisor` package for hierarchical multi-agent coordination. LangChain.js provider packages (`@langchain/openai`, `@langchain/anthropic`, `@langchain/google-genai`, `@langchain/ollama`) offer a uniform interface across all four required providers. The `langchain` package v1.2.37 provides `createAgent` (the successor to `createReactAgent`) with built-in support for Zod-based structured output via `responseFormat`.

**Primary recommendation:** Use the `@langchain/langgraph-supervisor` `createSupervisor` pattern for agent collaboration, `createAgent` from `langchain` for individual agent nodes, Zod schemas for inter-agent output validation, and a simple in-process async execution model (no BullMQ in v1) with `recursionLimit` and custom timeout/budget tracking in graph state.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- All 4 providers must work in v1: OpenAI (GPT-4o), Anthropic (Claude), Google Gemini, Ollama (local + cloud)
- API keys stored per-office in the database (encrypted at rest) -- not environment variables
- Each office has a default LLM provider/model; new agents inherit it unless overridden
- Ollama endpoint is configurable per-office (supports both localhost:11434 for local and remote/cloud Ollama URLs)
- Ollama must support both local models and cloud-hosted models -- user decides where to point the endpoint

### Claude's Discretion
- Agent collaboration model: how agents work together on a task (sequential, parallel, lead-agent delegation) -- LangGraph workflow topology
- Task execution lifecycle: from creation to completion, assignment logic, status transitions
- Safety guardrails implementation: max iterations, token budgets, execution timeouts, and what happens when limits are hit
- Structured output validation between agent handoffs
- API route design for agent/task CRUD
- Database schema changes needed (e.g., office-level LLM config table, API key encryption)
- LangGraph graph structure and state management
- Error handling and retry strategies

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORCH-01 | LangGraph manages agent workflows with stateful graph-based execution | StateGraph + StateSchema from @langchain/langgraph; createSupervisor for multi-agent topology |
| ORCH-02 | LangChain provides unified LLM access across all supported providers | @langchain/openai, @langchain/anthropic, @langchain/google-genai, @langchain/ollama -- all share BaseChatModel interface |
| ORCH-03 | User can assign specialized roles to agents (CEO, CTO, developer, designer, marketing, legal, etc.) | Existing AgentRole enum + systemPrompt field; role-specific prompt templates for each agent role |
| ORCH-04 | User can configure which LLM provider/model powers each agent (OpenAI, Anthropic, Gemini, Ollama local/cloud) | New OfficeLlmConfig model for per-office defaults + API keys; Agent model already has llmProvider/llmModel fields; factory function to instantiate correct ChatModel |
| ORCH-05 | Agent execution has loop protection: max iterations, max execution time, and token budget limits | LangGraph recursionLimit config + custom graph state fields for iteration count, elapsed time, and token tracking |
| ORCH-06 | Agent orchestration runs asynchronously -- never blocks the API event loop or WebSocket connections | LangGraph graph.invoke() is async by nature; fire-and-forget pattern with status polling; all LLM calls are I/O-bound awaits |
| ORCH-07 | Agent outputs are validated between handoffs (structured output schemas) | Zod schemas + createAgent responseFormat; custom validation nodes between agent handoffs in graph |
| ORCH-08 | User can create a task and assign it to one or more agents for collaborative execution | Task/TaskAssignment CRUD routes + createSupervisor workflow that dynamically creates agent nodes from assignments |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @langchain/langgraph | 1.2.5 | Graph-based agent orchestration runtime | Official LangGraph JS library; StateGraph, conditional edges, checkpointing |
| @langchain/langgraph-supervisor | 1.0.1 | Hierarchical multi-agent supervisor pattern | Official helper for createSupervisor; handles agent routing and delegation |
| @langchain/langgraph-checkpoint | 1.0.1 | State checkpointing for graph execution | Required peer dep of langgraph; enables state persistence |
| @langchain/core | 1.1.36 | Base abstractions (BaseChatModel, messages, tools) | Shared foundation for all LangChain provider packages |
| langchain | 1.2.37 | createAgent, tool definitions, structured output | High-level agent creation with middleware and Zod responseFormat |
| @langchain/openai | 1.3.1 | ChatOpenAI provider | OpenAI GPT-4o integration |
| @langchain/anthropic | 1.3.25 | ChatAnthropic provider | Anthropic Claude integration |
| @langchain/google-genai | 2.1.26 | ChatGoogleGenerativeAI provider | Google Gemini integration |
| @langchain/ollama | 1.2.6 | ChatOllama provider | Ollama local/cloud integration with configurable baseUrl |
| zod | 4.3.6 | Schema validation for structured output and API validation | Used by LangChain for tool schemas and responseFormat; also usable for route validation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fastify-type-provider-zod | 6.1.0 | Zod validation compiler for Fastify routes | Agent/task CRUD route input/output validation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @langchain/langgraph-supervisor | Custom StateGraph with manual routing | Supervisor is simpler for v1; custom graph gives more control but more code |
| langchain createAgent | @langchain/langgraph createReactAgent (deprecated) | createAgent is the v1 successor; createReactAgent still works but deprecated |
| @langchain/google-genai | @langchain/google | google-genai is the newer package (v2.x); @langchain/google is v0.1.x legacy |
| In-process async (fire-and-forget) | BullMQ job queue | BullMQ adds Redis dependency; in-process is sufficient for v1 single-instance Docker |
| Node.js crypto (built-in) | @aes-256-gcm npm package | Built-in crypto has zero deps and full AES-256-GCM support |

**Installation:**
```bash
bun add @langchain/langgraph @langchain/langgraph-supervisor @langchain/langgraph-checkpoint @langchain/core langchain @langchain/openai @langchain/anthropic @langchain/google-genai @langchain/ollama zod fastify-type-provider-zod
```

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/app/
  plugins/
    db.ts                     # (existing) Prisma plugin
    llm.ts                    # NEW: LLM provider factory plugin (decorates fastify.llm)
  routes/
    agents/                   # NEW: Agent CRUD routes
      index.ts                #   GET /, POST /
      _agentId/               #   Parameterized
        index.ts              #   GET /:agentId, PUT, DELETE
    tasks/                    # NEW: Task CRUD + execution routes
      index.ts                #   GET /, POST /
      _taskId/                #   Parameterized
        index.ts              #   GET /:taskId, PUT, DELETE
        execute.ts            #   POST /:taskId/execute (trigger async execution)
    offices/                  # NEW: Office LLM config routes
      _officeId/
        llm-config.ts         #   GET/PUT office LLM config
  services/
    llm-factory.ts            # NEW: Creates ChatModel instances from provider config
    encryption.ts             # NEW: AES-256-GCM encrypt/decrypt for API keys
    orchestration/
      workflow.ts             # NEW: LangGraph supervisor workflow builder
      agent-node.ts           # NEW: Individual agent node factory
      state.ts                # NEW: Graph state schema (StateSchema + Zod)
      guardrails.ts           # NEW: Loop protection, timeout, token budget logic
      schemas/                # NEW: Zod schemas for inter-agent output validation
        task-output.schema.ts
        agent-handoff.schema.ts

libs/db/prisma/
  schema.prisma               # MODIFIED: Add OfficeLlmConfig, TaskExecution models

libs/shared/src/types/
  llm.types.ts                # NEW: LLM provider enum, config interfaces
  orchestration.types.ts      # NEW: Execution status, guardrail config types
```

### Pattern 1: Supervisor-Delegated Multi-Agent Workflow

**What:** A central supervisor agent (powered by a lead LLM) receives a task, decides which specialized agents to invoke, and routes work between them. Each agent is a node in a LangGraph StateGraph. The supervisor uses `createSupervisor` from `@langchain/langgraph-supervisor`.

**When to use:** Any task assigned to multiple agents.

**Example:**
```typescript
// Source: LangGraph.js docs + @langchain/langgraph-supervisor README
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

// Create specialized agent nodes
const developerAgent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4o", apiKey }),
  tools: [/* developer-specific tools */],
  name: "developer",
  systemPrompt: "You are a senior software developer...",
  responseFormat: z.object({
    analysis: z.string(),
    recommendation: z.string(),
    confidence: z.number().min(0).max(1),
  }),
});

const designerAgent = createAgent({
  model: new ChatAnthropic({ model: "claude-sonnet-4-20250514", apiKey }),
  tools: [],
  name: "designer",
  systemPrompt: "You are a UI/UX designer...",
  responseFormat: z.object({
    design_feedback: z.string(),
    suggested_changes: z.array(z.string()),
  }),
});

// Create supervisor that orchestrates the team
const workflow = createSupervisor({
  agents: [developerAgent, designerAgent],
  llm: supervisorModel,
  prompt: "You are a project manager. Route tasks to the appropriate team member.",
});

const graph = workflow.compile();
const result = await graph.invoke({
  messages: [{ role: "user", content: taskDescription }],
});
```

### Pattern 2: LLM Provider Factory

**What:** A factory function that instantiates the correct LangChain ChatModel based on provider/model strings and per-office API key configuration stored in the database.

**When to use:** Every time an agent needs an LLM instance -- called during workflow setup.

**Example:**
```typescript
// Source: LangChain.js integration docs
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export function createChatModel(
  provider: string,
  model: string,
  apiKey: string | null,
  ollamaBaseUrl?: string
): BaseChatModel {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({ model, apiKey: apiKey! });
    case "anthropic":
      return new ChatAnthropic({ model, apiKey: apiKey! });
    case "google":
      return new ChatGoogleGenerativeAI({ model, apiKey: apiKey! });
    case "ollama":
      return new ChatOllama({ model, baseUrl: ollamaBaseUrl ?? "http://127.0.0.1:11434" });
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
```

### Pattern 3: Graph State with Guardrails

**What:** Define LangGraph state using `StateSchema` with fields for messages, iteration tracking, token usage, and execution metadata. Guardrail checks are conditional edges.

**When to use:** Every agent workflow execution.

**Example:**
```typescript
// Source: LangGraph.js Graph API docs
import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";
import { z } from "zod/v4";

const WorkflowState = new StateSchema({
  messages: MessagesValue,
  taskId: z.string(),
  currentAgent: z.string().optional(),
  iterationCount: z.number().default(0),
  totalTokensUsed: z.number().default(0),
  maxIterations: z.number().default(10),
  maxTokenBudget: z.number().default(50000),
  startedAt: z.number().default(() => Date.now()),
  maxExecutionMs: z.number().default(300000), // 5 minutes
  status: z.enum(["running", "completed", "failed", "budget_exceeded", "timeout"]).default("running"),
  agentOutputs: new ReducedValue(
    z.array(z.object({
      agentName: z.string(),
      output: z.unknown(),
      tokensUsed: z.number(),
    })).default(() => []),
    { reducer: (curr, update) => [...curr, ...update] }
  ),
});
```

### Pattern 4: API Key Encryption at Rest

**What:** Use Node.js built-in `crypto` module with AES-256-GCM to encrypt API keys before storing in PostgreSQL. Store IV + authTag + ciphertext together. Encryption key from environment variable.

**When to use:** Any time an API key is written to or read from the OfficeLlmConfig table.

**Example:**
```typescript
// Source: Node.js crypto docs
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as: iv:authTag:ciphertext (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
```

### Pattern 5: Async Fire-and-Forget Execution

**What:** Task execution runs in-process as an unresolved Promise. The API endpoint triggers execution and immediately returns a `202 Accepted` with a task execution ID. The client polls for status or receives updates via WebSocket (Phase 3). The graph.invoke() call is fully async and non-blocking since all LLM calls are I/O awaits.

**When to use:** POST /tasks/:taskId/execute endpoint.

**Example:**
```typescript
// POST /tasks/:taskId/execute
fastify.post("/:taskId/execute", async (request, reply) => {
  const { taskId } = request.params;
  // Validate task exists, has assignments, etc.
  const task = await fastify.prisma.task.findUnique({
    where: { id: taskId },
    include: { assignments: { include: { agent: true } } },
  });

  // Fire and forget -- do NOT await
  executeTaskWorkflow(task, fastify.prisma).catch((err) => {
    fastify.log.error({ err, taskId }, "Task execution failed");
  });

  return reply.code(202).send({ taskId, status: "IN_PROGRESS" });
});

async function executeTaskWorkflow(task: TaskWithAgents, prisma: PrismaClient) {
  await prisma.task.update({ where: { id: task.id }, data: { status: "IN_PROGRESS" } });
  try {
    const graph = buildWorkflowForTask(task);
    const result = await graph.invoke({
      messages: [{ role: "user", content: task.description }],
    }, { recursionLimit: task.maxIterations ?? 25 });
    await prisma.task.update({ where: { id: task.id }, data: { status: "COMPLETED" } });
  } catch (error) {
    await prisma.task.update({ where: { id: task.id }, data: { status: "FAILED" } });
  }
}
```

### Anti-Patterns to Avoid

- **Blocking the event loop with synchronous LLM calls:** All LangChain model.invoke() calls are async. Never wrap them in synchronous patterns.
- **Storing API keys in plaintext:** Always encrypt with AES-256-GCM before database storage.
- **Hardcoding provider config in environment variables:** The decision is per-office DB config, not .env files for API keys.
- **Awaiting graph.invoke() in the route handler:** This would block the request for the entire execution duration (could be minutes). Use fire-and-forget.
- **Using createReactAgent from @langchain/langgraph:** This is deprecated in v1. Use `createAgent` from `langchain` package instead.
- **Using Annotation from older langgraph versions:** Use `StateSchema` which is the current v1 API for state definition.
- **Global singleton LLM instances:** Each agent may have different providers/models/keys. Create per-execution LLM instances.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-agent routing | Custom if/else routing between agents | `createSupervisor` from @langchain/langgraph-supervisor | Handles message passing, routing decisions, and conversation state |
| LLM provider abstraction | Custom wrapper around each provider API | LangChain provider packages (ChatOpenAI, etc.) | Uniform BaseChatModel interface, built-in streaming, tool calling, retries |
| Agent tool/function calling | Manual JSON schema + prompt engineering | `createAgent` + `tool()` from langchain | Handles schema passing to LLMs, output parsing, retry on parse failure |
| Structured output validation | Manual JSON.parse + custom validation | Zod schemas with `responseFormat` in createAgent | Automatic retry with error feedback, type inference, provider-native structured output |
| Encryption | Custom encryption scheme | Node.js built-in `crypto` with AES-256-GCM | Well-audited, zero deps, handles IV/authTag correctly |
| Graph state management | Custom state tracking objects | LangGraph `StateSchema` + `ReducedValue` | Built-in reducers for parallel updates, checkpoint support, type safety |

**Key insight:** LangGraph + LangChain provide the entire orchestration and LLM abstraction layer. The implementation work is in wiring them together with the application's domain (offices, agents, tasks) and adding guardrails -- not in building agent infrastructure.

## Common Pitfalls

### Pitfall 1: LangGraph recursionLimit Too Low
**What goes wrong:** Complex multi-agent workflows with 3+ agents can exceed the default limit of 25 steps (each agent invocation + routing = multiple steps).
**Why it happens:** Default of 25 is conservative. A supervisor -> agent -> tool -> supervisor round trip consumes multiple steps.
**How to avoid:** Set recursionLimit to a reasonable higher value (e.g., 50-100) based on expected agent count. Also track iteration count in graph state as a secondary check.
**Warning signs:** GraphRecursionError thrown before task completes.

### Pitfall 2: API Key Not Decrypted Before LLM Instantiation
**What goes wrong:** ChatOpenAI receives encrypted ciphertext as apiKey, resulting in authentication errors.
**Why it happens:** Forgetting to call decrypt() when reading OfficeLlmConfig from database.
**How to avoid:** Centralize key decryption in the LLM factory. Never pass raw DB values to ChatModel constructors.
**Warning signs:** 401 errors from LLM providers.

### Pitfall 3: Fire-and-Forget Error Swallowing
**What goes wrong:** Task execution fails silently. Task stays stuck in IN_PROGRESS forever.
**Why it happens:** The .catch() handler only logs but doesn't update task status.
**How to avoid:** Always wrap fire-and-forget in a try/catch that updates the task to FAILED status and logs the error. Use a finally block.
**Warning signs:** Tasks permanently in IN_PROGRESS state.

### Pitfall 4: Missing ENCRYPTION_KEY Environment Variable
**What goes wrong:** Application crashes on first attempt to encrypt/decrypt API keys.
**Why it happens:** Encryption key must be a 64-char hex string (32 bytes). Easy to forget in .env setup.
**How to avoid:** Validate ENCRYPTION_KEY on app startup. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
**Warning signs:** App crash on office LLM config save.

### Pitfall 5: Ollama Requires No API Key but Other Providers Do
**What goes wrong:** Validation rejects Ollama config for missing API key, or null apiKey passed to ChatOpenAI.
**Why it happens:** Ollama is the only provider that doesn't need an API key. The other three require one.
**How to avoid:** Make API key nullable in the schema. Validate presence based on provider type: required for openai/anthropic/google, optional for ollama.
**Warning signs:** Zod validation errors when saving Ollama config, or null pointer errors for cloud providers.

### Pitfall 6: Zod v4 Import Path Change
**What goes wrong:** Import `from "zod"` may behave differently than `from "zod/v4"` in LangGraph context.
**Why it happens:** LangGraph.js v1 StateSchema uses `z` from `"zod/v4"`. The LangChain tool() and responseFormat can use regular `"zod"` import.
**How to avoid:** Use `import { z } from "zod/v4"` when defining StateSchema fields. Use regular `import * as z from "zod"` for LangChain tools and Fastify validation.
**Warning signs:** Type errors or runtime schema validation failures.

## Code Examples

### Creating an Office LLM Config (Database Extension)

```prisma
// New model for libs/db/prisma/schema.prisma
model OfficeLlmConfig {
  id              String   @id @default(uuid())
  officeId        String   @unique
  office          Office   @relation(fields: [officeId], references: [id], onDelete: Cascade)
  defaultProvider String   @default("openai")
  defaultModel    String   @default("gpt-4o")
  // Encrypted API keys (null = not configured)
  openaiApiKey    String?
  anthropicApiKey String?
  googleApiKey    String?
  // Ollama config
  ollamaBaseUrl   String   @default("http://127.0.0.1:11434")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Also need to add to Office model:
// llmConfig  OfficeLlmConfig?
```

### Task Execution Model Extension

```prisma
// Track execution history
model TaskExecution {
  id              String    @id @default(uuid())
  taskId          String
  task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  status          String    @default("running") // running, completed, failed, timeout, budget_exceeded
  iterationCount  Int       @default(0)
  totalTokensUsed Int       @default(0)
  result          Json?
  error           String?
  startedAt       DateTime  @default(now())
  completedAt     DateTime?

  @@index([taskId])
}
```

### Fastify Route with Zod Validation

```typescript
// Source: fastify-type-provider-zod docs
import { z } from "zod";
import { FastifyInstance } from "fastify";

const CreateAgentSchema = {
  body: z.object({
    officeId: z.string().uuid(),
    name: z.string().min(1).max(100),
    role: z.enum(["CEO", "CTO", "DEVELOPER", "DESIGNER", "MARKETING", "LEGAL", "CUSTOM"]),
    systemPrompt: z.string().optional(),
    llmProvider: z.string().optional(),
    llmModel: z.string().optional(),
  }),
  response: {
    201: z.object({
      id: z.string().uuid(),
      name: z.string(),
      role: z.string(),
      llmProvider: z.string(),
      llmModel: z.string(),
    }),
  },
};

export default async function (fastify: FastifyInstance) {
  fastify.post("/", { schema: CreateAgentSchema }, async (request, reply) => {
    const { officeId, name, role, systemPrompt, llmProvider, llmModel } = request.body;

    // If no provider/model specified, inherit from office defaults
    const officeConfig = await fastify.prisma.officeLlmConfig.findUnique({
      where: { officeId },
    });

    const agent = await fastify.prisma.agent.create({
      data: {
        officeId,
        name,
        role,
        systemPrompt,
        llmProvider: llmProvider ?? officeConfig?.defaultProvider ?? "openai",
        llmModel: llmModel ?? officeConfig?.defaultModel ?? "gpt-4o",
      },
    });

    return reply.code(201).send(agent);
  });
}
```

### Guardrails Check Node

```typescript
// Source: LangGraph.js conditional edges docs
import { END } from "@langchain/langgraph";

function checkGuardrails(state: typeof WorkflowState.State): string {
  const elapsed = Date.now() - state.startedAt;

  if (elapsed > state.maxExecutionMs) {
    return "timeout";
  }
  if (state.iterationCount >= state.maxIterations) {
    return "max_iterations";
  }
  if (state.totalTokensUsed >= state.maxTokenBudget) {
    return "budget_exceeded";
  }
  return "continue";
}

// Wire into graph
graph.addConditionalEdges("guardrail_check", checkGuardrails, {
  timeout: "finalize_timeout",
  max_iterations: "finalize_max_iter",
  budget_exceeded: "finalize_budget",
  continue: "supervisor",
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| createReactAgent (langgraph prebuilt) | createAgent (langchain package) | LangGraph v1 (2025) | Simpler API, middleware support, unified with langchain |
| Annotation system | StateSchema | LangGraph v1 (2025) | More Zod-native, standard schema support |
| Custom supervisor routing | @langchain/langgraph-supervisor createSupervisor | 2025 | Official package for hierarchical multi-agent patterns |
| Manual JSON parsing for structured output | responseFormat with Zod schemas | LangChain 2025 | Automatic validation, retry on parse failure, type inference |
| @langchain/community providers | Dedicated provider packages (@langchain/openai, etc.) | 2024-2025 | Each provider is independently versioned and maintained |

**Deprecated/outdated:**
- `createReactAgent` from `@langchain/langgraph`: Deprecated in favor of `createAgent` from `langchain`
- `Annotation` from `@langchain/langgraph`: Replaced by `StateSchema`
- `@langchain/community` chat models: Split into individual provider packages

## Open Questions

1. **Token Usage Tracking**
   - What we know: LangChain chat models emit token usage in response metadata. LangGraph does not natively aggregate token counts across steps.
   - What's unclear: Whether all four providers (especially Ollama) consistently report token usage in their responses.
   - Recommendation: Track tokens in graph state via a callback handler. For Ollama, tokens may need to be estimated or may be unavailable -- handle gracefully with 0 as fallback.

2. **createAgent vs createSupervisor compatibility**
   - What we know: `createSupervisor` accepts an array of compiled agents. `createAgent` returns something that can be passed to it.
   - What's unclear: Whether `createAgent` output is directly compatible with `createSupervisor` agents array, or if it needs `.compile()` first. GitHub issue #7913 mentions type mismatches.
   - Recommendation: Test this during implementation. Fallback is to use `createReactAgent` from langgraph prebuilt (still works, just deprecated) or build agents as raw StateGraph nodes.

3. **Zod v4 vs Zod v3 compatibility**
   - What we know: LangGraph StateSchema uses `zod/v4` imports. LangChain tools and Fastify validation may use standard `zod` imports. Zod 4.3.6 is current.
   - What's unclear: Whether mixing `import from "zod"` and `import from "zod/v4"` causes issues in the same project.
   - Recommendation: Start with standard `import { z } from "zod"` everywhere. Switch to `"zod/v4"` only where StateSchema requires it. Test early.

4. **Google Gemini package naming**
   - What we know: There are two packages -- `@langchain/google-genai` (v2.1.26, active) and `@langchain/google` (v0.1.8, older). The official docs currently show `ChatGoogle` from `@langchain/google`.
   - What's unclear: Which is the recommended package going forward. The docs page shows `@langchain/google` but `@langchain/google-genai` has higher version and more recent updates.
   - Recommendation: Use `@langchain/google-genai` with `ChatGoogleGenerativeAI` -- it's the more actively maintained package with v2.x version line.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.x (already configured for libs/shared and libs/db) |
| Config file | apps/api needs vitest.config.mts (Wave 0 gap) |
| Quick run command | `bunx nx run api:test` |
| Full suite command | `bunx nx run-many -t test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORCH-01 | LangGraph StateGraph builds and compiles a valid workflow | unit | `bunx vitest run apps/api/src/app/services/orchestration/workflow.test.ts` | No -- Wave 0 |
| ORCH-02 | LLM factory creates correct ChatModel for each provider | unit | `bunx vitest run apps/api/src/app/services/llm-factory.test.ts` | No -- Wave 0 |
| ORCH-03 | Agent CRUD creates agent with role and default LLM config | integration | `bunx vitest run apps/api/src/app/routes/agents/agents.test.ts` | No -- Wave 0 |
| ORCH-04 | Agent inherits office default provider; can override per-agent | integration | `bunx vitest run apps/api/src/app/routes/agents/agents.test.ts` | No -- Wave 0 |
| ORCH-05 | Guardrail check returns correct status for limits exceeded | unit | `bunx vitest run apps/api/src/app/services/orchestration/guardrails.test.ts` | No -- Wave 0 |
| ORCH-06 | Task execution returns 202 immediately without blocking | integration | `bunx vitest run apps/api/src/app/routes/tasks/execute.test.ts` | No -- Wave 0 |
| ORCH-07 | Structured output validated between handoffs; invalid output caught | unit | `bunx vitest run apps/api/src/app/services/orchestration/schemas/validation.test.ts` | No -- Wave 0 |
| ORCH-08 | Task CRUD creates task with agent assignments | integration | `bunx vitest run apps/api/src/app/routes/tasks/tasks.test.ts` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `bunx vitest run --reporter=verbose` (relevant test file)
- **Per wave merge:** `bunx nx run-many -t test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/vitest.config.mts` -- Vitest config for API app (does not exist; libs have configs but apps/api does not)
- [ ] `apps/api/project.json` -- Add `test` target pointing to vitest config
- [ ] `apps/api/src/app/services/orchestration/workflow.test.ts` -- Covers ORCH-01
- [ ] `apps/api/src/app/services/llm-factory.test.ts` -- Covers ORCH-02
- [ ] `apps/api/src/app/routes/agents/agents.test.ts` -- Covers ORCH-03, ORCH-04
- [ ] `apps/api/src/app/services/orchestration/guardrails.test.ts` -- Covers ORCH-05
- [ ] `apps/api/src/app/routes/tasks/execute.test.ts` -- Covers ORCH-06
- [ ] `apps/api/src/app/services/orchestration/schemas/validation.test.ts` -- Covers ORCH-07
- [ ] `apps/api/src/app/routes/tasks/tasks.test.ts` -- Covers ORCH-08
- [ ] Vitest + Fastify test helper (light-my-request) for route testing

## Sources

### Primary (HIGH confidence)
- [@langchain/langgraph npm](https://www.npmjs.com/package/@langchain/langgraph) - v1.2.5, published 2026-03-20
- [LangGraph.js Graph API docs](https://docs.langchain.com/oss/javascript/langgraph/graph-api) - StateGraph, StateSchema, nodes, edges, conditional edges
- [LangGraph.js Overview docs](https://docs.langchain.com/oss/javascript/langgraph/overview) - Installation, getting started
- [LangGraph v1 Release Notes](https://docs.langchain.com/oss/javascript/releases/langgraph-v1) - createReactAgent deprecation, StateSchema, typed interrupts
- [LangChain.js Chat Model Integrations](https://docs.langchain.com/oss/javascript/integrations/chat) - Provider packages and setup
- [LangChain.js Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output) - Zod responseFormat, providerStrategy, toolStrategy
- [LangChain.js Agents docs](https://docs.langchain.com/oss/javascript/langchain/agents) - createAgent API
- [ChatOllama Integration docs](https://docs.langchain.com/oss/javascript/integrations/chat/ollama) - baseUrl configuration
- [Node.js crypto docs](https://nodejs.org/api/crypto.html) - AES-256-GCM implementation
- npm registry version verification for all packages (via `npm view`)

### Secondary (MEDIUM confidence)
- [langgraph-supervisor GitHub README](https://github.com/langchain-ai/langgraphjs/tree/main/libs/langgraph-supervisor) - createSupervisor API, multi-level hierarchies
- [fastify-type-provider-zod GitHub](https://github.com/turkerdev/fastify-type-provider-zod) - Zod integration with Fastify
- [Supervisor Pattern article](https://dev.to/programmingcentral/the-supervisor-pattern-stop-writing-monolithic-agents-and-start-orchestrating-teams-2olk) - Multi-agent architecture patterns
- [AES-256-GCM with Node.js gist](https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81) - Encryption implementation pattern

### Tertiary (LOW confidence)
- [LangGraph.js issue #7913](https://github.com/langchain-ai/langchainjs/issues/7913) - Type mismatch between createAgent and supervisor (may be resolved in latest)
- [LangGraph.js issue #1524](https://github.com/langchain-ai/langgraphjs/issues/1524) - recursionLimit config behavior
- Training data knowledge about BullMQ for async execution (validated unnecessary for v1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All package versions verified against npm registry (2026-03-24). LangGraph.js v1.2.5 published 4 days ago.
- Architecture: MEDIUM-HIGH - Supervisor pattern is well-documented. createAgent/createSupervisor integration has a known issue (#7913) that may need workaround.
- Pitfalls: MEDIUM - Zod v4 import path issue identified from LangGraph docs but not yet tested in practice. Token tracking across providers is uncertain.
- LLM Factory: HIGH - All four provider packages verified and documented with consistent ChatModel interface.
- Encryption: HIGH - AES-256-GCM with Node.js crypto is well-established and requires no external deps.
- Async execution: MEDIUM - Fire-and-forget pattern is straightforward but Phase 3 (WebSocket) will need to integrate with it later.

**Research date:** 2026-03-24
**Valid until:** 2026-04-07 (LangChain/LangGraph ecosystem moves fast; re-verify before implementation if delayed)
