# Stack

> Durable reference for the technology choices shipped in PSYKL-System. Captures **what is implemented**, not what is planned. Initiative-level design docs at `docs/initiatives/{initiative}/DESIGN.md` carry plans; this file records reality.

## M1 Bootstrap (all six Specs shipped)

| Layer                             | Choice                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager                   | pnpm + `pnpm-workspace.yaml`                                                                                                                                           |
| Node runtime                      | Node 24 LTS (pinned via `.nvmrc` + `engines.node`)                                                                                                                     |
| pnpm version                      | 10.x (pinned via `packageManager` field)                                                                                                                               |
| `engine-strict`                   | `.npmrc` at repo root contains `engine-strict=true`                                                                                                                    |
| Pre-commit gate                   | Husky `pre-commit` → `pnpm exec lint-staged` → `pnpm -r format:check` → `pnpm -r typecheck`                                                                            |
| Static Analysis                   | ESLint flat config + Prettier + `tsc`, configured at repo root, invoked per-package via `lint`, `format:check`, `typecheck` scripts                                    |
| API framework                     | NestJS, REST, multi-transport-ready (gRPC + GraphQL deferrable into the same app)                                                                                      |
| API spec / schema discipline      | Schema-first via Zod in `packages/shared-types/src/schemas/` + `nestjs-zod` DTOs + `zod-to-openapi`-emitted document                                                   |
| OpenAPI artifact                  | `components/service-task/openapi.json` (gitignored, emitted at build) consumed by clients via `openapi-typescript` + `openapi-fetch`                                   |
| PWA framework                     | Vite + React 19 (SPA mode) + `vite-plugin-pwa`                                                                                                                         |
| UI Component-layer test toolchain | Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon` (supersedes M1 DESIGN.md Decision #33 via new Decision #34)                            |
| Unit-layer test toolchain         | Vitest 3.x + Testing Library + `jsdom` (web_client); Jest (service-task)                                                                                               |
| HTTP boundary stub                | MSW (Mock Service Worker) — single handler set at `components/web_client/src/test/msw-handlers.ts`, reused across Vitest setup and Storybook via `msw-storybook-addon` |
| ORM + migrations                  | Drizzle ORM + drizzle-kit; schema at `components/service-task/src/db/schema/`; migrations at `components/service-task/drizzle/migrations/`                             |
| Database (M1)                     | pglite (in-process PostgreSQL via WebAssembly) — Postgres-shaped from day one for clean M4+ networked migration                                                        |
| PSYKL Task id                     | UUID v7 (RFC 9562, time-ordered), generated app-side in NestJS `TaskService` via `uuid` package                                                                        |
| `created_at` column               | `timestamptz` with DB default `now()` (Drizzle: `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`)                                              |
| Authorization boundary (M1/M2)    | Global NestJS `UserIdGuard` enforcing `X-User-Id` header; hardcoded value `local` in M1/M2; real auth slots in at M4 without data-model change                         |
| pglite persistence path           | Production: `/var/lib/psykl/pglite` (Docker volume `psykl-pglite-data`); dev: `./.pglite-dev` (gitignored); tests: in-memory. Env var: `PGLITE_DATA_DIR`               |
| Service ports (local dev)         | `service-task` `:3000`, `web_client` Vite `:5173`                                                                                                                      |
| CORS posture                      | service-task allows `Origin: http://localhost:5173` in dev (configurable via `CORS_ORIGIN`); `X-User-Id` whitelisted in allowed-headers per Decision #29               |
| Local dev stack                   | Docker Compose v2 runs `service-task` + `web_client`; pglite persists in named volume `psykl-pglite-data`                                                              |
| E2E stack reset                   | `docker-compose.e2e.yml` clears the pglite named volume mount and replaces it with `tmpfs` for clean test runs                                                         |
| CI provider                       | GitHub Actions                                                                                                                                                         |
| CI check names                    | `CI / static-checking`, `CI / unit-tests`, `CI / integration-tests`, `CI / component-tests`, `CI E2E / e2e`; manual merge gate while repo is private                   |
| CI command surface                | Root `verify:*` scripts in `package.json`; reusable shell behavior under `scripts/`                                                                                    |
| E2E driver                        | Playwright Chromium against the Docker Compose stack                                                                                                                   |
| Container image bases             | `node:24-bookworm-slim` for Node build/runtime stages; `nginx:alpine` for the `web_client` static runtime                                                              |
| UI Component folder layout        | Per-component directory (`src/components/<Name>/`) with colocated tests and `index.ts` re-export; root-page exception for `App.tsx`                                    |
| Test file locations               | Static + Unit + UI Component colocated next to source; Integration in per-component `tests/integration/`; E2E in repo-root `e2e/`                                      |
| Branching convention              | Sibling-default DevTask branches off the Spec integration branch; stacking allowed only when DevTask K+1 depends on K's unmerged work; rebase-before-PR mandatory      |
| Container registry                | GitHub Container Registry (`ghcr.io/jonpham/psykl-{service-task,web_client}`)                                                                                          |
| CD publish on merge               | `.github/workflows/cd-publish.yml` — builds + pushes both images to GHCR with `:{sha}` + `:latest` tags on every merge to `main`                                       |
| Subtree mirror repos              | `jonpham/PSYKL-Client_WEB-PWA` (web_client), `jonpham/PSYKL-API_Tasks` (service-task); force-pushed via `cd-subtree-sync.yml` on every merge to `main`                 |
| Subtree-push secret               | `SUBTREE_PUSH_TOKEN` — fine-grained PAT, `contents: write` on both mirror repos, stored as a monorepo Actions secret                                                   |
| Helm chart location               | `deploy/helm/` (`Chart.yaml`, `values.yaml`, templates for service-task Deployment+Service+PVC and web-client Deployment+Service, optional Ingress)                    |
| Tagged-release workflow           | `.github/workflows/cd-release.yml` — on `v*.*.*` tag: re-tag GHCR images with `:{semver}`, package Helm chart, create GitHub Release with `.tgz` attached              |
| Image tag strategy                | Three-tag per Decision #30: on merge → `:{sha}` + `:latest`; on tag → additionally `:{semver}`. Helm `values.yaml` defaults to `:latest`; release pipeline overrides   |
| LICENSE                           | MIT                                                                                                                                                                    |

