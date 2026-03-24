# Project Research Summary

**Project:** Office-Jam
**Domain:** Multi-agent AI virtual office platform (pixel-art agent swarm orchestration)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Office-Jam is a multi-agent AI platform where users manage autonomous AI agents working in a pixel-art virtual office. The product's core loop is: hire agents with specific roles, assign tasks, watch agents collaborate in real time as animated sprites, and intervene through chat when needed. Experts build this class of product as two tightly coupled but independent rendering layers — a WebGL/canvas game engine for pixel-art visualization and a React UI overlay for panels — backed by a Python AI orchestration backend (FastAPI + CrewAI) and a PostgreSQL database for application state. The reference projects (AgentOffice, Claw Empire) validate this pattern; Office-Jam differentiates through per-agent configurable LLM providers, dual execution modes (ad-hoc + autonomous loops), and a data model that supports multi-office from day one.

The recommended approach is to build back-to-front and integration-last. Start with the database schema and FastAPI REST API, add CrewAI agent orchestration with sequential process (NOT hierarchical — it is broken in CrewAI), layer in the async real-time WebSocket infrastructure, then build the frontend starting with React UI components before adding the PixiJS pixel-art canvas. This order is mandatory because the frontend depends on a stable WebSocket event contract, and the game layer depends on both the event stream and the React component scaffold being in place. Core pitfalls that must be addressed in Phase 1 — before any demo — are agent infinite loops with token cost explosion, async/event-loop collision between FastAPI and CrewAI, and Docker volume misconfiguration that causes all agent memory to be lost on container restart.

The biggest risk to execution is scope: every competitor has a narrower feature set than Office-Jam's full vision. The MVP must resist adding dual execution modes, multi-office UI, or dynamic hiring until the core ad-hoc agent loop is working and validated. The single most important architectural decision is to use CrewAI Flows for autonomous orchestration (not the broken hierarchical process) and to isolate CrewAI's internal memory storage from the application's PostgreSQL state from the very first line of schema code.

## Key Findings

### Recommended Stack

See full details in `.planning/research/STACK.md`.

The stack is opinionated and constrained by the pixel-art requirement. @pixi/react v8 requires React 19, which cascades to React 19+ for the entire frontend. PixiJS 8 is strongly preferred over Phaser 4 (still RC, not stable) for this project because it is a visualization, not a game — PixiJS is 3x smaller and 2x faster for pure rendering. CrewAI 1.11.x on Python 3.12 is the mandated backend orchestration framework; it is independent of LangChain and runs 12M+ daily executions in production.

**Core technologies:**
- Python 3.12: Backend runtime — best stability/performance, required by CrewAI 1.11.x
- CrewAI 1.11.x: Multi-agent orchestration — non-negotiable per project requirements
- FastAPI 0.135.x: HTTP and WebSocket API server — async-native, pairs perfectly with CrewAI's async patterns
- PixiJS 8.17.x + @pixi/react 8.0.x: Pixel-art rendering — WebGL/WebGPU renderer, React 19 bridge
- React 19.2.x + TypeScript 5.x: Frontend framework — required by @pixi/react v8
- Zustand 5.0.x: Frontend state — lightweight, separate stores for game state, UI state, WebSocket state
- PostgreSQL 17 + SQLAlchemy 2.0.x + Alembic: Application persistence — relational structure, async driver, proper concurrent write support
- Docker Compose v2: Container orchestration — non-negotiable per project requirements
- Vite 8.0.x: Frontend build — Rolldown-based, requires Node 20.19+

**Critical version constraints:**
- @pixi/react 8.0.x will NOT work with React 18 — React 19 is required
- Vite 8.0.x requires Node 20.19+ or 22.12+
- CrewAI 1.11.x requires Python >=3.10,<3.14 (use 3.12 for stability)
- Do NOT use Phaser 4 (still in RC6), LangChain (conflicts with CrewAI), or Socket.IO (FastAPI native WebSocket is sufficient)

### Expected Features

See full details in `.planning/research/FEATURES.md`.

The pixel-art office category is well-established with clear table stakes. The MVP must include animated sprites with visible agent status, a real-time activity feed, a task kanban board, click-to-inspect agents, human-to-agent chat, and Docker Compose deployment. The configurable per-agent LLM provider is a v1 differentiator and must be included from day one — it is the primary technical differentiator against AgentOffice and Claw Empire.

