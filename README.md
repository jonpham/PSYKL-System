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
├── docker-compose.yml         # Full local stack: service-task + web_client + persistent pglite volume
├── docker-compose.e2e.yml     # E2E overlay: tmpfs pglite state for clean test runs
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

`components/*` and `packages/*` are the source of truth; component downstream repos (`jonpham/PSYKL-Client_WEB-PWA` for `components/web_client`, `jonpham/PSYKL-API_Tasks` for `components/service-task`) are mirrors maintained by `.github/workflows/cd-subtree-sync.yml` on every merge to `main` (M1 Spec 6).

---

## Setup

### Prerequisites

- **Node 24 LTS** — pinned via `.nvmrc`. Activate with `nvm use` (or your platform's equivalent).
- **pnpm 10.x** — pinned via the root `packageManager` field. Activate with Corepack: `corepack enable && corepack prepare pnpm@10 --activate`.
- **Docker Engine + Docker Compose v2** — used for the full-stack local runtime and the future E2E workflow.
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

### Run the full stack with Docker Compose

```sh
docker compose up --build
```

Open `http://localhost:5173`. The PWA is served by nginx and calls `service-task` on `http://localhost:3000`. Task data persists in the `psykl-pglite-data` Docker volume until you run `docker compose down -v`.

Use the E2E overlay when you need a clean pglite store on each stack run:

```sh
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build
```

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

| Command                                           | What it does                                                                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @psykl/service-task dev`           | Run the NestJS API in watch mode against in-process pglite                                                                               |
| `pnpm --filter @psykl/service-task build`         | Build the API (`tsc` to `dist/`)                                                                                                         |
| `pnpm --filter @psykl/service-task build:openapi` | Emit `components/service-task/openapi.json` from shared Zod schemas via `zod-to-openapi`                                                 |
| `pnpm --filter @psykl/service-task openapi:view`  | Regenerate `openapi.json` and serve a Scalar viewer at `http://localhost:3003` (via `pnpm dlx @scalar/cli`; no install in the workspace) |
| `pnpm --filter @psykl/service-task db:generate`   | Generate a new Drizzle SQL migration from a schema change                                                                                |
| `pnpm --filter @psykl/service-task db:push`       | Push the current schema to the active pglite instance (use during local dev only)                                                        |
| `pnpm --filter @psykl/web-client dev`             | Run Vite dev server on `:5173`                                                                                                           |
| `pnpm --filter @psykl/web-client codegen`         | Generate `src/api/types.ts` from `components/service-task/openapi.json`                                                                  |
| `pnpm --filter @psykl/web-client build`           | Production build (`tsc -b && vite build`)                                                                                                |
| `pnpm --filter @psykl/web-client preview`         | Serve the production build for smoke-testing                                                                                             |
| `pnpm --filter @psykl/web-client storybook`       | Run Storybook dev server on `:6006` (Manual Visual Check surface for UI Components)                                                      |
| `pnpm --filter @psykl/web-client build-storybook` | Build Storybook static into `storybook-static/`                                                                                          |

---

## Verify locally (full Test Pyramid)

The project's test discipline is a five-layer pyramid (Static Analysis → Unit → Integration → Component → E2E). The E2E layer runs Playwright Chromium against the Docker Compose stack with the E2E overlay.

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

docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
pnpm test:e2e                                      # Layer 5: Playwright Chromium against the running stack
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v
```

Or use the root pass-through scripts (same effect):

| Root script             | Equivalent                         |
| ----------------------- | ---------------------------------- |
| `pnpm build`            | `pnpm -r build`                    |
| `pnpm lint`             | `pnpm -r lint`                     |
| `pnpm format:check`     | `pnpm -r format:check`             |
| `pnpm typecheck`        | `pnpm -r typecheck`                |
| `pnpm test:unit`        | `pnpm -r test:unit`                |
| `pnpm test:integration` | `pnpm -r test:integration`         |
| `pnpm test:component`   | `pnpm -r test:component`           |
| `pnpm test:e2e`         | `pnpm --filter @psykl/e2e test`    |
| `pnpm test:e2e:ui`      | `pnpm --filter @psykl/e2e test:ui` |

The GitHub Actions workflows call root verification scripts. Commands with multi-step shell behavior delegate to reusable scripts under `scripts/`:

| Root script                              | Behavior                                        |
| ---------------------------------------- | ----------------------------------------------- |
| `pnpm verify:prepare`                    | Builds shared types, OpenAPI, and web API types |
| `pnpm verify:static`                     | Lint, format check, and typecheck               |
| `pnpm verify:unit`                       | Unit tests                                      |
| `pnpm verify:integration`                | Integration tests                               |
| `pnpm verify:component:install-browsers` | Installs Chromium for Storybook tests           |
| `pnpm verify:component`                  | Component tests                                 |
| `pnpm verify:e2e:install-browsers`       | Installs Chromium for E2E tests                 |
| `pnpm verify:e2e:up`                     | Builds and starts the Docker Compose E2E stack  |
| `pnpm verify:e2e:wait`                   | service-task + web-client readiness checks      |
| `pnpm verify:e2e`                        | Playwright E2E tests                            |
| `pnpm verify:e2e:logs`                   | Docker Compose E2E logs                         |
| `pnpm verify:e2e:down`                   | Stops and removes the Docker Compose E2E stack  |

### Pull Request CI

Pull Requests to `main` and Spec integration branches (`spec/**`) run two GitHub Actions workflows:

| Check name               | Coverage                                                |
| ------------------------ | ------------------------------------------------------- |
| `CI / static-checking`   | Static Analysis: lint, format check, and typecheck      |
| `CI / unit-tests`        | Unit tests                                              |
| `CI / integration-tests` | Integration tests                                       |
| `CI / component-tests`   | Component tests, including Storybook UI Component tests |
| `CI E2E / e2e`           | Docker Compose stack plus Playwright Chromium E2E       |

For this private repository, GitHub branch-protection enforcement is out of scope unless the repository becomes public or GitHub Pro is enabled. Treat these checks as the manual merge gate: do not merge PRs until the visible workflow checks are green.

### Full-stack smoke

Use Docker Compose for the full-stack local smoke:

1. Run `docker compose up --build`.
2. Open `http://localhost:5173`.
3. Create a task, refresh, confirm it persists.
4. Run `docker compose down`, then `docker compose up` again; confirm the task still exists.
5. Run `docker compose down -v`, then `docker compose up` again; confirm the task list is empty.
6. DevTools → Application → Manifest should load cleanly (installable PWA).
7. DevTools → Network: confirm `POST /tasks` carries `X-User-Id: local` and `Content-Type: application/json`; no CORS errors.

### Pre-commit hook

Husky runs `pnpm exec lint-staged → pnpm -r format:check → pnpm -r typecheck` on every commit (see [`.husky/pre-commit`](.husky/pre-commit)). Failures block the commit.

**Escape hatch:** `git commit --no-verify` bypasses the hook. Per [`AGENTS.md`](AGENTS.md) → Git Safety Protocol, only use `--no-verify` when explicitly necessary, and log the reason in the commit body.

---

## Deploy

M1's CD release pipeline is wired (M1 Spec 6 — [feature doc](docs/features/%5B20260520%5DGH7_m1-cd-release-pipeline.md)):

- **On every merge to `main`:** `.github/workflows/cd-publish.yml` builds and pushes `service-task` + `web_client` container images to GitHub Container Registry with `:{sha}` + `:latest` tags. `.github/workflows/cd-subtree-sync.yml` force-pushes the two component subtrees to their downstream mirror repositories `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks`.
- **On every `v*.*.*` tag push:** `.github/workflows/cd-release.yml` re-tags the existing `:{sha}` images with the semver, packages the Helm chart at `deploy/helm/`, and creates a GitHub Release with the packaged `.tgz` attached as a release asset.
- **Helm chart at `deploy/helm/`:** single chart, multi-Deployment — `service-task` (Deployment + Service + PVC for pglite persistence) and `web_client` (Deployment + Service), single-replica per Premise 8, optional Ingress disabled by default. Install a published release with `gh release download v0.X.Y --pattern '*.tgz' && helm install psykl ./psykl-0.X.Y.tgz`.
  For details see [`docs/STACK.md`](docs/STACK.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ADR-M1-026 through ADR-M1-030.

---

## Release

Cutting a new release is operator-side. The procedure below applies to every release; substitute `X.Y.Z` with the actual semver (e.g., `0.1.0`, `0.2.0`).

### Preconditions

- All Specs for the release are shipped to `main`.
- `cd-publish.yml` and `cd-subtree-sync.yml` are running green on every merge to `main` — check with `gh run list --workflow=cd-publish.yml --branch=main --limit=1` and `gh run list --workflow=cd-subtree-sync.yml --branch=main --limit=1`.
- One-time-per-repo: GHCR workflow permissions are "Read and write" (Settings → Actions → General → Workflow permissions). Only relevant if `cd-publish.yml` ever errors with `permission denied` pushing to `ghcr.io`.
- One-time-per-major-release: confirm `SUBTREE_PUSH_TOKEN` (the fine-grained PAT used by `cd-subtree-sync.yml`) is not expiring soon. Rotate via Settings → Developer settings → Personal access tokens (fine-grained) and update the Actions secret if needed.

### Procedure

1. **Update `CHANGELOG.md` for the release date.** Rename the current `## Unreleased` heading to `## [X.Y.Z] - YYYY-MM-DD` (use the actual tag date). Add a fresh empty `## Unreleased` heading above it.

   ```bash
   git checkout main && git pull
   # Edit CHANGELOG.md per above.
   git add CHANGELOG.md
   git commit -m "docs: release vX.Y.Z — move Unreleased to dated X.Y.Z section"
   git push -u origin HEAD:docs/release-vX.Y.Z   # explicit refspec per AGENTS.md HARD RULE
   gh pr create --base main --head docs/release-vX.Y.Z --title "docs: release vX.Y.Z" --body "CHANGELOG date for vX.Y.Z."
   ```

   Merge the PR through the normal review flow with explicit approval per the AGENTS.md HARD RULE on PR merges. The merge commit is what gets tagged in step 3.

2. **Wait for `cd-publish.yml` and `cd-subtree-sync.yml` on the new `main` commit.** `cd-release.yml` will pull the `:{sha}` images this commit produced, so they must exist before tagging.

   ```bash
   gh run list --workflow=cd-publish.yml --branch=main --limit=1     # status=completed, conclusion=success
   gh run list --workflow=cd-subtree-sync.yml --branch=main --limit=1 # status=completed, conclusion=success
   ```

3. **Tag and push `vX.Y.Z`.**

   ```bash
   git checkout main && git pull
   git tag -a vX.Y.Z -m "PSYKL-System vX.Y.Z"
   git push origin vX.Y.Z
   ```

   `git push origin vX.Y.Z` is the explicit-refspec form per the AGENTS.md HARD RULE — it pushes only the tag, never any branch.

4. **Watch `cd-release.yml` complete.**

   ```bash
   gh run watch --workflow=cd-release.yml
   ```

5. **Verify.**

   ```bash
   # GHCR images now carry :X.Y.Z (in addition to :{sha} and :latest)
   gh api /users/jonpham/packages/container/psykl-service-task/versions \
     --jq '.[] | select(.metadata.container.tags | contains(["X.Y.Z"]))'
   gh api /users/jonpham/packages/container/psykl-web_client/versions \
     --jq '.[] | select(.metadata.container.tags | contains(["X.Y.Z"]))'

   # GitHub Release exists with the packaged Helm chart attached
   gh release view vX.Y.Z --repo jonpham/PSYKL-System
   # Expected: psykl-X.Y.Z.tgz under Assets
   ```

6. **(Optional one-time per image)** Make GHCR images public if you want pull-anywhere access. https://github.com/users/jonpham/packages/container/psykl-service-task/settings → "Change package visibility" → Public. Repeat for `psykl-web_client`.

7. **Smoke-install the chart in a local Kubernetes cluster** (kind, minikube, or k3s).

   ```bash
   gh release download vX.Y.Z --repo jonpham/PSYKL-System --pattern '*.tgz'
   helm install psykl-test ./psykl-X.Y.Z.tgz
   kubectl get pods                              # both psykl-test-* pods Running
   kubectl port-forward svc/psykl-test-web-client 8080:80
   # Browse http://localhost:8080 — PWA loads.
   helm uninstall psykl-test
   ```

### Failure modes & remediation

If a release step fails, do **not** delete or move the `vX.Y.Z` tag — the failed workflow run is the operator's record of what happened. Fix the root cause on a new branch off `main`, merge a fix PR, cut a new patch tag (`vX.Y.Z+1`).

| Symptom                                                                                 | Likely cause                                                                                                  | Fix                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `cd-release.yml` step `Re-tag service-task image with :{semver}` fails on `docker pull` | `cd-publish.yml` hadn't completed for the tagged commit before the tag was pushed                             | Wait for `cd-publish.yml`, then cut `vX.Y.Z+1` (do not re-push the same tag)                   |
| `cd-release.yml` `helm lint` fails                                                      | Chart edit landed since the last release without local lint                                                   | Fix the chart, merge, cut a new patch tag                                                      |
| GitHub Release missing the `.tgz` asset                                                 | `softprops/action-gh-release@v2` step failed but earlier steps passed; re-running the workflow will re-upload | Re-run the workflow from the Actions tab; manually attach the asset only if re-run still fails |
| `cd-subtree-sync.yml` 403                                                               | `SUBTREE_PUSH_TOKEN` expired or its repo-access list drifted (see ADR-M1-027 in `docs/ARCHITECTURE.md`)       | Regenerate the PAT, update the Actions secret, re-run the failed workflow                      |
| `cd-publish.yml` `Cache export is not supported for the docker driver`                  | `docker/setup-buildx-action@v3` step missing from a new matrix leg (see ADR-M1-026)                           | Add the buildx-setup step to the new matrix leg                                                |

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
