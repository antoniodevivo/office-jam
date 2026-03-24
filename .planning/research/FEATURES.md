# Feature Research

**Domain:** Multi-agent AI virtual office platform (pixel-art agent swarm orchestration)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Competitor Landscape (Context for Feature Decisions)

Direct competitors in the pixel-art AI agent office space:

| Product | Focus | Stack | Key Differentiator |
|---------|-------|-------|--------------------|
| **AgentOffice** | Autonomous agent collaboration | TypeScript/Phaser.js/Colyseus/Ollama | Self-growing teams, dynamic hiring |
| **Claw Empire** | CEO-directed agent company | React/PixiJS/Express/SQLite | Workflow packs, 600+ skills library, meeting system |
| **Pixel Agents** | VS Code agent visualization | TypeScript/React/Canvas 2D | IDE-native, log-driven animation |
| **Agent Town** | Pixel RPG boss simulation | OpenClaw-based | Walkable memory spaces, co-op multi-human |
| **Bit Office** | Team leader orchestration | VS Code extension | Kanban wall, desk-as-directory metaphor |

Office-Jam differentiates through: CrewAI-powered orchestration (not CLI wrapper), multi-provider LLM per agent, dual execution modes (ad-hoc + autonomous loops), and multi-office support.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Pixel-art office with animated agent sprites** | Core visual promise; every competitor has this. Without it you have a terminal. | HIGH | Phaser.js or PixiJS for rendering. Need sprite sheets for each role (CEO, CTO, dev, etc.) with walk/idle/work/talk animations. AgentOffice uses Phaser; Claw Empire uses PixiJS. |
| **Agent role assignment** | Users need to see who does what. Roles define the mental model. | LOW | CrewAI natively supports role, goal, backstory per agent. Map to visual sprites. |
| **Task assignment and status tracking** | Users must give agents work and see progress. Kanban/list view is standard. | MEDIUM | Kanban board with columns: Backlog, In Progress, Review, Done. Every competitor has this. Claw Empire adds Inbox, Planned, Collaborating states. |
| **Real-time activity feed** | Users need to see what agents are doing NOW. Opacity kills trust. | MEDIUM | WebSocket/SSE stream of agent actions, decisions, tool usage. Timestamp + agent + action format. Critical for transparency. |
| **Agent-to-agent communication** | Core multi-agent value. Agents must visibly collaborate. | MEDIUM | CrewAI handles delegation natively. UI shows speech bubbles, chat logs between agents. AgentOffice does this with proximity-based conversation. |
| **Click-to-inspect agent** | Users expect to click any agent and see details. Pixel Agents, AgentOffice, Bit Office all have this. | LOW | Show: current task, role, skills, recent actions, chat history, LLM provider, token usage. |
| **Chat panel (human-to-agent)** | Human-in-the-loop is a stated requirement. Users must intervene via text. | MEDIUM | Persistent chat per agent + global chat. Agent responds contextually. CrewAI supports human input during tasks. |
| **State persistence across sessions** | Users will close the browser and expect to resume. AgentOffice and Claw Empire both persist to SQLite. | MEDIUM | Database-backed: agent state, task progress, chat history, office layout. CrewAI's @persist() decorator handles workflow state. |
| **Agent status indicators** | Users glance at the office and need instant state awareness. | LOW | Visual indicators on sprites: working (typing animation), idle, talking (speech bubble), waiting for input (alert icon), error (red indicator). |
| **Office layout / environment** | Users expect a furnished office, not an empty grid. Competitors have desks, meeting rooms, furniture. | MEDIUM | Grid-based tilemap with pre-built office templates. Desks, meeting table, whiteboard. Agents pathfind to relevant locations. |

### Differentiators (Competitive Advantage)

