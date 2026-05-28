---
status: DONE
issue: [GH#5](https://github.com/jonpham/PSYKL-System/issues/5)
branches:
  - infra/m1-s4-dt7-docker-compose-stack
prs:
  - https://github.com/jonpham/PSYKL-System/pull/28
completed_at: 2026-05-28
created_at: 2026-05-20
initiative: m1-bootstrap
spec: consolidated-into-this-doc
---

# M1 Spec 4: Local Dev Stack

## User Story

As a **developer**, I want to **run `docker compose up` from a fresh clone and see the full stack running** so that **PSYKL-System can be exercised end-to-end without installing Node, pnpm, or project dependencies locally, and so Spec 5's CI E2E job has a deterministic stack to drive Playwright against**.

## Features

1. **Two-container Docker Compose stack** at the repository root. `docker-compose.yml` builds and runs `service-task` on host `:3000` and `web_client` on host `:5173` under the Compose project name `psykl`.
2. **Production-shaped `service-task` image** using a multi-stage `node:24-bookworm-slim` Dockerfile. Runtime starts `node dist/src/main.js`, applies the existing Drizzle/pglite path conventions, and persists pglite data at `/var/lib/psykl/pglite`.
3. **Production-shaped `web_client` image** using a multi-stage Dockerfile with `node:24-bookworm-slim` for the build and `nginx:alpine` for the runtime. Nginx serves the built Vite app from `dist/` with a SPA fallback so future client-side routes work on refresh.
4. **Persistent local data mode** through the named Docker volume `psykl-pglite-data`. `docker compose down` preserves local Task data; `docker compose down -v` intentionally resets it.
5. **E2E overlay mode** in `docker-compose.e2e.yml`. The overlay clears the inherited named volume and mounts `/var/lib/psykl/pglite` as `tmpfs`, so each E2E run starts from an empty database.
6. **Image-specific Docker ignore files colocated with application code** using `components/service-task/Dockerfile.dockerignore` and `components/web_client/Dockerfile.dockerignore`. Build contexts exclude `node_modules`, generated output, coverage, and tests while still keeping source needed for Docker builds.
7. **Container healthchecks** for both services. `service-task` verifies the HTTP boundary is alive through `/tasks` with `X-User-Id`; `web_client` verifies nginx responds on container-local `127.0.0.1:80`.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m1-bootstrap/DESIGN.md` (Decisions #14, #15, #21, #25, #27, #29, #32).
- Original issue brief: `docs/initiatives/m1-bootstrap/issues/[20260520]P4_m1-local-dev-stack.md` (consolidated into this feature doc and removed by this PR).
- Execution spec: `docs/specs/m1-bootstrap/20260520-S4-local-dev-stack.md` (consolidated into this feature doc and removed by this PR; the DevTask checklist lives only in git history from here forward).
- GitHub issue: [#5](https://github.com/jonpham/PSYKL-System/issues/5).
- DevTask PR: [#28](https://github.com/jonpham/PSYKL-System/pull/28) (DT7 Docker Compose stack).
- Spec integration PR: [#27](https://github.com/jonpham/PSYKL-System/pull/27).

## Implementation Notes

- **Compose topology:** M1 remains a two-container stack. `service-task` owns pglite in-process; there is no separate database container. This keeps local dev and CI close to the app's M1 runtime model while preserving a Postgres-shaped persistence layer for future migration.
- **Build context discipline:** Both Dockerfiles build from the repository root because the components need workspace manifests, `packages/shared-types`, and cross-component generated OpenAPI/client types. Dockerfile-specific ignore files are colocated with each image's application code so image context rules live next to the Dockerfile that consumes them.
- **Runtime dependency install:** `service-task` installs production dependencies in its runtime stage with `pnpm install --prod --frozen-lockfile --ignore-scripts` so the root Husky `prepare` script does not run inside the runtime image.
- **Web build order:** the web image builds `packages/shared-types`, emits `components/service-task/openapi.json`, regenerates `components/web_client/src/api/types.ts`, then runs the Vite production build. This keeps the client image type contract current without committing generated artifacts.
- **E2E reset:** the overlay uses Compose's `!reset []` tag to clear the base named-volume mount before applying `tmpfs`. This avoids introducing an app-only `/test/reset` endpoint and gives Spec 5 a clean database on every run.

## Verification Steps

**Associated E2E test:** none in this Spec. Spec 5 wires Playwright against this compose stack.

**Manual verification**

_Setup / Preconditions_

- Docker Desktop, Colima, OrbStack, or equivalent Docker Engine + Docker Compose v2 is installed and running.
- Specs 1, 2, and 3 are present because the Dockerfiles build the actual workspace packages and components.

_Steps_

1. Run `docker compose build`.
2. Run `docker compose up -d`.
3. Run `docker compose ps` and confirm `psykl-service-task` and `psykl-web-client` are healthy.
4. Run `curl -s http://localhost:3000/tasks -H "X-User-Id: local"` and confirm `[]`.
5. Run `curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "X-User-Id: local" -d '{"title":"docker compose test"}'` and confirm a Task JSON object is returned.
6. Run `curl -s http://localhost:3000/tasks -H "X-User-Id: local"` and confirm the created task appears.
7. Open `http://localhost:5173` and confirm the PWA loads and can create/list Tasks through `service-task`.
8. Run `docker compose down`, then `docker compose up -d`, then read `GET /tasks` again and confirm the task persisted.
9. Run `docker compose down -v`, then `docker compose up -d`, then read `GET /tasks` and confirm `[]`.
10. Run `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d`, create a task, then bring the overlay down and up again. Confirm the task list resets to `[]` because the pglite path is mounted as `tmpfs`.
11. Clean up with `docker compose down -v` and `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`.

_Expectation_

The repository can run the full M1 stack with one Docker Compose command. Local development uses persistent pglite state by default, while the E2E overlay starts every run with an empty in-memory pglite store.

## Affected Components

- Repository root: `docker-compose.yml`, `docker-compose.e2e.yml`.
- `components/service-task/`: multi-stage Dockerfile and `Dockerfile.dockerignore`.
- `components/web_client/`: multi-stage Dockerfile, nginx runtime config, and `Dockerfile.dockerignore`.
- Durable docs: `README.md`, `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`.

## Design Decisions

- **#14** Service ports: `service-task` container `:3000` maps to host `:3000`; `web_client` container `:80` maps to host `:5173`.
- **#15** CORS posture: `service-task` allows `Origin: http://localhost:5173`, configurable through `CORS_ORIGIN`; no reverse proxy in M1.
- **#21** Web client production runtime: nginx serves built `dist/`, not `vite preview` or a Node server.
- **#25** pglite persistence: production compose mounts `/var/lib/psykl/pglite` from the `psykl-pglite-data` named volume; env var `PGLITE_DATA_DIR=/var/lib/psykl/pglite`.
- **#27** E2E reset strategy: `docker-compose.e2e.yml` swaps pglite's named volume for a `tmpfs` mount so each E2E run starts clean.
- **#29** CORS allowed headers include `Content-Type` and `X-User-Id`; allowed methods include `GET`, `POST`, `PATCH`, `DELETE`, and `OPTIONS`.
- **#32** Container runtime: `node:24-bookworm-slim`, not Alpine, to avoid pglite WebAssembly musl/glibc compatibility risk.

## Architecture Decisions (ADR)

- **ADR-M1-017:** Docker Compose is the canonical M1 full-stack local runtime. It builds the real `service-task` and `web_client` components from the monorepo and runs them with production-shaped process boundaries while keeping pglite in-process inside `service-task`.
- **ADR-M1-018:** pglite persists through a named Docker volume mounted at `/var/lib/psykl/pglite`; no database container is introduced in M1. This preserves the current service architecture and avoids pretending pglite is a networked database.
- **ADR-M1-019:** The E2E stack is a Compose overlay, not an application reset endpoint. The overlay clears the base volume mount and replaces it with `tmpfs`, which lets CI start from a clean database without adding test-only API surface to `service-task`.
- **ADR-M1-020:** `web_client` production runtime is nginx serving static Vite output with SPA fallback. The app remains a static PWA; nginx is only a file server and does not introduce server-rendering behavior.
- **ADR-M1-021:** Node container images use Debian slim rather than Alpine. The larger base image is accepted to avoid pglite WebAssembly compatibility risk with musl libc.

## Change Log

| Date       | PR                                                     | Summary                                                                                                                                       |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-28 | [#28](https://github.com/jonpham/PSYKL-System/pull/28) | DT7: Docker Compose stack, service/web Dockerfiles, nginx runtime config, persistent pglite volume, E2E tmpfs overlay, and colocated ignores. |
| 2026-05-28 | [#27](https://github.com/jonpham/PSYKL-System/pull/27) | Spec integration: S4 close-out docs, durable status handoff, changelog update, and removal of the S4 issue/spec source artifacts.             |
