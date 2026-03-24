# Pitfalls Research

**Domain:** Multi-agent virtual office platform (CrewAI + pixel-art frontend + multi-LLM)
**Researched:** 2026-03-24
**Confidence:** HIGH (multiple sources, CrewAI community issues, official docs, production post-mortems)

## Critical Pitfalls

### Pitfall 1: Agent Infinite Loops and Token Cost Explosion

**What goes wrong:**
CrewAI agents enter infinite conversation loops where Agent A requests clarification from Agent B, which in turn asks Agent A for more context, cycling indefinitely. This is the single most common and most expensive failure mode. A real-world documented case saw costs escalate from $127/week to $47,000 over four weeks because an agent loop ran undetected for 11 days.

**Why it happens:**
Three root causes cover 90% of cases: (1) no `max_iter` or `max_turns` set on agents/tasks -- most frameworks do not set this by default, (2) termination conditions that never evaluate to True, and (3) agent system prompts that lack a clear "done" signal. When no agent has a clear termination condition, each defaults to its next best move: asking another agent for help.

**How to avoid:**
- Set `max_iter` on every agent (start with 10-15, tune per role).
- Set `max_execution_time` on every task (e.g., 300 seconds for simple tasks, 600 for complex).
- Implement a global token budget per crew execution. CrewAI does not provide this natively -- build a callback that tracks cumulative token usage and raises a hard stop.
- Use AgentOps integration from day one for Recursive Thought Detection.
- Define explicit terminal states (SUCCESS/FAILED) in tool responses so agents stop retrying completed operations.
- Design agent prompts with explicit "you are DONE when..." conditions.

**Warning signs:**
- Token costs per execution growing without corresponding output quality improvement.
- Single task executions taking 5x longer than expected.
- Agent logs showing repetitive patterns (same tool call, same question, back-and-forth delegation).
- Identical or near-identical messages appearing in agent conversation history.

**Phase to address:**
Phase 1 (Core Backend). This must be baked into the agent orchestration layer from the very first agent execution. Never demo without loop protection.

---

### Pitfall 2: CrewAI Hierarchical Process Does Not Work as Documented

**What goes wrong:**
The CrewAI hierarchical manager-worker process is documented as enabling a manager agent to selectively delegate tasks to worker agents. In practice, it executes all tasks sequentially regardless, the manager does not effectively coordinate agents, and delegation fails with type validation errors (DelegateWorkToolSchema expects strings, manager passes dicts). This leads to incorrect agent invocation, overwritten outputs, and inflated token costs.

**Why it happens:**
CrewAI's core orchestration logic for hierarchical process is fundamentally weak. The manager prompt provided by CrewAI is too generic to produce correct routing behavior. Multiple open bugs exist (Issue #4783, Issue #2606, Issue #1851) with no resolution as of early 2026. Community consensus is that hierarchical mode "does not actually work."

**How to avoid:**
- Do NOT use `process=Process.hierarchical` with CrewAI's default manager. It will waste tokens and produce incorrect results.
- Use `process=Process.sequential` for predictable task execution, or build a custom orchestration layer.
- If manager-worker delegation is required (the office CEO delegating to departments), implement a custom manager agent with explicit step-by-step instructions that conditionally calls only required agents, synthesizes outputs, and terminates.
- Use CrewAI Flows for complex multi-step orchestration instead of relying on hierarchical process.

**Warning signs:**
- Manager agent executing tasks itself instead of delegating.
- All agents running on every task regardless of relevance.
- TypeError or validation errors in delegation calls.
- Token usage 3-5x higher than expected for simple multi-agent tasks.

**Phase to address:**
Phase 1 (Core Backend). The entire agent orchestration architecture depends on understanding this limitation. Design around it, not into it.

---

### Pitfall 3: CrewAI Memory Vanishes in Docker Containers

**What goes wrong:**
CrewAI stores memory (long-term, entity, contextual) in local machine-bound directories using SQLite (via ChromaDB for vector storage). Any container restart, redeployment, or fresh container instance starts with a completely blank memory slate. For Office-Jam, which requires "full state persistence across sessions," this means agents lose all accumulated knowledge, conversation history, and learned context on every Docker restart.

