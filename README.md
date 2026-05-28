# PSYKL-System

A time-independent planning tool for accomplishing and building / expending **PSY** (energy) across nested cycles:

- **PSYKL** — a self-defined period of work (minutes)
- **Earth** — day
- **Moon** — month
- **HelioArc** — season / quarter
- **Sun** — year

For people who want to build on their accomplishments using **repetition and energy levels** rather than standardized hours and periods.

> See [`docs/PRODUCT.md`](docs/PRODUCT.md) for the product brief (premise, hypothesis, MVP, future features, target surfaces).

---

## Repository Layout

```
.
├── components/                # System components (each with its own tech stack + downstream subtree mirror)
│   ├── service-task/          # NestJS REST API (Tasks; pglite via Drizzle)
│   └── web_client/            # Vite + React PWA consuming service-task via openapi-fetch
├── packages/                  # Shared library packages
│   └── shared-types/          # Zod schemas → TypeScript types → OpenAPI source of truth
├── docs/                      # Project docs — see "Documentation" below
├── .husky/                    # Husky pre-commit hook (Static Analysis gate)
├── eslint.config.js           # Root ESLint flat config (used by every workspace package)
├── prettier.config.js         # Root Prettier config
├── tsconfig.base.json         # Base TypeScript config extended by each workspace package
├── pnpm-workspace.yaml        # pnpm workspace declaration
├── AGENTS.md                  # Working agreement for AI assistants and humans
├── CLAUDE.md                  # Claude Code entry point (sources AGENTS.md)
└── CHANGELOG.md               # Release-style change log
```

`components/*` and `packages/*` are the source of truth; component upstream repos (`jonpham/psykl-{service-task,web_client}`) are downstream mirrors maintained by CI subtree automation (lands in M1 Spec 6).

---

## Setup

### Prerequisites

