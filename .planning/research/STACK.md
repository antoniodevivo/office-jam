# Stack Research

**Domain:** Multi-agent virtual office platform with pixel-art frontend and AI orchestration backend
**Researched:** 2026-03-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.12 | Backend runtime | Best balance of performance and ecosystem support for 2026. CrewAI requires >=3.10,<3.14. Python 3.12 has the fastest interpreter yet and is fully stable. Avoid 3.13/3.14 -- newer but some C extension ecosystem lag. |
| CrewAI | 1.11.x | Multi-agent orchestration | Non-negotiable per project requirements. Current stable is 1.11.1 (March 2026). Independent of LangChain, 2-3x faster than comparable frameworks. Provides Crews (autonomous agent teams) and Flows (event-driven production scaffolding). 45k+ GitHub stars, battle-tested at 12M+ daily executions. |
| FastAPI | 0.135.x | HTTP/WebSocket API server | The standard async Python web framework. Native WebSocket support, built-in SSE streaming, async-first design pairs perfectly with CrewAI's async patterns. Automatic OpenAPI docs. Used by the majority of Python AI projects. |
| Uvicorn | 0.42.x | ASGI server | Lightning-fast ASGI server for FastAPI. Production-grade with HTTP/1.1 and WebSocket support. Use `--reload` for development, gunicorn+uvicorn workers for production. |
| React | 19.2.x | UI framework | Required by @pixi/react v8 (React 19+). The pixel-agents reference project uses React 19. Mature ecosystem, massive community, well-understood patterns for complex UIs. |
| TypeScript | 5.x | Frontend language | Type safety for the complex game loop + UI state interaction. Non-negotiable for a project with canvas rendering, WebSocket state sync, and multiple component layers. |
| PixiJS | 8.17.x | Pixel-art rendering engine | WebGL/WebGPU 2D renderer with Canvas fallback. Better fit than Phaser for this project -- we are building a visualization, not a game. PixiJS is 3x smaller (450KB vs 1.2MB), 2x faster at pure rendering, and gives full control without game-framework opinions about physics/scenes we do not need. Supports integer zoom for pixel-perfect rendering. |
| @pixi/react | 8.0.x | React-PixiJS bridge | Official React 19 integration for PixiJS v8. Rebuilt from scratch with TypeScript. Declarative JSX components (pixiSprite, pixiAnimatedSprite, pixiContainer). Tree-shakeable via `extend` API for minimal bundle size. |
| Vite | 8.0.x | Frontend build tool | 40x faster than CRA. Vite 8 uses Rolldown (Rust-based bundler) replacing esbuild/Rollup. Instant HMR, React Fast Refresh. Official React+TypeScript template. Requires Node.js 20.19+. |
| Zustand | 5.0.x | Frontend state management | Lightweight hooks-based state management. Perfect for this project -- game state (agent positions, animations), UI state (panels, chat), and WebSocket sync state are distinct concerns that Zustand handles cleanly with separate stores. 2KB bundle. No boilerplate. |
| PostgreSQL | 17 | Application database | The application needs to persist offices, agents, tasks, chat history, and cross-office relationships. PostgreSQL handles this better than SQLite because: (1) runs as a separate Docker service -- natural for Docker Compose, (2) proper concurrent write support for multiple agent tasks completing simultaneously, (3) JSONB for flexible agent config/metadata, (4) robust foreign key relationships for office-agent-task hierarchy. CrewAI manages its OWN memory separately (LanceDB internally), so PostgreSQL is purely for application state. |
| SQLAlchemy | 2.0.x | Python ORM | The standard Python ORM. Async support via `sqlalchemy[asyncio]` + asyncpg driver. Declarative models, relationship management, migration support. Pairs with Alembic for schema migrations. |
| Alembic | 1.18.x | Database migrations | SQLAlchemy's official migration tool. Async support via `-t async` template. Autogenerate migrations from model changes. Essential for iterative schema evolution. |
| Docker Compose | v2 | Container orchestration | Non-negotiable per project requirements. Orchestrates backend, frontend, PostgreSQL, and optional Ollama containers. Volume mounts for hot reload in development. |

### Supporting Libraries

