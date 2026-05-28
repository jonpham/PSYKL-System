---
status: TODO
issue: P4
pr:
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec_number: 4
devtasks_total: 1
devtasks_complete: 0
honors_decisions: [14, 15, 21, 25, 27, 29, 32]
---

# M1 Spec 4: Local dev stack via Docker Compose — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docker compose up` from a fresh clone produce a running full PSYKL stack (PWA + API + pglite) on standard ports with persistent storage, plus a `docker-compose.e2e.yml` overlay that swaps the pglite volume for tmpfs so Spec 5's E2E suite starts clean every run.

**Architecture:** Two-container compose stack (no separate database container — pglite runs in-process inside `service-task`). `service-task` runs as a Node process built into a multi-stage Debian-slim image; pglite data persists to a named Docker volume `psykl-pglite-data` mounted at `/var/lib/psykl/pglite`. `web_client` runs as a multi-stage build with nginx serving the static `dist/` output on container `:80`, mapped to host `:5173`. SPA-fallback rewrite in nginx config so client-side React Router (when added in M2) works. `docker-compose.e2e.yml` overrides `service-task` to mount the pglite path as tmpfs.

**Tech Stack:** Docker Engine 27.x or later, Docker Compose v2 (built into Docker Desktop / `docker compose` CLI), `node:24-bookworm-slim` base image, `nginx:alpine` runtime image for web_client.

**Reads from:** `docs/initiatives/m1-bootstrap/DESIGN.md` Decisions appendix. Honors decisions #14 (ports), #15 (CORS env), #21 (nginx production runtime), #25 (PGLITE_DATA_DIR mount), #27 (E2E compose overlay with tmpfs), #29 (CORS allowed headers), #32 (node:24-bookworm-slim — Debian, not Alpine).

**Depends on:** Specs 1, 2, 3 must have merged. The Dockerfiles build the actual component apps that Specs 2 and 3 produce.

---

## File Structure

| File                                                         | Purpose                                                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `/Users/jp/code/psykl/docker-compose.yml`                    | Production-shaped local stack: service-task (Node) + web_client (nginx) + named volume                |
| `/Users/jp/code/psykl/docker-compose.e2e.yml`                | Overlay: swaps the pglite named volume for `tmpfs` so E2E runs start clean                            |
| `/Users/jp/code/psykl/components/service-task/Dockerfile`    | Multi-stage: builder (pnpm install + tsc build) → runtime (node:24-bookworm-slim + dist + migrations) |
| `/Users/jp/code/psykl/components/service-task/.dockerignore` | Exclude node_modules, dist, tests, .pglite-dev/                                                       |
| `/Users/jp/code/psykl/components/web_client/Dockerfile`      | Multi-stage: builder (pnpm install + vite build) → runtime (nginx:alpine + dist)                      |
| `/Users/jp/code/psykl/components/web_client/nginx.conf`      | SPA-fallback rewrite + reasonable defaults                                                            |
| `/Users/jp/code/psykl/components/web_client/.dockerignore`   | Exclude node_modules, dist, src/api/types.ts                                                          |

---

## Task 7: Docker Compose stack + Dockerfiles + E2E overlay

Start DevTask 7 on a branch off `main`: `git checkout main && git pull && git checkout -b infra/docker-compose-stack`.

- [x] **Step 1: Write `components/service-task/.dockerignore`**

```
node_modules
dist
.pglite-dev
**/*.test.ts
tests
coverage
.git
.gitignore
README.md
```

