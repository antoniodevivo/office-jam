# Architecture Research

**Domain:** Multi-agent virtual office platform (AI agent swarms in pixel-art environment)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Phaser.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Phaser Game   │  │ React UI     │  │ WebSocket Client       │    │
│  │ (Canvas)      │  │ Overlay      │  │ (Connection Manager)   │    │
│  │ - Sprites     │  │ - Chat Panel │  │ - Event dispatch       │    │
│  │ - Tilemap     │  │ - Task Board │  │ - Reconnection         │    │
│  │ - Pathfinding │  │ - Dashboard  │  │ - State sync           │    │
│  │ - Animations  │  │ - Agent Info │  │                        │    │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘    │
│         │    EventBus      │                      │                 │
│         └──────────────────┘                      │                 │
├───────────────────────────────────────────────────┼─────────────────┤
│                                                   │ WebSocket       │
│                                          HTTP REST│ (bidirectional) │
├───────────────────────────────────────────────────┼─────────────────┤
│                      BACKEND (FastAPI + Python)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ REST API      │  │ WebSocket    │  │ Background Task        │    │
│  │ (CRUD ops)    │  │ Manager      │  │ Runner (asyncio)       │    │
│  │ - Offices     │  │ - Broadcast  │  │ - Crew execution       │    │
│  │ - Agents      │  │ - Rooms      │  │ - Agent loops          │    │
│  │ - Tasks       │  │ - Events     │  │ - Callback relay       │    │
│  │ - Config      │  │              │  │                        │    │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘    │
│         │                 │                       │                 │
│  ┌──────┴─────────────────┴───────────────────────┴────────────┐    │
│  │                    Service Layer                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │    │
│  │  │ Office      │  │ Agent       │  │ Task             │     │    │
│  │  │ Service     │  │ Service     │  │ Service          │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘     │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐    │
│  │                  CrewAI Orchestration Layer                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │ Flows    │  │ Crews    │  │ Agents   │  │ Tools    │    │    │
│  │  │ (state   │  │ (teams)  │  │ (roles)  │  │ (actions)│    │    │
│  │  │  + event │  │          │  │          │  │          │    │    │
│  │  │  driven) │  │          │  │          │  │          │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                            │                                        │
│  ┌─────────────────────────┴───────────────────────────────────┐    │
│  │                    LLM Provider Layer                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │ OpenAI   │  │Anthropic │  │ Gemini   │  │ Ollama   │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                            │                                        │
├────────────────────────────┼────────────────────────────────────────┤
│                     PERSISTENCE LAYER                               │
│  ┌──────────┐  ┌──────────────────┐  ┌────────────────────────┐    │
│  │ SQLite   │  │ CrewAI Memory    │  │ File Storage           │    │
│  │ (via     │  │ (short/long/     │  │ (agent artifacts,      │    │
│  │  SQLAlch │  │  entity memory)  │  │  generated files)      │    │
│  │  emy)    │  │                  │  │                        │    │
│  └──────────┘  └──────────────────┘  └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Phaser Game Canvas | Render pixel-art office, animate agent sprites, handle tilemap, pathfinding | Phaser 3.x with Canvas2D renderer, BFS/A* pathfinding, sprite state machine |
| React UI Overlay | All non-game UI: chat panels, task board, dashboards, agent profiles, settings | React 18+ components rendered as HTML overlay above the Phaser canvas |
| EventBus | Bridge between Phaser game events and React UI state | Custom EventTarget or mitt-style event emitter shared between Phaser scenes and React |
| WebSocket Client | Maintain persistent connection to backend, dispatch events, handle reconnection | Native WebSocket or socket.io-client with automatic reconnection and event routing |
| REST API | CRUD operations for offices, agents, tasks, configuration, LLM provider settings | FastAPI router modules, Pydantic models for request/response validation |
| WebSocket Manager | Server-side connection management, room-based broadcasting, event dispatch | FastAPI WebSocket endpoints with ConnectionManager class, per-office rooms |
| Background Task Runner | Execute CrewAI crews/flows asynchronously, relay callbacks to WebSocket | asyncio tasks spawned per crew execution, step_callback and task_callback relay |
| Service Layer | Business logic: office management, agent lifecycle, task orchestration | Python service classes mediating between API layer and CrewAI + database |
| CrewAI Orchestration | Multi-agent collaboration, task delegation, tool usage, memory | CrewAI Flows (top-level orchestration) containing Crews (agent teams) |
| LLM Provider Layer | Route LLM calls to configured provider per agent | CrewAI native LLM class with per-agent provider configuration |
| SQLite + SQLAlchemy | Persist offices, agents, tasks, chat history, configuration | SQLAlchemy async ORM with aiosqlite driver, Alembic migrations |
| CrewAI Memory | Agent short-term, long-term, and entity memory across executions | CrewAI built-in memory system (memory=True on Crew) |
| File Storage | Store agent-generated artifacts (code, documents, images) | Local filesystem within Docker volume, organized by office/task |

