# Office-Jam

## What This Is

A multi-office virtual workspace platform where AI agent swarms collaborate in a pixel-art office environment. Users create offices, hire specialized AI agents (CEO, CTO, marketing, legal, etc.), assign tasks, and watch agents collaborate visually in real-time. Supports both autonomous long-running operations ("build a SaaS company") and ad-hoc task execution, with full human-in-the-loop intervention.

## Core Value

A single virtual office where you hire AI agents, give them a task, and watch them collaborate in a pixel-art UI — with the ability to intervene at any point via chat or direct agent interaction.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Pixel-art virtual office UI with animated agents (inspired by pixel-agents)
- [ ] TypeScript backend with LangGraph for agent swarm orchestration
- [ ] LangChain for LLM integration across providers
- [ ] Prisma ORM for database management
- [ ] Dynamic agent hiring — system suggests roles based on task needs, user approves or hires manually
- [ ] Specialized agent roles: CEO, CTO, marketing, legal, developer, designer, etc.
- [ ] Task assignment and autonomous agent collaboration
- [ ] Autonomous loop execution for complex multi-step tasks
- [ ] Human-in-the-loop: chat panel, click-on-agent interaction, agent-initiated alerts
- [ ] Multi-office support with configurable cross-office agent sharing
- [ ] Agent profiles: role, skills, current task, chat history
- [ ] Office dashboard: overview of all offices, agents, tasks, metrics
- [ ] Task board: kanban/list view of active tasks and status
- [ ] Real-time activity logs of agent actions and decisions
- [ ] Configurable LLM provider per agent (OpenAI, Anthropic, Gemini, Ollama local/cloud)
- [ ] Full state persistence: agents, tasks, history, office state across sessions
- [ ] Docker Compose deployment for local execution

### Out of Scope

- Cloud hosting / multi-tenant deployment — local Docker only for v1
- Mobile app — browser-based only
- Billing / payment integration — no monetization layer
- Voice interaction with agents — text-based only

## Context

- **Frontend inspiration**: [pixel-agents](https://github.com/pablodelucca/pixel-agents) — pixel-art style virtual office with animated AI agent characters
- **Agent framework**: LangGraph provides the multi-agent orchestration layer with stateful graph-based workflows, supporting cyclic agent interactions, conditional routing, and human-in-the-loop checkpoints
- **LLM integration**: LangChain provides unified LLM access across OpenAI (GPT-4o), Anthropic (Claude), Google Gemini, Ollama (local), Ollama cloud
- **Two execution modes**: (1) Ad-hoc task execution — give agents specific tasks and get results. (2) Autonomous simulation — complex directives like "create and run a SaaS company" that agents execute in loops with checkpoints
- **Cross-office collaboration**: Configurable per office — some offices share agents, others are fully isolated
- **V1 focus**: Single office end-to-end. Multi-office and cross-office features are designed into the architecture but v1 demos one fully working office
- **Unified TypeScript stack**: Both frontend and backend in TypeScript for code sharing and developer experience

## Constraints

- **Backend**: TypeScript with LangGraph for agent orchestration, LangChain for LLM integration
- **Database**: Prisma ORM with PostgreSQL
- **Frontend**: Must closely resemble pixel-agents visual style (pixel art, animated agent sprites, office environment)
- **Deployment**: Docker Compose for local development and execution
- **Persistence**: Full state must survive session restarts — database required
- **Real-time**: WebSocket or SSE for live agent activity updates in the UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| LangGraph for agent orchestration | User decision — stateful graph workflows, cyclic interactions, built-in human-in-the-loop | — Pending |
| LangChain for LLM integration | User decision — unified multi-provider LLM access | — Pending |
| Prisma for database | User decision — type-safe ORM, great DX with TypeScript | — Pending |
| TypeScript full-stack (pivot from Python) | User decision — unified language for frontend + backend | — Pending |
| Pixel-art frontend inspired by pixel-agents | User requirement — visual representation of agents working in offices | — Pending |
| Configurable LLM per agent | Users need flexibility across providers and cost tiers | — Pending |
| Docker Compose only (no cloud deploy) | Simplify v1 scope, run everything locally | — Pending |
| Cross-office sharing as configurable toggle | Some use cases need isolation, others need collaboration | — Pending |

---
*Last updated: 2026-03-24 after stack pivot to TypeScript + LangGraph + LangChain + Prisma*
