---
status: TODO
issue: P4
branches:
  -
prs:
  -
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec: 4
devtasks_total: 1       # DevTask 7
devtasks_complete: 0
---

# 20260520 - M1 Spec 4: Local dev stack via Docker Compose

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer**, I want to be able to **run `docker compose up` from a fresh clone and see the full stack running** so that **PSYKL-System can be exercised end-to-end without installing Node, pnpm, or any project dependencies locally — and so that Spec 5's CI E2E job has a deterministic stack to drive Playwright against**.

## Features (DevTasks composing this Spec)

1. **DevTask 7 — Docker Compose stack.** `docker-compose.yml` for production-shaped local stack, `docker-compose.e2e.yml` overlay (per Decision #27 — swaps pglite volume for tmpfs so E2E starts fresh each run), multi-stage Dockerfile for `service-task` (`node:24-bookworm-slim` base per Decision #32, pglite data dir mounted via env), multi-stage Dockerfile for `web_client` (`node:24-bookworm-slim` build stage → `nginx:alpine` runtime stage with SPA-fallback `nginx.conf` per Decision #21), healthchecks, named volume `psykl-pglite-data`. ~7 files. [Sub-Issue TBD]

## Verification Steps

**Associated E2E test:** none in this Spec — Spec 5 (CI test pipeline) wires Playwright against this compose stack.

**Manual verification:**

_Setup / Preconditions_
- Specs 1, 2, 3 complete and merged.
- Docker Desktop (or equivalent: `colima`, `orbstack`, etc.) installed and running.

_Steps_
1. From a fresh clone with `pnpm install` done, run `docker compose up --build`. First build takes minutes; subsequent runs use cache.
2. Confirm logs show both services start: `service-task` listens on `:3000`, `web_client` nginx listens on `:80` inside its container.
3. Visit `http://localhost:5173` (host port → container `:80`). The PWA loads.
4. Visit `http://localhost:3000/tasks` directly with curl + `X-User-Id: local` header. Returns `[]` (empty array).
5. Open the PWA, create a task with title "compose-test". Confirm it appears in the list.
6. Run `docker compose down` (note: NOT `down -v`). Then `docker compose up` again.
7. The PWA loads again; the "compose-test" task persists (named volume `psykl-pglite-data` survived).
8. Run `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build`. Confirm `service-task` starts but the pglite directory inside the container is mounted as `tmpfs` (no host volume).
9. Stop the e2e stack and bring it up again: state is fresh (empty task list) because tmpfs is ephemeral.

_Expectation_
Two clear modes: production-shaped (persistent named volume, used for local dev) and E2E-shaped (tmpfs, ephemeral, used by Spec 5's CI workflow). Both produced from the same `docker-compose.yml` + a small overlay file.

## Affected Components

- Repository root: `docker-compose.yml`, `docker-compose.e2e.yml`.
- `components/service-task/`: `Dockerfile` (multi-stage), `.dockerignore`.
- `components/web_client/`: `Dockerfile` (multi-stage, nginx runtime), `nginx.conf`, `.dockerignore`.

## Design Decisions

- **#14** Service ports: `service-task` container `:3000` → host `:3000`; `web_client` container `:80` (nginx) → host `:5173`. Same ports as `pnpm dev` modes for consistency.
- **#15** CORS posture: `service-task` allows `Origin: http://localhost:5173` (configurable via `CORS_ORIGIN` env var); no reverse proxy in M1.
- **#21** Web client production runtime: nginx serving built `dist/`. Multi-stage Dockerfile: build stage produces `dist/`; runtime stage is `nginx:alpine` with a `try_files` SPA-fallback rule.
- **#25** pglite persistence: production compose mounts `/var/lib/psykl/pglite` from the `psykl-pglite-data` named volume; env `PGLITE_DATA_DIR=/var/lib/psykl/pglite`.
- **#27** E2E reset strategy: `docker-compose.e2e.yml` overlay overrides `service-task` to mount `/var/lib/psykl/pglite` as `tmpfs` (in-memory, scoped to container lifetime). E2E CI runs `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up`. Each run starts clean; teardown is automatic.
- **#29** CORS allowed headers include `Content-Type` and `X-User-Id`; allowed methods `GET, POST, PATCH, DELETE, OPTIONS`.
- **#32** Container runtime: `node:24-bookworm-slim` (Debian) not `node:24-alpine`. pglite WASM has had musl/glibc compatibility issues; +80 MB image weight buys known-good runtime.

## Architecture Decisions (ADR)

- **ADR-M1-013:** Compose-overlay pattern for E2E reset (rather than an in-app `/test/reset` endpoint or running a separate compose project). The overlay design lets the production `docker-compose.yml` keep its named-volume persistence semantics intact while still giving CI a clean-database E2E mode. See Decision #27.
- **ADR-M1-014:** nginx serves the PWA in production (not `vite preview`, not `serve`). Vite's own docs explicitly discourage using `vite preview` as a production server. Nginx adds ~5 lines of config in the Dockerfile and is rock-solid; Helm + nginx for static SPA is standard. See Decision #21.
- **ADR-M1-015:** Debian-based Node base image (not Alpine). pglite WebAssembly compatibility with musl libc is unverified. Slim-Bookworm is ~80 MB larger than Alpine but eliminates a known risk class. See Decision #32.
- **ADR-M1-016:** No separate database container. pglite runs in-process inside the `service-task` container, persisted via a Docker volume mounted at `/var/lib/psykl/pglite`. M1 ships a 2-container stack (PWA + API), not a 3-container stack. See Decisions #8 (pglite), #25 (path).

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| _none yet_ | _none yet_ | _none yet_ |