## Recommended Project Structure

```
office-jam/
├── docker-compose.yml          # Full stack orchestration
├── Dockerfile.backend          # Python backend container
├── Dockerfile.frontend         # Node frontend container (build + nginx)
│
├── backend/
│   ├── pyproject.toml          # Python deps (CrewAI, FastAPI, SQLAlchemy, etc.)
│   ├── alembic/                # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app factory, lifespan events
│   │   ├── config.py           # Settings (Pydantic BaseSettings)
│   │   ├── database.py         # SQLAlchemy engine, session factory
│   │   │
│   │   ├── api/                # HTTP + WebSocket endpoints
│   │   │   ├── __init__.py
│   │   │   ├── offices.py      # Office CRUD
│   │   │   ├── agents.py       # Agent CRUD + hiring
│   │   │   ├── tasks.py        # Task CRUD + assignment
│   │   │   ├── config.py       # LLM provider configuration
│   │   │   └── ws.py           # WebSocket endpoint + ConnectionManager
│   │   │
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── office.py
│   │   │   ├── agent.py
│   │   │   ├── task.py
│   │   │   ├── message.py      # Chat history
│   │   │   └── activity.py     # Activity log entries
│   │   │
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── office.py
│   │   │   ├── agent.py
│   │   │   ├── task.py
│   │   │   └── events.py       # WebSocket event schemas
│   │   │
│   │   ├── services/           # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── office_service.py
│   │   │   ├── agent_service.py
│   │   │   ├── task_service.py
│   │   │   └── execution_service.py  # Crew/Flow kickoff + monitoring
│   │   │
│   │   ├── crew/               # CrewAI definitions
│   │   │   ├── __init__.py
│   │   │   ├── agents/         # Agent role definitions (YAML or Python)
│   │   │   │   ├── ceo.py
│   │   │   │   ├── cto.py
│   │   │   │   ├── developer.py
│   │   │   │   ├── marketer.py
│   │   │   │   └── ...
│   │   │   ├── tasks/          # Task templates
│   │   │   ├── tools/          # Custom CrewAI tools
│   │   │   ├── crews.py        # Crew assembly (dynamic based on office config)
│   │   │   └── flows.py        # Flow definitions for complex workflows
│   │   │
│   │   └── core/               # Shared utilities
│   │       ├── __init__.py
│   │       ├── events.py       # Internal event system
│   │       ├── llm_factory.py  # LLM provider instantiation
│   │       └── exceptions.py
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_api/
│       ├── test_services/
│       └── test_crew/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── assets/             # Pixel-art assets
│   │       ├── sprites/        # Agent character spritesheets
│   │       ├── tiles/          # Office floor, wall, furniture tiles
│   │       ├── ui/             # UI element sprites
│   │       └── audio/          # Optional sound effects
│   │
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component, layout
│       │
│       ├── game/               # Phaser game layer
│       │   ├── PhaserGame.tsx  # React component wrapping Phaser instance
│       │   ├── config.ts       # Phaser game configuration
│       │   ├── scenes/
│       │   │   ├── OfficeScene.ts    # Main office scene (tilemap, agents)
│       │   │   ├── BootScene.ts      # Asset loading
│       │   │   └── UIScene.ts        # In-game HUD (optional)
│       │   ├── entities/
│       │   │   ├── AgentSprite.ts    # Agent character sprite + animations
│       │   │   └── Furniture.ts      # Office furniture objects
│       │   ├── systems/
│       │   │   ├── Pathfinding.ts    # BFS/A* on tile grid
│       │   │   └── AnimationManager.ts
│       │   └── EventBus.ts     # Phaser <-> React communication
│       │
│       ├── components/         # React UI overlay components
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   └── Header.tsx
│       │   ├── chat/
│       │   │   ├── ChatPanel.tsx
│       │   │   └── MessageBubble.tsx
│       │   ├── tasks/
│       │   │   ├── TaskBoard.tsx
│       │   │   └── TaskCard.tsx
│       │   ├── agents/
│       │   │   ├── AgentProfile.tsx
│       │   │   ├── AgentHire.tsx
│       │   │   └── AgentList.tsx
│       │   ├── office/
│       │   │   ├── OfficeDashboard.tsx
│       │   │   └── OfficeSelector.tsx
│       │   ├── activity/
│       │   │   └── ActivityLog.tsx
│       │   └── settings/
│       │       └── LLMConfig.tsx
│       │
│       ├── hooks/              # React hooks
│       │   ├── useWebSocket.ts
│       │   ├── useOffice.ts
│       │   └── useAgents.ts
│       │
│       ├── stores/             # State management (Zustand)
│       │   ├── officeStore.ts
│       │   ├── agentStore.ts
│       │   ├── taskStore.ts
│       │   └── wsStore.ts
│       │
│       ├── api/                # REST API client
│       │   ├── client.ts
│       │   ├── offices.ts
│       │   ├── agents.ts
│       │   └── tasks.ts
│       │
│       └── types/              # Shared TypeScript types
│           ├── office.ts
│           ├── agent.ts
│           ├── task.ts
│           └── events.ts
│
└── .planning/                  # Project planning (not deployed)
```

