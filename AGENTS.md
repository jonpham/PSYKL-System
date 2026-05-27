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
## For Planning Designs
- Every document generated for planning or execution should mention the skill used to write it.
- Stop to discuss or confirm Key engineering decisions whenever there are multiple directions for the design
- Stop and request user review of a design (*.md) file before moving onto planning next phase or spec.

## For Execution on Specs
- During execution, complete exactly **one DevTask** at a time, then STOP and wait for explicit approval. (Applies AFTER `superpowers:writing-plans` has produced all specs. Does NOT apply during the planning skill itself — that skill writes multiple specs in a single session.)
- A Step is one checklist item in the **active spec doc's `## DevTasks` section** (inside a DevTask block), and ends with a commit. Feature docs (`docs/features/`) do NOT contain Steps — they are post-implementation summaries written once per Spec at the final DevTask's merge.
- Exception: if the active spec doc has `step_gating: false` in its frontmatter,
  complete all Steps within a DevTask before stopping — but still stop at the DevTask boundary
- During execution, never begin the next Spec without starting a new AI assistant session. (Applies AFTER specs are written. Does NOT apply during `superpowers:writing-plans` itself — that skill produces multiple specs in one run.)

### Before Implementing Anything

- Identify the current spec and initiative and its position amongst all specs. Something like `Currently on: {Initiative Slug} Spec 4/6 and DevTask 4/5`
- Review overall design and walk through expected user verification case.
- State your assumptions explicitly
- If a decision has meaningful tradeoffs, present options and ask which to take

### After Every Step

Output the following before stopping:

1. **Changed files** — every file created, modified, or deleted
2. **Assumptions made** — anything not explicitly specified that you decided
3. **Verification commands** — exact commands the engineer should run to confirm the step works locally
4. **Next step** — one sentence describing what comes next, but do NOT execute it

### Response Style

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

### File & Status Discipline

- After completing a Step, update the corresponding checkbox in the active spec doc's `## DevTasks` section (NOT the feature doc — feature docs are written once at Spec completion)
- After completing a spec, update frontmatter: `status`, `branch`, `pr`, `completed_at`
- After completing a spec, summarize changes implemented, significant design decisions, and architectural decisions (ADR) into the spec's associated feature document.
- Commit feature doc changes as part of the same PR as the implementation. CHANGELOG.md should be updated to include a change log for each feature implemented.
- After completing an initiative, scan feature documents created over the course of execution. If feature documents successfully summarize the high-level details of the initiative and its specs, the initiative and spec files can be deleted to minimize document sprawl.

### Workflow Retrospectives

- After completing an initiative, ask the user if there is anything about the AI Agentic development workflow that they would like changed and update this or other documents accordingly.

### Test Discipline (TDD + Full Test Pyramid)