- **Node 24 LTS** — pinned via `.nvmrc`. Activate with `nvm use` (or your platform's equivalent).
- **pnpm 10.x** — pinned via the root `packageManager` field. Activate with Corepack: `corepack enable && corepack prepare pnpm@10 --activate`.
- `engine-strict=true` in `.npmrc` means a mismatched Node/pnpm version fails at `pnpm install` time. This is intentional.

### Install

```sh
pnpm install
```

Side effects you should expect:

- Workspace packages link via pnpm hoisting.
- The Husky `pre-commit` hook installs automatically via the root `prepare` script (`pnpm exec husky`).

### One-time post-install for service consumers

`components/service-task` emits an OpenAPI document that the web client consumes via generated types. Run these once after install (and whenever the service's Zod schemas change):

```sh
pnpm --filter @psykl/service-task build:openapi    # emits components/service-task/openapi.json
pnpm --filter @psykl/web-client codegen            # writes components/web_client/src/api/types.ts
```

Both artifacts are gitignored; CI regenerates them on every PR.

---

## Run locally

### Run the API

```sh
pnpm --filter @psykl/service-task dev              # NestJS on http://localhost:3000
```

### Run the web client

In a separate terminal:

```sh
pnpm --filter @psykl/web-client dev                # Vite on http://localhost:5173
```

Open `http://localhost:5173`. The page should render the PSYKL shell with an empty task list, an input, and a Create button. Creating a task fires `POST /tasks` against the API; reloading lists from `GET /tasks` (persisted via pglite).

> The browser sends `X-User-Id: local` automatically; M1 is single-user, no auth. CORS is preconfigured for `http://localhost:5173`. See `docs/STACK.md` and `docs/ARCHITECTURE.md` → Authorization Boundary for the why.

### Common per-component commands

| Command                                           | What it does                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm --filter @psykl/service-task dev`           | Run the NestJS API in watch mode against in-process pglite                               |
| `pnpm --filter @psykl/service-task build`         | Build the API (`tsc` to `dist/`)                                                         |
| `pnpm --filter @psykl/service-task build:openapi` | Emit `components/service-task/openapi.json` from shared Zod schemas via `zod-to-openapi` |
| `pnpm --filter @psykl/service-task db:generate`   | Generate a new Drizzle SQL migration from a schema change                                |
| `pnpm --filter @psykl/service-task db:push`       | Push the current schema to the active pglite instance (use during local dev only)        |
| `pnpm --filter @psykl/web-client dev`             | Run Vite dev server on `:5173`                                                           |
| `pnpm --filter @psykl/web-client codegen`         | Generate `src/api/types.ts` from `components/service-task/openapi.json`                  |
| `pnpm --filter @psykl/web-client build`           | Production build (`tsc -b && vite build`)                                                |
| `pnpm --filter @psykl/web-client preview`         | Serve the production build for smoke-testing                                             |
| `pnpm --filter @psykl/web-client storybook`       | Run Storybook dev server on `:6006` (Manual Visual Check surface for UI Components)      |
| `pnpm --filter @psykl/web-client build-storybook` | Build Storybook static into `storybook-static/`                                          |

---

## Verify locally (full Test Pyramid)

The project's test discipline is a five-layer pyramid (Static Analysis → Unit → Integration → Component → E2E). Static Analysis through Component run locally today; E2E lands in M1 Spec 5.

Run the entire pyramid (recursive across all workspace packages):

```sh
pnpm install                                       # ensures Husky hook is installed
pnpm --filter @psykl/service-task build:openapi    # one-time per schema change
pnpm --filter @psykl/web-client codegen            # one-time per schema change

pnpm -r lint                                       # Layer 1: ESLint (max-warnings 0)
pnpm -r format:check                               # Layer 1: Prettier check
pnpm -r typecheck                                  # Layer 1: tsc --noEmit (project-references)
pnpm -r test:unit                                  # Layer 2: Vitest/Jest unit tests
pnpm -r test:integration                           # Layer 3: in-process pglite integration tests
pnpm -r test:component                             # Layer 4: service contract tests + UI Component tests (Storybook test-runner)
# pnpm -r test:e2e                                 # Layer 5: not wired yet — lands in Spec 5
```

Or use the root pass-through scripts (same effect):

| Root script             | Equivalent                            |
| ----------------------- | ------------------------------------- |
| `pnpm build`            | `pnpm -r build`                       |
| `pnpm lint`             | `pnpm -r lint`                        |
| `pnpm format:check`     | `pnpm -r format:check`                |
| `pnpm typecheck`        | `pnpm -r typecheck`                   |
| `pnpm test:unit`        | `pnpm -r test:unit`                   |
| `pnpm test:integration` | `pnpm -r test:integration`            |
| `pnpm test:component`   | `pnpm -r test:component`              |
| `pnpm test:e2e`         | Stub — exits 0 until Spec 5 wires E2E |

### Full-stack smoke

After Spec 4 lands the local Docker Compose stack this gets replaced with a single `docker compose up` command. Until then:

1. `pnpm --filter @psykl/service-task dev` (terminal 1).
2. `pnpm --filter @psykl/web-client dev` (terminal 2).
3. Open `http://localhost:5173`.
4. Create a task, refresh, confirm it persists.
5. DevTools → Application → Manifest should load cleanly (installable PWA).
6. DevTools → Network: confirm `POST /tasks` carries `X-User-Id: local` and `Content-Type: application/json`; no CORS errors.

### Pre-commit hook

Husky runs `pnpm exec lint-staged → pnpm -r format:check → pnpm -r typecheck` on every commit (see [`.husky/pre-commit`](.husky/pre-commit)). Failures block the commit.

**Escape hatch:** `git commit --no-verify` bypasses the hook. Per [`AGENTS.md`](AGENTS.md) → Git Safety Protocol, only use `--no-verify` when explicitly necessary, and log the reason in the commit body.

---

## Deploy

**M1 deploy is not wired yet** — it lands in M1 Spec 6 (CD release pipeline). The planned shape:

- Each component is built into a container image and published to GitHub Container Registry (`ghcr.io/jonpham/psykl-{service-task,web_client}`).
- Helm chart lives at `deploy/helm/`.
- After a merge to `main`, CI runs `git subtree split` + force-push of `components/*` to their downstream mirror repos (`jonpham/psykl-{service-task,web_client}`).

For the current shape of what's planned see [`docs/STACK.md`](docs/STACK.md) → "Pending" and [`docs/initiatives/m1-bootstrap/DESIGN.md`](docs/initiatives/m1-bootstrap/DESIGN.md) Decisions #16, #17, #21, #27, #30.

---

## Documentation

Start with [`docs/PRODUCT.md`](docs/PRODUCT.md) and [`docs/STACK.md`](docs/STACK.md). Then dive into anything below as needed.

| Path                                                  | What it is                                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)                  | Product brief — premise, MVP, future features, surfaces, constraints                                                    |
| [`docs/STACK.md`](docs/STACK.md)                      | Tech stack table per milestone (what's shipped vs what's pending)                                                       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)        | Durable architecture decisions (ADRs) and component descriptions for everything that's shipped                          |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)    | Live status of the active initiative / spec; how to pick up the project from a cold start                               |
| [`docs/features/`](docs/features/)                    | Per-Spec completion records — one consolidated doc per shipped Spec, with GitHub issue + PR links + ADRs                |
| [`docs/initiatives/{initiative}/`](docs/initiatives/) | Initiative design docs (gstack output) and issue briefs                                                                 |
| [`docs/specs/{initiative}/`](docs/specs/)             | Execution plans (superpowers output) for **pending** Specs; shipped Specs are consolidated into `features/` and removed |
| [`docs/templates/`](docs/templates/)                  | Templates for feature docs and other planning artifacts                                                                 |
| [`docs/BACKLOG_IDEAS.md`](docs/BACKLOG_IDEAS.md)      | Someday/maybe items outside the milestone roadmap                                                                       |
| [`AGENTS.md`](AGENTS.md)                              | Working agreement — workflow, terminology, test discipline, git conventions, skill routing                              |
| [`CLAUDE.md`](CLAUDE.md)                              | Claude Code entry point (sources `AGENTS.md`)                                                                           |
| [`CHANGELOG.md`](CHANGELOG.md)                        | Release-style change log                                                                                                |