### Structure Rationale

- **`backend/app/api/`:** Separates HTTP endpoints from business logic. The `ws.py` module handles all WebSocket connections in a single place with room-based broadcasting (one room per office).
- **`backend/app/crew/`:** Isolates all CrewAI definitions (agents, tasks, tools, crews, flows) from the API/service layer. This is critical because CrewAI agent definitions are domain-specific and change independently from the API contract.
- **`backend/app/services/`:** Mediates between the API layer and both the database and CrewAI. The `execution_service.py` is the bridge that spawns crew executions as background tasks and relays callbacks to WebSocket clients.
- **`frontend/src/game/`:** Completely isolates Phaser from React. The `PhaserGame.tsx` component is the single integration point. The `EventBus.ts` enables bidirectional communication without tight coupling.
- **`frontend/src/stores/`:** Zustand stores keep client state flat and simple. WebSocket events update stores directly, which triggers React re-renders and Phaser game updates through the EventBus.
- **`frontend/src/components/`:** Domain-organized React UI. These render as an HTML overlay on top of the Phaser canvas, following the proven pattern from AgentOffice.

## Architectural Patterns

### Pattern 1: Dual-Layer Frontend (Game Canvas + UI Overlay)

**What:** The frontend consists of two independent rendering layers: a Phaser canvas for the pixel-art office simulation and React components rendered as an HTML overlay on top. They communicate through a shared EventBus.

**When to use:** Whenever you need interactive game-like visuals combined with complex UI panels (chat, forms, lists, dashboards). This is the standard pattern used by AgentOffice, pixel-agents, and similar projects.