## M2 PWA CRUD + Offline-First (Specs 1-6 complete on spec/m2-pwa)

| Layer                         | Choice                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Task create identity          | Client-supplied UUID v7 `Task.id` required on `POST /tasks`; distinct from idempotency operation identity                                  |
| Task mutation endpoints       | `PATCH /tasks/:id` and `DELETE /tasks/:id` in `service-task`                                                                               |
| Conflict resolution           | Last-Write-Wins using client-supplied `updated_at`; timestamps more than five minutes ahead of server time are clamped before comparison   |
| Delete model                  | Soft-delete tombstones via nullable `deleted_at`; default `GET /tasks` hides tombstones and `GET /tasks?include_deleted=1` includes them   |
| Idempotency                   | Required `Idempotency-Key` header on `POST`, `PATCH`, and `DELETE`; response replay keyed by `(user_id, idempotency_key)` with 24-hour TTL |
| Idempotency persistence       | Drizzle-managed `idempotency` table in pglite with request hash, status code, response body, expiry, and created timestamp                 |
| Service contract verification | Zod schema Unit tests, Drizzle+pglite Integration tests, NestJS HTTP Component contract tests, generated OpenAPI through `verify:prepare`  |
| PWA mutation key generation   | `web_client` uses UUID v7 for per-operation `Idempotency-Key` when creating Tasks through the typed OpenAPI client                         |
| Browser data store            | IndexedDB database `psykl` through the `idb` package, schema version 1                                                                     |
| PWA local stores              | `tasks`, `sync_queue`, `sync_meta`, and `failed_ops`; Task rows mirror the service wire shape                                              |
| PWA read source of truth      | `useTasks()` hook backed by React `useSyncExternalStore` over IndexedDB snapshots                                                          |
| PWA cold-start hydration      | `GET /tasks?include_deleted=1` writes server rows, including tombstones, into IndexedDB before rendering visible non-deleted Tasks         |
| PWA store invalidation        | Same-tab `notifyTasksChanged()` plus `BroadcastChannel('psykl-idb')` for cross-tab invalidation                                            |
| Browser storage test shim     | `fake-indexeddb` for web_client Unit and Integration tests                                                                                 |
| Sync replay module            | `components/web_client/src/sync/replay.ts`; shared page/Service Worker replay loop for queued mutations                                    |
| Sync replay coordination      | IndexedDB `sync_meta.replay_lock` row with 30-second stale timeout                                                                         |
| Sync queue replay order       | FIFO across due `sync_queue` rows; transient failures back off and stop that replay pass                                                   |
| Permanent sync failures       | 4xx responses move rows to `failed_ops`, emit `sync:permanent-fail`, warn at 50 rows, and cap at 100 rows                                  |
| PWA mutation path             | Task creates write optimistic local rows, enqueue `create` operations, and trigger replay instead of calling `POST /tasks` directly        |
| Pending sync UI               | Task rows with matching `sync_queue.task_id` render at 60% opacity with a pending-sync dot                                                 |
| Sync failure UI               | `Toast` listens for `sync:permanent-fail` and renders an alert                                                                             |
| Service Worker strategy       | `vite-plugin-pwa` `injectManifest` with owned `components/web_client/src/sw.ts`; no `skipWaiting()`                                        |
| App-shell offline behavior    | Service Worker precaches the app shell and serves single-page-app navigations from cached `index.html`                                     |
| Runtime Task read cache       | Service Worker uses Workbox stale-while-revalidate for default `GET /tasks`; `include_deleted=1` stays uncached for sync reads             |
| Background Sync tag           | Chromium Background Sync registration uses the literal `psykl-sync` tag                                                                    |
| Service Worker replay         | Service Worker `sync` events call the shared `src/sync/replay.ts` module with owner `service-worker`                                       |
| Service Worker tests          | Real Playwright Chromium Component tests under `components/web_client/tests/component/*.pw.spec.ts`                                        |
| CRUD UI mutation surface      | `TaskRow` under `TaskList` supports inline edit, complete/uncomplete, and two-click delete; all mutations enqueue local-first sync ops     |
| Offline/user feedback UI      | Loading skeleton, empty state, offline banner, permanent-fail toast, stale-write toast, and delayed pending-sync dot                       |
| Multi-device E2E harness      | Playwright opens two isolated browser contexts against one Compose stack and one `user_id`; helper assertions inspect each context's IDB   |
| Offline sync E2E coverage     | Active E2E covers offline create replay, Last-Write-Wins convergence, tombstone propagation, idempotent retry, and pending-sync affordance |

## Pending (planned, not shipped)

| Layer                | Choice                                                       | Lands in |
| -------------------- | ------------------------------------------------------------ | -------- |
| Apple-native clients | SwiftUI multiplatform (iOS / iPadOS / macOS) — toolchain TBD | M3       |
| Multi-user auth      | TBD (OAuth provider vs magic-link vs password+session)       | M4       |