**Why it happens:**
CrewAI's default memory storage paths are relative to the project directory inside the container. Without explicit volume mounting and path configuration, Docker's ephemeral filesystem discards everything. Developers often discover this only after building significant functionality on top of the assumption that memory "just persists."

**How to avoid:**
- Configure `db_path` in CrewAI memory settings to point to a known, mountable directory (e.g., `/app/data/memory/`).
- In `docker-compose.yml`, mount a named volume to this directory: `volumes: - office_jam_data:/app/data`.
- Enable SQLite WAL mode for better concurrency when multiple agents access memory simultaneously.
- Build a separate persistence layer (PostgreSQL or dedicated SQLite on volume) for application state that is independent of CrewAI's internal memory -- do not rely solely on CrewAI's memory for critical state.
- Test the persistence story early: start agents, accumulate state, restart container, verify state survives.

**Warning signs:**
- Agents behaving as if they have never seen a task before after container restart.
- ChromaDB `chroma.sqlite3` file not found on host filesystem.
- Memory-dependent features working in dev (bare metal) but failing in Docker.

**Phase to address:**
Phase 1 (Core Backend) for the volume mount and persistence architecture. Phase 2 (Agent System) for verifying memory survives restarts as an explicit acceptance criterion.

---

### Pitfall 4: Async/Event-Loop Collision Between FastAPI and CrewAI

**What goes wrong:**
FastAPI runs on an asyncio event loop. CrewAI's agent execution is fundamentally synchronous -- it blocks the thread. Running CrewAI's `kickoff()` directly in a FastAPI async endpoint will block the entire event loop, freezing all WebSocket connections, HTTP requests, and real-time updates. Every connected client goes unresponsive until the crew finishes.

**Why it happens:**
CrewAI was designed as a script-runner framework, not a web service component. Its `kickoff()` method performs synchronous LLM calls, tool executions, and inter-agent communication. While `kickoff_async()` exists, it simply wraps the synchronous call in a thread. The `akickoff()` method provides native async but CrewAI tools are still synchronous only, so true non-blocking execution is not fully achievable.

**How to avoid:**
- Never call `crew.kickoff()` directly in an async FastAPI route handler.
- Use `asyncio.to_thread()` or `loop.run_in_executor()` with a ThreadPoolExecutor to offload crew execution to a separate thread.
- Better: use a task queue (Celery with Redis, or a simpler asyncio.Queue + worker pattern) to decouple crew execution from the web process entirely.
- Stream agent activity updates via WebSocket from the worker thread/process, not from the crew execution itself.
- Size the ThreadPoolExecutor appropriately -- each concurrent crew execution consumes one thread.

**Warning signs:**
- WebSocket connections dropping or timing out during agent execution.
- Frontend showing "connecting..." or frozen state while agents work.
- HTTP health check endpoints becoming unresponsive.
- `RuntimeError: asyncio.run() cannot be called from a running event loop` errors.

**Phase to address:**
Phase 1 (Core Backend). The async architecture must be designed before any agent execution code is written. Retrofitting async boundaries is extremely painful.

---

### Pitfall 5: Cascading Failures Across Agents

**What goes wrong:**
When one agent produces flawed output (hallucinated data, malformed JSON, wrong assumptions), every downstream agent inherits and amplifies the error. Without validation between agent steps, the system "ships an output nobody wants" -- but with more steps and higher cost. In multi-agent systems, agents can also echo and validate each other's mistakes ("hallucination loops") rather than correcting them.

**Why it happens:**
Multi-agent systems are distributed systems. Without explicit validation gates, there is no mechanism to catch bad output before it propagates. Vague task descriptions cause agents to misinterpret scope -- one agent researches the wrong topic, another builds on it, and the final output is coherent-sounding garbage. Adding more agents does not fix this; it creates "more meetings and wasteful work."

**How to avoid:**
- Add output validation between every agent handoff. Use Pydantic models as CrewAI task `output_pydantic` to enforce structure.
- Implement a lightweight "validator" agent or function that checks intermediate outputs before passing to the next agent.
- Write detailed, specific task descriptions for every agent. "Research the semiconductor shortage" is too vague; "Find 3 current (2026) sources about TSMC chip supply for automotive manufacturers" is actionable.
- Design agent roles with minimal overlap to prevent duplicate work.
- Tag messages with agent ID and intent for audit trails.
- Implement circuit breakers: if an agent's output confidence is below threshold, halt and escalate to human review.