**Trade-offs:**
- Pro: Each layer uses the best tool for its job (Phaser for sprites/animation, React for UI)
- Pro: UI panels get full React ecosystem (accessibility, component libraries, forms)
- Pro: Game and UI can be developed independently
- Con: Two rendering systems means two mental models and an event bridge to maintain
- Con: Z-index and pointer event coordination between layers requires care

**Example:**
```typescript
// EventBus.ts -- shared between Phaser and React
const EventBus = new EventTarget();
export default EventBus;

// In Phaser scene: emit agent click
EventBus.dispatchEvent(new CustomEvent('agent-selected', {
  detail: { agentId: 'ceo-1', position: { x: 120, y: 80 } }
}));

// In React component: listen for agent selection
useEffect(() => {
  const handler = (e: CustomEvent) => setSelectedAgent(e.detail.agentId);
  EventBus.addEventListener('agent-selected', handler);
  return () => EventBus.removeEventListener('agent-selected', handler);
}, []);
```

### Pattern 2: Background Crew Execution with Callback Relay

**What:** CrewAI crew/flow executions run as asyncio background tasks. The `step_callback` and `task_callback` hooks capture progress events and relay them through the WebSocket manager to connected clients. This decouples the long-running AI work from the request/response cycle.

**When to use:** Always. CrewAI crew executions can take seconds to minutes. They must never block the API event loop.

**Trade-offs:**
- Pro: Non-blocking API, multiple crews can run concurrently
- Pro: Real-time progress visibility for the frontend
- Pro: Graceful handling of disconnects (crew keeps running, client reconnects)
- Con: Need careful lifecycle management (cancellation, cleanup on office deletion)
- Con: Callback relay adds complexity vs. simple request/response

**Example:**
```python
# execution_service.py
import asyncio
from crewai import Crew

class ExecutionService:
    def __init__(self, ws_manager, db_session):
        self.ws_manager = ws_manager
        self.db = db_session
        self._running_tasks: dict[str, asyncio.Task] = {}

    async def start_crew(self, office_id: str, crew: Crew):
        task = asyncio.create_task(
            self._run_crew(office_id, crew)
        )
        self._running_tasks[office_id] = task

    async def _run_crew(self, office_id: str, crew: Crew):
        def on_step(step_output):
            # Relay each agent thinking step to WebSocket clients
            asyncio.create_task(self.ws_manager.broadcast(
                office_id,
                {"type": "agent_step", "data": step_output}
            ))

        def on_task_complete(task_output):
            # Relay task completion to WebSocket clients
            asyncio.create_task(self.ws_manager.broadcast(
                office_id,
                {"type": "task_complete", "data": task_output}
            ))

        result = crew.kickoff(
            step_callback=on_step,
            task_callback=on_task_complete
        )
        # Persist final result
        await self._save_result(office_id, result)
```

### Pattern 3: Room-Based WebSocket Broadcasting

**What:** Each office is a "room." When a client connects, they join a room by office ID. All WebSocket broadcasts are scoped to the room, so agents in Office A do not leak events to clients viewing Office B. This is essential for multi-office support.

**When to use:** From the start. Even with V1 single-office focus, designing for rooms means multi-office is a configuration change, not an architecture change.

**Trade-offs:**
- Pro: Clean isolation between offices
- Pro: Efficient broadcasting (only send to interested clients)
- Pro: Natural fit for cross-office agent sharing (agent joins multiple rooms)
- Con: Slightly more complexity than a single broadcast channel

**Example:**
```python
# ws.py
from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, office_id: str):
        await websocket.accept()
        self.rooms[office_id].append(websocket)

    def disconnect(self, websocket: WebSocket, office_id: str):
        self.rooms[office_id].remove(websocket)

    async def broadcast(self, office_id: str, message: dict):
        for connection in self.rooms[office_id]:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection, office_id)
```

### Pattern 4: CrewAI Flows as Top-Level Orchestrator