**Must have (table stakes):**
- Pixel-art office with animated agent sprites (walk, idle, work, talk) — core visual promise
- Agent role assignment (CEO, CTO, developer, etc.) — defines the mental model
- Task assignment and kanban board — give agents work, see progress
- Real-time activity feed — transparency, trust, the "wow" moment
- Click-to-inspect agent — roles, current task, LLM provider, token usage
- Human-to-agent chat — the intervention mechanism for human-in-the-loop
- Agent-to-agent visible communication — speech bubbles, delegation indicators
- Status persistence across sessions — agents and tasks survive browser refresh
- Docker Compose deployment — single `docker compose up`

**Should have (competitive differentiators):**
- Configurable LLM provider per agent — primary differentiator, include in v1
- Autonomous loop execution — complex multi-step tasks with checkpoints (v1.x)
- Dynamic agent hiring with system suggestions — "You need a legal reviewer" (v1.x)
- Agent-initiated alerts and escalation — agents flag blockers proactively (v1.x)
- Decision reasoning traces — expandable "why" per agent action (v1.x)

**Defer (v2+):**
- Multi-office UI — data model must support it, but show only one office in v1
- Cross-office agent sharing — requires multi-office UI first
- Office dashboard with aggregate metrics — requires multi-office
- Custom office layout editor — low value vs. agent features

**Anti-features to avoid:**
- Fully autonomous agent hiring (runaway costs, no user control)
- Voice interaction (massive scope, text chat covers 95% of needs)
- Real-time everything sub-second (WebSocket flood, use 2-3s batching)
- Agent personality traits (gimmick, add prompt complexity without output benefit)

### Architecture Approach

See full details in `.planning/research/ARCHITECTURE.md`.

The architecture is a dual-layer frontend (PixiJS canvas + React HTML overlay) communicating via an EventBus, backed by a FastAPI backend that separates the REST API, WebSocket manager, and background crew execution into distinct concerns. CrewAI Flows sit at the top of the orchestration hierarchy, delegating complex work to dynamically assembled Crews composed from database records. All application state (offices, agents, tasks, chat history) lives in PostgreSQL; CrewAI's internal memory (LanceDB/ChromaDB) is explicitly separate and managed by CrewAI alone.

**Major components:**
1. PixiJS canvas (via @pixi/react) — renders pixel-art office, tiles, animated agent sprites, pathfinding; communicates with React only through EventBus
2. React UI overlay + Zustand stores — chat panels, task board, activity log, agent profiles; updated by WebSocket events via stores
3. FastAPI backend — REST CRUD endpoints (offices, agents, tasks, config) and WebSocket manager with room-based broadcasting per office
4. ExecutionService (background) — spawns crew executions as asyncio tasks, relays step_callback/task_callback to WebSocket clients
5. CrewAI Flows/Crews — agent orchestration; Flows for autonomous mode, dynamically assembled Crews from DB records for ad-hoc
6. PostgreSQL + SQLAlchemy — application state with explicit schema (offices, agents, tasks, messages, activities)

**Key patterns to follow:**
- Background crew execution with callback relay (never block the event loop)
- Room-based WebSocket broadcasting (one room per office, scoped from day one)
- Dynamic agent/crew assembly from database records (no hardcoded crews)
- Sequential process for CrewAI (NOT hierarchical — it is documented but broken)
- Strict EventBus boundary between PixiJS and React (no direct imports)

### Critical Pitfalls

See full details in `.planning/research/PITFALLS.md`.

1. **Agent infinite loops and token cost explosion** — Set `max_iter` on every agent (10-15), `max_execution_time` on every task, implement a global token budget callback, and use AgentOps for loop detection. A real-world case saw costs go from $127/week to $47,000 over four weeks due to an undetected loop. Must be baked into Phase 1 before any demo.

