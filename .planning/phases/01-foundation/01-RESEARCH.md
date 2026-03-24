# Phase 1: Foundation - Research

**Researched:** 2026-03-24
**Domain:** Nx monorepo, Prisma 7 / PostgreSQL, Docker Compose, Fastify, TypeScript project scaffolding
**Confidence:** HIGH

## Summary

Phase 1 is pure infrastructure scaffolding: an Nx monorepo with two apps (Fastify API and React frontend), two shared libraries (types/utils and Prisma database), a PostgreSQL database with a multi-office-aware schema, and Docker Compose to orchestrate everything with persistent data volumes. This is a greenfield project with no existing code.

The most significant finding is that **Prisma 7 has major breaking changes** from Prisma 5/6: it requires a `prisma.config.ts` file, a mandatory `output` path in the generator block, driver adapters (`@prisma/adapter-pg`) instead of the built-in Rust query engine, and ships as ESM. This fundamentally changes how the `libs/db` package is structured compared to older Prisma tutorials. The schema no longer contains the database URL -- that moves to `prisma.config.ts`.

The Nx ecosystem at v22.6.1 has first-class Fastify support via `@nx/node:application --framework=fastify` and React support via `@nx/react`. The `--preset=apps` flag creates an empty integrated monorepo with `apps/` and `libs/` directories, which is the correct starting point. TypeScript path aliases in `tsconfig.base.json` enable cross-package imports using `@office-jam/*` scope.

**Primary recommendation:** Use the `--preset=apps` Nx workspace, generate apps with `@nx/node` (Fastify) and `@nx/react` (Vite), create libs with `@nx/js:library`, and structure Prisma 7 in `libs/db` with a singleton client pattern that exports both the client instance and generated types. Docker Compose runs only PostgreSQL in a container with a named volume; apps run natively via `nx serve` for the best hot-reload DX.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Nx workspace with `apps/` + `libs/` convention
- Two apps: `apps/web` (React + PixiJS frontend), `apps/api` (Fastify backend)
- Start with 2 libs: `libs/shared` (types + utils combined) and `libs/db` (Prisma schema + generated client). Split into more granular libs only when complexity demands it
- All packages use `@office-jam/` scope prefix: `@office-jam/web`, `@office-jam/api`, `@office-jam/shared`, `@office-jam/db`
- Types organized by domain within `libs/shared/src/types/`: `agent.types.ts`, `task.types.ts`, `office.types.ts`, `message.types.ts`, `activity.types.ts`, `ws-events.ts`
- Barrel export from `libs/shared/src/index.ts`
- Utils in `libs/shared/src/utils/`