#### Backend (Python)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pydantic | 2.12.x | Data validation/serialization | Always -- FastAPI's native validation layer. Define API schemas, agent configs, task models. CrewAI also uses Pydantic for structured output. |
| pydantic-settings | 2.x | Environment config | Always -- type-safe settings from env vars and .env files. LLM API keys, database URLs, feature flags. |
| asyncpg | 0.30.x | Async PostgreSQL driver | Always -- fastest Python PostgreSQL driver (5x faster than psycopg3). Native asyncio, no thread bridging. Required for SQLAlchemy async + PostgreSQL. |
| python-multipart | 0.x | Form/file uploads | When handling file uploads (agent avatars, office assets). FastAPI dependency for form data. |
| websockets | 14.x | WebSocket protocol | Bundled with FastAPI/uvicorn. Handles real-time agent activity streaming to frontend. |
| litellm | (bundled) | LLM provider abstraction | Bundled with CrewAI. Universal translator for 100+ LLM providers. CrewAI uses natively for OpenAI, Anthropic, Gemini, Ollama. |
| httpx | 0.28.x | Async HTTP client | For external API calls, health checks, Ollama connectivity verification. |
| celery or arq | latest | Background task queue | DEFER to Phase 2+. Only needed if autonomous loop execution requires task scheduling beyond CrewAI's built-in Flow orchestration. Evaluate after v1. |

#### Frontend (TypeScript/React)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.x | Server state management | Always -- handles API data fetching, caching, refetching. Separates server state (API data) from client state (Zustand). |
| react-router | 7.x | Client-side routing | Always -- office navigation, agent profiles, task boards, settings pages. |
| tailwindcss | 4.x | UI styling | For all non-canvas UI (panels, dashboards, forms, chat). Utility-first CSS. Do NOT style canvas elements with Tailwind. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Ruff | Python linting + formatting | Replaces flake8 + black + isort. Single tool, Rust-based, 10-100x faster. Use `ruff check` and `ruff format`. |
| pytest + pytest-asyncio | Python testing | Async test support for FastAPI/CrewAI code. Use `httpx.AsyncClient` for API tests. |
| ESLint + Prettier | TypeScript linting + formatting | Standard for React/TypeScript projects. |
| Vitest | Frontend testing | Vite-native test runner. Compatible with Jest API but faster. |

## Installation

```bash
# Backend (Python) -- use uv for fast dependency management
pip install uv
uv init backend
cd backend

uv add crewai "crewai[tools]" \
    fastapi uvicorn[standard] \
    sqlalchemy[asyncio] asyncpg alembic \
    pydantic pydantic-settings \
    httpx python-multipart \
    websockets

uv add --dev ruff pytest pytest-asyncio

# Frontend (TypeScript/React)
npm create vite@latest frontend -- --template react-swc-ts
cd frontend

npm install pixi.js @pixi/react \
    zustand \
    @tanstack/react-query \
    react-router

npm install -D tailwindcss @tailwindcss/vite \
    vitest @testing-library/react
```

