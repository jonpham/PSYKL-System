# Stack

> Durable reference for the technology choices shipped in PSYKL-System. Captures **what is implemented**, not what is planned. Initiative-level design docs at `docs/initiatives/{initiative}/DESIGN.md` carry plans; this file records reality.

## M1 Bootstrap (Specs 1–5 shipped; Spec 6 pending)

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
| LICENSE                           | MIT                                                                                                                                                                    |

## Pending (planned, not shipped)

| Layer                | Choice                                                                                                                   | Lands in  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| CD release pipeline  | GitHub Container Registry (`ghcr.io/jonpham/psykl-{service-task,web_client}`); subtree mirrors to component-mirror repos | M1 Spec 6 |
| Helm chart location  | `deploy/helm/`                                                                                                           | M1 Spec 6 |
| Container registry   | GitHub Container Registry (`ghcr.io/jonpham/psykl-*`)                                                                    | M1 Spec 6 |
| Subtree mirror repos | `jonpham/PSYKL-Client_WEB-PWA`, `jonpham/PSYKL-API_Tasks`                                                                | M1 Spec 6 |
| Offline-first store  | TBD (IndexedDB shape + sync queue + last-write-wins implementation)                                                      | M2        |
| Apple-native clients | SwiftUI multiplatform (iOS / iPadOS / macOS) — toolchain TBD                                                             | M3        |
| Multi-user auth      | TBD (OAuth provider vs magic-link vs password+session)                                                                   | M4        |