### Claude's Discretion
- Database schema design: entity relationships, field types, indexes, constraints
- Docker Compose configuration: services, volumes, networking, hot-reload strategy
- Dev workflow: local dev servers vs containerized development
- Seed data approach
- Prisma migration strategy
- TypeScript configuration (tsconfig paths, strict mode, etc.)
- Nx configuration files and build targets

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Project uses Nx monorepo with TypeScript for frontend and backend | Nx 22.6.1 with `--preset=apps`, `@nx/node` for Fastify, `@nx/react` for frontend, `@nx/js` for shared libs, TypeScript 5.8.x, path aliases via `tsconfig.base.json` |
| INFR-02 | Application deploys via single `docker compose up` command | Docker Compose with PostgreSQL service (named volume), app services with Dockerfiles, `depends_on` with healthcheck for startup ordering |
| INFR-03 | PostgreSQL database with Prisma ORM for all application state | Prisma 7.5.0 with `prisma.config.ts`, `@prisma/adapter-pg` driver adapter, schema in `libs/db/prisma/schema.prisma`, generated client in `libs/db/generated/client` |
| INFR-04 | All data survives container restarts via volume mounts | Docker named volume for `/var/lib/postgresql/data`, persists across `docker compose down && docker compose up` (only `docker compose down -v` removes it) |
| INFR-05 | Database schema supports multi-office isolation from day one | Every entity has an `officeId` foreign key with index, Office model as top-level entity, all queries naturally scoped by office |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nx | 22.6.1 | Monorepo orchestration, task runner, dependency graph | Industry-standard for TypeScript monorepos; first-class Fastify + React generators |
| @nx/node | 22.6.1 | Fastify app generator and executor | Provides `--framework=fastify` with esbuild bundling, serve/build/test targets |
| @nx/react | 22.6.1 | React app generator with Vite | Standard Nx plugin for React apps with Vite bundler |
| @nx/js | 22.6.1 | TypeScript library generator | Creates publishable/buildable TS libraries with proper tsconfig |
| @nx/vite | 22.6.1 | Vite integration for build and dev server | Fast dev server and bundling for React frontend |
| prisma | 7.5.0 | Database schema management, migrations, code generation | Latest stable; v7 architecture with `prisma.config.ts` and driver adapters |
| @prisma/client | 7.5.0 | Type-safe database queries (generated) | Auto-generated from schema; full TypeScript inference |
| @prisma/adapter-pg | latest | PostgreSQL driver adapter for Prisma 7 | Required in Prisma 7 -- replaces built-in Rust query engine |
| pg | latest | PostgreSQL client library (used by adapter) | Low-level driver required by `@prisma/adapter-pg` |
| fastify | 5.8.4 | HTTP/WebSocket server | Fast, TypeScript-native, schema-based validation, plugin architecture |
| react | 19.2.4 | Frontend UI library | Latest stable React with concurrent features |
| react-dom | 19.2.4 | React DOM renderer | Paired with React 19 |
| typescript | ~5.8.x | Type system | Use 5.8.x for Nx 22 compatibility (TS 6.0.2 is very new, may have plugin issues) |
| vite | 8.0.2 | Frontend dev server and bundler | Fast HMR, native ESM, standard for React + Nx |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.1 | Test runner | Unit and integration tests; native Vite integration |
| tsx | 4.21.0 | TypeScript runner | Running seed scripts and ad-hoc TS files without compilation |
| dotenv | latest | Environment variable loading | Loading `.env` files in `prisma.config.ts` and local dev |
| @types/pg | latest | TypeScript types for pg | Type safety for the PostgreSQL driver |
| @types/node | latest | Node.js type definitions | Required for TypeScript Node.js projects |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `--preset=apps` (empty) | `--preset=react-monorepo` | Pre-generates React app but less control over backend setup; use `apps` for full control |
| TypeScript 6.0.2 | TypeScript 5.8.x | TS 6.0 is very new (March 2026); Nx plugins may not support it yet. Safer to use 5.8.x |
| Containerized apps | Native `nx serve` | Containerized dev has filesystem/HMR issues on Windows; native dev is faster and more reliable |
| Prisma 5.22.0 (legacy) | Prisma 7.5.0 | Prisma 5 is simpler but entering maintenance mode; v7 is the future with better ESM and performance |

**Installation (root workspace):**
```bash
npx create-nx-workspace@22 office-jam --preset=apps --packageManager=npm --workspaceType=integrated
```

**Post-scaffold installs (managed by Nx generators):**
```bash
# Add Nx plugins
nx add @nx/node
nx add @nx/react
nx add @nx/vite

# Generate apps
nx g @nx/node:application apps/api --framework=fastify --e2eTestRunner=none
nx g @nx/react:application apps/web --bundler=vite --e2eTestRunner=none

# Generate libs
nx g @nx/js:library libs/shared --bundler=none --unitTestRunner=vitest
nx g @nx/js:library libs/db --bundler=none --unitTestRunner=vitest

# Prisma dependencies (in libs/db context)
npm install prisma @prisma/client @prisma/adapter-pg pg dotenv
npm install -D @types/pg tsx
```

**Version verification:**
All versions verified via `npm view <package> version` on 2026-03-24. TypeScript pinned to ~5.8.x for Nx compatibility; latest 6.0.2 is too new.

## Architecture Patterns

