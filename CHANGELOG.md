# Changelog

## Unreleased

_No unreleased changes._

## M1 Bootstrap Spec 4 Shipped - 2026-05-28

- Completed M1 Spec 4 Local Dev Stack ([feature doc](docs/features/%5B20260520%5DGH5_m1-local-dev-stack.md)): Docker Compose now builds and runs the full M1 stack (`service-task` + `web_client`) from the monorepo with production-shaped container boundaries, persistent pglite data via the `psykl-pglite-data` named volume, nginx serving the built PWA on host `:5173`, and the API on host `:3000`; `docker-compose.e2e.yml` replaces pglite persistence with `tmpfs` so Spec 5's Playwright E2E workflow can start clean every run. Docker image context rules are colocated with each image as `Dockerfile.dockerignore`. Constituent PR: [#28](https://github.com/jonpham/PSYKL-System/pull/28); Spec integration [#27](https://github.com/jonpham/PSYKL-System/pull/27).

## M1 Bootstrap Specs 1-3 Shipped - 2026-05-27

- Completed M1 Spec 1 Workspace Bootstrap ([feature doc](docs/features/%5B20260520%5DGH2_m1-workspace-bootstrap.md)): pnpm workspace scaffold, Node/pnpm pins, MIT license, and `@psykl/shared-types`.
- Completed M1 Spec 2 service-task minimal API ([feature doc](docs/features/%5B20260520%5DGH3_m1-service-task-minimal-api.md)): NestJS Task API, pglite/Drizzle persistence, global `UserIdGuard`, OpenAPI emission, and static analysis.
- Completed M1 Spec 3 web_client minimal PWA ([feature doc](docs/features/%5B20260520%5DGH4_m1-web-client-minimal-pwa.md)): installable Vite + React (SPA mode) + `vite-plugin-pwa` shell driving `POST /tasks` and `GET /tasks` against `service-task` via typed `openapi-fetch` (end-to-end type safety from shared Zod schemas through the emitted OpenAPI document to the client's generated types); Husky + lint-staged pre-commit gate running ESLint + Prettier + project-wide `tsc` on every commit; Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon` as the UI Component-layer CLI gate (supersedes M1 DESIGN.md Decision #33 with new Decision #34); UI Component Folder Layout convention adopted (every UI Component its own directory with colocated tests + `index.ts` re-export; private children nest under their single parent; root pages flat); AGENTS.md updates for UI Component vs system component disambiguation, sibling-default DevTask branching with stacking-only-on-real-dependency, rebase-before-PR rule. Constituent PRs: [#19](https://github.com/jonpham/PSYKL-System/pull/19), [#23](https://github.com/jonpham/PSYKL-System/pull/23), [#24](https://github.com/jonpham/PSYKL-System/pull/24), [#25](https://github.com/jonpham/PSYKL-System/pull/25); Spec integration [#21](https://github.com/jonpham/PSYKL-System/pull/21).