- [x] **Step 2: Write `components/service-task/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

# ----- Builder stage -----
FROM node:24-bookworm-slim AS builder
WORKDIR /repo

# Enable Corepack for the pnpm version pinned in package.json's packageManager field.
RUN corepack enable

# Copy workspace manifests first for better Docker layer caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY components/service-task/package.json components/service-task/

# Install ALL workspace deps (production + dev — build needs tsc + tsx).
RUN pnpm install --frozen-lockfile

# Copy the rest of the workspace.
COPY packages/shared-types ./packages/shared-types
COPY components/service-task ./components/service-task

# Build packages/shared-types first (service-task depends on its compiled output).
RUN pnpm --filter @psykl/shared-types build
RUN pnpm --filter @psykl/service-task build

# ----- Runtime stage -----
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

# Enable Corepack so the pinned pnpm is available for `pnpm --filter ... start`.
RUN corepack enable

# Copy production node_modules + built dist from the builder.
COPY --from=builder /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=builder /repo/packages/shared-types/package.json /repo/packages/shared-types/dist /app/packages/shared-types/
COPY --from=builder /repo/components/service-task/package.json /repo/components/service-task/dist /app/components/service-task/
COPY --from=builder /repo/components/service-task/drizzle /app/components/service-task/drizzle

# Install production-only deps in the runtime image. Ignore lifecycle scripts so
# root `prepare` does not try to run Husky without dev dependencies installed.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV PGLITE_DATA_DIR=/var/lib/psykl/pglite
EXPOSE 3000

# Create the pglite data directory so the volume mount has a valid target.
RUN mkdir -p /var/lib/psykl/pglite

WORKDIR /app/components/service-task
CMD ["node", "dist/main.js"]
```

- [x] **Step 3: Write `components/web_client/.dockerignore`**

```
node_modules
dist
src/api/types.ts
**/*.test.tsx
**/*.test.ts
src/test
coverage
.git
.gitignore
README.md
```

- [x] **Step 4: Write `components/web_client/nginx.conf`**

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  sendfile on;
  keepalive_timeout 65;
  server_tokens off;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback: any unmatched route serves index.html so client-side
    # React Router (M2+) handles deep links.
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Hashed static assets — long cache.
    location ~* \.(js|css|woff2?|png|jpg|svg|ico)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

- [x] **Step 5: Write `components/web_client/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

# ----- Builder stage -----
FROM node:24-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable

# Workspace manifests for layer caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY components/service-task/package.json components/service-task/
COPY components/web_client/package.json components/web_client/

RUN pnpm install --frozen-lockfile

# Copy source.
COPY packages/shared-types ./packages/shared-types
COPY components/service-task ./components/service-task
COPY components/web_client ./components/web_client

# shared-types must build first (web_client imports its types via workspace:*).
RUN pnpm --filter @psykl/shared-types build

# Regenerate openapi.json + types.ts in case service-task changed.
RUN pnpm --filter @psykl/service-task build:openapi
RUN pnpm --filter @psykl/web-client codegen

# Build the Vite app.
RUN pnpm --filter @psykl/web-client build

# ----- Runtime stage -----
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=builder /repo/components/web_client/dist/ ./
COPY components/web_client/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [x] **Step 6: Write `/Users/jp/code/psykl/docker-compose.yml`**

```yaml
name: psykl

services:
  service-task:
    build:
      context: .
      dockerfile: components/service-task/Dockerfile
    image: psykl-service-task:local
    container_name: psykl-service-task
    environment:
      NODE_ENV: production
      PORT: '3000'
      PGLITE_DATA_DIR: /var/lib/psykl/pglite
      CORS_ORIGIN: http://localhost:5173
    ports:
      - '3000:3000'
    volumes:
      - psykl-pglite-data:/var/lib/psykl/pglite
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3000/tasks', { headers: { 'X-User-Id': 'healthcheck' } }).then(r => process.exit(r.status === 401 ? 1 : 0)).catch(() => process.exit(1))",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  web-client:
    build:
      context: .
      dockerfile: components/web_client/Dockerfile
    image: psykl-web-client:local
    container_name: psykl-web-client
    depends_on:
      service-task:
        condition: service_healthy
    ports:
      - '5173:80'
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:80/']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  psykl-pglite-data:
    name: psykl-pglite-data
```

Note: the service-task healthcheck calls `/tasks` expecting a 401 (no `X-User-Id` header is OK as evidence the server is up and the global UserIdGuard is wired). Exits 0 on 401, 1 otherwise.

- [x] **Step 7: Write `/Users/jp/code/psykl/docker-compose.e2e.yml` overlay**

```yaml
# E2E overlay (Decision #27): swaps the pglite named volume for a tmpfs mount
# so every CI run starts with an empty database.
# Usage: docker compose -f docker-compose.yml -f docker-compose.e2e.yml up

services:
  service-task:
    tmpfs:
      - /var/lib/psykl/pglite
    volumes:
      # Empty to clear the inherited named-volume mount from the base compose file.
      []