### Recommended Project Structure
```
office-jam/
├── apps/
│   ├── api/                        # Fastify backend
│   │   ├── src/
│   │   │   ├── main.ts             # Fastify entry point
│   │   │   ├── app/
│   │   │   │   ├── app.ts          # Fastify app factory
│   │   │   │   └── routes/         # Route modules (future phases)
│   │   │   └── plugins/            # Fastify plugins
│   │   │       └── db.ts           # Prisma client plugin
│   │   ├── project.json            # Nx project config
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   └── Dockerfile
│   └── web/                        # React + Vite frontend
│       ├── src/
│       │   ├── main.tsx            # React entry point
│       │   ├── app/
│       │   │   └── app.tsx         # Root component
│       │   └── styles.css
│       ├── index.html
│       ├── project.json
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── vite.config.ts
│       └── Dockerfile
├── libs/
│   ├── shared/                     # Types + utilities
│   │   ├── src/
│   │   │   ├── index.ts            # Barrel export
│   │   │   ├── types/
│   │   │   │   ├── agent.types.ts
│   │   │   │   ├── task.types.ts
│   │   │   │   ├── office.types.ts
│   │   │   │   ├── message.types.ts
│   │   │   │   ├── activity.types.ts
│   │   │   │   └── ws-events.ts
│   │   │   └── utils/
│   │   ├── project.json
│   │   └── tsconfig.json
│   └── db/                         # Prisma schema + client
│       ├── src/
│       │   ├── index.ts            # Barrel: re-exports client + types
│       │   └── client.ts           # Singleton PrismaClient
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema
│       │   ├── migrations/         # Migration history
│       │   └── seed.ts             # Seed script
│       ├── generated/
│       │   └── client/             # Prisma 7 generated output
│       ├── prisma.config.ts        # Prisma 7 config (datasource URL, migrations)
│       ├── .env                    # DATABASE_URL (gitignored)
│       ├── project.json
│       └── tsconfig.json
├── docker-compose.yml              # PostgreSQL + app services
├── .env                            # Root env vars (gitignored)
├── nx.json                         # Nx workspace config
├── tsconfig.base.json              # Shared TS config + path aliases
├── package.json                    # Root dependencies
└── .gitignore
```

### Pattern 1: Prisma 7 Singleton Client in Monorepo

**What:** Centralized Prisma client instantiation with driver adapter and global memoization
**When to use:** Always -- prevents multiple PrismaClient instances during hot reload

```typescript
// libs/db/src/client.ts
// Source: https://www.prisma.io/docs/guides/use-prisma-in-pnpm-workspaces
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// libs/db/src/index.ts
export { prisma } from "./client";
export * from "../generated/client";
```

### Pattern 2: Prisma 7 Configuration

**What:** The new `prisma.config.ts` file required by Prisma 7
**When to use:** Required for all Prisma 7 projects

```typescript
// libs/db/prisma.config.ts
// Source: https://www.prisma.io/docs/orm/reference/prisma-config-reference
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Pattern 3: Fastify Plugin for Database Access

**What:** Fastify plugin pattern that decorates the Fastify instance with the Prisma client
**When to use:** Standard Fastify pattern for database access in routes

```typescript
// apps/api/src/plugins/db.ts
// Source: https://www.prisma.io/fastify
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { prisma } from "@office-jam/db";

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
```

### Pattern 4: TypeScript Path Aliases

**What:** Monorepo-wide import aliases using `tsconfig.base.json`
**When to use:** All cross-package imports

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@office-jam/shared": ["libs/shared/src/index.ts"],
      "@office-jam/db": ["libs/db/src/index.ts"]
    }
  }
}
```

### Pattern 5: Docker Compose with Health Checks

**What:** PostgreSQL service with health check, apps depend on healthy database
**When to use:** Required for `docker compose up` to work reliably

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: office_jam
      POSTGRES_USER: office_jam
      POSTGRES_PASSWORD: office_jam_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "office_jam"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://office_jam:office_jam_dev@db:5432/office_jam
      PORT: 3000
    ports:
      - "3000:3000"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    depends_on:
      - api
    ports:
      - "4200:4200"

volumes:
  pgdata:
```

### Pattern 6: Multi-Office Data Isolation via Foreign Key

**What:** Every entity references an Office via `officeId` foreign key with index
**When to use:** All models that belong to an office (agents, tasks, messages, activities)

```prisma
// libs/db/prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
}

model Office {
  id          String     @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  agents      Agent[]
  tasks       Task[]
  messages    Message[]
  activities  Activity[]
}

enum AgentRole {
  CEO
  CTO
  DEVELOPER
  DESIGNER
  MARKETING
  LEGAL
  CUSTOM
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}

model Agent {
  id            String     @id @default(uuid())
  officeId      String
  office        Office     @relation(fields: [officeId], references: [id], onDelete: Cascade)
  name          String
  role          AgentRole
  systemPrompt  String?
  llmProvider   String     @default("openai")
  llmModel      String     @default("gpt-4o")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  tasks         TaskAssignment[]
  messages      Message[]
  activities    Activity[]

  @@index([officeId])
}