- **Test-Driven Development (TDD = writing failing tests before implementation) is mandatory.** Every spec orders steps as: failing test(s) → implementation → green → refactor. Never the reverse.
- **The full test pyramid is established from Milestone 1 and maintained throughout the project's life.** Five layers, ordered fastest-at-base to slowest-at-top. Every Pull Request runs the full pyramid in CI:

  1. **Static Analysis** — language- and framework-specific tools for linting, formatting, code-style enforcement, compilation, and type-checking. Examples by component: TypeScript components use ESLint + Prettier + `tsc`; Swift components use SwiftLint + swift-format + the Swift compiler; other languages bring their equivalents. Runs FIRST in every Pull Request; failure blocks every other test layer from running.
  2. **Unit** — pure functions, classes, and small UI widgets tested in isolation (e.g. a single React component or a single SwiftUI view). No I/O, no network. Fast.
  3. **Integration** — multi-module interactions within ONE system component: API handler + database, middleware + handler, store + reducer. In-process dependencies are real (in-process pglite in M1, per `docs/initiatives/m1-bootstrap/DESIGN.md` Decision #8); external services not yet involved. Also includes Multi UI Component storybook tests.
  4. **Component** — the SYSTEM component tested as a black box against its boundaries.
     - For a service (`service-task`): API contract testing — status codes, response shapes, header enforcement (including the `user_id` default-deny posture).
     - For a UI application (`web_client` PWA, `ios_client` native): drive the UI against mocked / faked / stubbed back-end services. The component is exercised end-to-end within itself, with its dependencies controlled.
  5. **End-to-End (E2E)** — the entire stack running together (the Docker Compose deployment, or its equivalent for native clients), driven by the actual client. **Client-specific tooling**:
     - PWA → browser driver (e.g. Playwright).
     - iOS / iPadOS / macOS native → simulator or real-device driver (e.g. XCUITest or a Swift Testing harness).
     - Future client surfaces use whichever driver matches the platform.

- **Tests live in the same Pull Request as the implementation they cover.** A spec proposing implementation without corresponding tests is a violation of the working agreement and must be rejected at review.
- **Tests must exercise real behavior, not stubs.** Integration tests touch real databases (in-process pglite in M1; whichever in-process database the active initiative's DESIGN.md selects); E2E tests run against the real Docker Compose stack (or equivalent); mocks at Component boundaries are explicit and intentional (services not in the project's control, or back-ends being faked for UI component tests). Mocking core domain logic is a smell.
- **Negative-path tests are required where the design calls for default-deny behavior** (e.g., the `user_id` middleware in Milestone 1 must have Component-layer contract tests proving requests without proper headers are rejected).

#### Test File Location Convention

Every test file lives in a predictable place so a single CI glob catches each layer cleanly. **Convention applies to every component AND every package under `packages/`**:

| Layer | Location | Filename pattern | Canonical run command |
|-------|----------|------------------|-----------------------|
| Static Analysis | Configured at component or package root (`eslint.config.js`, `prettier.config.js`, `tsconfig.json`, language-specific equivalents). | n/a — runs against all source | `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check` |
| Unit | **Colocated** next to the source it tests, inside `src/`. | `*.unit.test.ts` / `*.unit.test.tsx` | `pnpm -r test:unit` |
| Integration | Per-component, in a top-level `tests/integration/` directory. For packages with no service-level integration concerns (e.g. `packages/shared-types`), this layer is skipped. | `*.integration.test.ts` | `pnpm -r test:integration` |
| Component | **Colocated** next to the boundary it verifies (e.g., contract test next to the controller). For UI applications, use Vitest + Testing Library (the project's default Component-layer toolchain). | `*.contract.test.ts` (services) / `*.component.test.tsx` (UI apps) | `pnpm -r test:component` |
| End-to-End (E2E) | Repo-root `e2e/` directory (web client E2E specs). For Apple-native components arriving in M3, per-component `e2e/` is also acceptable since the driver tooling differs. | `*.e2e.spec.ts` | `pnpm test:e2e` (root-level script) |

Concrete example:

```
components/service-task/
  src/
    task/
      task.controller.ts
      task.controller.contract.test.ts         ← Component (contract)
      task.service.ts
      task.service.unit.test.ts                ← Unit
    auth/
      user-id.guard.ts
      user-id.guard.contract.test.ts           ← Component (negative-path default-deny)
  tests/
    integration/
      task-crud.integration.test.ts            ← Integration

components/web_client/
  src/
    components/
      TaskList.tsx
      TaskList.unit.test.tsx                   ← Unit (UI widget)
      TaskList.component.test.tsx              ← Component (UI driven with stubbed backend)

e2e/
  m1-task-crud.e2e.spec.ts                     ← End-to-End
```

#### Component Folder Nesting Threshold

Default to a flat `src/components/` directory with colocated tests (per the table above). Promote a component to its own folder once it would colocate **≥5 files** (e.g., `.tsx` + `.unit.test.tsx` + `.component.test.tsx` + `.stories.tsx` + a helper or styles module). At that point, move it to `src/components/<ComponentName>/` with a sibling `index.ts` re-export so import paths stay stable. Components with fewer than 5 colocated files stay flat. The threshold balances "too many files in one directory" against "too many nested directories."

### Design Doc Discipline

- **Candidate lists in initiative/design docs are constraints-first, not options-first.** A design doc must NOT pre-narrow framework, tool, or library choices unless those choices were explicitly discussed during the design session. Carry the constraint set; let candidates surface during the answer pass (typically `/plan-eng-review` or spec drafting).
- **Acronyms are defined on first use within a doc**, even if defined elsewhere in the project. Each doc is read independently; the glossary travels with the doc or appears inline.
- **A design doc's Decisions appendix is normative once status is `APPROVED`.** Subsequent skills (`superpowers:writing-plans`, spec authors, executors) MUST treat those decisions as locked. Re-opening a closed decision requires explicit user permission and a new `/plan-eng-review` pass against the affected design doc.
- **A design doc's Spec / DevTask Breakdown is an authoritative starting suggestion, not a rigid contract.** `superpowers:writing-plans` may adjust DevTask grouping, split a DevTask into more DevTasks, or split a DevTask into multiple Steps — but MUST cover everything the breakdown enumerates and MUST honor the trilemma resolution rule below.
- **Trilemma resolution (≤10 production behavior source files per DevTask PR vs tests-in-same-PR vs DevTask count):** When three constraints collide, prefer **(C) splitting DevTasks** over (A) bending the ≤10 production-behavior-source-file rule, and never give on (B) tests-in-same-PR. A design doc's DevTask count is a target, not a ceiling. If a planned DevTask needs >10 production behavior source files, split it. Do not split merely because required tests, configuration, documentation, assets, generated files, or lockfile changes push the total Pull Request diff above 10 files. The Test-Driven Development (TDD) discipline is sacred. The file-count rule applies to DevTask Pull Requests only; Spec integration Pull Requests aggregate all DevTask diffs and have no file limit (see Git Conventions -> Spec/DevTask branching workflow).

### API Decision Discipline

For any API-shaped decision in this project (a service, a client, an integration point), resolve three questions in order before naming a framework:

1. **Paradigm** evaluated against ALL planned downstream clients across all milestones — REST, GraphQL, gRPC, typed-RPC (e.g. tRPC), or hybrid. Disqualify paradigms that lock out planned clients (e.g. TypeScript-only RPC when iOS Swift consumption is on the roadmap).
2. **Spec/schema discipline** — spec-first (write the OpenAPI / GraphQL SDL / .proto first, generate handlers and clients), schema-first (derive runtime validation + types from code-level schema objects), or code-first (handlers first, spec generated as an artifact).
3. **Framework** — only narrow candidates after the above two are decided.

Skipping ahead to a framework recommendation before paradigm + discipline are settled produces throwaway work when iOS or another client surface later finds the chosen wire format inadequate.

### Plan Review Scoping

`/plan-eng-review`, `/plan-design-review`, and `/plan-devex-review` are built for **spec-sized** plans (single PR, single feature). When invoked against a **milestone-sized** initiative design doc (a `/office-hours` output spanning multiple Specs and ~50+ files):

- Narrow the review to architectural decisions still open at the design level (e.g., the doc's "Open Questions" or "Decisions Pending" section).
- Skip Sections 2 (Code Quality) and 4 (Performance) on zero-code design docs.
- Skip Section 3 (Test Review) unless the test strategy itself is contested.
- Run a fresh `/plan-eng-review` per Spec AFTER `superpowers:writing-plans` produces the spec docs, where the skill's full structure naturally fits.

State the scoping decision up front before walking any review section so the user can correct if the skill is the wrong fit.

---

## Skill Transition Discipline

These rules govern how agents move between skills (`/office-hours`, `/plan-eng-review`, `superpowers:writing-plans`, etc.) during a session.

### Pause between skill transitions

At the close of every skill workflow, STOP. Do not auto-invoke or auto-suggest the next skill mid-flow. Instead:

1. Surface that the skill is finishing and what its last produced artifact is (path + 1-line summary).
2. Offer a retrospective beat — what worked, what didn't, anything to refine in AGENTS.md or the working agreement before continuing.
3. Suggest which skill is appropriate next, justified by AGENTS.md routing rules and the current project state — but wait for the user to say "go" before invoking it.

Skill boundaries are STOP points, same as DevTask boundaries during execution. Never silently transition between `/office-hours` → `/plan-ceo-review` → `/plan-eng-review` → `superpowers:writing-plans`. Each handoff is a conversation.

### Right tool for the job beats stretching

When recommending the next step, evaluate tool fit on its own merits. Do NOT treat "this would invoke a new skill" as a con if that skill is genuinely the right tool for the task. The pause rule above is about transparency and retrospective, not about avoiding skill transitions when warranted. Recommend the structured workflow that best matches the work — `/plan-eng-review` for architecture lock-in, `/plan-devex-review` for onboarding, `superpowers:writing-plans` for spec breakdown — instead of trying to keep work inside the currently-loaded skill.

### Commit artifacts after every skill workflow

At the close of every skill workflow, commit all documents and artifacts produced or modified during that workflow as ONE atomic commit before suggesting the next skill.

- Run `git status` and stage every new/modified file produced by the workflow.
- Group all skill outputs into one commit. Don't split into per-file commits.
- Subject describes the artifact (e.g., `docs(office-hours): M1 bootstrap initiative design`); body lists every file changed with a one-line "why".
- Follow Conventional Commits per the Git Conventions section.
- After committing, mention the commit hash in the close-out summary.
- Confirm before pushing — committing is local-and-safe; pushing is a separate action that needs explicit user approval.

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

| Path                                               | Purpose                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `docs/PRODUCT.md`                                  | Canonical product brief (premise, differentiator, MVP, future features, surfaces, constraints, milestone roadmap) |
| `docs/PROJECT_STATUS.md`                           | Live status — active initiative / spec / task, locked-in stack, open design surfaces, future review areas |
| `docs/BACKLOG_IDEAS.md`                            | Someday/maybe learning experiments and side-quests outside the milestone roadmap |
| `docs/features/`                                   | Completed features describing system behavior with GitHub issue & PR links  |
| `docs/initiatives/{initiative}/`                   | gstack initiative planning, discovery, and design review artifacts (DESIGN.md + MILESTONE.md per initiative) |
| `docs/specs/{initiative}/`                         | Active superpowers implementation plans and specs for that initiative       |
| `docs/templates/FEATURE.md`                        | Post-implementation feature-summary template                                |
| `docs/templates/SPEC.md`                           | Pre-implementation spec template for `superpowers:writing-plans` to write into |
| `docs/STACK.md`, `ARCHITECTURE.md`, `CHANGELOG.md` | Reference docs                                                              |

**No automated GitHub issue sync.** Repository plan documents are the source of truth during development. GitHub Issues may be written manually from planning outputs and referenced as part of feature completion and document consolidation. After development, feature docs represent consolidated plan documents while GitHub becomes the source of truth for released work.

- Use gstack for initiative planning and store outputs in `docs/initiatives/{initiative}/`
- Use superpowers for implementation planning and store outputs in `docs/specs/{initiative}/`
- After merged changes complete the tasks defined by a spec implementation plan, move that spec file from `docs/specs/{initiative}/` to `docs/features/` to signal completion/history.
- Manual task after planning: write or update GitHub Issues from the accepted initiative/spec documents when issue tracking is needed
- GitHub Project Milestones and Issues will be used for project tracking while repository documents for initiatives and specs will be used for execution.

---

## Code Standards

### Git Conventions

- **Branch naming:**
  - Spec integration branch: `spec/m{N}-s{M}-{spec-slug}` (e.g., `spec/m1-s2-service-task-minimal-api`).
  - DevTask branch: `(feat|bug|infra|chore)/m{N}-s{M}-dt{K}-{short-slug}` (e.g., `feat/m1-s2-dt3-nestjs-handlers`).
  - Initiative planning branch: `feat/plan-{initiative-slug}` (e.g., `feat/plan-m2-pwa-crud-offline`); doc-changes only.
- **Spec/DevTask branching workflow (Spec PRs are long-lived integration branches; DevTask PRs are small reviewable units).**
  - At the start of each Spec, create `spec/m{N}-s{M}-{slug}` off `main` and open a **draft PR against `main`**. This is the long-lived Spec PR; it stays open until every DevTask in the Spec has merged into the Spec branch, then the Spec PR is finalized and merged into `main` as the whole-Spec review.
  - Each DevTask branches off the **active Spec integration branch** (not off `main`) and opens a PR **targeting that Spec branch** (not `main`). DevTask PRs are where small focused review happens.
  - **No stacking of DevTask branches on prior DevTask branches.** All DevTasks within a Spec are siblings rooted on the Spec integration branch. If DevTask K+1 has a hard ordering dependency on DevTask K, K+1's branch waits for K to merge into the Spec branch before being opened.
  - **Initiative planning branches** (e.g., `feat/plan-m2-pwa-crud-offline`) carry only doc-changes and merge to `main` independently — they are not parented by any Spec branch.
- Commit messages: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- NEVER commit directly to `main`; NEVER force push to `main`
- **HARD RULE: never merge any Pull Request without explicit user approval in the current session.** This applies to every Pull Request type, including DevTask Pull Requests into Spec integration branches, Spec integration Pull Requests into `main`, documentation Pull Requests, and cleanup Pull Requests. Commands such as `gh pr merge`, GitHub connector merge actions, and local merge-then-push workflows are forbidden unless the user has explicitly approved that specific merge.
- **HARD RULE: never run plain `git push` after creating or rebasing a branch until its upstream is verified.** Before any push, run `git status --short --branch` and `git rev-parse --abbrev-ref --symbolic-full-name @{u}`. If the upstream is missing, is `origin/main`, or is any branch other than the intended remote branch, do **not** run plain `git push`; instead use an explicit refspec: `git push -u origin HEAD:<intended-branch>`. This is mandatory for branches created from remote refs such as `origin/main` or `origin/spec/...`, because Git may inherit the remote ref as the upstream and accidentally push commits to the wrong branch.
- NEVER force push to `main` or any feature branch tracked by an open PR. If a force-push seems necessary, STOP and provide the command for the user to run manually with precautions.
- **Exception:** the subtree-sync GitHub Action (per M1 DESIGN.md DevTask 10) force-pushes to the downstream mirror repositories (`jonpham/psykl-{web_client,service-task}`) on every merge to `main`. This is the documented exception — mirror repos are downstream-only and the force-push is the canonical pattern for `git subtree split`. No other force-push is permitted.
- Always use a feature branch + pull request
- A feature doc in `docs/features/` is created once **per Spec, not per DevTask** — it consolidates the Spec's outcome and lands with the final DevTask PR of that Spec. Earlier DevTask PRs within the same Spec do NOT need to create or touch a feature doc; they update the spec doc's `## Tasks` checklist instead. The "every PR" rule from older AGENTS.md text is superseded by this per-Spec-completion rule.
- **Per-DevTask-PR file limit: ≤10 production behavior source files.** Applies to DevTask Pull Requests (the small reviewable units targeting a Spec branch), NOT to Spec Pull Requests (which aggregate all DevTask diffs and carry no file limit — they are the whole-Spec integration review). The purpose is small focused review per DevTask. When a planned DevTask exceeds the limit, split it into multiple sequential DevTasks (trilemma rule above), each on its own sibling branch off the Spec branch.
- **Files excluded from the ≤10 count:**
  - **Lockfiles** — `pnpm-lock.yaml`, `pnpm-workspace.yaml`.
  - **Documentation files** — anything matching `docs/**`, top-level `README*`, `CHANGELOG*`, `LICENSE*`, `AGENTS.md`, `CLAUDE.md`, and any `**/*.md` accompanying source.
  - **Code-generated files on these paths** (extend this list as new generators land):
    - `components/service-task/drizzle/migrations/**` — drizzle-kit output, checked into git for replay (per M1 Decision #13).
  - **Gitignored files** never appear in PR diffs so do not need an exemption entry (this covers `components/service-task/openapi.json`, `components/web_client/src/api/types.ts`, and the `.pglite-dev/` dev data directory, per M1 Decision #12 and #25).
- **What "production behavior source files" means in practice.** Count only source files whose production code can change runtime application behavior:
  - `components/*/src/**/*`
  - `packages/*/src/**/*`
  - `e2e/**/*` when the Pull Request changes end-to-end product behavior expectations

  Do not count tests (`*.test.*`, `*.spec.*`), package/tooling/config files (`package.json`, `tsconfig*.json`, `*.config.ts`, `Dockerfile`, Continuous Integration workflow YAML), static assets, icons, fixtures, seed/data files, documentation, lockfiles, generated files, or gitignored files. Tests remain required in the same Pull Request as the behavior they cover; they are excluded from the numeric file limit only to avoid artificial splits.

### Mono Repo Structure

- System components and applications in `components/` are downstream mirror repositories
- `docs` directories contains archived feature documents and current initiatives and specs. docs root contains project details

### Development Workflow

Always work from a feature branch and one focused worktree. Read the active feature doc and any matching initiative/spec docs before implementation. When development starts or resumes, update `docs/PROJECT_STATUS.md` with the active spec, the skill being used, the current task, and the next action for that task or the next task. Update repository docs in the same PR as the code change.

After merging to `main`, the `sync-subtrees-push.yml` workflow automatically pushes changed app subtrees to their upstream repos. No manual subtree push is needed.

---

## Feature Docs
_Rules for writing and updating feature documents that summarize what has been completed in the repository_

- After execution of a spec, check whether a feature document has been created to summarize changes.
- If one does not exist, create one using the [template](docs/templates/FEATURE.md) as an example
- If one exists, expand on the feature to include whats changed in the process of executing on a completed spec.
- If the completed spec is the last expected change of an initiative, review the feature doc against the initiative document and its associated spec documents to ensure all important high-level information has been captured
- Afterwards, if the consolidated feature docs fully capture the initiative's outcomes, delete the now-redundant initiative and spec files to minimize doc sprawl (see the rule in "Project Documentation" above)

### Naming Convention

**Feature docs (`docs/features/`):**
```
[{YYYYMMDD}]{Milestone-ID}_{feature-slug}.md

[20260520]m1_energy-cycle-spec.md
```

**Spec docs (`docs/specs/{initiative}/`):**
```
{YYYYMMDD}-Spec{N}-{spec-slug}.md

20260521-Spec1-workspace-bootstrap.md         # Spec 1 of the initiative
20260521-Spec2-service-task-minimal-api.md    # Spec 2 of the initiative
```
- `YYYYMMDD`: spec creation date (does not change)
- `S{N}`: Spec number within the parent initiative, matching the initiative's DESIGN.md Spec/DevTask Breakdown table.
- `spec-slug`: kebab-case slug derived from the Spec's User Story / title.
- DevTask-level work is tracked inside the spec doc's `## Tasks` section (one heading per DevTask), not as separate spec files.

**Universal rules:**
- `YYYYMMDD`: the date the doc was first created (does not change as status moves).
- `ISSUE_REF`: `P{n}` local plan, `GH{n}` only when a manually created GitHub Issue exists (feature docs only).
- Status (`TODO` | `IN-PROGRESS` | `DONE` | `BLOCKED`) lives in the doc's frontmatter, **not** in the filename, so files don't need renames as status changes.

---

## Planning Tools

Use gstack for initiative planning, product/design/architecture review, and discovery. Store retained gstack artifacts under `docs/initiatives/{initiative}/`.

Use superpowers for implementation planning and execution plans. Store retained superpowers plans/specs under `docs/specs/{initiative}/`.

When a spec's implementation tasks are completed and merged, move the completed spec to `docs/features/` as the completion record.

- When creating plans, ask what nomenclature the user would like to use with regards to workstreams, phases, steps, tasks, tiers, etc.

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
- Product ideas and initiative planning → use gstack; write *.md files under `docs/initiatives/{initiative}/`
- Strategy, scope, architecture, design, and developer-experience review → use gstack plan-review skills; outputs under `docs/initiatives/{initiative}/`
- Implementation planning and design → use superpowers; write specs under `docs/specs/{initiative}/`