Features that set Office-Jam apart. Not expected by users of generic tools, but provide real value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Configurable LLM provider per agent** | No competitor does this well. Users pick the right model for each role: Claude for the CTO (reasoning), GPT-4o for marketing (creativity), Ollama for cost-sensitive roles. Cost optimization + capability matching. | MEDIUM | CrewAI supports multi-provider natively. Need UI for per-agent LLM config: provider, model, temperature, token limits. Claw Empire supports multiple providers but doesn't emphasize per-agent selection in the UI. |
| **Dual execution modes (ad-hoc + autonomous loops)** | Competitors are either fully autonomous (AgentOffice) or fully directed (Claw Empire). Office-Jam does both. Ad-hoc: "write a blog post." Autonomous: "build and launch a SaaS." | HIGH | Ad-hoc mode uses standard CrewAI task execution. Autonomous mode needs: loop detection, checkpoint/resume, progress milestones, configurable intervention points, and a stop/pause mechanism. This is the hardest feature. |
| **Multi-office support with cross-office agent sharing** | No competitor supports multiple isolated workspaces with optional agent sharing. Enables: personal office, company office, project office. | HIGH | Architecture must support office isolation from day 1. V1 ships with one office but the data model supports N offices. Cross-office agent sharing is a toggle per office. |
| **Dynamic agent hiring with role suggestions** | AgentOffice has agent-initiated hiring. Office-Jam adds system-suggested hiring based on task analysis. "This task needs a legal reviewer. Hire one?" | MEDIUM | CrewAI can analyze task requirements. System suggests roles, user approves or customizes before hiring. More controlled than AgentOffice's fully autonomous hiring. |
| **Agent-initiated alerts and escalation** | Agents proactively notify humans when they need help, hit blockers, or reach decision points. Beyond passive monitoring. | MEDIUM | CrewAI's human-input-on-task combined with UI notifications. Toast/badge alerts. Agent walks to a "help desk" location visually when blocked. |
| **Decision transparency and reasoning traces** | Show WHY an agent made a decision, not just WHAT it did. CrewAI's step callbacks expose reasoning chains. | MEDIUM | Expandable reasoning trace per action in the activity feed. "I delegated to the developer because the task requires code changes and the CTO confirmed the architecture." |
| **Office dashboard with cross-office metrics** | Bird's-eye view of all offices, all agents, all tasks. No competitor has multi-office dashboards. | MEDIUM | Dashboard: office count, agent utilization, task completion rate, LLM cost tracking, active/idle ratios. Useful when managing multiple offices. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately excluded.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Fully autonomous agent hiring (no approval)** | "Let agents scale themselves!" AgentOffice does this. | Runaway agent creation. Cost explosion from uncontrolled LLM calls. Users lose understanding of who's in their office and why. AgentOffice caps at 7 agents for this reason. | System suggests hires, user approves. User stays in control of headcount and cost. |
| **Voice interaction with agents** | "Talk to my agents like Alexa." | Massive scope increase (speech-to-text, text-to-speech, voice UX). Text chat covers 95% of interaction needs. V1 is explicitly text-only per PROJECT.md. | Text chat with rich formatting. Consider voice as a v2+ experiment. |
| **Cloud multi-tenant deployment** | "I want to share my office with coworkers." | Security model, auth, billing, data isolation all become first-class concerns. Premature complexity for v1. | Docker Compose local-only. Design data model to not preclude multi-tenant later but don't build it. |
| **Custom agent code execution (arbitrary tools)** | "Let agents run any code." AgentOffice supports sandboxed JS. | Security risk. Users will blame the platform when agents delete files or make bad API calls. Sandboxing is hard to get right. | CrewAI's curated tool system. Pre-built tools (web search, file read, code analysis) with explicit user-approved tool grants per agent. |
| **Real-time everything (sub-second updates)** | "I want to see every keystroke." | WebSocket flood. Browser performance tanks with high-frequency updates. Most agent actions take 5-30 seconds anyway. | Batched updates every 2-3 seconds. Instant updates only for: task completion, agent alerts, errors. Activity feed appends, doesn't poll. |
| **Agent personality traits (Big Five model)** | "Agents should have unique personalities!" AgentOffice uses openness, conscientiousness, etc. | Personality simulation is a gimmick that doesn't improve task output. Adds LLM prompt complexity. Users care about results, not whether their CTO is "agreeable." | Role-specific system prompts that affect work style (e.g., CTO is thorough and asks clarifying questions). Functional behavior, not personality theater. |
| **Mobile app** | "I want to check my office on my phone." | Pixel art office needs screen real estate. Mobile UX for agent interaction is poor. Explicitly out of scope. | Responsive browser UI that works on tablets. Phone-sized is not a target. |
| **Drag-and-drop office layout editor** | "Let me customize my office furniture." Pixel Agents has a full layout editor. | High development cost for a feature users use once. Not core to the agent collaboration value prop. | Pre-built office templates (small/medium/large). Users pick a template. Custom layouts are a v2+ feature. |

## Feature Dependencies