**Warning signs:**
- Final outputs that sound plausible but contain contradictory or invented information.
- Multiple agents producing overlapping or duplicate work.
- Downstream agents asking for clarification on upstream output.
- Agent logs showing context that was not in the original task.

**Phase to address:**
Phase 2 (Agent System). Once basic agent execution works, validation gates must be added before building any complex multi-agent workflows.

---

### Pitfall 6: WebSocket Connection Management Under Real-Time Agent Activity

**What goes wrong:**
The pixel-art UI requires real-time streaming of agent actions (agent moved, started typing, reading a document, chatting). WebSocket connections die silently on flaky networks, mobile browsers, or tab backgrounding. Without proper handling, a single disconnected client that has not triggered `WebSocketDisconnect` blocks the entire broadcast loop, freezing updates for all connected users.

**Why it happens:**
WebSockets are stateful, and developers often treat them as "set and forget." In reality: clients go silent without closing connections, browser tabs get backgrounded (reducing WebSocket priority), network switches cause invisible disconnections, and load balancers have their own timeout settings that can kill idle connections.

**How to avoid:**
- Implement server-side heartbeat pings every 30 seconds. If client does not respond (pong) within 10 seconds, consider connection dead and clean up.
- Wrap broadcast sends in try/catch -- remove dead connections on send failure rather than blocking the broadcast loop.
- Implement client-side reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s).
- On reconnect, send last-received event ID so the client can fill gaps (event sourcing pattern).
- Use `asyncio.create_task()` for background heartbeat tasks, and cancel them on disconnect to prevent resource leaks.
- Configure Nginx/reverse proxy WebSocket timeouts to match (proxy_read_timeout 300s minimum).

**Warning signs:**
- Frontend occasionally shows stale agent positions or states.
- Connection count in server metrics growing unbounded (zombie connections).
- Broadcast operations taking longer over time (iterating dead connections).
- Memory usage creeping up in the WebSocket server process.

**Phase to address:**
Phase 2 (Real-Time Layer). Must be designed alongside the WebSocket infrastructure, not bolted on after agent streaming works.

---

### Pitfall 7: LLM Provider Rate Limits and Concurrent Agent Requests

**What goes wrong:**
When multiple agents execute simultaneously, each making LLM API calls, the system quickly hits provider rate limits (RPM, TPM, concurrent request ceilings). OpenAI allows 3,500 RPM for GPT-4 on paid plans, but a crew of 6 agents each making 5+ calls per task can exhaust this in minutes. With multiple LLM providers configured per agent, each provider has different limit structures (Anthropic measures ITPM/OTPM separately, Ollama has no limits but has throughput constraints).

**Why it happens:**
Developers test with one or two agents and extrapolate. Real multi-agent execution with 5-10 concurrent agents hits limits that single-agent testing never reveals. Different providers have different limit structures, and CrewAI does not provide built-in rate limiting or request queuing.

**How to avoid:**
- Implement a centralized LLM request queue/gateway that all agents route through. LiteLLM (already used by CrewAI internally) supports this, but you need to configure it explicitly.
- Set per-provider rate limits in the gateway: track RPM and TPM per API key.
- Implement exponential backoff on 429 responses. Anthropic returns `Retry-After` headers -- respect them.
- For Ollama (local), understand that throughput is constrained by GPU memory and compute, not API limits. Queue requests to avoid OOM.
- Consider using different API keys for different agent groups to increase effective rate limits.
- Track input vs output tokens separately -- output tokens cost 3-5x more on most providers.

**Warning signs:**
- Intermittent 429 (Too Many Requests) errors in agent logs.
- Agent execution times varying wildly between runs.
- Ollama becoming unresponsive under concurrent agent load.
- Some agents completing instantly while others wait minutes.

