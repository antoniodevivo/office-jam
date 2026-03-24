---
phase: 2
slug: agent-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (workspace root or apps/api) |
| **Quick run command** | `bunx vitest run --reporter=verbose` |
| **Full suite command** | `bunx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bunx vitest run --reporter=verbose`
- **After every plan wave:** Run `bunx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ORCH-03, ORCH-04 | unit | `bunx vitest run apps/api/src` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ORCH-01, ORCH-02 | integration | `bunx vitest run apps/api/src` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | ORCH-05, ORCH-06, ORCH-07, ORCH-08 | integration | `bunx vitest run apps/api/src` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/vitest.config.ts` — vitest config for API project
- [ ] `apps/api/src/__tests__/setup.ts` — shared test setup (mock Prisma, test fixtures)
- [ ] `vitest` + `@vitest/coverage-v8` — install if not present

*Planner should include Wave 0 as part of the first plan if test infrastructure is missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent execution doesn't block event loop | ORCH-06 | Requires observing server responsiveness during execution | Start agent task, simultaneously hit /health endpoint — must respond < 100ms |
| LLM provider connectivity | ORCH-02 | Requires real API keys | Configure each provider, create agent, verify response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