```
[Agent Role Assignment]
    |
    +--requires--> [Agent Sprite System]
    |                  |
    |                  +--requires--> [Pixel Art Office Renderer]
    |
    +--requires--> [CrewAI Agent Configuration]
                       |
                       +--enables--> [Task Assignment]
                       |                 |
                       |                 +--enables--> [Task Board UI]
                       |                 |
                       |                 +--enables--> [Agent-to-Agent Communication]
                       |                                   |
                       |                                   +--enables--> [Decision Transparency]
                       |
                       +--enables--> [Human-to-Agent Chat]
                       |                 |
                       |                 +--enables--> [Agent-Initiated Alerts]
                       |
                       +--enables--> [Configurable LLM per Agent]

[State Persistence]
    |
    +--requires--> [Database Schema]
    |
    +--enables--> [Session Resume]
    |
    +--enables--> [Autonomous Loop Execution]
                      |
                      +--requires--> [Checkpoint/Resume System]
                      |
                      +--requires--> [Task Assignment]

[Real-Time Activity Feed]
    |
    +--requires--> [WebSocket/SSE Infrastructure]
    |
    +--requires--> [CrewAI Step Callbacks]

[Multi-Office Support]
    |
    +--requires--> [Office Isolation in Data Model]
    |
    +--requires--> [State Persistence]
    |
    +--enables--> [Cross-Office Agent Sharing]
    |
    +--enables--> [Office Dashboard]

[Dynamic Agent Hiring]
    |
    +--requires--> [Agent Role Assignment]
    |
    +--requires--> [Task Assignment] (to analyze what roles are needed)
```

### Dependency Notes

- **Pixel Art Office Renderer is the foundation:** Everything visual depends on the canvas/game engine being in place. Build this first.
- **CrewAI Agent Configuration unlocks the agent layer:** Task assignment, communication, and LLM config all flow from having agents properly configured in CrewAI.
- **State Persistence is a prerequisite for autonomous loops:** You cannot run long-running autonomous tasks without checkpoint/resume. This must be solid before autonomous mode ships.
- **WebSocket infrastructure is shared:** Activity feed, agent status updates, and chat all use the same real-time transport. Build once, use everywhere.
- **Multi-Office is architecturally foundational but feature-deferred:** The data model must support multiple offices from day 1, but the UI only needs to show one office in v1. Retrofitting office isolation is a rewrite.

## MVP Definition

### Launch With (v1)

Minimum viable product -- validate that watching AI agents collaborate in a pixel office is compelling.

- [ ] **Pixel-art office with 3-5 agent roles** -- The visual hook. Agents walk, sit at desks, show status. Without this, it's just another terminal.
- [ ] **CrewAI-powered task execution (ad-hoc mode)** -- User assigns a task, agents collaborate, results delivered. The core loop.
- [ ] **Task board (kanban)** -- See what's being worked on, what's done, what's blocked.
- [ ] **Real-time activity feed** -- Stream of agent actions and decisions. Transparency builds trust.
- [ ] **Click-to-inspect agent** -- Click any sprite to see role, current task, status, recent activity.
- [ ] **Human-to-agent chat** -- Click agent, type message, agent responds. The intervention mechanism.
- [ ] **Agent-to-agent visible collaboration** -- Speech bubbles, delegation indicators. Users see agents working together.
- [ ] **Configurable LLM per agent** -- Pick provider/model for each agent. Key differentiator, include from day 1.
- [ ] **SQLite persistence** -- Agents, tasks, and chat survive browser refresh and Docker restart.
- [ ] **Docker Compose deployment** -- Single `docker compose up` to run everything locally.

### Add After Validation (v1.x)

Features to add once core ad-hoc execution is working and users confirm the concept.

