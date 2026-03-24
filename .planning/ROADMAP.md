# Roadmap: Office-Jam

## Overview

Office-Jam delivers a pixel-art virtual office where AI agents collaborate on tasks in real time. The build order is back-to-front: infrastructure and database first, then agent orchestration (LangGraph/LangChain), then the real-time WebSocket layer, then the React UI panels, and finally the PixiJS pixel-art visualization with full end-to-end integration. Each phase delivers a verifiable capability that the next phase depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Nx monorepo, Prisma/PostgreSQL schema, Docker Compose, and data persistence
- [x] **Phase 2: Agent Orchestration** - LangGraph workflows, LangChain LLM integration, agent roles, and safety guardrails
- [ ] **Phase 3: Real-Time Layer** - WebSocket server with room-based broadcasting, heartbeat, callback relay, and activity logging
- [ ] **Phase 4: React Frontend** - Task board, agent profiles, activity log, chat panel, and WebSocket client
- [ ] **Phase 5: Pixel-Art Office** - PixiJS office environment, animated agent sprites, pathfinding, and full end-to-end integration

## Phase Details

### Phase 1: Foundation
**Goal**: A working local development environment with a persistent database schema that supports the full application data model
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` starts the full application stack (database, backend, frontend) with zero manual steps
  2. The Prisma schema defines tables for offices, agents, tasks, messages, and activities with proper relations
  3. Running `docker compose down && docker compose up` preserves all previously created data (agents, tasks, office state)
  4. The database schema isolates data by office ID, supporting multi-office from day one even though v1 shows one office
  5. The Nx monorepo builds both frontend and backend packages from a single workspace with shared TypeScript types
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold Nx monorepo with Fastify API, React frontend, and shared libraries
- [ ] 01-02-PLAN.md -- Set up Prisma 7 database layer with schema, client singleton, and Fastify plugin
- [ ] 01-03-PLAN.md -- Create Docker Compose, Dockerfiles, shared domain types, and verify full stack

### Phase 2: Agent Orchestration
**Goal**: Users can create agents with specialized roles, configure their LLM providers, assign tasks, and watch agents collaborate through a safe, async orchestration pipeline
**Depends on**: Phase 1
**Requirements**: ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, ORCH-06, ORCH-07, ORCH-08
**Success Criteria** (what must be TRUE):
  1. User can create an agent, assign it a role (CEO, developer, designer, etc.), and choose which LLM provider/model powers it
  2. User can create a task, assign it to one or more agents, and the agents execute collaboratively via a LangGraph stateful workflow
  3. Agent execution runs asynchronously and never blocks the Fastify event loop or WebSocket connections
  4. Agent execution respects loop protection: max iterations, max execution time, and token budget limits are enforced
  5. Agent outputs are validated via structured schemas between handoffs so bad output from one agent does not cascade
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md -- Schema extensions (OfficeLlmConfig, TaskExecution), encryption service, shared types, vitest setup
- [ ] 02-02-PLAN.md -- LLM factory, Agent CRUD, Task CRUD, and Office LLM config routes
- [ ] 02-03-PLAN.md -- LangGraph orchestration engine (state, agent nodes, guardrails, workflow builder)
- [ ] 02-04-PLAN.md -- Task execution endpoint (async fire-and-forget) and full integration wiring

### Phase 3: Real-Time Layer
**Goal**: Agent execution events flow from the backend to connected clients in real time, with reliable connection management and persistent activity history
**Depends on**: Phase 2
**Requirements**: RT-01, RT-02, RT-03, RT-04
**Success Criteria** (what must be TRUE):
  1. WebSocket clients connect to office-scoped rooms and receive only events for their office
  2. The server detects and cleans up dead connections via heartbeat pings every 30 seconds
  3. When an agent executes a task, each step and decision is relayed to connected WebSocket clients as it happens
  4. All agent activities are logged to the database and can be replayed after a page refresh
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: React Frontend
**Goal**: Users can manage tasks, inspect agents, read real-time activity, and chat with agents through a complete React UI
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, HITL-01
**Success Criteria** (what must be TRUE):
  1. User can view and manage tasks in a kanban/list board showing task status, assigned agents, and progress
  2. User can inspect any agent to see its role, skills, current task, LLM configuration, and token usage
  3. User can watch a real-time activity log that updates live as agents make decisions and produce outputs
  4. User can send a chat message to a specific agent or the whole team and see the agent's response
  5. If the WebSocket connection drops, the client reconnects automatically with exponential backoff and restores state
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Pixel-Art Office
**Goal**: Users see a pixel-art office with animated agent sprites that move, work, and communicate visually -- driven by real backend events -- and can click on any agent to interact
**Depends on**: Phase 4
**Requirements**: PIX-01, PIX-02, PIX-03, PIX-04, PIX-05, HITL-02
**Success Criteria** (what must be TRUE):
  1. A PixiJS canvas renders a tiled office environment with floor, walls, and furniture
  2. Agent sprites animate through distinct states (idle, working, typing, talking, walking) driven by backend WebSocket events via the EventBus
  3. Agents navigate the office using pathfinding on the tile grid (no walking through walls or furniture)
  4. When agents collaborate, speech bubbles and delegation indicators appear above their sprites
  5. User can click on any agent sprite in the pixel office to open their profile and interact directly
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-24 |
| 2. Agent Orchestration | 4/4 | Complete | 2026-03-25 |
| 3. Real-Time Layer | 0/? | Not started | - |
| 4. React Frontend | 0/? | Not started | - |
| 5. Pixel-Art Office | 0/? | Not started | - |