**What:** Use CrewAI Flows as the top-level workflow orchestrator. Flows manage state, control execution order, and delegate complex work to Crews. This gives you structured state persistence (`@persist`), conditional branching (`@router`), and human-in-the-loop checkpoints (`@human_feedback`) -- all critical for the autonomous simulation mode.

**When to use:** For any workflow longer than a single crew execution. The "build a SaaS company" autonomous mode is a Flow with many steps, each potentially involving a different Crew.

**Trade-offs:**
- Pro: Built-in state persistence across restarts (survives Docker restart)
- Pro: Event-driven execution with conditional branching
- Pro: Human feedback gates for intervention points
- Con: Flows add a layer of abstraction over raw Crew usage
- Con: Flow state is separate from application database state (need sync strategy)

**Example:**
```python
from crewai.flow.flow import Flow, start, listen, router
from pydantic import BaseModel

class SaaSBuildState(BaseModel):
    company_name: str = ""
    business_plan: str = ""
    tech_stack: str = ""
    phase: str = "planning"

class SaaSBuildFlow(Flow[SaaSBuildState]):
    @start()
    def plan_business(self):
        # Kick off planning crew
        result = PlanningCrew().crew().kickoff(
            inputs={"directive": self.state.company_name}
        )
        self.state.business_plan = result.raw
        return result

    @listen(plan_business)
    @router()
    def review_plan(self):
        # Route based on plan quality
        if "viable" in self.state.business_plan.lower():
            return "approved"
        return "needs_revision"

    @listen("approved")
    def build_product(self):
        result = DevelopmentCrew().crew().kickoff(
            inputs={"plan": self.state.business_plan}
        )
        self.state.tech_stack = result.raw
```

### Pattern 5: Dynamic Agent/Crew Assembly

**What:** Rather than hardcoding crew compositions, dynamically assemble CrewAI Agent and Crew objects from database records. When a user hires an agent (CEO, CTO, developer), it creates a database record. When a task is assigned, the system reads the office's agent roster from the database and assembles a Crew on the fly.

**When to use:** Always. Static crew definitions do not support the "hire agents dynamically" requirement.

**Trade-offs:**
- Pro: Agents are truly dynamic -- users hire/fire at will
- Pro: LLM provider configuration is per-agent and persisted
- Pro: Cross-office agent sharing is just a database relationship
- Con: More complex than defining crews in YAML
- Con: Must validate crew composition at runtime (enough agents for task?)

## Data Flow

### Request Flow (REST)

```
[Browser]
    │ HTTP POST /api/offices/{id}/tasks
    ↓
[FastAPI Router] → validates request (Pydantic schema)
    ↓
[TaskService] → creates task in DB, determines required agents
    ↓
[ExecutionService] → assembles CrewAI Crew from DB agent records
    ↓
[asyncio.create_task] → spawns crew.kickoff() as background task
    ↓
[HTTP 202 Accepted] → returns task_id to client immediately
```

### Real-Time Event Flow (WebSocket)

```
[CrewAI Crew running in background]
    │ step_callback fires (agent thinking/acting)
    ↓
[ExecutionService] → formats event, persists to activity log
    ↓
[ConnectionManager.broadcast(office_id, event)]
    ↓
[WebSocket] → sends JSON to all clients in office room
    ↓
[Frontend WebSocket Client]
    ↓ dispatches to...
    ├── [Zustand Store] → updates agent status, task progress
    │       ↓
    │   [React Components] → re-render chat, task board, activity log
    │
    └── [EventBus] → dispatches to Phaser
            ↓
        [Phaser OfficeScene] → animate agent sprite (typing, walking, talking)
```

### Agent Interaction Flow (Human-in-the-Loop)