```

- [x] **Step 8: Build the compose stack**

Run from repo root: `docker compose build`

Expected: both images build successfully. `service-task` image is ~150-250 MB (Debian slim + Node + node_modules + dist). `web-client` runtime image is ~50 MB (nginx:alpine + static dist). First build takes minutes; subsequent builds use cache.

If the build fails on `pnpm install`: verify the workspace manifests copied correctly. The dockerfiles list `packages/shared-types/package.json`, `components/service-task/package.json`, `components/web_client/package.json` explicitly — extending later (M2+ adds more components) requires updating both Dockerfiles.

- [ ] **Step 9: Start the stack**

Run: `docker compose up -d`

Expected: both containers start. `docker compose ps` shows both with `Up` + healthy status (after ~30 seconds for the healthchecks to flip).

Inspect logs:

```bash
docker compose logs service-task | tail -20
docker compose logs web-client | tail -10
```

`service-task` should log: pglite init, Drizzle migrations applied, "service-task listening on http://0.0.0.0:3000". `web-client` should be silent except for nginx startup.

- [ ] **Step 10: Smoke-test the running stack**

```bash
# API: empty list with valid header
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
# Expected: []

# Create one
curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: local" \
  -d '{"title":"docker compose test"}'
# Expected: JSON object with id (UUID v7), user_id "local", title, created_at

# Read it back
curl -s http://localhost:3000/tasks -H "X-User-Id: local" | python3 -m json.tool
# Expected: array containing the task

# PWA loads
curl -s http://localhost:5173/ | head -20
# Expected: HTML containing <title>PSYKL-System</title>
```

Open `http://localhost:5173` in a browser. Confirm the PWA loads, shows the task created above, and can create new tasks. Network panel shows requests going to `http://localhost:3000` with `X-User-Id: local`.

- [ ] **Step 11: Verify persistence across `down`+`up`**

```bash
docker compose down              # NOT -v; we want to keep the volume
docker compose up -d
sleep 5
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
```

Expected: the "docker compose test" task is still there. Volume `psykl-pglite-data` survived.

- [ ] **Step 12: Verify clean tear-down with `-v`**

```bash
docker compose down -v          # this DOES delete the volume
docker compose up -d
sleep 5
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
```

Expected: `[]` (empty array). Volume was recreated empty.

- [ ] **Step 13: Verify the E2E overlay starts clean every time**

```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
sleep 5
curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" -H "X-User-Id: local" \
  -d '{"title":"e2e overlay test"}'
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
# Expected: array with one task

docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
sleep 5
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
# Expected: [] (tmpfs cleared on container restart)

docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
```

- [ ] **Step 14: Final cleanup**

```bash
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v
```

- [ ] **Step 15: Commit DevTask 7**

```bash
git add docker-compose.yml docker-compose.e2e.yml \
        components/service-task/Dockerfile components/service-task/.dockerignore \
        components/web_client/Dockerfile components/web_client/nginx.conf components/web_client/.dockerignore
git commit -m "infra(M1-T7): Docker Compose stack with nginx, pglite volume, and E2E overlay

Two-container production-shaped stack (service-task + web-client) with
in-process pglite (no separate DB container) and a docker-compose.e2e.yml
overlay that swaps the named volume for tmpfs so Spec 5's E2E CI job
starts fresh every run.

Multi-stage Dockerfiles use node:24-bookworm-slim per Decision #32
(Debian, not Alpine — pglite WASM compatibility).
Honors Decisions #14, #15, #21, #25, #27, #29, #32."
```

Push, open PR, merge.

---

## Spec 4 Verification (after DevTask 7 merges)

- [ ] **Step 1: Cold-clone smoke test**

```bash
cd /tmp && rm -rf psykl-smoke && git clone <repo-url> psykl-smoke && cd psykl-smoke
docker compose build
docker compose up -d
sleep 15
docker compose ps                # both healthy
curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "X-User-Id: local" -d '{"title":"cold clone"}'
# Browser to http://localhost:5173 — confirm full flow
docker compose down -v
```

- [ ] **Step 2: Close out the Spec**

When the PR merges, set frontmatter `status: DONE`, `devtasks_complete: 1`, populate branch/PR lists. Promote `docs/initiatives/m1-bootstrap/issues/[20260520]P4_m1-local-dev-stack.md` to `docs/features/` updating the Change Log.