model Task {
  id          String          @id @default(uuid())
  officeId    String
  office      Office          @relation(fields: [officeId], references: [id], onDelete: Cascade)
  title       String
  description String?
  status      TaskStatus      @default(PENDING)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  assignments TaskAssignment[]
  activities  Activity[]

  @@index([officeId])
  @@index([status])
}

model TaskAssignment {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())

  @@unique([taskId, agentId])
}

model Message {
  id        String   @id @default(uuid())
  officeId  String
  office    Office   @relation(fields: [officeId], references: [id], onDelete: Cascade)
  agentId   String?
  agent     Agent?   @relation(fields: [agentId], references: [id], onDelete: SetNull)
  content   String
  role      String   @default("user")
  createdAt DateTime @default(now())

  @@index([officeId])
  @@index([agentId])
}

enum ActivityType {
  AGENT_CREATED
  TASK_CREATED
  TASK_ASSIGNED
  TASK_STARTED
  TASK_COMPLETED
  TASK_FAILED
  MESSAGE_SENT
  AGENT_THINKING
  AGENT_RESPONDING
  AGENT_DELEGATING
}

model Activity {
  id        String       @id @default(uuid())
  officeId  String
  office    Office       @relation(fields: [officeId], references: [id], onDelete: Cascade)
  agentId   String?
  agent     Agent?       @relation(fields: [agentId], references: [id], onDelete: SetNull)
  taskId    String?
  task      Task?        @relation(fields: [taskId], references: [id], onDelete: SetNull)
  type      ActivityType
  payload   Json?
  createdAt DateTime     @default(now())

  @@index([officeId])
  @@index([agentId])
  @@index([taskId])
  @@index([createdAt])
}
```

### Anti-Patterns to Avoid

- **Importing from `@prisma/client` directly:** In Prisma 7 monorepos, always import from `@office-jam/db` which re-exports the generated client. Do NOT import from `@prisma/client` -- the types live in the custom output directory.
- **Running `prisma migrate dev` in Docker:** Use `prisma migrate deploy` in containers. `migrate dev` is interactive and may reset data. Reserve `migrate dev` for local development only.
- **Putting DATABASE_URL in schema.prisma:** Prisma 7 moved the datasource URL to `prisma.config.ts`. The schema.prisma `datasource` block still needs a `provider` but the `url` there is only used as a fallback for `prisma generate` (not for migrations or runtime).
- **Creating PrismaClient in every file:** Use the singleton pattern in `libs/db/src/client.ts` to avoid connection pool exhaustion during hot reload.
- **Using `docker compose down -v` for restarts:** The `-v` flag deletes volumes and all data. Use `docker compose down` (without `-v`) for normal restarts.
- **Containerizing app dev on Windows:** Filesystem polling for HMR in Docker on Windows is slow and unreliable. Run apps natively with `nx serve` and only containerize PostgreSQL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database schema + migrations | Raw SQL migrations | Prisma Migrate (`prisma migrate dev/deploy`) | Tracks migration history, generates type-safe client, handles rollbacks |
| Project scaffolding | Manual folder + config creation | Nx generators (`nx g @nx/node:application`, etc.) | Generates correct configs, project.json, tsconfig, build targets automatically |
| TypeScript path aliases | Manual webpack/tsc config | Nx + `tsconfig.base.json` paths | Nx generators auto-register paths; works with all build tools |
| Database connection management | Manual connect/disconnect | Prisma singleton + Fastify plugin pattern | Handles connection pooling, graceful shutdown, hot-reload safety |
| Docker service ordering | Sleep scripts, retry loops | `depends_on` + `healthcheck` | Docker Compose native; pg_isready is the standard PostgreSQL health check |
| Monorepo dependency graph | Manual build order scripts | Nx task runner + dependency graph | Automatically determines build order, caches results, parallelizes tasks |
| Dev server orchestration | Multiple terminal tabs | `nx run-many --target=serve` | Runs all apps in parallel with a single command |

**Key insight:** Nx generators produce correct, interconnected configurations. Hand-creating `project.json`, `tsconfig.json`, and build targets is error-prone and tedious. Always use generators, then customize the output.

## Common Pitfalls

### Pitfall 1: Prisma 7 Breaking Changes from Prisma 5/6
**What goes wrong:** Following older Prisma tutorials that assume `prisma-client-js` generator, `url` in `datasource` block, and `@prisma/client` imports from `node_modules`.
**Why it happens:** Most online resources still reference Prisma 5/6 patterns. Prisma 7 shipped in early 2025 and fundamentally changed the configuration.
**How to avoid:** Use `provider = "prisma-client"` (not `prisma-client-js`), always specify `output`, create `prisma.config.ts`, install `@prisma/adapter-pg` + `pg`, instantiate PrismaClient with an `adapter` option.
**Warning signs:** `Error: Unknown generator "prisma-client-js"` or `Error: No adapter specified` or types not found.

### Pitfall 2: Prisma Generate Must Run Before Build
**What goes wrong:** TypeScript compilation fails because `libs/db/generated/client` doesn't exist yet.
**Why it happens:** Prisma client is generated code that must exist before any TypeScript that imports it can compile.
**How to avoid:** Add `prisma generate` as a `prebuild` step or as an Nx dependency in `libs/db/project.json`. Ensure `generated/` is in `.gitignore` but generated before builds.
**Warning signs:** `Cannot find module '../generated/client'` or `Module not found` errors.

### Pitfall 3: TypeScript Version Mismatch with Nx Plugins
**What goes wrong:** Nx plugins crash or emit incorrect types with TypeScript 6.0.x (just released March 2026).
**Why it happens:** Nx 22.6.1 was built against TypeScript 5.x; TS 6.0 may have incompatibilities.
**How to avoid:** Pin TypeScript to `~5.8.x` in root `package.json`. Upgrade to TS 6 only after Nx officially supports it.
**Warning signs:** Build errors in Nx plugin code, not in project code.

### Pitfall 4: Docker Named Volume Not Persisting Data
**What goes wrong:** Data disappears after `docker compose down && docker compose up`.
**Why it happens:** Using `docker compose down -v` (with the `-v` flag) which removes volumes. Or using bind mounts to an empty host directory that overwrites the PostgreSQL data directory.
**How to avoid:** Use named volumes (declared in top-level `volumes:` section). Never use `-v` flag unless intentionally wiping data. Verify with `docker volume ls`.
**Warning signs:** Database is empty after restart; `docker volume ls` shows no volume.

### Pitfall 5: Nx Path Alias Conflicts with Package Names
**What goes wrong:** TypeScript resolves `@office-jam/shared` to the wrong location or fails to resolve at all.
**Why it happens:** If the path alias in `tsconfig.base.json` exactly matches a `name` field in a lib's `package.json`, resolution can conflict in some bundlers.
**How to avoid:** Ensure `tsconfig.base.json` paths point to `libs/shared/src/index.ts` (source file), not just the directory. Nx generators handle this correctly by default.
**Warning signs:** `Module not found` errors that only appear in certain build tools but not others.

### Pitfall 6: Prisma Migrations in Docker vs Local Dev
**What goes wrong:** Running `prisma migrate dev` inside a Docker container creates interactive prompts that hang, or resets data unexpectedly.
**Why it happens:** `migrate dev` is designed for local development -- it detects drift and may prompt to reset. Inside containers, it has no TTY for prompts.
**How to avoid:** Always use `prisma migrate deploy` in Docker/CI (applies existing migrations, never creates new ones). Use `prisma migrate dev` only locally when authoring schema changes.
**Warning signs:** Docker build hangs at Prisma step; data unexpectedly reset after deployment.

### Pitfall 7: ESM/CJS Mismatch in Prisma 7
**What goes wrong:** Runtime errors like `Cannot use import statement outside a module` or `require is not defined`.
**Why it happens:** Prisma 7 ships as ESM. If the consuming app is CJS, imports break.
**How to avoid:** Ensure `"type": "module"` in the `libs/db/package.json` or configure the Nx build to output ESM. Fastify app should also target ESM or use a bundler (esbuild) that handles the conversion.
**Warning signs:** `ERR_REQUIRE_ESM` or `SyntaxError: Cannot use import statement outside a module`.

## Code Examples

### Nx Workspace Creation (Full Command Sequence)

```bash
# Source: https://nx.dev/docs/reference/create-nx-workspace
# Step 1: Create empty integrated monorepo
npx create-nx-workspace@22 office-jam --preset=apps --packageManager=npm