```
[User clicks agent in Phaser canvas]
    ↓
[EventBus] → 'agent-selected' event
    ↓
[React ChatPanel] → opens chat for selected agent
    ↓
[User types message, clicks send]
    ↓
[WebSocket] → sends { type: "chat_message", agentId, message }
    ↓
[Backend WebSocket Handler] → routes to AgentService
    ↓
[AgentService] → injects message as context into agent's current task
    ↓
[CrewAI Agent] → processes with LLM, generates response
    ↓
[step_callback] → relays response back through WebSocket
    ↓
[Frontend] → displays agent response in ChatPanel + speech bubble in Phaser
```

### State Persistence Flow

```
[Application State]
    │
    ├── [SQLite via SQLAlchemy]
    │   ├── offices (id, name, config, layout)
    │   ├── agents (id, office_id, role, llm_provider, llm_model, status)
    │   ├── tasks (id, office_id, description, status, assigned_agents, result)
    │   ├── messages (id, agent_id, content, timestamp, direction)
    │   └── activities (id, office_id, agent_id, action, detail, timestamp)
    │
    ├── [CrewAI Memory] (managed by CrewAI, stored separately)
    │   ├── Short-term: within single crew execution
    │   ├── Long-term: across executions (agent learning)
    │   └── Entity: tracked people, concepts, projects
    │
    └── [CrewAI Flow State] (@persist decorator → SQLite)
        └── Flow execution state survives restarts
```

### Key Data Flows

1. **Task Submission:** User creates task via REST API -> task persisted to DB -> crew assembled dynamically from office agents -> crew kicked off as background task -> HTTP 202 returned immediately -> progress streamed via WebSocket.

2. **Agent Activity Visualization:** CrewAI step_callback fires -> event formatted and broadcast via WebSocket -> frontend dispatches to both Zustand (UI update) and EventBus (Phaser animation) -> agent sprite transitions state (idle -> thinking -> typing -> talking).

3. **Office State Restoration:** On page load, frontend fetches full office state via REST (agents, tasks, active activities) -> populates Zustand stores -> Phaser scene reads from stores to place agents at correct positions -> WebSocket connection established to resume real-time updates.

4. **Cross-Office Agent Sharing:** Agent record has `home_office_id` plus many-to-many `shared_offices` relation -> when assembling crew for Office B, include agents shared from Office A -> agent activity broadcasts to both office rooms.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 offices (V1) | Single SQLite database, single FastAPI process, everything in Docker Compose. This is the target. |
| 5-20 offices | Still single process. SQLite handles this fine. May want to limit concurrent crew executions to avoid LLM API rate limits. Add a simple execution queue. |
| 20-100 offices | Switch SQLite to PostgreSQL (async via asyncpg). Add Redis for WebSocket pub/sub if running multiple FastAPI workers. Crew execution queue via Celery or arq. |
| 100+ offices | Not in scope. Would need worker processes per office, message broker (Redis/RabbitMQ), and potentially separate LLM proxy layer for rate limiting. |

### Scaling Priorities

1. **First bottleneck: LLM API rate limits.** Each agent step calls an LLM. An office with 5 agents running a complex task generates dozens of LLM calls. Multiple concurrent offices multiply this. Prevention: execution queue with concurrency limits, configurable per LLM provider.

2. **Second bottleneck: WebSocket broadcast volume.** Active agents generate frequent step events. With many connected clients, broadcast becomes heavy. Prevention: throttle event frequency (batch updates every 500ms instead of every step), allow clients to subscribe to specific event types.

## Anti-Patterns

### Anti-Pattern 1: Synchronous Crew Execution in Request Handler

**What people do:** Call `crew.kickoff()` directly inside a FastAPI route handler and wait for it to complete before responding.
**Why it's wrong:** Crew executions take seconds to minutes. This blocks the API server, causes HTTP timeouts, and prevents concurrent requests. The client gets no progress updates until the entire execution completes.
**Do this instead:** Spawn crew execution as an `asyncio.create_task()`, return HTTP 202 with a task ID immediately, and stream progress via WebSocket callbacks.

