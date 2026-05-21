# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Last completed plan & task:** `/plan-eng-review` + adversarial-review doc-sweep closed all M1 architectural decisions
**Active initiative:** M1 Bootstrap (`docs/initiatives/m1-bootstrap/`) — APPROVED, ready for spec writing
**Active spec:** _none yet — about to run `superpowers:writing-plans` to produce the 6 Specs / ~11-14 DevTasks_
**Active plan:** `superpowers:writing-plans` against M1 design doc → atomic ≤10-file DevTasks under `docs/specs/m1-bootstrap/`
**Active skill:** _between skills — paused after `/plan-eng-review` + adversarial-review sweep_
**Branch:** `feat/plan-and-bootstrap`
**Current step:** Pre-`superpowers` doc sweep complete after THREE adversarial-review iterations. Iteration 1 promoted cross-agent rules; Iteration 2 caught residual SQLite/swagger references + AGENTS.md "or stacked branches" contradiction + missing ports/CORS/mirror-URLs/branch-protection/engine-strict; Iteration 3 caught the L153 vocabulary residue ("Tasks" not "DevTasks"), S2/S3 dependency-graph contradiction (DevTask 6 consumes DevTask 3's openapi.json), missing decisions on PSYKL Task id generation strategy + `created_at` column shape + web_client Docker production runtime + pnpm script contract + Vitest workspace config + pglite persistence init + LICENSE filename, GHCR/mirror naming inconsistency (`psykl-system-*` vs `psykl-*` resolved to `psykl-*`), DevTask 3 mandatory split into 3a + 3b, single-user-multi-device sync model premise added.
**Known blockers:** None.
**Next action:** Invoke `superpowers:writing-plans` against `docs/initiatives/m1-bootstrap/DESIGN.md`. The skill should produce 6 Spec docs under `docs/specs/m1-bootstrap/` following `docs/templates/SPEC.md` (filename pattern `YYYYMMDD-S{N}-{spec-slug}.md`).

## M1 Locked-in Stack

| Layer | Choice |
|-------|--------|
| Package manager | pnpm + pnpm-workspace.yaml |
| Node runtime | Node 24 LTS (pinned via `.nvmrc` + `engines`) |
| pnpm version | 10.x (pinned via `packageManager` field) |
| API framework | NestJS, REST, multi-transport-ready (gRPC + GraphQL deferrable into the same app) |
| API spec / schema discipline | Schema-first via Zod in `packages/shared-types/src/schemas/` + `nestjs-zod` DTOs + `zod-to-openapi` emitted document |
| OpenAPI artifact | `components/service-task/openapi.json` (gitignored, emitted at build) consumed by clients via `openapi-typescript` + `openapi-fetch` |
| PWA framework | Vite + React (SPA mode) + `vite-plugin-pwa` |
| ORM + migrations | Drizzle ORM + drizzle-kit; schema at `components/service-task/src/db/schema/`; migrations at `components/service-task/drizzle/migrations/` |
| Database (M1) | pglite (in-process PostgreSQL via WebAssembly) — Postgres-shaped from day one for clean M4+ networked migration |
| PSYKL Task id | UUID v7 (RFC 9562, time-ordered), generated app-side in NestJS `TaskService` via `uuid` package |
| `created_at` column | `timestamptz` with DB default `now()` (Drizzle: `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`) |
| Web client prod runtime | nginx serving built `dist/` (multi-stage Dockerfile, nginx:alpine + SPA-fallback config) |
| pglite persistence path | Production: `/var/lib/psykl/pglite` (Docker volume `psykl-pglite-data`). Dev: `./.pglite-dev` (gitignored). Tests: in-memory (no path). Env var: `PGLITE_DATA_DIR`. |
| Container registry | GitHub Container Registry (`ghcr.io/jonpham/psykl-{service-task,web_client}`) |
| Helm chart location | `deploy/helm/` |
| Branching convention | Each DevTask branches off `main`, PRs into `main` (no stacking) |
| Test file locations | Unit + Component colocated next to source; Integration in per-component `tests/integration/`; E2E in repo-root `e2e/` |
| Service ports (local dev) | `service-task` :3000, `web_client` Vite :5173 |
| CORS posture | service-task allows `Origin: http://localhost:5173` in dev (configurable via `CORS_ORIGIN` env var); no reverse proxy in M1 |
| Subtree mirror repos | `jonpham/psykl-web_client`, `jonpham/psykl-service-task` (must be created before DevTask 10) |
| `engine-strict` | `.npmrc` at repo root contains `engine-strict=true` |
| LICENSE | MIT |

## Initiative Summary

| Initiative | Theme | Status | Initiative Doc |
| ---------- | ----- | ------ | -------------- |
| M1 — Bootstrap | Vertical slice + test pyramid + Continuous Integration / Continuous Deployment infra | 🟡 Designed, decisions closed | [`m1-bootstrap/`](initiatives/m1-bootstrap/) |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync | ⚪ Sketched | [`m2-pwa-crud-offline/`](initiatives/m2-pwa-crud-offline/) |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives | ⚪ Sketched | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab | Real authentication, multi-user data isolation, homelab self-host | ⚪ Sketched | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/) |