```yaml
# docker-compose.yml services
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: officejam
      POSTGRES_USER: officejam
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://officejam:dev_password@db:5432/officejam
    depends_on:
      - db
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "5173:5173"
    command: npm run dev -- --host 0.0.0.0

  # Optional: local Ollama for free/private LLM
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    profiles:
      - local-llm

volumes:
  postgres_data:
  ollama_data:
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| PixiJS 8 | Phaser 3/4 | Only if you need built-in physics, collision detection, or are building a full game. Phaser 4 is still in RC (not stable). For a visualization/dashboard with animated sprites, PixiJS provides better control at lower overhead. |
| PixiJS 8 | Raw Canvas 2D | Only if zero dependencies is a hard requirement. The pixel-agents reference uses raw Canvas, but it is a simple VS Code extension. Our project needs animated sprites, layered rendering, zoom, and performance with many agents -- PixiJS handles this out of the box. |
| PostgreSQL 17 | SQLite | Only if you want zero-ops simplicity and will never have concurrent writes. SQLite is fine for prototyping, but our Docker Compose setup already runs a DB container anyway, and PostgreSQL handles concurrent agent task completions without WAL mode caveats. CrewAI uses its own internal SQLite/LanceDB for memory -- do NOT try to share that. |
| Zustand | Redux Toolkit | Only for very large teams (5+ frontend devs) who need enforced architectural patterns. Redux adds significant boilerplate for minimal benefit in a project this size. |
| Zustand | Jotai | If you prefer atomic state management. Jotai is from the same team (pmndrs) and works well, but Zustand's store pattern is better for our use case of clearly separated state slices (game state, UI state, WebSocket state). |
| FastAPI | Django/Django Channels | Only if you need Django's admin panel, ORM, or auth system. FastAPI is faster, async-native, and the standard choice for AI/ML Python backends. Django is heavier and its async story is still catching up. |
| React | Vue 3 | If the team strongly prefers Vue. Both work, but React is required by @pixi/react. Using Vue would mean losing the official PixiJS-React bridge and writing custom PixiJS integration code. |
| Alembic | raw SQL migrations | Never. Alembic autogenerate + SQLAlchemy models is dramatically safer and faster for iterative development. |
| uv | pip/poetry | pip works but is slow. Poetry works but is complex. uv is Rust-based, 10-100x faster than pip, and handles virtual environments. The modern Python standard. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain | CrewAI is explicitly independent of LangChain. Mixing them creates dependency conflicts and architectural confusion. CrewAI handles everything LangChain would provide. | CrewAI (already chosen) |
| AutoGen | Different paradigm (conversation-based). Would conflict with CrewAI's crew/flow model. Choosing both creates two competing orchestration layers. | CrewAI Crews + Flows |
| Socket.IO | Adds unnecessary abstraction over WebSocket. FastAPI has native WebSocket support. Socket.IO's room/namespace features are overkill -- use Zustand stores for state partitioning. | FastAPI native WebSocket |
| Phaser 4 | Still in Release Candidate (RC6 as of Dec 2025). Not stable for production. Full game framework adds ~800KB of unused features (physics, audio, input systems). | PixiJS 8 |
| MongoDB | No-SQL is wrong for this domain. Offices, agents, tasks, and chat have clear relational structure with foreign keys. MongoDB would lead to denormalization pain and data integrity issues. | PostgreSQL |
| Django REST Framework | Synchronous by default. The async story is bolted on, not native. Would fight against CrewAI's async patterns and WebSocket needs. | FastAPI |
| Create React App (CRA) | Deprecated. Officially recommends using a framework or Vite. Webpack-based, dramatically slower than Vite. | Vite |
| npm workspaces / monorepo | Overengineering for two packages (frontend + backend in different languages). Keep them as separate directories with separate dependency management. | Simple /frontend + /backend directories |
| Redis | Not needed for v1. Single-instance Docker Compose does not need a message broker or cache layer. Add only if scaling to multiple backend instances. | PostgreSQL (sufficient for v1) |
| ChromaDB (standalone) | CrewAI manages its own ChromaDB/LanceDB internally for agent memory. Do NOT install a separate vector DB for application state. Application data is relational, not vector. | PostgreSQL for app state, let CrewAI manage its own memory storage |

## Stack Patterns by Variant

**If running without any LLM API keys (fully local):**
- Enable the `ollama` Docker Compose profile: `docker compose --profile local-llm up`
- Configure all agents with `LLM(model="ollama/llama3.2", base_url="http://ollama:11434")`
- Ollama service discovery uses Docker Compose DNS (`ollama` hostname)
- Pull models on first startup: `docker compose exec ollama ollama pull llama3.2`

**If prioritizing fastest development iteration:**
- Run frontend outside Docker (native `npm run dev`) for fastest HMR
- Run backend outside Docker with `uvicorn app.main:app --reload`
- Only containerize PostgreSQL and Ollama
- Use `.env` file with `DATABASE_URL=postgresql+asyncpg://officejam:dev_password@localhost:5432/officejam`

**If adding real-time agent activity streaming:**
- Use WebSocket for bidirectional communication (chat, human-in-the-loop)
- Use SSE (Server-Sent Events) for unidirectional streaming (agent activity logs, task progress)
- FastAPI supports both natively -- no additional libraries needed
- CrewAI callbacks (`step_callback`, `task_callback`) feed into WebSocket/SSE broadcasts

**If the office visualization becomes performance-critical (50+ agents):**
- PixiJS 8's WebGPU renderer activates automatically on supported browsers
- Use sprite batching and texture atlases for agent sprites
- Object pooling for agents entering/leaving view
- Consider PixiJS Render Layers (v8.7+) for z-ordering without scene graph restructuring

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| CrewAI 1.11.x | Python 3.10-3.13 | Tested on 3.12. Use 3.12 for best stability. |
| FastAPI 0.135.x | Python 3.10+ | Pairs with Pydantic 2.x (not 1.x). |
| SQLAlchemy 2.0.x | asyncpg 0.30.x | Must install `sqlalchemy[asyncio]` extra for async. Greenlet dependency needed. |
| Alembic 1.18.x | SQLAlchemy 2.0.x | Use `-t async` template for async migrations. |
| PixiJS 8.17.x | @pixi/react 8.0.x | Must use together -- @pixi/react v8 is built for PixiJS v8 only. |
| @pixi/react 8.0.x | React 19.x | Requires React 19+. Will NOT work with React 18. |
| Vite 8.0.x | Node.js 20.19+ | Uses Rolldown bundler. Requires Node 20.19+ or 22.12+. |
| Zustand 5.0.x | React 18/19 | Works with both, but we use React 19. |
| CrewAI 1.11.x | Pydantic 2.x | CrewAI uses Pydantic for structured outputs. FastAPI also uses Pydantic 2. No conflicts. |