### Anti-Pattern 2: Hardcoded Crew Composition

**What people do:** Define fixed crews in Python/YAML (e.g., "always use CEO + CTO + Developer") and instantiate them directly.
**Why it's wrong:** Users need to hire/fire agents dynamically. Fixed crews cannot accommodate different office configurations, different agent counts, or cross-office sharing.
**Do this instead:** Store agent definitions in the database. Assemble CrewAI Agent and Crew objects dynamically from database records at execution time. The crew composition is determined by which agents are in the office when the task runs.

### Anti-Pattern 3: Tight Coupling Between Phaser and React State

**What people do:** Have Phaser scenes directly import and mutate React state, or have React components directly call Phaser scene methods.
**Why it's wrong:** Creates circular dependencies, makes both layers untestable in isolation, and causes subtle bugs when rendering timing differs between Canvas frames and React renders.
**Do this instead:** Use the EventBus as a strict boundary. Phaser dispatches events, React listens. React dispatches events, Phaser listens. Neither imports the other's internals.

### Anti-Pattern 4: Storing All State in CrewAI Memory Only

**What people do:** Rely entirely on CrewAI's built-in memory system for application state (office config, agent roster, task status).
**Why it's wrong:** CrewAI memory is designed for agent context (what the agent "remembers"), not application state. It is not queryable, not relational, and not designed for CRUD operations. Losing CrewAI memory should not lose your office configuration.
**Do this instead:** Use SQLite/SQLAlchemy for application state (offices, agents, tasks, config). Use CrewAI memory for what it is designed for: giving agents context from previous executions.

### Anti-Pattern 5: Single Global WebSocket Channel

**What people do:** Broadcast all events from all offices to all connected clients.
**Why it's wrong:** Creates noise (client receives events for offices they are not viewing), wastes bandwidth, and leaks information between offices that should be isolated.
**Do this instead:** Room-based WebSocket broadcasting from day one. Each office is a room. Clients join the room for the office they are viewing.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | CrewAI native LLM class (`LLM(model="gpt-4o")`) | Set via `OPENAI_API_KEY` env var. Per-agent model selection. |
| Anthropic API | CrewAI native LLM class (`LLM(model="anthropic/claude-sonnet-4-5")`) | Set via `ANTHROPIC_API_KEY` env var. |
| Google Gemini API | CrewAI via LiteLLM fallback (`LLM(model="gemini/gemini-pro")`) | Set via `GOOGLE_API_KEY` env var. |
| Ollama (local) | CrewAI LLM class (`LLM(model="ollama/llama3.2", base_url="http://ollama:11434")`) | Runs as separate Docker Compose service. No API key needed. |
| Ollama (cloud) | Same as local but with cloud base_url | User provides base_url in config. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend <-> Backend (REST) | HTTP JSON | Pydantic schemas define contract. Used for CRUD and initial state loading. |
| Frontend <-> Backend (Real-time) | WebSocket JSON | Typed event schemas. Used for live updates, chat, and agent interaction. |
| API Layer <-> Service Layer | Direct Python calls | Services are injected via FastAPI dependency injection. |
| Service Layer <-> CrewAI | Python object instantiation | Services create CrewAI Agents/Crews dynamically from DB records. |
| Service Layer <-> Database | SQLAlchemy async ORM | All DB access goes through SQLAlchemy models. Never raw SQL. |
| Phaser <-> React | EventBus (CustomEvent) | Strict boundary. No direct imports between layers. |
| CrewAI <-> LLM Providers | CrewAI internal (LiteLLM routing) | CrewAI handles provider routing internally. App configures per agent. |

## Build Order (Dependencies Between Components)

The following order respects hard dependencies (later components require earlier ones):

