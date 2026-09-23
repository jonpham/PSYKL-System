# AGENTS.md

## Working Agreement

These rules govern every session. Follow them without exception.

## Key Stages, Documents, and Terms

1. **Project** — The monorepo repository and its system is the project, it shares a common overarching goal and status, and should be mapped to an associated GitHub Project.
2. **Initiative** — A milestone that aims to deliver a new or set of new associated features that expand the system's use cases for its users. Written using `gstack`, and is represented by a design and associated test/eng plans. (Mirrored to GitHub Milestone)
3. **Spec** — An implementation design and plan for delivering a use case feature identified in an Initiative, can be described by a User Story; Written by `superpowers` based on an Initiative's workstream or phase. A Spec may contain one or more DevTasks. (Mirrored to GitHub Issue)
4. **DevTask** — A portion of implementation in a Spec that can be delivered in an atomic Pull Request. One DevTask = one PR. A DevTask contains one or more Steps. (Mirrored to GitHub Sub-Issue)
5. **Step** — One checklist item in a DevTask's `## Steps` section. Each Step ends with a commit. Multiple Steps make up one DevTask.
6. **Feature** — An implemented feature of the system, the result of completion of one or more Specs.

> **Why "DevTask" and not "Task":** PSYKL's data model has an entity literally named `Task` (`id, user_id, title, created_at`). To eliminate the collision between workflow-level vocabulary and product-domain vocabulary, this project uses **DevTask** for the workflow concept (a PR-sized unit of work) and reserves bare `Task` for the PSYKL data-model entity. When you see `Task` in code, schemas, API paths, or PSYKL-domain prose, it means the data record. When you see `DevTask`, it means the workflow concept.

### Phase-Gating (Default)

Heavyweight production work is phase-gated: one DevTask at a time, stop at DevTask and Spec boundaries, wait for explicit approval. The gating rules live in [`docs/workflows/production-dev-workflow.md`](docs/workflows/production-dev-workflow.md). Lightweight work is not phase-gated — it has one review checkpoint instead, before implementation. See Workflow Routing below.

## Workflow Routing

Two workflows, and the lightweight one has two targets. **Pick one before touching code, and say which you are in.**

| Workflow        | Target       | Use when                                                                                                                  | Governed by                                                                                        | Artifacts                                                                                                                                                                        |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lightweight** | `prototype`  | Prototyping a user-facing UI/UX idea whose value is unproven. UI layer only.                                              | [`docs/workflows/lightweight-feature-workflow.md`](docs/workflows/lightweight-feature-workflow.md) | `docs/experiments/{slug}/` — experiment card, plus one `{iteration}/` subfolder per iteration holding feature card, one visual artifact, acceptance checks, implementation notes |
| **Lightweight** | `production` | Shipping a small, decided change to a surface that already exists — a bug fix, a UX refinement, a small feature addition. | [`docs/workflows/lightweight-feature-workflow.md`](docs/workflows/lightweight-feature-workflow.md) | `docs/specs/{initiative}/{YYYYMMDD}-{slug}/` (or `docs/specs/maintenance/`) — the same four artifacts, no experiment card                                                        |
| **Production**  | —            | Shipping a feature that introduces a domain concept, spans components by contract, or needs design review.                | [`docs/workflows/production-dev-workflow.md`](docs/workflows/production-dev-workflow.md)           | Initiative → Spec → DevTask → feature doc                                                                                                                                        |