## Architecture Decisions Driven by Stack

1. **Separate CrewAI memory from application state.** CrewAI manages its own memory via LanceDB at `.crewai/memory/`. Application state (offices, agents, tasks, UI state) lives in PostgreSQL. Never try to share storage -- they serve different purposes.

2. **CrewAI Flows for production orchestration.** Use Flows (not just Crews) for the autonomous execution loop. Flows provide event-driven control, conditional branching, and state management via Pydantic models. This is CrewAI's production pattern running 12M+ executions/day.

3. **Dual real-time channels.** WebSocket for bidirectional (chat, human-in-the-loop intervention). SSE for unidirectional streaming (agent activity feed, task progress). Both via FastAPI native support.

4. **PixiJS canvas + React UI overlay.** The canvas renders the pixel-art office (PixiJS via @pixi/react). React components overlay the canvas for UI panels (chat, task board, agent profiles). Zustand bridges state between canvas and UI layers.

5. **Per-agent LLM configuration.** CrewAI natively supports different LLM providers per agent via the `llm` parameter. Store provider/model config in PostgreSQL agent records, pass to CrewAI Agent constructors at runtime.

## Sources

- [CrewAI PyPI](https://pypi.org/project/crewai/) -- version 1.11.1, Python >=3.10,<3.14 (verified March 2026)
- [CrewAI Documentation - LLM Connections](https://docs.crewai.com/en/learn/llm-connections) -- multi-provider config patterns
- [CrewAI Documentation - Memory](https://docs.crewai.com/en/concepts/memory) -- LanceDB default storage, custom backend protocol
- [CrewAI Documentation - Flows](https://docs.crewai.com/en/concepts/flows) -- event-driven production orchestration
- [CrewAI Documentation - Tasks](https://docs.crewai.com/en/concepts/tasks) -- callback system for task completion
- [FastAPI PyPI](https://pypi.org/project/fastapi/) -- version 0.135.2 (verified March 2026)
- [FastAPI WebSocket docs](https://fastapi.tiangolo.com/advanced/websockets/) -- native WebSocket support
- [pixel-agents GitHub](https://github.com/pablodelucca/pixel-agents) -- reference project: React 19, Canvas 2D, TypeScript, Vite
- [agent-office GitHub](https://github.com/harishkotra/agent-office) -- comparable project: Phaser, Colyseus, SQLite, Ollama
- [PixiJS v8.16.0 blog](https://pixijs.com/blog/8.16.0) -- Canvas fallback, tagged text
- [PixiJS React v8](https://pixijs.com/blog/pixi-react-v8-live) -- React 19 exclusive, TypeScript-first
- [Phaser v4 RC6](https://phaser.io/news/2025/12/phaser-v4-release-candidate-6-is-out) -- still in RC, not stable
- [PixiJS vs Phaser comparison](https://aircada.com/blog/pixijs-vs-phaser) -- PixiJS 3x smaller, 2x faster rendering
- [Zustand npm](https://www.npmjs.com/package/zustand) -- version 5.0.12
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown integration, Node 20.19+
- [SQLAlchemy PyPI](https://pypi.org/project/SQLAlchemy/) -- version 2.0.48, async via asyncio extra
- [Alembic docs](https://alembic.sqlalchemy.org/) -- version 1.18.4, async template support
- [Pydantic PyPI](https://pypi.org/project/pydantic/) -- version 2.12.5 stable
- [SQLite for AI Agents](https://dev.to/nathanhamlett/sqlite-is-the-best-database-for-ai-agents-and-youre-overcomplicating-it-1a5g) -- SQLite vs PostgreSQL tradeoffs
- [Full-Stack AI Agent Template](https://github.com/vstorm-co/full-stack-ai-agent-template) -- FastAPI + CrewAI + WebSocket reference architecture
- [AG-UI Protocol](https://www.copilotkit.ai/blog/how-to-add-a-frontend-to-any-crewai-agent-using-ag-ui-protocol) -- SSE-based frontend-agent communication

---
*Stack research for: Multi-agent virtual office platform (Office-Jam)*
*Researched: 2026-03-24*