**Phase to address:**
Phase 2 (Agent System). Rate limiting must be in place before multi-agent concurrent execution is enabled.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Polling instead of WebSocket for agent updates | Simpler to implement | 10-100x more HTTP requests, stale UI, server load | Never -- real-time is a core requirement |
| Storing all state in CrewAI's memory only | Zero additional code | Lose everything on container restart, no queryable history | Never -- always maintain separate persistence |
| Hardcoding LLM provider per agent in code | Quick setup | Cannot switch providers without code changes, no cost optimization | Only in earliest prototype (Phase 1 week 1) |
| Single-threaded crew execution | Avoids concurrency bugs | Blocks entire application during agent work | Only in initial proof-of-concept |
| Skipping output validation between agents | Faster agent chains | Cascading errors, garbage outputs, wasted tokens | Never |
| Flat agent prompt templates | Easy to start | Impossible to maintain role-specific behavior, all agents blend together | MVP only, refactor by Phase 2 |
| No token usage tracking | Simpler code | Invisible cost spikes, no per-agent cost attribution, budget overruns | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI API | Not handling streaming responses for real-time UI updates | Use streaming callbacks in CrewAI's LLM config; pipe chunks to WebSocket |
| Anthropic API | Ignoring different rate limit structure (ITPM/OTPM vs RPM) | Track input and output tokens separately; respect Retry-After headers |
| Ollama (local) | Assuming it handles concurrent requests like cloud APIs | Queue requests; monitor GPU memory; set `OLLAMA_NUM_PARALLEL` appropriately |
| Ollama (cloud) | Using same config as local Ollama | Different base URL, potentially different auth; test endpoint separately |
| CrewAI LiteLLM | Setting env vars that conflict with per-agent LLM config | LiteLLM sources env vars and may override programmatic config; use provider-specific env var names exactly per LiteLLM docs |
| ChromaDB (CrewAI memory) | Assuming it handles concurrent writes from multiple agents | Enable WAL mode on underlying SQLite; consider external vector store for production |
| Docker Compose networking | Backend and Ollama containers cannot reach each other | Use Docker service names as hostnames (e.g., `http://ollama:11434`), not `localhost` |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Broadcasting all agent events to all clients | UI feels responsive with 1 user | Filter events by office/subscription; send only relevant updates per client | 5+ concurrent users watching different offices |
| Storing full conversation history in agent context | Agents have full context | Implement sliding window or summarization; use CrewAI's memory abstraction | Context window overflow at ~20 conversation turns per agent |
| Canvas redrawing entire office on every frame | Smooth animation at start | Use dirty-rect rendering; only redraw changed regions; use OffscreenCanvas for compositing | 10+ animated sprites with complex backgrounds |
| Single SQLite database for everything | Simple data layer | Separate agent memory DB from application state DB; consider PostgreSQL for structured data | Concurrent write contention with 5+ simultaneous agent executions |
| Loading all agent sprites and animations upfront | Fast after initial load | Lazy-load sprite sheets per agent role; use sprite atlases to minimize HTTP requests | Office with 10+ agents, each with 5+ animation states |
| Synchronous crew execution in request handler | Works for single-task demo | Task queue or background workers for all crew executions | Any user interaction during agent execution |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing LLM API keys in frontend or client-accessible config | Key theft, unlimited API billing on your account | All LLM calls server-side only; API keys in environment variables, never in responses |
| Agents executing arbitrary code from LLM output | Remote code execution, data exfiltration | Sandbox all tool executions; whitelist allowed tools per agent role; never `eval()` LLM output |
| No audit trail for agent actions | Cannot trace what agents did or why; compliance/debugging nightmare | Log every agent action, tool call, and LLM interaction with timestamps and agent IDs |
| Storing user prompts/data in CrewAI memory without cleanup | Data leaks across sessions if memory is shared | Scope memory per user/office; implement memory cleanup on office deletion |
| Agent tools with unrestricted filesystem access | Agents can read/write arbitrary files | Restrict tool filesystem access to designated directories; use Docker volume isolation |
| WebSocket endpoints without authentication | Anyone can connect and receive agent activity | Authenticate WebSocket connections on handshake; validate session tokens |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visibility into what agents are doing during long tasks | User thinks system is frozen; kills the process | Stream real-time activity: "CEO is analyzing market data...", "CTO is reviewing architecture..." |
| Agent actions shown as raw log text | Overwhelming, unreadable, feels like watching server logs | Translate agent actions into human-readable activities with visual state changes in the pixel-art UI |
| Human-in-the-loop blocks entire crew silently | User does not know agents are waiting for input; tasks appear stuck | Push notifications/alerts when human input is needed; show visual indicator on the waiting agent |
| No way to cancel a running agent task | User must wait for completion or kill the process | Implement graceful cancellation with cleanup; show "cancel" button on running tasks |
| Pixel-art animations disconnected from actual agent state | Agents "walk around" randomly while actually idle; breaks immersion | Tie animation states directly to agent execution states: idle, working, waiting, communicating |
| Showing token costs only after execution | Sticker shock; user feels out of control | Show real-time cost ticker during execution; offer cost estimates before kickoff |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Agent execution:** Often missing max_iter and max_execution_time limits -- verify every agent has hard caps set
- [ ] **WebSocket layer:** Often missing heartbeat/ping-pong -- verify connections survive 5-minute idle periods
- [ ] **Docker persistence:** Often missing volume mounts for memory/data -- verify data survives `docker compose down && docker compose up`
- [ ] **Multi-LLM support:** Often missing error handling for provider-specific failures -- verify graceful fallback when one provider is down
- [ ] **Human-in-the-loop:** Often missing the resume mechanism -- verify paused crews can resume after container restart (not just in-memory pause)
- [ ] **Real-time UI updates:** Often missing reconnection logic -- verify UI recovers after network blip (disconnect WiFi for 10 seconds, reconnect)
- [ ] **Agent memory:** Often missing scope isolation -- verify one office's agent memory does not leak into another office
- [ ] **Task cancellation:** Often missing cleanup of in-flight LLM calls -- verify cancelling a task does not leave orphaned API requests burning tokens
- [ ] **Pixel-art rendering:** Often missing integer coordinate snapping -- verify sprites are not blurry at different zoom levels/screen DPIs
- [ ] **Cost tracking:** Often missing output token tracking -- verify both input AND output tokens are tracked per agent per execution

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Agent infinite loop detected after cost spike | MEDIUM | Kill crew execution immediately; implement max_iter; review agent prompts for missing termination conditions; add AgentOps monitoring; set token budget alerts |
| Hierarchical process producing wrong outputs | LOW | Switch to sequential process; build custom orchestration with CrewAI Flows; no data loss, just wasted tokens |
| Memory lost after Docker restart | HIGH if significant agent learning accumulated | Implement volume mounts; configure db_path; migrate to external persistence (PostgreSQL); rebuild agent knowledge through re-execution if needed |
| Event loop blocked by synchronous CrewAI | MEDIUM | Refactor to task queue pattern; move crew execution to background workers; requires architectural change but no data loss |
| Cascading agent errors producing garbage | LOW | Add Pydantic output validation; implement validator functions between agent steps; re-run affected tasks with validated chain |
| WebSocket zombie connections consuming memory | LOW | Deploy heartbeat mechanism; add connection cleanup on send failure; restart WebSocket process to clear zombie state |
| Rate limit exhaustion across providers | LOW | Implement centralized request queue; add exponential backoff; distribute load across API keys; temporary fix: reduce concurrent agents |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Agent infinite loops / token explosion | Phase 1 (Core Backend) | Run agent for 50+ iterations with intentionally ambiguous task; verify it stops at max_iter |
| Hierarchical process failure | Phase 1 (Core Backend) | Architecture uses sequential process or custom orchestration; no reliance on built-in hierarchical mode |
| Docker memory persistence | Phase 1 (Core Backend) | `docker compose down && docker compose up`; verify agent memory and task history survive |
| Async/event-loop collision | Phase 1 (Core Backend) | Start crew execution; verify WebSocket pings still respond; verify HTTP health check still works |
| Cascading agent failures | Phase 2 (Agent System) | Feed deliberately bad output to downstream agent; verify validation catches it before propagation |
| WebSocket connection management | Phase 2 (Real-Time Layer) | Disconnect client mid-stream; verify server cleans up; reconnect; verify state recovery |
| LLM rate limits | Phase 2 (Agent System) | Run 5 agents simultaneously; verify no 429 errors; verify request queuing works |
| Human-in-the-loop resume | Phase 3 (HITL Features) | Pause crew for human input; restart container; resume; verify crew continues from pause point |
| Cost tracking and budgets | Phase 2 (Agent System) | Run crew with budget limit; verify execution stops at budget; verify per-agent cost breakdown is accurate |
| Pixel-art rendering performance | Phase 2 (Frontend) | Render 10+ animated agents with background; verify 60fps on mid-range hardware; verify integer zoom |