Legend: 🟢 Done · 🟡 Active · ⚪ Sketched / Not started

## Remaining Design Areas That Require `/plan-eng-review`

The current M1 design has had its architectural Open Questions closed. These are the **future** review surfaces — none active right now.

| When | Artifact | Review needed |
|------|----------|---------------|
| After each Spec is written by `superpowers:writing-plans` | `docs/specs/m1-bootstrap/{spec}.md` | Per-Spec `/plan-eng-review` IF the Spec introduces architectural choices not already decided in the M1 DESIGN.md (e.g., Spec 6's container-registry choice between GitHub Container Registry vs Docker Hub vs Harbor). Most M1 Specs will not need this because decisions are pre-locked. |
| Before M2 specs are written | `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` (does not exist yet — produced by `/office-hours`) | M2 design will introduce real architectural decisions: offline-first sync engine (last-write-wins implementation details, IndexedDB schema, queue durability, conflict resolution UI), Service Worker scope, optimistic-update strategy. `/plan-eng-review` against the M2 design doc. |
| Before M3 specs are written | `docs/initiatives/m3-apple-native-product-discovery/DESIGN.md` | M3 will be the heaviest review: SwiftUI multiplatform vs Mac Catalyst, sync architecture between iOS and `service-task`, energy-retrospective aggregation (client-side vs server-side decision finally landing), PSYKL-boundary coaching algorithm shape, push notification strategy, App Store submission constraints. |
| Before M4 specs are written | `docs/initiatives/m4-multi-user-auth-homelab/DESIGN.md` | M4: authentication mechanism (OAuth provider vs magic-link email vs password+session), session-state storage, multi-tenancy enforcement at the Drizzle layer, homelab deployment guide validation. |
| Periodically as M2+ are exercised | `docs/PRODUCT.md` and AGENTS.md | If the dogfood retrospectives change PSYKL's product direction or working-agreement principles, re-review affected docs. |

## Open Design Surfaces (parked, will resurface in later milestones)

Not blocking anything today; documented so they don't get lost.

| Surface | Parked at | Owning milestone |
|---------|-----------|------------------|
| Offline-first sync engine architecture (Service Worker scope, IndexedDB shape, sync queue, last-write-wins implementation) | `/office-hours` | M2 |
| ~~Conflict resolution via CRDT~~ — **CLOSED, out of scope.** Per the single-user-multi-device sync model (PRODUCT.md → Sync and Sharing Model, DESIGN.md Premise 8), last-write-wins is sufficient for the lifetime of the project; CRDTs solve a multi-actor problem PSYKL doesn't have. | Permanently closed 2026-05-20 | — |
| Server-side vs client-side retrospective aggregation | `/office-hours` parked for post-M3 | M3 or M4 |
| Configurable term-map / UI theme architecture (default celestial: PSYKL/Earth/Moon/HelioArc/Sun) | `/office-hours` | M3+ |
| Multi-user auth scheme (OAuth provider vs magic-link vs password+session) | `/office-hours` | M4 |
| Homelab multi-instance deployment guide | `/office-hours` | M4 |
| Apple Watch integration (movement detection for fatigue / distraction signals) | `docs/PRODUCT.md` future features | M5+ |
| iCloud / Google Calendar sync | `docs/PRODUCT.md` future features | M5+ |
| Apple Reminders import / two-way sync | `docs/PRODUCT.md` future features | M5+ |

## Backlog ideas (not on the milestone roadmap)

See [`docs/BACKLOG_IDEAS.md`](BACKLOG_IDEAS.md) for someday/maybe items. Currently tracked: **gRPC learning side-quest** (add one gRPC model to NestJS for personal learning; not architecturally needed).
