# AGENTS.md

## Working Agreement

These rules govern every session. Follow them without exception.


## Key Stages, Documents, and Terms
1. **Project** — The monorepo repository and its system is the project, it shares a common overarching goal and status, and should be mapped to an associated GitHub Project.
2. **Initiative** — A milestone that aims to deliver a new or set of new associated features that expand the system's use cases for its users. Written using `gstack`, and is represented by a design and associated test/eng plans. (Mirrored to GitHub Milestone)
3. **Spec** — An implementation design and plan for delivering a use case feature identified in an Initiative, can be described by a User Story; Written by `superpowers` based on an Initiative's workstream or phase. A Spec may contain one or more Tasks. (Mirrored to GitHub Issue)
4. **Task** — A portion of implementation in a Spec that can be delivered in an atomic Pull Request. One Task = one PR. A Task contains one or more Steps. (Mirrored to GitHub Sub-Issue)
5. **Step** — One checklist item in a Task's `## Steps` section. Each Step ends with a commit. Multiple Steps make up one Task.
6. **Feature** — An implemented feature of the system, the result of completion of one or more Specs.

> **Vocabulary collision warning for agents:** The workflow term `Task` (an atomic-PR-sized unit of work in a Spec) is unrelated to PSYKL's data-model entity `Task` (the `id, user_id, title, created_at` record stored in `service-task`'s database). When writing or reviewing specs and code, disambiguate by context. In doc prose, prefer phrases like *"the PSYKL Task entity"* or *"the `Task` data model"* vs *"a workflow Task"* or *"a PR-sized Task"* when ambiguity could arise.

### Phase-Gating (Default)
## For Planning Designs
- Every document generated for planning or execution should mention the skill used to write it.
- Stop to discuss or confirm Key engineering decisions whenever there are multiple directions for the design
- Stop and request user review of a design (*.md) file before moving onto planning next phase or spec.

## For Execution on Specs
- Complete exactly **one Task** at a time, then STOP and wait for explicit approval
- A step is one checklist item in the active feature doc's `## Steps` section, and ends with a commit.
- Exception: if the active feature doc has `step_gating: false` in its frontmatter,
  complete all steps in the spec before stopping — but still stop at the phase boundary
- Never begin the next spec without starting a new AI assistant session

### Before Implementing Anything

- Identify the current spec and initiative and its position amongst all specs. Something like `Currently on: {Initiative Slug} Spec 4/6 and Task 4/5`
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

- After completing a step, update the corresponding checklist item in the feature doc
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
  3. **Integration** — multi-module interactions within ONE system component: API handler + database, middleware + handler, store + reducer. In-process dependencies are real (in-memory SQLite is fine); external services not yet involved. Also includes Multi UI Component storybook tests.
  4. **Component** — the SYSTEM component tested as a black box against its boundaries.
     - For a service (`service-task`): API contract testing — status codes, response shapes, header enforcement (including the `user_id` default-deny posture).
     - For a UI application (`web_client` PWA, `ios_client` native): drive the UI against mocked / faked / stubbed back-end services. The component is exercised end-to-end within itself, with its dependencies controlled.
  5. **End-to-End (E2E)** — the entire stack running together (the Docker Compose deployment, or its equivalent for native clients), driven by the actual client. **Client-specific tooling**:
     - PWA → browser driver (e.g. Playwright).
     - iOS / iPadOS / macOS native → simulator or real-device driver (e.g. XCUITest or a Swift Testing harness).
     - Future client surfaces use whichever driver matches the platform.

- **Tests live in the same Pull Request as the implementation they cover.** A spec proposing implementation without corresponding tests is a violation of the working agreement and must be rejected at review.
- **Tests must exercise real behavior, not stubs.** Integration tests touch real databases (in-memory SQLite for speed); E2E tests run against the real Docker Compose stack (or equivalent); mocks at Component boundaries are explicit and intentional (services not in the project's control, or back-ends being faked for UI component tests). Mocking core domain logic is a smell.
- **Negative-path tests are required where the design calls for default-deny behavior** (e.g., the `user_id` middleware in Milestone 1 must have Component-layer contract tests proving requests without proper headers are rejected).

### Design Doc Discipline

- **Candidate lists in initiative/design docs are constraints-first, not options-first.** A design doc must NOT pre-narrow framework, tool, or library choices unless those choices were explicitly discussed during the design session. Carry the constraint set; let candidates surface during the answer pass (typically `/plan-eng-review` or spec drafting).
- **Acronyms are defined on first use within a doc**, even if defined elsewhere in the project. Each doc is read independently; the glossary travels with the doc or appears inline.
- **A design doc's Decisions appendix is normative once status is `APPROVED`.** Subsequent skills (`superpowers:writing-plans`, spec authors, executors) MUST treat those decisions as locked. Re-opening a closed decision requires explicit user permission and a new `/plan-eng-review` pass against the affected design doc.
- **A design doc's Spec Breakdown is an authoritative starting suggestion, not a rigid contract.** `superpowers:writing-plans` may adjust grouping or split a Task into multiple Steps, but MUST NOT exceed the ≤10-files-per-PR rule and MUST cover everything the breakdown enumerates.

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

Skill boundaries are STOP points, same as Task boundaries during execution. Never silently transition between `/office-hours` → `/plan-ceo-review` → `/plan-eng-review` → `superpowers:writing-plans`. Each handoff is a conversation.

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
| `docs/superpowers/specs/`                          | Reference examples of well-shaped specs (not active work)                   |
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

- Branch naming: `(feat|bug|infra|chore)/short-description`
- Commit messages: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- NEVER commit directly to `main`; NEVER force push to `main`
- NEVER force push, if necessary STOP and provide command for user to do destructive actions manually with precautions
- Always use a feature branch + pull request
- Every PR must include an updated feature doc in `docs/features/`
- **Hard limit: ≤10 files changed per PR.** Exemptions: `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`. If a spec requires more, split it into multiple
  sequential PRs against the same branch (or stacked branches), each with
  its own atomic scope (e.g., scaffold → implementation → docs/CI). When
  writing a spec or plan, design the merge boundaries to fit this limit
  before drafting steps.

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

```
[{YYYYMMDD}]{ISSUE_REF}_{feature-slug}.md

[20260520]P1_energy-cycle-spec.md          # Planned, no GitHub Issue yet
[20260520]GH12_energy-cycle-spec.md        # GitHub Issue created
```
- `YYYYMMDD`: the date the feature doc was first created (does not change as status moves)
- `ISSUE_REF`: `P{n}` local plan, `GH{n}` only when a manually created GitHub Issue exists
- Status (`TODO` | `IN-PROGRESS` | `DONE` | `BLOCKED`) lives in the doc's frontmatter, **not** in the filename, so files don't need renames as status changes

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