# Step 2: Add required Nx plugins
cd office-jam
npx nx add @nx/node
npx nx add @nx/react
npx nx add @nx/vite

# Step 3: Generate applications
npx nx g @nx/node:application apps/api --framework=fastify --e2eTestRunner=none
npx nx g @nx/react:application apps/web --bundler=vite --e2eTestRunner=none

# Step 4: Generate shared libraries
npx nx g @nx/js:library libs/shared --bundler=none --unitTestRunner=vitest
npx nx g @nx/js:library libs/db --bundler=none --unitTestRunner=vitest
```

### Prisma 7 Initialization

```bash
# Source: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
# Run from libs/db directory
cd libs/db
npm install prisma@7 @prisma/client@7 @prisma/adapter-pg pg dotenv
npm install -D @types/pg tsx
npx prisma init
# Then edit prisma.config.ts, schema.prisma as shown in Architecture Patterns
```

### Prisma 7 Schema File Header

```prisma
// Source: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
generator client {
  provider = "prisma-client"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
}
```

### Seed Script

```typescript
// libs/db/prisma/seed.ts
// Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
import { prisma } from "../src/client";

async function main() {
  // Create a default office
  const office = await prisma.office.upsert({
    where: { id: "default-office" },
    update: {},
    create: {
      id: "default-office",
      name: "Headquarters",
      description: "The main office",
    },
  });

  console.log("Seeded default office:", office.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Running the Full Stack

```bash
# Development: PostgreSQL in Docker, apps native
docker compose up db -d           # Start only PostgreSQL
npx nx run-many --target=serve    # Start API + Web in parallel

# Production-like: Everything in Docker
docker compose up --build         # Start all services
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prisma-client-js` generator | `prisma-client` generator | Prisma 7 (early 2025) | Must use new provider name + output path |
| `url` in `datasource` block | `prisma.config.ts` for URL | Prisma 7 (early 2025) | Database URL moves out of schema file |
| Built-in Rust query engine | Driver adapters (`@prisma/adapter-pg`) | Prisma 7 (early 2025) | Must explicitly install and configure adapter |
| `@prisma/client` from node_modules | Custom output directory | Prisma 7 (early 2025) | Import from generated path, not node_modules |
| Nx tsconfig path aliases only | Nx 22 TypeScript project linking + workspaces | Nx 22 (2025) | Can use npm/yarn workspaces alongside tsconfig paths |
| Docker Compose v2 syntax (version field) | Docker Compose v2 without version field | 2023+ | `version:` field is obsolete; remove it |

**Deprecated/outdated:**
- `prisma-client-js` generator provider: Maintenance mode in Prisma 7, will be removed in Prisma 8
- `version: '3.x'` in docker-compose.yml: Ignored by modern Docker Compose; remove the field entirely
- `@prisma/client` imports from node_modules: In Prisma 7 with custom output, always import from the generated directory or via the db package barrel export

## Dev Workflow Recommendation

**Recommendation: Hybrid approach -- PostgreSQL containerized, apps native.**

| Component | How | Why |
|-----------|-----|-----|
| PostgreSQL | Docker Compose (`docker compose up db -d`) | Isolated, reproducible, no local Postgres install needed |
| Fastify API | Native (`nx serve api`) | Fast hot reload via esbuild, no filesystem polling issues |
| React Web | Native (`nx serve web`) | Vite HMR is instant natively; slow through Docker volumes on Windows |

For the "single `docker compose up` command" requirement (INFR-02), provide Dockerfiles for api and web services so the full stack CAN be started via `docker compose up`. But the primary dev workflow should use native serves with only the database containerized.

The Docker Compose file should support both modes:
- `docker compose up` -- starts everything (satisfies INFR-02)
- `docker compose up db` -- starts only PostgreSQL (for development)

## Open Questions

1. **Nx 22 + TypeScript version ceiling**
   - What we know: Nx 22.6.1 ships with TS support; TS 6.0.2 just released
   - What's unclear: Whether Nx 22 officially supports TS 6.0 or requires 5.x
   - Recommendation: Pin to `~5.8.x` initially; upgrade after verifying Nx compatibility

2. **Prisma 7 ESM + Nx esbuild bundler interaction**
   - What we know: Prisma 7 ships as ESM; Nx node apps use esbuild
   - What's unclear: Whether esbuild seamlessly bundles Prisma 7 generated client or needs special configuration
   - Recommendation: Test during implementation; if issues arise, configure esbuild `external` to exclude Prisma

3. **Prisma config file location in monorepo**
   - What we know: `prisma.config.ts` must be at the project root where `prisma` CLI is run
   - What's unclear: When `prisma` CLI is run from workspace root vs `libs/db`, which location does it pick up
   - Recommendation: Place `prisma.config.ts` in `libs/db/` and always run Prisma commands from that directory (use Nx targets with `cwd` option)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | None yet -- Wave 0 will create `vitest.workspace.ts` at root |
| Quick run command | `npx nx test db` |
| Full suite command | `npx nx run-many --target=test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-01 | Nx workspace builds all packages | smoke | `npx nx run-many --target=build` | No -- Wave 0 |
| INFR-02 | Docker compose starts full stack | integration (manual) | `docker compose up -d && docker compose ps` | No -- manual verify |
| INFR-03 | Prisma schema defines all models, migrations apply | integration | `npx nx run db:test` (test Prisma client CRUD) | No -- Wave 0 |
| INFR-04 | Data persists across container restarts | integration (manual) | `docker compose down && docker compose up -d` then verify data | No -- manual verify |
| INFR-05 | All models have officeId, queries scoped by office | unit | `npx nx run db:test` (test office isolation) | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npx nx run-many --target=build` (verifies compilation)
- **Per wave merge:** `npx nx run-many --target=test` (runs all tests)
- **Phase gate:** Full suite green + manual Docker Compose verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `libs/db/src/__tests__/schema.test.ts` -- covers INFR-03, INFR-05 (Prisma CRUD + office isolation)
- [ ] `vitest.workspace.ts` -- root Vitest workspace config
- [ ] Framework install: Vitest added via Nx generators (`--unitTestRunner=vitest`)
- [ ] Docker Compose smoke test: manual verification script or checklist

## Sources

### Primary (HIGH confidence)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) -- Breaking changes, new config, driver adapters
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference) -- `prisma.config.ts` full API
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker) -- Dockerfile patterns, migrate deploy
- [Prisma Monorepo Guide (pnpm workspaces)](https://www.prisma.io/docs/guides/use-prisma-in-pnpm-workspaces) -- Singleton pattern, package structure, barrel exports
- [Prisma Seeding Docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding) -- Seed script setup
- [Nx create-nx-workspace Reference](https://nx.dev/docs/reference/create-nx-workspace) -- Presets, options
- [Nx React Monorepo Tutorial](https://nx.dev/docs/getting-started/tutorials/react-monorepo-tutorial) -- Project structure, generators
- [Nx Fastify Blog Post](https://nx.dev/blog/bundling-a-node-api-with-fastify-esbuild-and-nx) -- Fastify + esbuild + Nx
- [Docker Compose Startup Order](https://docs.docker.com/compose/how-tos/startup-order/) -- depends_on + healthcheck
- [Docker Persistent Volumes](https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/) -- Named volumes lifecycle

### Secondary (MEDIUM confidence)
- [Prisma + Fastify Guide](https://www.prisma.io/fastify) -- Fastify plugin integration pattern
- [Nx TypeScript Project Linking](https://nx.dev/docs/concepts/typescript-project-linking) -- Modern path alias approach
- [Docker Compose with Nx Monorepo](https://www.codefeetime.com/post/using-docker-compose-with-nx-monorepo-for-multi-apps-development/) -- HMR challenges, volume mounting
- [Prisma Migrate Dev vs Deploy](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) -- Workflow differences

### Tertiary (LOW confidence)
- TypeScript 6.0 compatibility with Nx 22 -- no official statement found; recommendation to use 5.8.x is precautionary
- esbuild + Prisma 7 ESM interaction -- not specifically documented; may need testing during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, official docs consulted
- Architecture: HIGH -- patterns from official Prisma monorepo guide and Nx documentation
- Pitfalls: HIGH -- Prisma 7 breaking changes well-documented; Docker volume behavior verified via official docs
- Schema design: MEDIUM -- based on requirements and standard relational modeling; may need iteration
- Dev workflow: MEDIUM -- hybrid approach is standard practice but Windows-specific HMR issues are anecdotal

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- stable ecosystem, Prisma 7 settled)