2. **CrewAI hierarchical process does not work** — Multiple open bugs (Issues #4783, #2606, #1851), community consensus is it "does not actually work." Use `process=Process.sequential` for predictable execution, and use CrewAI Flows for complex orchestration. Design around this, not into it.

3. **CrewAI memory vanishes in Docker** — CrewAI's default memory paths are container-local. Without explicit volume mounts and `db_path` configuration, every container restart starts with blank agent memory. Configure and test persistence in Phase 1.

4. **Async/event-loop collision between FastAPI and CrewAI** — CrewAI's `kickoff()` is fundamentally synchronous and will block FastAPI's event loop, freezing all WebSocket connections. Use `asyncio.to_thread()` or `loop.run_in_executor()`. Never call `crew.kickoff()` directly in an async route handler. Design this in Phase 1; retrofitting is painful.

5. **Cascading failures across agents** — Bad output from Agent A propagates to all downstream agents. Use Pydantic models as `output_pydantic` on every CrewAI task, add lightweight validator agents between handoffs, and write specific (not vague) task descriptions. Required before any multi-step workflows ship.

6. **WebSocket connection management** — Connections die silently; dead connections block broadcast loops. Implement server-side heartbeat pings every 30 seconds, wrap broadcasts in try/catch, and build client-side exponential backoff reconnection. Design with the WebSocket infrastructure, not after.

7. **LLM rate limits under concurrent agent execution** — Multiple agents make simultaneous LLM calls; 6 agents can exhaust OpenAI's GPT-4 tier in minutes. Implement a centralized LLM request gateway via LiteLLM, add exponential backoff on 429s, and test with 5+ concurrent agents before shipping multi-agent workflows.

## Implications for Roadmap

Based on combined research, the following phase structure is recommended. Build order is mandatory due to hard dependencies: database before API, API before CrewAI, CrewAI before real-time layer, real-time layer before frontend, frontend scaffold before game canvas.

### Phase 1: Foundation — Database, API, and Docker

**Rationale:** Every other component depends on a stable schema and working REST API. Establishing Docker Compose with PostgreSQL now prevents the Docker persistence pitfall (Pitfall 3) from being discovered late when agent memory loss would be costly.

**Delivers:** Working local development environment; schema for all entities; CRUD endpoints for offices, agents, tasks; Docker Compose with PostgreSQL and volume mounts; Alembic migrations.

**Addresses:** State persistence (table stakes), Docker Compose deployment (table stakes), multi-office data model isolation (architectural prerequisite for v2 multi-office).

**Avoids:** Docker memory persistence pitfall — test `docker compose down && docker compose up` with data survival as an explicit acceptance criterion.

### Phase 2: CrewAI Backend — Agent Orchestration Core

**Rationale:** The entire product value depends on CrewAI working correctly. Establishing the orchestration layer before any frontend means the backend is testable in isolation and pitfalls (loop protection, async isolation, hierarchical process avoidance) are resolved before UI complexity is added.

**Delivers:** Dynamic crew assembly from database agent records; per-agent LLM provider configuration; sequential process execution with loop protection (max_iter, max_execution_time, token budget); async execution via asyncio.to_thread(); CrewAI Flows skeleton for autonomous mode.

**Addresses:** Agent role assignment (table stakes), configurable LLM per agent (differentiator).

**Avoids:** Agent infinite loops (Pitfall 1), hierarchical process failure (Pitfall 2), async/event-loop collision (Pitfall 4). These must all be addressed here — never in a later phase.

### Phase 3: Real-Time Layer — WebSocket Infrastructure

**Rationale:** The frontend cannot be built meaningfully without a working WebSocket event contract. Establishing room-based broadcasting, heartbeat/reconnection, and callback relay now means the frontend consumes a stable API.

**Delivers:** WebSocket ConnectionManager with room-based broadcasting (one room per office); server-side heartbeat and dead connection cleanup; step_callback/task_callback relay to WebSocket; activity logging to database; SSE endpoint for unidirectional streams.

**Addresses:** Real-time activity feed (table stakes), agent status indicators (table stakes).

**Avoids:** WebSocket zombie connection pitfall (Pitfall 6), cascading failure detection via activity log (Pitfall 5).

### Phase 4: React Frontend — UI Scaffold

**Rationale:** Build the React UI overlay before the PixiJS canvas. The UI components (chat, task board, activity log, agent profiles) are independent of the game engine and can be developed against the real backend API. This validates the full stack end-to-end before adding canvas complexity.

**Delivers:** Vite + React + TypeScript scaffold; Zustand stores for agent, task, UI, and WebSocket state; REST API client; chat panel, task board (kanban), activity log, agent profile, LLM config UI; WebSocket client with reconnection logic.

**Addresses:** Task assignment and kanban board (table stakes), click-to-inspect agent (table stakes), human-to-agent chat (table stakes), configurable LLM provider UI (differentiator).

**Avoids:** No anti-pattern coupling between canvas and UI layers — React components are established as the HTML overlay before Phaser/PixiJS is introduced.

### Phase 5: Game Layer — Pixel-Art Office Visualization

**Rationale:** PixiJS canvas is the most complex frontend work and depends on both the React scaffold (EventBus integration point) and the WebSocket event stream (drives animation state). Building it last means it integrates into a working system rather than being built in isolation.

**Delivers:** PixiJS 8 via @pixi/react; tilemap rendering (floor, walls, furniture); agent sprite system with animation state machine (idle, working, typing, talking, walking); BFS pathfinding on tile grid; EventBus integration (WebSocket events drive sprite state transitions); integer coordinate snapping for pixel-perfect rendering.

**Addresses:** Pixel-art office (table stakes), agent-to-agent visible communication (table stakes), agent status indicators (table stakes), office layout with furniture (table stakes).

**Avoids:** Pixel-art rendering performance trap (integer zoom, dirty-rect rendering, sprite batching for 10+ animated agents); tight coupling between PixiJS and React state via strict EventBus boundary.

### Phase 6: Integration and Polish — End-to-End Experience

**Rationale:** With all layers functional independently, this phase wires them together: real-time sprite animation driven by backend events, full human-in-the-loop interaction, task cancellation, cost tracking, and the "looks done but isn't" checklist from PITFALLS.md.

**Delivers:** Real-time agent animation driven by WebSocket events (backend step_callback -> sprite state machine); click-agent-to-chat full flow; task cancellation with in-flight LLM call cleanup; real-time token cost display; reconnection tested (disconnect/reconnect scenario); full "Looks Done But Isn't" checklist passed.

**Addresses:** Full human-in-the-loop loop, agent-to-agent visible collaboration, transparency/trust features.

**Avoids:** Cascading failures (Pitfall 5 — validate outputs before passing between agents); rate limit exhaustion (Pitfall 7 — test 5 concurrent agents).

### Phase 7: Autonomous Mode and v1.x Features

**Rationale:** Autonomous loop execution (CrewAI Flows with checkpoints) requires the entire Phase 1-6 stack to be stable. This is the highest-complexity feature and the most prone to infinite loop and cost explosion failures. Add only after ad-hoc execution is validated.

**Delivers:** CrewAI Flows for multi-step autonomous tasks; checkpoint/resume across container restarts; pause/resume with human-in-the-loop gates; dynamic agent hiring with system suggestions; agent-initiated alerts and escalation; decision reasoning traces.

**Addresses:** Autonomous loop execution (v1.x feature), dynamic agent hiring (v1.x), agent-initiated alerts (v1.x), decision transparency (v1.x).

**Avoids:** All Pitfall 1 (loop) scenarios — the autonomous loop must have extra hardening; human-in-the-loop resume after container restart (documented gotcha).

### Phase Ordering Rationale

- Database and Docker before everything else — persistence must be solved before complexity is added
- CrewAI before frontend — validates orchestration independently, forces pitfalls to surface early
- WebSocket before canvas — frontend needs stable event contract; canvas depends on event stream for animation
- React UI before PixiJS canvas — validates the full API integration path before adding rendering complexity
- Advanced features last — autonomous mode, dynamic hiring, and reasoning traces all require stable base layers

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2 (CrewAI Core):** CrewAI Flows state persistence and the @persist decorator need implementation research — documentation exists but edge cases (partial failure recovery, cross-restart state sync with PostgreSQL) are sparse.
- **Phase 5 (Game Layer):** PixiJS 8 via @pixi/react with animated sprite sheets and A* pathfinding on a tile grid is well-documented in concept but the specific @pixi/react v8 API (declarative `pixiAnimatedSprite`, `extend()` registry) needs hands-on validation before building.
- **Phase 7 (Autonomous Mode):** CrewAI Flows human feedback gates (`@human_feedback`) and how they interact with the FastAPI WebSocket layer for human-in-the-loop intervention is not fully documented in production scenarios. Plan for a spike.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** PostgreSQL + SQLAlchemy + Alembic + FastAPI is a highly documented, battle-tested combination. Standard patterns apply.
- **Phase 3 (WebSocket):** FastAPI WebSocket with ConnectionManager is well-documented with multiple reference implementations in the research.
- **Phase 4 (React UI):** React 19 + Zustand + TanStack Query is entirely standard. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official sources and PyPI as of March 2026. Version compatibility matrix confirmed. Reference projects (pixel-agents, AgentOffice) use overlapping stack. |
| Features | HIGH | Direct competitor analysis (AgentOffice, Claw Empire, Pixel Agents, Agent Town, Bit Office) provides strong evidence of table stakes. Differentiators validated against competitor gap analysis. |
| Architecture | HIGH | Reference implementations exist for every major pattern (dual-layer frontend from AgentOffice, background crew execution from FastAPI docs, EventBus pattern from Phaser 3 React template). |
| Pitfalls | HIGH | Multiple sources including CrewAI GitHub issues, community forum posts, production post-mortems, and documented real-world cost explosions. Pitfall 2 (hierarchical process) is confirmed by open bugs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Pixel-art sprite assets:** Research covers the rendering pipeline but not asset sourcing. The MVP needs sprite sheets for at least 3-5 agent roles (CEO, CTO, developer) with walk/idle/work/talk animation frames. Source of these assets (custom, licensed, procedural) is not resolved and could be a significant time cost.
- **LLM cost estimates for v1 demo:** No research was done on expected token consumption per ad-hoc task execution with 3-5 agents. Need a baseline before setting `max_execution_time` and token budget limits. Plan for a measurement spike in Phase 2.
- **CrewAI Flows @persist implementation detail:** How Flow state interacts with the application's PostgreSQL database (synchronization strategy, conflict resolution) needs a concrete implementation decision in Phase 7.
- **Tilemap design and pathfinding grid:** The research confirms BFS/A* on a tile grid is the right approach but does not define office layout dimensions, walkable tile conventions, or furniture collision rules. These need design decisions before Phase 5.

## Sources

### Primary (HIGH confidence)

- [CrewAI PyPI](https://pypi.org/project/crewai/) — version 1.11.1, Python requirements (verified March 2026)
- [CrewAI Documentation](https://docs.crewai.com/) — Flows, Crews, Agents, Tasks, Memory, LLM connections, HITL
- [FastAPI Documentation](https://fastapi.tiangolo.com/advanced/websockets/) — WebSocket endpoints, background tasks
- [PixiJS v8 blog](https://pixijs.com/blog/8.16.0) and [@pixi/react v8](https://pixijs.com/blog/pixi-react-v8-live) — v8 API, React 19 requirement
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) — Rolldown, Node 20.19+ requirement
- [SQLAlchemy docs](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) — async ORM patterns
- [CrewAI GitHub Issues #4783, #2606, #1851](https://github.com/crewAIInc/crewAI/issues/) — hierarchical process bugs confirmed

### Secondary (MEDIUM confidence)

- [AgentOffice GitHub](https://github.com/harishkotra/agent-office) and [Dev.to writeup](https://dev.to/harishkotra/how-i-built-agentoffice-self-growing-ai-teams-in-a-pixel-art-virtual-office-4o0p) — reference architecture, competitor feature analysis
- [Claw Empire GitHub](https://github.com/GreenSheep01/claw-empire) — competitor feature analysis, PixiJS usage
- [pixel-agents GitHub](https://github.com/pablodelucca/pixel-agents) — sprite state machine, BFS pathfinding reference
- [Phaser 3 + React TypeScript Template](https://phaser.io/news/2024/03/phaser-3-and-react-typescript-template) — EventBus pattern (adapted for PixiJS)
- [Why CrewAI's Manager-Worker Architecture Fails (TDS)](https://towardsdatascience.com/why-crewais-manager-worker-architecture-fails-and-how-to-fix-it/) — hierarchical process analysis
- [Galileo multi-agent failure analysis](https://galileo.ai/blog/multi-agent-llm-systems-fail) — cascading failure patterns
- [CrewAI community: infinite loop threads](https://community.crewai.com/t/how-to-limit-token-usage-for-infinite-loops/765) — real-world loop cases
- [Full-Stack AI Agent Template](https://github.com/vstorm-co/full-stack-ai-agent-template) — FastAPI + CrewAI + WebSocket reference

### Tertiary (LOW confidence — validate during implementation)

- [AG-UI Protocol (CopilotKit)](https://www.copilotkit.ai/blog/how-to-add-a-frontend-to-any-crewai-agent-using-ag-ui-protocol) — SSE-based agent communication (alternative to WebSocket for unidirectional streams)
- [SQLite for AI Agents (Dev.to)](https://dev.to/nathanhamlett/sqlite-is-the-best-database-for-ai-agents-and-youre-overcomplicating-it-1a5g) — SQLite vs PostgreSQL tradeoff argument (we chose PostgreSQL per STACK.md rationale)

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
