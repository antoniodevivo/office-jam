# Requirements: Office-Jam

**Defined:** 2026-03-24
**Core Value:** A single virtual office where you hire AI agents, give them a task, and watch them collaborate in a pixel-art UI -- with the ability to intervene at any point

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFR-01**: Project uses Nx monorepo with TypeScript for frontend and backend
- [ ] **INFR-02**: Application deploys via single `docker compose up` command
- [x] **INFR-03**: PostgreSQL database with Prisma ORM for all application state
- [ ] **INFR-04**: All data (agents, tasks, history, office state) survives container restarts via volume mounts
- [x] **INFR-05**: Database schema supports multi-office isolation from day one (even though v1 UI shows one office)

### Agent Orchestration

- [ ] **ORCH-01**: LangGraph manages agent workflows with stateful graph-based execution
- [x] **ORCH-02**: LangChain provides unified LLM access across all supported providers
- [x] **ORCH-03**: User can assign specialized roles to agents (CEO, CTO, developer, designer, marketing, legal, etc.)
- [x] **ORCH-04**: User can configure which LLM provider/model powers each agent (OpenAI, Anthropic, Gemini, Ollama local/cloud)
- [ ] **ORCH-05**: Agent execution has loop protection: max iterations, max execution time, and token budget limits
- [ ] **ORCH-06**: Agent orchestration runs asynchronously -- never blocks the API event loop or WebSocket connections
- [ ] **ORCH-07**: Agent outputs are validated between handoffs (structured output schemas)
- [x] **ORCH-08**: User can create a task and assign it to one or more agents for collaborative execution

### Real-Time Communication

- [ ] **RT-01**: WebSocket server with room-based broadcasting (one room per office)
- [ ] **RT-02**: Server-side heartbeat pings every 30 seconds with dead connection cleanup
- [ ] **RT-03**: Agent execution progress relayed to WebSocket clients in real-time via callbacks
- [ ] **RT-04**: All agent activities logged to database for persistence and replay

### Frontend UI

- [ ] **UI-01**: Task board with kanban/list view showing active tasks and their status
- [ ] **UI-02**: Agent profile panel showing role, skills, current task, LLM config, and token usage
- [ ] **UI-03**: Real-time activity log displaying agent actions, decisions, and outputs as they happen
- [ ] **UI-04**: Chat panel for sending messages to specific agents or the whole team
- [ ] **UI-05**: WebSocket client with exponential backoff reconnection on disconnect

### Pixel-Art Visualization

- [ ] **PIX-01**: PixiJS office environment with tilemap rendering (floor, walls, furniture)
- [ ] **PIX-02**: Animated agent sprites with state machine (idle, working, typing, talking, walking)
- [ ] **PIX-03**: BFS/A* pathfinding on tile grid for agent movement
- [ ] **PIX-04**: Agent-to-agent visible communication via speech bubbles and delegation indicators
- [ ] **PIX-05**: EventBus integration -- WebSocket events drive sprite state transitions (strict boundary between PixiJS and React)

### Human-in-the-Loop

- [ ] **HITL-01**: User can send chat messages to specific agents while they are working
- [ ] **HITL-02**: User can click on any agent in the pixel office to see their status and interact directly

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Autonomous Mode

- **AUTO-01**: LangGraph workflows for complex multi-step autonomous tasks with checkpoint/resume
- **AUTO-02**: Tasks can run in loops with milestone checkpoints (e.g., "build a SaaS company")
- **AUTO-03**: Pause/resume autonomous execution with full state preservation

### Dynamic Hiring

- **HIRE-01**: System detects skill gaps and suggests new agent roles to hire
- **HIRE-02**: User can approve or reject system-suggested hires
- **HIRE-03**: User can manually hire agents from a role roster at any time

### Advanced HITL

- **HITL-03**: Agents can initiate alerts to request human input when blocked
- **HITL-04**: User can cancel running tasks with in-flight LLM call cleanup
- **HITL-05**: Decision reasoning traces -- expandable "why" per agent action

### Multi-Office

- **OFFICE-01**: UI for creating and managing multiple offices
- **OFFICE-02**: Office dashboard with aggregate metrics across all offices
- **OFFICE-03**: Configurable cross-office agent sharing (toggle per office)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud hosting / multi-tenant | Local Docker only for v1 -- simplify scope |
| Mobile app | Browser-based only |
| Billing / payments | No monetization layer in v1 |
| Voice interaction | Text-based only -- massive scope for marginal benefit |
| Fully autonomous agent hiring | Runaway cost risk without user control |
| Agent personality traits | Gimmick -- adds prompt complexity without output benefit |
| Custom office layout editor | Low value vs agent features |
| SSE fallback | WebSocket sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 1 | Pending |
| INFR-05 | Phase 1 | Complete |
| ORCH-01 | Phase 2 | Pending |
| ORCH-02 | Phase 2 | Complete |
| ORCH-03 | Phase 2 | Complete |
| ORCH-04 | Phase 2 | Complete |
| ORCH-05 | Phase 2 | Pending |
| ORCH-06 | Phase 2 | Pending |
| ORCH-07 | Phase 2 | Pending |
| ORCH-08 | Phase 2 | Complete |
| RT-01 | Phase 3 | Pending |
| RT-02 | Phase 3 | Pending |
| RT-03 | Phase 3 | Pending |
| RT-04 | Phase 3 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |
| HITL-01 | Phase 4 | Pending |
| PIX-01 | Phase 5 | Pending |
| PIX-02 | Phase 5 | Pending |
| PIX-03 | Phase 5 | Pending |
| PIX-04 | Phase 5 | Pending |
| PIX-05 | Phase 5 | Pending |
| HITL-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