## Sources

- [CrewAI Memory Documentation](https://docs.crewai.com/en/concepts/memory) -- memory types, persistence, configuration
- [CrewAI Human-in-the-Loop Documentation](https://docs.crewai.com/en/learn/human-in-the-loop) -- HITL workflow patterns
- [CrewAI LLM Connections](https://docs.crewai.com/en/learn/llm-connections) -- multi-provider configuration
- [CrewAI Async Kickoff](https://docs.crewai.com/en/learn/kickoff-async) -- async execution methods
- [CrewAI AgentOps Observability](https://docs.crewai.com/how-to/agentops-observability) -- monitoring and loop detection
- [Why CrewAI's Manager-Worker Architecture Fails (Towards Data Science)](https://towardsdatascience.com/why-crewais-manager-worker-architecture-fails-and-how-to-fix-it/) -- hierarchical process analysis
- [Why Multi-Agent LLM Systems Fail (Galileo)](https://galileo.ai/blog/multi-agent-llm-systems-fail) -- cascading failures, coordination problems
- [Why Multi-Agent LLM Systems Fail (Augment Code)](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them) -- error propagation patterns
- [The 17x Error Trap (Towards Data Science)](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/) -- "bag of agents" anti-pattern
- [CrewAI Infinite Loop Community Discussion](https://community.crewai.com/t/how-to-limit-token-usage-for-infinite-loops/765) -- token cost protection
- [CrewAI Agent Loop Bug](https://community.crewai.com/t/agents-keeps-going-in-a-loop/1053) -- loop root causes
- [CrewAI Flow Infinite Loop](https://community.crewai.com/t/crewai-flow-infinite-loop-steps-repeating-endlessly/6780) -- Flow-specific loop issues
- [CrewAI Hierarchical Process Bug #4783](https://github.com/crewAIInc/crewAI/issues/4783) -- delegation type errors
- [CrewAI asyncio Event Loop Issue](https://community.crewai.com/t/flow-execution-asyncio-run-cannot-be-called-from-a-running-event-loop/2945) -- async collision
- [CrewAI LiteLLM Ollama Endpoint Bug #2216](https://github.com/crewAIInc/crewAI/issues/2216) -- provider config override
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) -- production architecture patterns
- [FastAPI WebSocket Background Task Issue](https://github.com/fastapi/fastapi/discussions/6741) -- blocking background tasks
- [FastAPI Long-Running Request Blocking](https://github.com/fastapi/fastapi/discussions/8842) -- event loop blocking
- [WebSocket Reconnection Logic Guide](https://oneuptime.com/blog/post/2026-01-27-websocket-reconnection-logic/view) -- reconnection patterns
- [WeaponizingReal-Time WebSocket/SSE with FastAPI](https://blog.greeden.me/en/2025/10/28/weaponizing-real-time-websocket-sse-notifications-with-fastapi-connection-management-rooms-reconnection-scale-out-and-observability/) -- production WebSocket patterns
- [Crisp Pixel Art in HTML5 (MDN)](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look) -- rendering best practices
- [pixel-agents GitHub](https://github.com/pablodelucca/pixel-agents) -- reference frontend architecture
- [Why AI Agents Fail: 3 Failure Modes (DEV Community)](https://dev.to/aws/why-ai-agents-fail-3-failure-modes-that-cost-you-tokens-and-time-1flb) -- context overflow, timeouts, reasoning loops
- [LLM Rate Limiting Guide (Markaicode)](https://markaicode.com/handle-api-rate-limits-llm-frameworks/) -- multi-provider rate limit handling

---
*Pitfalls research for: Multi-agent virtual office platform (Office-Jam)*
*Researched: 2026-03-24*
