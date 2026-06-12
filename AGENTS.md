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
- Stop and request user review of a design (\*.md) file before moving onto planning next phase or spec.

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
- **Spec integration PRs must include close-out work before they merge to `main`.** The final Spec integration PR is not complete until it carries the feature doc, durable-doc refreshes, status handoff, and obsolete per-Spec artifact deletions. Do not defer close-out docs to a follow-up branch after the Spec PR merges; the next Spec should be startable from `main` without revisiting the previous Spec.
- **`superpowers:finishing-a-development-branch` does not bypass Spec close-out.** In PSYKL, the final DevTask branch of a Spec is not "implementation complete" until the close-out work above is committed on that same branch. When using `superpowers:finishing-a-development-branch` for the final DevTask in a Spec, complete the feature doc, durable-doc refreshes, `PROJECT_STATUS.md` handoff, and obsolete artifact deletions before marking the PR ready for review or telling the user the branch is ready to merge.
- Commit feature doc changes as part of the same PR as the implementation. CHANGELOG.md should be updated to include a change log for each feature implemented.
- **At Spec close-out, consolidate AND delete the per-Spec issue brief and execution-plan spec.** The per-Spec feature doc under `docs/features/` is the consolidated record; `docs/initiatives/{initiative}/issues/{spec-brief}.md` and `docs/specs/{initiative}/{spec}.md` are deleted in the Spec integration PR before it merges. (The initiative-level docs and design docs are deleted later at initiative close-out per the next rule.)
- After completing an initiative, scan feature documents created over the course of execution. If feature documents successfully summarize the high-level details of the initiative and its specs, the initiative-level docs (`DESIGN.md`, `MILESTONE.md`, remaining issue briefs) can be deleted to minimize document sprawl. Retrospectives at `docs/retrospectives/` are durable and stay across initiative close-outs.
- **`honors_decisions:` frontmatter must be refreshed on decision re-open.** When a Decisions-appendix entry referenced in any spec doc's `honors_decisions:` is re-opened (rewritten, deprecated, or superseded by a new decision), every spec doc that referenced it must add the new decision number in the same PR that lands the re-open.
- **Durable docs are refreshed in the Spec integration PR at Spec close-out.** Every Spec integration PR refreshes the following when applicable before merging to `main`: `README.md` script tables (if scripts changed); `docs/STACK.md` (if the stack table changed); `docs/ARCHITECTURE.md` (if the Spec shipped a new component or ADRs); `CHANGELOG.md` (always — one entry per Spec, and merged Specs must move out of `Unreleased` into a dated shipped/released section); `docs/PROJECT_STATUS.md` (always — last completed Spec points to the feature doc, current execution is `N/A`, and the next executable Spec is named).
- **Procedure docs (release, deploy, runbooks) live in `README.md` from the start.** Feature docs and spec docs reference `README.md` sections by anchor; never duplicate procedural content.
- **Parent worktree sync at Spec integration PR merge.** After the Spec integration PR merges to `main`, fast-forward the parent worktree's `main` to `origin/main`. Reminder, not an enforcement gate.
- **CHANGELOG release-dating convention at tag cut.** At release tag cut, the per-Spec dated sections are preserved as the historical ship record. A new `## [X.Y.Z] - YYYY-MM-DD` heading is added above them as the release marker — NOT consolidated. Release-marker line is agent-written at tag cut; operator approves the PR that lands it.
- **Spec close-out completeness checklist** (walk before marking the Spec integration PR ready):
  1. Feature doc at `docs/features/[{YYYYMMDD}]{ISSUE_REF}_{slug}.md` consolidates issue brief + execution plan.
  2. Issue brief deleted (`docs/initiatives/{initiative}/issues/{slug}.md`).
  3. Execution plan deleted (`docs/specs/{initiative}/{slug}.md`).
  4. Companion docs with `deleted_at_spec_closeout: true` frontmatter deleted; content folded into feature doc or `README.md`.
  5. Durable docs refreshed: `README.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `docs/PROJECT_STATUS.md`.
  6. `honors_decisions:` frontmatter refreshed on every spec doc touched by a decision re-open.
  7. `grep -r` durable docs for references to deleted planning files; update or comment as intentional.
  8. If the Spec ships a new GitHub Actions workflow, the first run on the merge-to-`main` commit MUST show `conclusion: success`. Failed first runs → post-merge fixup PRs + ADR operational footnotes (precedent: ADR-M1-026, ADR-M1-027). Spec PR description carries a pending-verification checkbox.
  9. Parent worktree `main` fast-forwarded.
  10. Merged DevTask + Spec branches deleted locally and remotely.
- **Initiative close-out completeness checklist:**
  1. Spec feature docs cover every DESIGN.md decision (via "Design Decisions" sections or `docs/ARCHITECTURE.md` ADRs).
  2. `docs/initiatives/{initiative}/{DESIGN.md, MILESTONE.md}` deleted; `issues/` directory deleted.
  3. Initiative retrospective at `docs/retrospectives/{YYYY-MM-DD}-{initiative-slug}.md`.
  4. `docs/PROJECT_STATUS.md`: last-completed-initiative + next-executable-initiative; active fields = N/A.
  5. Release tag cut per `README.md` → Release.
  6. `feat/plan-{next-initiative-slug}` parking branch exists.

### Workflow Retrospectives

- After completing an initiative, ask the user if there is anything about the AI Agentic development workflow that they would like changed and update this or other documents accordingly.
- **Per-Spec retrospectives are optional but recommended** whenever a Spec surfaced friction worth recording (worktree pollution, locked-decision re-opens, tooling swaps, branch-tracking traps, etc.). Land them at `docs/retrospectives/{YYYY-MM-DD}-{spec-slug}.md` with the per-spec PRs enumerated in frontmatter and a "Proposed AGENTS.md changes" section if applicable. Initiative-level retrospectives also land in `docs/retrospectives/{YYYY-MM-DD}-{initiative-slug}.md` at initiative close-out per the rule above.

### Subagent-Driven Development Discipline

When invoking `superpowers:subagent-driven-development` or dispatching long-lived subagents via the `Agent` tool:

- **Always use `Agent isolation: "worktree"` for implementer subagents.** Without it, the subagent runs in the controller's working tree and can switch the branch out from under the user. Reviewer subagents (read-only) can skip isolation.
- **Pre-tune `.claude/settings.json` before the first subagent dispatch.** Run `/fewer-permission-prompts` to add common read-only patterns to the project-shared allowlist; subagents inherit the parent's permission mode and uninstrumented commands flood the user with prompts. Project-shared `.claude/settings.json` (NOT `settings.local.json`) so the allowlist applies to every contributor's subagent runs.
- **Watch token budgets.** Each implementer + 2-stage reviewer cycle can run 50k–100k tokens per task. If the user issues a token-conservation warning, pause and create a handoff doc (see Per-Spec retrospective format) before dispatching more subagents.
- **Order: sequential by default; parallel only when truly independent.** The skill's two-stage review (spec compliance → code quality) is forbidden to run before the implementer finishes; if multiple DevTasks are truly independent (no shared base mutations, no shared files), they can run in parallel via multiple `Agent` calls in one message.

### Test Discipline (TDD + Full Test Pyramid)

- **TDD is mandatory.** Order: failing test → implementation → green → refactor. Never the reverse. For user-facing Specs, first commit the intended End-to-End scenario as an inactive Playwright test (`test.skip` / `test.describe.skip`) when behavior does not exist yet, then activate it as implementation lands.
- **Five-layer pyramid, established from M1 and run on every PR in CI** (fastest at base, slowest at top):
  1. **Static Analysis** — lint + format + compile + type-check (TS: ESLint + Prettier + `tsc`; Swift: SwiftLint + swift-format + swiftc). Runs FIRST; failure blocks every other layer.
  2. **Unit** — pure functions, classes, single UI Components in isolation. No I/O, no network.
  3. **Integration** — multi-module interactions within ONE system component (API handler + DB, middleware + handler, store + reducer). In-process deps are real (M1: pglite, per DESIGN.md Decision #8).
  4. **Component** — the system component as a black box against its boundaries. Services: API contract tests (status codes, response shapes, header enforcement including `user_id` default-deny). UI apps: **UI Component tests** drive the application against stubbed back-ends.
  5. **End-to-End** — the full stack (Compose or platform equivalent) driven by the real client. Platform-specific driver (PWA → Playwright; Apple-native → XCUITest / Swift Testing).
- **Tests live in the same PR as the implementation they cover.** Implementation without tests is a working-agreement violation; reject at review.
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

e2e/m1-task-crud.e2e.spec.ts               ← E2E
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

### Design Doc Discipline

- **Candidate lists in initiative/design docs are constraints-first, not options-first.** A design doc must NOT pre-narrow framework, tool, or library choices unless those choices were explicitly discussed during the design session. Carry the constraint set; let candidates surface during the answer pass (typically `/plan-eng-review` or spec drafting).
- **Acronyms are defined on first use within a doc**, even if defined elsewhere in the project. Each doc is read independently; the glossary travels with the doc or appears inline.
- **A design doc's Decisions appendix is normative once status is `APPROVED`.** Subsequent skills (`superpowers:writing-plans`, spec authors, executors) MUST treat those decisions as locked. Re-opening a closed decision requires explicit user permission.
  - **Wide-scope re-open** (changes that ripple through multiple Specs, alter the test pyramid taxonomy, or change a cross-component contract): requires a new `/plan-eng-review` pass against the affected design doc before the re-open lands.
  - **Narrow-scope re-open** (a contained tooling swap or toolchain replacement within one Spec, no contract change, no cross-component effect): may use the lighter ceremony — rewrite the original decision in place, add a new decision with explicit rationale and a back-link to the original decision number, and propagate the change through every doc that references the old decision number (including AGENTS.md sections and spec doc `honors_decisions:` frontmatter). No `/plan-eng-review` pass required. The bar for "narrow scope" is conservative: when in doubt, take the wide-scope path.
- **A design doc's Spec / DevTask Breakdown is an authoritative starting suggestion, not a rigid contract.** `superpowers:writing-plans` may adjust DevTask grouping, split a DevTask into more DevTasks, or split a DevTask into multiple Steps — but MUST cover everything the breakdown enumerates and MUST honor the trilemma resolution rule below.
- **Trilemma resolution (≤10 production behavior source files per DevTask PR vs tests-in-same-PR vs DevTask count):** When three constraints collide, prefer **(C) splitting DevTasks** over (A) bending the ≤10 production-behavior-source-file rule, and never give on (B) tests-in-same-PR. A design doc's DevTask count is a target, not a ceiling. If a planned DevTask needs >10 production behavior source files, split it. Do not split merely because required tests, configuration, documentation, assets, generated files, or lockfile changes push the total Pull Request diff above 10 files. The Test-Driven Development (TDD) discipline is sacred. The file-count rule applies to DevTask Pull Requests only; Spec integration Pull Requests aggregate all DevTask diffs and have no file limit (see Git Conventions -> Spec/DevTask branching workflow).
- **External-resource naming confirmation before plan finalization.** Any decision that names an out-of-code resource (mirror repos, image registries, secret names, GitHub Actions secrets, cloud project IDs, domain names, external API endpoints, third-party account identifiers) must be confirmed against the actual-created resource with the user before the plan's status flips to `APPROVED`. Required form: "Decision #N names `{resource}`. Has this resource been created yet, and if so, what is its actual name?" Discovered-divergence at execution time triggers a narrow-scope re-open (precedent: Decision #16 → #35).

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

**HARD RULE: at any skill's documented implementation-complete boundary, the agent MUST surface the transition explicitly and STOP for user approval before invoking the next skill — even when the source skill names the next skill as a "required sub-skill".** Required form:

> "I am about to transition from `{current-skill}` to `{next-skill}` because `{reason — usually a quote from the current skill's own instructions}`. Confirm?"

Auto-transition without the explicit "Confirm?" prompt is forbidden. Examples of boundaries: `superpowers:executing-plans` Step 3 → `superpowers:finishing-a-development-branch`; `superpowers:writing-plans` → `superpowers:executing-plans`; `/office-hours` → `/plan-*-review`; `/plan-eng-review` → `superpowers:writing-plans`.

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

| Path                                               | Purpose                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `docs/PRODUCT.md`                                  | Canonical product brief (premise, differentiator, MVP, future features, surfaces, constraints, milestone roadmap) |
| `docs/PROJECT_STATUS.md`                           | Live status — active initiative / spec / task, locked-in stack, open design surfaces, future review areas         |
| `docs/BACKLOG_IDEAS.md`                            | Someday/maybe learning experiments and side-quests outside the milestone roadmap                                  |
| `docs/STYLE.md`                                    | Code style preferences and static-tool ownership for rules not fully captured by Prettier                         |
| `docs/features/`                                   | Completed features describing system behavior with GitHub issue & PR links                                        |
| `docs/initiatives/{initiative}/`                   | gstack initiative planning, discovery, and design review artifacts (DESIGN.md + MILESTONE.md per initiative)      |
| `docs/specs/{initiative}/`                         | Active superpowers implementation plans and specs for that initiative                                             |
| `docs/templates/FEATURE.md`                        | Post-implementation feature-summary template                                                                      |
| `docs/templates/SPEC.md`                           | Pre-implementation spec template for `superpowers:writing-plans` to write into                                    |
| `docs/STACK.md`, `ARCHITECTURE.md`, `CHANGELOG.md` | Reference docs                                                                                                    |

**No automated GitHub issue sync.** Repo plan docs are source of truth during development; GitHub Issues are written manually when issue tracking is needed. After ship, feature docs are the consolidated record and GitHub releases are the source of truth for released work. gstack outputs land in `docs/initiatives/{initiative}/`; superpowers outputs land in `docs/specs/{initiative}/`; completed Specs become feature docs in `docs/features/` (per File & Status Discipline → Spec close-out checklist).

---

## Code Standards

Code style lives in [`docs/STYLE.md`](docs/STYLE.md). Keep durable style rules there, then enforce them in ESLint or Prettier when practical so agents and non-agent contributors get the same feedback locally and in continuous integration.

### Git Conventions

- **Branch naming:**
  - Spec integration branch: `spec/m{N}-s{M}-{spec-slug}` (e.g., `spec/m1-s2-service-task-minimal-api`).
  - DevTask branch: `(feat|bug|infra|chore)/m{N}-s{M}-dt{K}-{short-slug}` (e.g., `feat/m1-s2-dt3-nestjs-handlers`).
  - Initiative planning branch: `feat/plan-{initiative-slug}` (e.g., `feat/plan-m2-pwa-crud-offline`); doc-changes only.
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