---

## Workflow (Quick Reference)

Full rules live in [`AGENTS.md`](AGENTS.md). The TL;DR:

- **Initiatives** are planned with `gstack` → `docs/initiatives/`
- **Specs** are planned with `superpowers` → `docs/specs/`
- Completed Specs are consolidated into **feature docs** under `docs/features/`; their execution-plan and issue-brief artifacts are removed
- Branch naming: `(feat|bug|infra|chore)/m{N}-s{M}-dt{K}-{slug}` for DevTasks; `spec/m{N}-s{M}-{slug}` for Spec integration branches; `feat/plan-{initiative-slug}` for planning branches
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- DevTask PRs target the Spec integration branch as siblings; stacking allowed only when DevTask K+1 depends on K's unmerged work
- Rebase onto `origin/<target>` before opening any PR
- Never commit directly to `main`; never force-push to `main`
- **≤10 production-behavior source files per DevTask PR** (configs, docs, lockfiles, generated files, tests are EXEMPT — see AGENTS.md for the precise definition)
- **No PR merge without explicit user approval in the current session** (AGENTS.md HARD RULE)

---

## Links

- **GitHub Repo:** [jonpham/PSYKL-System](https://github.com/jonpham/PSYKL-System)
- **GitHub Project:** [PSYKL-System Project & Roadmap](https://github.com/users/jonpham/projects/6/)
- **Milestones:** [PSYKL-System/milestones](https://github.com/jonpham/PSYKL-System/milestones)