```
Phase 1: Foundation
  ├── Database models + migrations (everything depends on persistence)
  ├── FastAPI app skeleton + config
  └── Basic REST API (offices, agents CRUD)

Phase 2: CrewAI Core
  ├── LLM provider factory (agents need LLM connections)
  ├── Agent role definitions (CEO, CTO, etc.)
  ├── Dynamic crew assembly from DB records
  └── Basic crew execution (synchronous, for testing)

Phase 3: Real-Time Layer
  ├── WebSocket manager with room-based broadcasting
  ├── Background task execution (asyncio)
  ├── Callback relay (step_callback -> WebSocket)
  └── Activity logging to DB

Phase 4: Frontend Foundation
  ├── Vite + React + TypeScript scaffold
  ├── REST API client
  ├── Zustand stores (populated from REST)
  └── Basic UI: office view, agent list, task board

Phase 5: Game Layer
  ├── Phaser game setup + React integration (PhaserGame.tsx)
  ├── Tile map rendering (office floor, walls, furniture)
  ├── Agent sprite rendering + animation state machine
  ├── Pathfinding (BFS on tile grid)
  └── EventBus integration (WebSocket -> store -> EventBus -> Phaser)

Phase 6: Integration
  ├── WebSocket client in frontend
  ├── Real-time agent animation (backend events drive sprite state)
  ├── Chat panel connected to agent interaction flow
  ├── Task board with live status updates
  └── Activity log streaming

Phase 7: Advanced Features
  ├── CrewAI Flows for autonomous simulation mode
  ├── Human-in-the-loop intervention (chat + click interaction)
  ├── Multi-office support + office selector
  ├── Cross-office agent sharing
  └── Office layout customization

Phase 8: Deployment
  ├── Docker Compose (backend, frontend, Ollama)
  ├── Environment variable configuration
  ├── Volume mounts for persistence
  └── Health checks
```

**Build order rationale:** The database and API come first because every other component depends on persisted state. CrewAI integration comes before the frontend because the backend must be functional and testable independently. The real-time layer (WebSocket) must exist before the frontend can consume live events. The Phaser game layer is the most complex frontend piece and depends on both the React scaffold and the WebSocket event stream being functional. Advanced features like Flows and multi-office build on all prior layers.

## Sources

- [CrewAI Official Documentation](https://docs.crewai.com/en/introduction) -- Core architecture, Flows, Crews, Agents, Tasks
- [CrewAI Flows Documentation](https://docs.crewai.com/en/concepts/flows) -- Flow decorators, state management, persistence
- [CrewAI Crew Orchestration (DeepWiki)](https://deepwiki.com/crewAIInc/crewAI/2.1-crew-configuration-and-orchestration) -- Crew configuration, callbacks, execution methods
- [CrewAI LLM Connections](https://docs.crewai.com/en/learn/llm-connections) -- Multi-provider LLM configuration
- [AgentOffice Architecture](https://dev.to/harishkotra/how-i-built-agentoffice-self-growing-ai-teams-in-a-pixel-art-virtual-office-4o0p) -- Reference architecture: Phaser + React overlay, Colyseus, agent think loop
- [Pixel Agents (GitHub)](https://github.com/pablodelucca/pixel-agents) -- Reference: Canvas 2D rendering, sprite state machine, BFS pathfinding
- [Phaser 3 + React TypeScript Template](https://phaser.io/news/2024/03/phaser-3-and-react-typescript-template) -- Official integration pattern, EventBus approach
- [FastAPI WebSocket Documentation](https://fastapi.tiangolo.com/advanced/websockets/) -- WebSocket endpoint patterns
- [FastAPI Background Tasks with WebSockets](https://hexshift.medium.com/implementing-background-tasks-with-websockets-in-fastapi-034cdf803430) -- Background task + WebSocket relay pattern
- [Multi-Agent Architecture Patterns (NexAI)](https://nexaitech.com/multi-ai-agent-architecutre-patterns-for-scale/) -- Enterprise multi-agent orchestration patterns
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) -- Async ORM with aiosqlite/asyncpg

---
*Architecture research for: multi-agent virtual office platform*
*Researched: 2026-03-24*
