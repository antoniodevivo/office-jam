---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest (via Nx) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx nx run-many --target=test --all` |
| **Full suite command** | `npx nx run-many --target=test --all && npx nx run-many --target=lint --all` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx nx run-many --target=test --all`
- **After every plan wave:** Run `npx nx run-many --target=test --all && npx nx run-many --target=lint --all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFR-01 | integration | `npx nx build api && npx nx build web` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFR-03, INFR-05 | integration | `npx nx run db:prisma-validate` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | INFR-02, INFR-04 | integration | `docker compose up -d && docker compose down` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework installed via Nx generators (jest or vitest)
- [ ] Prisma validate target configured in `libs/db/project.json`
- [ ] Docker Compose health checks for PostgreSQL readiness

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Data persists across restarts | INFR-04 | Requires Docker lifecycle | `docker compose up -d`, create data via API, `docker compose down && docker compose up -d`, verify data exists |
| Full stack starts with zero manual steps | INFR-02 | Requires clean Docker state | From fresh clone: `docker compose up` — verify all services healthy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