- **`target = prototype` work lives only in a client's `src/experiment/` tree** and is reachable at `/exp/{experiment-slug}`. No schema, API, or shared-model changes; no edits to production modules beyond the sanctioned seam. An experiment may be iterated: the route and folder stay fixed while successive iterations add features to the same shell, each with its own artifact subfolder. An experiment — or a single iteration of one — ends discarded, paused, or promoted; promotion normally re-enters the Production workflow with that iteration's artifacts as inputs, one iteration mapping to one Spec.
- **`target = production` work is real product code and is reachable by a user the moment it merges.** Its planning is lightweight; **its test floor is not reduced at all** — the full five-layer pyramid applies, TDD ordering included, and every new user-visible behaviour ships with an E2E test in the same PR. A lightweight artifact set is a _folder_ under `docs/specs/`; a heavyweight Spec is a _file_. Lightweight work is never assigned a Spec number.
- **Never assert "UI-only" before reading the code.** If `target = production` work turns out to want a schema migration, a new endpoint, or a shared-model change, stop and bring the proposal to the operator before implementing it. A migration other features will depend on is a signal to escalate to the Production workflow, not to move fast.
- **Neither lightweight target uses a Spec integration branch or a stack of DevTask PRs.** One change, one branch, one PR. Work big enough to want stacking is big enough to escalate.
- **Lightweight work does not bypass this file.** Style ([`docs/STYLE.md`](docs/STYLE.md)), lint, typecheck, commit messages, and Git Conventions apply unchanged under both targets.
- **Apply rigor proportionally, independently of target** — Fast Lane for small reversible changes, Standard Lane for normal user-facing work, High-Rigor Lane for risky or expensive-to-reverse changes. The lane definitions live in the workflow document; do not restate them here.

### Response Style

Optimized for a small terminal window, fast operator scanning, and low review dread. Precedent: PR #70 (83 files, one dump) and the wall-of-text turns leading up to it prompted this section — see `docs/retrospectives/2026-08-28-todo-experience-spec1-pr-size.md`.

- **Hard cap: ≤ 20 lines of prose per response**, excluding required blocks (code, diffs, commit messages, file/command listings, the Step-complete block, tables). If it doesn't fit, cut detail, don't ask permission to run long.
- **Bullets and tables by default, not paragraphs.** A paragraph is a rewrite request unless the content genuinely can't be listed (e.g. a single causal explanation sentence).
- **State the conclusion first, in one line, before the supporting detail.** Root cause, verdict, or recommendation up top — not built up to.
- **Don't re-paraphrase what's already on disk.** Cite `path:line`; don't restate spec/design content the operator can already read.
- Terse — skip preambles and post-step recaps. The `✅ Step N complete` block is the required exception.
- Never add a trailing "here's what I did" summary after completing tool calls.
- Never use an Acronym that you have not defined in the current session, unless the user used it first.

### Commit Messages

- Header describes the feature work only — never mention doc/status updates in the header
- Doc and status updates (`PROJECT_STATUS.md`, feature doc checkmarks) go in body bullets only

### Monorepo-First — Working in `components/` and `packages/`

- Make all changes directly in `components/` and `packages/` inside this monorepo
- The monorepo is the source of truth; upstream repos are deployable mirrors
- After merging to `main`, ensure CI automatically pushes each component subtree to its upstream repo via `git subtree split` + force push
- Never make changes directly in the upstream repos — they will be overwritten on the next monorepo push

### Test Discipline (TDD + Full Test Pyramid)