- [ ] **Autonomous loop execution** -- Complex multi-step tasks with checkpoints. Add when ad-hoc mode is stable.
- [ ] **Dynamic agent hiring (system-suggested)** -- "You need a legal reviewer for this contract task." Add when task system is mature.
- [ ] **Agent-initiated alerts** -- Agents proactively flag blockers. Add when chat system handles interrupts.
- [ ] **Decision reasoning traces** -- Expandable "why" for each agent action. Add when activity feed is stable.
- [ ] **Office templates** -- Pre-built small/medium/large office layouts. Add when tile system supports it.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multi-office support** -- Multiple isolated workspaces. Defer until single office is polished.
- [ ] **Cross-office agent sharing** -- Agents lent between offices. Defer until multi-office exists.
- [ ] **Office dashboard with metrics** -- Aggregate view across offices. Defer until multi-office exists.
- [ ] **Custom office layout editor** -- User-designed offices. Low priority vs. agent features.
- [ ] **Agent skill/tool marketplace** -- Browse and install agent capabilities. Community feature, needs critical mass.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Pixel-art office renderer | HIGH | HIGH | P1 |
| Agent role assignment (CrewAI) | HIGH | LOW | P1 |
| Task assignment + kanban board | HIGH | MEDIUM | P1 |
| Real-time activity feed | HIGH | MEDIUM | P1 |
| Click-to-inspect agent | HIGH | LOW | P1 |
| Human-to-agent chat | HIGH | MEDIUM | P1 |
| Agent-to-agent communication | HIGH | MEDIUM | P1 |
| Configurable LLM per agent | HIGH | MEDIUM | P1 |
| State persistence (SQLite) | HIGH | MEDIUM | P1 |
| Agent status indicators | MEDIUM | LOW | P1 |
| Office layout with furniture | MEDIUM | MEDIUM | P1 |
| Docker Compose deployment | HIGH | LOW | P1 |
| Autonomous loop execution | HIGH | HIGH | P2 |
| Dynamic agent hiring | MEDIUM | MEDIUM | P2 |
| Agent-initiated alerts | MEDIUM | MEDIUM | P2 |
| Decision reasoning traces | MEDIUM | LOW | P2 |
| Office templates | LOW | LOW | P2 |
| Multi-office support | MEDIUM | HIGH | P3 |
| Cross-office agent sharing | LOW | HIGH | P3 |
| Office dashboard | LOW | MEDIUM | P3 |
| Layout editor | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the core experience
- P2: Should have, add when core is stable
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | AgentOffice | Claw Empire | Pixel Agents | Office-Jam (planned) |
|---------|-------------|-------------|--------------|---------------------|
| Pixel-art office | Phaser.js | PixiJS | Canvas 2D | Phaser.js or PixiJS |
| Agent orchestration | Custom Ollama loop | CLI/API wrapper | Log reader only | CrewAI (full framework) |
| Task board | Basic TaskBoard | Full Kanban (6 states) | None | Kanban (4-6 states) |
| Human-in-the-loop | Chat panel | CEO directives | None | Chat + click + alerts |
| LLM providers | Ollama (primary) | 9+ providers | Claude Code only | OpenAI, Anthropic, Gemini, Ollama |
| Per-agent LLM config | Via adapter pattern | Per-agent provider | N/A | Per-agent with UI |
| Autonomous execution | Always-on loop | Directive-driven | N/A | Dual mode (ad-hoc + auto) |
| Agent hiring | Dynamic (agent-initiated) | Manual with UI | N/A | System-suggested + approval |
| Persistence | SQLite | SQLite | None (VS Code state) | SQLite/PostgreSQL |
| Multi-office | No | No | No | Yes (v2) |
| Deployment | Docker | Docker | VS Code extension | Docker Compose |
| Meeting system | No | Yes (with minutes) | No | No (v1) |
| Skills library | No | 600+ skills | No | CrewAI tools |
| Git integration | No | Worktree isolation | No | No (v1) |
| Observability | SystemLog panel | Agent rankings, KPIs | Status heuristics | Activity feed + reasoning traces |

## Sources

- [AgentOffice - GitHub](https://github.com/harishkotra/agent-office) - Direct competitor, pixel-art virtual office with Ollama agents
- [AgentOffice - Dev.to writeup](https://dev.to/harishkotra/how-i-built-agentoffice-self-growing-ai-teams-in-a-pixel-art-virtual-office-4o0p) - Architecture and feature details
- [Claw Empire - GitHub](https://github.com/GreenSheep01201/claw-empire) - CEO-directed agent office simulator
- [Pixel Agents - GitHub](https://github.com/pablodelucca/pixel-agents) - VS Code extension, visual inspiration
- [Agent Town - GitHub](https://github.com/geezerrrr/agent-town) - Pixel RPG agent platform
- [CrewAI Documentation](https://docs.crewai.com/) - Agent orchestration framework features
- [CrewAI Memory](https://docs.crewai.com/en/concepts/memory) - Persistence and memory capabilities
- [Microsoft - UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/) - Agent UX best practices
- [WEF - Rethinking UX for Multi-Agent AI](https://www.weforum.org/stories/2025/08/rethinking-the-user-experience-in-the-age-of-multi-agent-ai/) - Transparency and control in agent UX
- [Azure - AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - Checkpoint and long-running task patterns

---
*Feature research for: Multi-agent AI virtual office platform*
*Researched: 2026-03-24*