- **TDD is mandatory.** Order: failing test → implementation → green → refactor. Never the reverse. For user-facing Specs, first commit the intended End-to-End scenario as an inactive Playwright test (`test.skip` / `test.describe.skip`) when behavior does not exist yet, then activate it as implementation lands.
- **Five-layer pyramid, established from M1 and run on every PR in CI** (fastest at base, slowest at top):
  1. **Static Analysis** — lint + format + compile + type-check (TS: ESLint + Prettier + `tsc`; Swift: SwiftLint + swift-format + swiftc). Runs FIRST; failure blocks every other layer.
  2. **Unit** — pure functions, classes, single UI Components in isolation. No I/O, no network.
  3. **Integration** — multi-module interactions within ONE system component (API handler + DB, middleware + handler, store + reducer). In-process deps are real (M1: pglite, per DESIGN.md Decision #8).
  4. **Component** — the system component as a black box against its boundaries. Services: API contract tests (status codes, response shapes, header enforcement including `user_id` default-deny). UI apps: **UI Component tests** drive the application against stubbed back-ends.
  5. **End-to-End** — the full stack (Compose or platform equivalent) driven by the real client. Platform-specific driver (PWA → Playwright; Apple-native → XCUITest / Swift Testing).
- **Tests live in the same PR as the implementation they cover.** Implementation without tests is a working-agreement violation; reject at review.
- **Every new user-visible UI behavior ships with an E2E test in the same PR.** As soon as a behavior can reach a user (which must be assumed the moment the change merges), an End-to-End test documents the expected user story and guards against regression. If the full flow is not yet exercisable (e.g., it needs an offline/multi-device harness that lands later), commit the test **skipped** (`test.skip` / `test.describe.skip`) — or keep the UI off the E2E surface — rather than omitting it. Collapsed to their titles, the E2E tests are the plain-language record of what the client lets a user do; write each `test(...)` title as a user story, not in technical terms.
- **Scope of the E2E mandate: production surfaces only.** Routes under `/exp/*` served from a client's `src/experiment/` tree are excluded — that is, **`target = prototype` work only**. Such an experiment's test floor is one Storybook story exercising the primary acceptance check, plus Unit tests where logic warrants them — no E2E spec and no Integration test. **The carve-out does not extend to `target = production` work**, which is a production surface however lightly it was planned and carries the full mandate. Promoting an experiment restores the full mandate; the promotion DevTask writes the E2E spec.
- **Tests exercise real behavior, not stubs.** Integration tests touch the real in-process DB; E2E tests run the real stack. Component-layer mocks are explicit and intentional (out-of-control services, faked back-ends for UI tests). Mocking core domain logic is a smell.
- **Negative-path tests are required for default-deny behavior** (e.g., `user_id` middleware Component tests proving header-less requests are rejected).

#### Test File Location Convention

Convention applies to every `components/*` and every `packages/*`. One CI glob catches each layer.

| Layer           | Location                                                                                                                                                                           | Pattern                                                                      | Run                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Static Analysis | Per-package root configs (`eslint.config.js`, `prettier.config.js`, `tsconfig.json`)                                                                                               | n/a — all source                                                             | `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check` |
| Unit            | Child `__tests__/` directory under the source boundary or UI Component directory.                                                                                                  | `*.unit.test.{ts,tsx}`                                                       | `pnpm -r test:unit`                                         |
| Integration     | Per-component `tests/integration/` (skipped for packages with no service-level concerns)                                                                                           | `*.integration.test.ts`                                                      | `pnpm -r test:integration`                                  |
| Component       | Child `__tests__/` directory under the source boundary or UI Component directory. UI apps use **Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon`**. | `*.contract.test.ts` (services); `*.stories.tsx` w/ play functions (UI apps) | `pnpm -r test:component`                                    |
| E2E             | Repo-root `e2e/` (Apple-native may use per-component `e2e/` in M3)                                                                                                                 | `*.e2e.spec.ts`                                                              | `pnpm test:e2e`                                             |

Example layout (one tree covers both system components):

```
components/service-task/src/
  task/
    __tests__/
      task.controller.create-list.contract.test.ts ← Component
      task.service.create-list.unit.test.ts        ← Unit
    task.controller.ts
    task.service.ts
  auth/
    __tests__/
      user-id.guard.contract.test.ts       ← Component (negative-path default-deny)
    user-id.guard.ts
components/service-task/tests/integration/
  task-persistence.integration.test.ts     ← Integration
  task-soft-delete.integration.test.ts     ← Integration

components/web_client/src/components/TaskList/
  __tests__/
    TaskList.unit.test.tsx                 ← Unit
    TaskList.stories.tsx                   ← Component (Storybook play function, MSW)
  TaskList.tsx
  index.ts                                 ← re-export
  TaskRow/                                 ← Nesting: child consumed only by TaskList
    __tests__/
      TaskRow.unit.test.tsx
    TaskRow.tsx
    index.ts

e2e/task_list.e2e.spec.ts                  ← E2E
```

#### Test Structure Convention

Mechanical style rules live in [`docs/STYLE.md`](docs/STYLE.md) and are enforced through static analysis where possible.

**API Component tests use Given / When / Then.** Applies to service Unit tests (`*.unit.test.ts`), service Component contract tests (`*.contract.test.ts`), and service Integration tests (`tests/integration/*.integration.test.ts`).

- Put required setup that is not the test-specific condition above `// Given`.
- Put the unique input, state, or condition that drives the assertion below `// Given`.
- Use `// When` for the action under test when a response or result is captured.
- Use `// Then` for assertions.
- Use `// When / Then` for status-only assertions where the request/result and assertion are one fluent chain.
- Prefer route-scoped `describe()` blocks for HTTP contract tests, such as `describe('POST /tasks')`.
- Prefer request helpers and payload builders over repeated raw `supertest` boilerplate.

API Component tests may include short documentation comments when the behavior under test is implemented outside the immediately tested file. These comments are part of the test's documentation role: high-level tests should explain behavior and point readers to the lower-level implementation owner.

Use this form:

```ts
/**
 * Behavior enforced by:
 * components/service-task/src/idempotency/idempotency.interceptor.ts
 */
```

- Prefer one ownership comment per `describe()` block when several tests exercise the same lower-level behavior.
- Reference the responsible file/module.
- Keep comments factual and focused on ownership boundaries.
- Do not comment obvious controller-local behavior.

**UI Component tests use Arrange / Act / Assert.** Applies to UI Component Unit tests (`*.unit.test.tsx`) and Storybook play functions (`*.stories.tsx`).

- `// Arrange` sets up render state, props, handlers, and mocked boundaries.
- `// Act` performs user interaction or lifecycle triggers.
- `// Assert` verifies visible behavior or callback effects.
- Use comments where they improve scanning; avoid comments that merely repeat the next line.

#### UI Component Folder Layout

> "UI Component" = React/SwiftUI/etc. presentation unit inside a system application, distinct from the top-level `components/` directory (e.g., `web_client`, `service-task`).

- Every UI Component gets its own directory from creation: `<Name>.tsx`, child `__tests__/` directory for `*.unit.test.tsx` and `*.stories.tsx`, helpers, styles, and `index.ts` re-export. No flat files in `src/components/`.
- **Nesting rule:** if a UI Component is consumed by exactly one parent, nest it as a subdirectory of that parent (see `TaskRow/` under `TaskList/` in the example above). Promote back up to `src/components/<Name>/` only when a second consumer appears.
- **Root-page exception:** top-level pages / routes (`App.tsx`, `src/pages/*`) may stay flat — they're the application shell with no parent.

### API Decision Discipline

For any API-shaped decision in this project (a service, a client, an integration point), resolve three questions in order before naming a framework:

1. **Paradigm** evaluated against ALL planned downstream clients across all milestones — REST, GraphQL, gRPC, typed-RPC (e.g. tRPC), or hybrid. Disqualify paradigms that lock out planned clients (e.g. TypeScript-only RPC when iOS Swift consumption is on the roadmap).
2. **Spec/schema discipline** — spec-first (write the OpenAPI / GraphQL SDL / .proto first, generate handlers and clients), schema-first (derive runtime validation + types from code-level schema objects), or code-first (handlers first, spec generated as an artifact).
3. **Framework** — only narrow candidates after the above two are decided.

Skipping ahead to a framework recommendation before paradigm + discipline are settled produces throwaway work when iOS or another client surface later finds the chosen wire format inadequate.

---

## Project Overview

**Project Name:** PSYKL-System

**Purpose:** A time-independent planning tool for accomplishing and building / expending (PSY) energy in PSYKL (self-defined period or work (minutes)), Earth (day), Moon (month), HelioArc (season/quarter), Sun (year) cycles.

For those who want to build on their accomplishments to best suit their own needs by using repetition and energy levels rather than standardized hours and periods.

**Type:** Monorepo with Various System Components with individualized Tech Stacks. Component repos are Git Subtrees used as downstream mirrors — the monorepo is the source of truth.

**GitHub Repo:** [jonpham/PSYKL-System](https://github.com/jonpham/PSYKL-System)
**GitHub Project:** [PSYKL-System Project & Roadmap](https://github.com/users/jonpham/projects/6/)
**GitHub Milestones:** [PSYKL-System/milestones](https://github.com/jonpham/PSYKL-System/milestones)

---

## Project Documentation

Docs live in `docs/`:

| Path                                               | Purpose                                                                                                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/PRODUCT.md`                                  | Canonical product brief (premise, differentiator, MVP, future features, surfaces, constraints, milestone roadmap)                                                                                        |
| `docs/PROJECT_STATUS.md`                           | Live status — active initiative / spec / task, locked-in stack, open design surfaces, future review areas                                                                                                |
| `docs/BACKLOG_IDEAS.md`                            | Someday/maybe learning experiments and side-quests outside the milestone roadmap                                                                                                                         |
| `docs/STYLE.md`                                    | Code style preferences and static-tool ownership for rules not fully captured by Prettier                                                                                                                |
| `docs/features/`                                   | Completed features describing system behavior with GitHub issue & PR links                                                                                                                               |
| `docs/initiatives/{initiative}/`                   | gstack initiative planning, discovery, and design review artifacts (DESIGN.md + MILESTONE.md per initiative)                                                                                             |
| `docs/specs/{initiative}/`                         | Active superpowers implementation plans and specs for that initiative                                                                                                                                    |
| `docs/templates/FEATURE.md`                        | Post-implementation feature-summary template                                                                                                                                                             |
| `docs/templates/SPEC.md`                           | Pre-implementation spec template for `superpowers:writing-plans` to write into                                                                                                                           |
| `docs/workflows/`                                  | Workflow definitions — production development workflow, and the lightweight feature workflow with its `prototype` and `production` targets                                                               |
| `docs/experiments/{slug}/`                         | Lightweight `target = prototype` artifacts: experiment card, plus `{iteration}/` subfolders (feature card, visual artifact, acceptance checks, implementation notes). Screenshots stay local for review. |
| `docs/STACK.md`, `ARCHITECTURE.md`, `CHANGELOG.md` | Reference docs                                                                                                                                                                                           |

**No automated GitHub issue sync.** Repo plan docs are source of truth during development; GitHub Issues are written manually when issue tracking is needed. After ship, feature docs are the consolidated record and GitHub releases are the source of truth for released work. gstack outputs land in `docs/initiatives/{initiative}/`; superpowers outputs land in `docs/specs/{initiative}/`; completed Specs become feature docs in `docs/features/` (per File & Status Discipline → Spec close-out checklist).

---

## Code Standards

Code style lives in [`docs/STYLE.md`](docs/STYLE.md). Keep durable style rules there, then enforce them in ESLint or Prettier when practical so agents and non-agent contributors get the same feedback locally and in continuous integration.

### Naming

- **No milestone tokens in codebase filenames or identifiers.** Milestone/initiative labels (`m1`, `m2`, `M3`, …) belong only in planning artifacts under `docs/*` (design docs, spec docs, feature docs, retrospectives) and in doc filenames. Source files, test files (including E2E specs), fixtures, and code identifiers must be named for the behavior or surface they cover, not the milestone that introduced them — behavior outlives the milestone, and a file named `m1-task-crud.e2e.spec.ts` reads as stale the moment M2 changes it. Example: `e2e/task_list.e2e.spec.ts`, not `e2e/m1-task-crud.e2e.spec.ts`.

### Git Conventions

- **Branch naming:** `{tag}` is the initiative's short purpose tag (e.g. `psykl-loop`). Shipped milestones M1/M2 used ordinal tokens (`m1`, `m2`) in their branch names; those names are history and are not rewritten. See `docs/PRODUCT.md` → Milestone Roadmap for why milestones from `psykl-loop` onward are tagged rather than numbered.
  - Spec integration branch: `spec/{tag}-s{M}-{spec-slug}` (e.g., `spec/psykl-loop-s1-cycle-entity`).
  - DevTask branch: `(feat|bug|infra|chore)/{tag}-s{M}-dt{K}-{short-slug}` (e.g., `feat/psykl-loop-s1-dt3-cycle-endpoints`).
  - Initiative planning branch: `feat/plan-{tag}` (e.g., `feat/plan-psykl-loop`); doc-changes only.
- **Spec/DevTask branching workflow (Spec PRs are long-lived integration branches; DevTask PRs are small reviewable units).**
  - At the start of each Spec, create `spec/m{N}-s{M}-{slug}` off `main` and open a **draft PR against `main`**. This is the long-lived Spec PR; it stays open until every DevTask in the Spec has merged into the Spec branch, then the Spec PR is finalized and merged into `main` as the whole-Spec review.
  - Each DevTask branches off the **active Spec integration branch** (not off `main`) **when it has no dependency on unmerged DevTask work**, and opens a PR **targeting that Spec branch** (not `main`). DevTask PRs are where small focused review happens.
  - **Stacking is permitted only when a DevTask depends on another DevTask's unmerged changes.** If DevTask K+1 has a hard ordering dependency on DevTask K and K has not yet merged into the Spec branch, K+1 branches **off K's branch** and opens its PR **targeting K's branch** (the parent DevTask), not the Spec branch. When K merges into the Spec branch, K+1's PR base auto-retargets to the Spec branch (or is manually retargeted). Independent DevTasks remain siblings rooted on the Spec integration branch — do not stack without a real dependency.
  - **Initiative planning branches** (e.g., `feat/plan-m2-pwa-crud-offline`) carry only doc-changes and merge to `main` independently — they are not parented by any Spec branch.
  - **Rebase before opening any PR.** Before opening a PR, fetch the target branch (`git fetch origin <target>`), update its local copy to the latest remote tip, and rebase the working branch onto it (`git rebase origin/<target>`). This applies to every PR type: DevTask PRs rebase onto their parent (Spec integration branch, or parent DevTask branch when stacked); Spec PRs rebase onto `main`; initiative planning PRs rebase onto `main`. Resolve conflicts locally and re-run the relevant test layers before pushing. Force-push to the working branch is permitted here (the branch has no other collaborators) — but only with an explicit refspec per the HARD RULE on `git push` upstream verification, and never against `main` or any branch with other contributors.
- Commit messages: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- NEVER commit directly to `main`; NEVER force push to `main`
- **HARD RULE: never merge any Pull Request without explicit user approval in the current session.** This applies to every Pull Request type, including DevTask Pull Requests into Spec integration branches, Spec integration Pull Requests into `main`, documentation Pull Requests, and cleanup Pull Requests. Commands such as `gh pr merge`, GitHub connector merge actions, and local merge-then-push workflows are forbidden unless the user has explicitly approved that specific merge.
- **HARD RULE: never run plain `git push` after creating or rebasing a branch until its upstream is verified.** Before any push, run `git status --short --branch` and `git rev-parse --abbrev-ref --symbolic-full-name @{u}`. If the upstream is missing, is `origin/main`, or is any branch other than the intended remote branch, do **not** run plain `git push`; instead use an explicit refspec: `git push -u origin HEAD:<intended-branch>`. Mandatory for branches created from remote refs (`origin/main`, `origin/spec/...`) — git inherits the source ref as upstream and a bare push lands on the wrong branch. (Precedent: M1 Spec 3 DT8.)
- NEVER force push to `main` or any feature branch tracked by an open PR. If a force-push seems necessary, STOP and provide the command for the user to run manually with precautions.
- **Exception:** the subtree-sync GitHub Action (per M1 DESIGN.md DevTask 10) force-pushes to the downstream mirror repositories (`jonpham/PSYKL-Client_WEB-PWA` for `components/web_client`, `jonpham/PSYKL-API_Tasks` for `components/service-task`, per M1 DESIGN.md Decision #35) on every merge to `main`. This is the documented exception — mirror repos are downstream-only and the force-push is the canonical pattern for `git subtree split`. No other force-push is permitted.
- Always use a feature branch + pull request
- **A feature doc for work that changed a user-facing surface carries that surface's picture in its `## Visual Record` section** — the planning `visual-artifact.md`, updated to what was built. The planning artifact is deleted at close-out; the feature doc is where the picture lives afterwards. Text-based forms only (ASCII wireframes, Mermaid, state table), since screenshots are never committed. Applies under both workflows; see [`docs/templates/FEATURE.md`](docs/templates/FEATURE.md).
- **Any plan that introduces or changes a user-facing surface writes a `visual-artifact.md` before implementation**, under either workflow — lightweight (in the artifact folder) or production (beside the spec doc). See the workflow documents for the exact paths.
- A feature doc in `docs/features/` is created once **per Spec, not per DevTask** — it consolidates the Spec's outcome and lands with the final DevTask PR of that Spec. Earlier DevTask PRs within the same Spec do NOT need to create or touch a feature doc; they update the spec doc's `## Tasks` checklist instead. The "every PR" rule from older AGENTS.md text is superseded by this per-Spec-completion rule.
- **Per-DevTask-PR file limit: ≤10 production behavior source files.** Applies to DevTask PRs only (Spec PRs aggregate all DevTask diffs and have no limit). Exceeding the limit means split the DevTask (trilemma rule above), siblings off the Spec branch.
- **Counted as "production behavior source files":** `components/*/src/**/*`, `packages/*/src/**/*`, and `e2e/**/*` when the PR changes end-to-end behavior expectations.
- **NOT counted** (excluded from the ≤10): tests (`*.test.*`, `*.spec.*`), package/tooling/config (`package.json`, `tsconfig*.json`, `*.config.ts`, `Dockerfile`, CI workflow YAML), static assets, fixtures, docs (`docs/**`, `README*`, `CHANGELOG*`, `LICENSE*`, `AGENTS.md`, `CLAUDE.md`, `**/*.md`), lockfiles (`pnpm-lock.yaml`, `pnpm-workspace.yaml`), code-generated files (`components/service-task/drizzle/migrations/**` per Decision #13; extend as new generators land), and gitignored files (`openapi.json`, `web_client/src/api/types.ts`, `.pglite-dev/` per Decisions #12, #25). Tests are required in the same PR as the behavior they cover; they're excluded from the numeric limit only to avoid artificial splits.

### Development Workflow

Work from a feature branch in one focused worktree. Read the active feature doc + relevant initiative/spec docs before implementation. At session start/resume, update `docs/PROJECT_STATUS.md` (active spec, skill, current task, next action). Update repo docs in the same PR as the code change. After merge to `main`, `cd-subtree-sync.yml` pushes component subtrees to mirror repos automatically (no manual subtree push needed).

---

## Feature Doc Naming Convention

Lifecycle rules for feature docs live in File & Status Discipline (Spec close-out checklist). This section only documents filename conventions.

**Feature docs (`docs/features/`):** `[{YYYYMMDD}]{ISSUE_REF}_{feature-slug}.md` — e.g., `[20260520]GH2_m1-workspace-bootstrap.md`. Use the template at `docs/templates/FEATURE.md`.

**Spec docs (`docs/specs/{initiative}/`):** `{YYYYMMDD}-Spec{N}-{spec-slug}.md` — e.g., `20260521-Spec1-workspace-bootstrap.md`. `S{N}` matches the initiative DESIGN.md's Spec/DevTask Breakdown numbering. DevTask-level work lives inside the spec doc's `## Tasks` section, not as separate files.

**Universal:** `YYYYMMDD` = doc creation date, never changes. `ISSUE_REF` = `P{n}` (local plan) or `GH{n}` (manually-created GitHub Issue, feature docs only). Status (`TODO` / `IN-PROGRESS` / `DONE` / `BLOCKED`) lives in frontmatter, never in filename — files don't rename as status moves.

---

## Planning Tools

- **gstack** for initiative planning + product/design/architecture review + discovery → outputs in `docs/initiatives/{initiative}/`.
- **superpowers** for implementation planning + execution → outputs in `docs/specs/{initiative}/`.
- Completed Specs become feature docs in `docs/features/` per Spec close-out checklist.
- When creating plans, ask the user's preferred nomenclature (workstreams, phases, steps, tasks, tiers, etc.).

---

## Current Session Context

Read current status and progress from @docs/PROJECT_STATUS.md

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Two skill ecosystems are in use:

- **gstack** — product/design/strategy skills. Examples: `/office-hours` (socratic ideation), `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`, `/plan-devex-review`, `/design-consultation`, `/design-shotgun`, `/autoplan`.
- **superpowers** — implementation/execution skills. Examples: `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:test-driven-development`.

> Not gstack: anything prefixed `gsd-*` (e.g. `/gsd-explore`) is from the **GSD (get-shit-done)** ecosystem and is **not** part of this project's planning routing.

Key routing rules:

- Socratic ideation / "I have an idea, help me think it through" → `/office-hours` (gstack)
- Product ideas and initiative planning → use gstack; write \*.md files under `docs/initiatives/{initiative}/`
- Strategy, scope, architecture, design, and developer-experience review → use gstack plan-review skills; outputs under `docs/initiatives/{initiative}/`
- Implementation planning and design → use superpowers; write specs under `docs/specs/{initiative}/`
