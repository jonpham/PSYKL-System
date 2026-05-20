# AGENTS.md

## Working Agreement

These rules govern every session. Follow them without exception.


## Key Stages, Documents, and Terms
1. Project - The monorepo repository and its system is the project, it shares a common overarching goal and status, and should be mapped to an associated GitHub Project.
2. Initiative - A milestone that aims to deliver a new or set of new associated features that expand the system's use cases for its users. Written using `gstack`, and is represented by a design and associated test/eng plans. (Mirrored to Github Milestone)
3. Spec - An implementation design and plan for delivering a use case feature identified in an Initiative, can be described by a User Story; Written by `superpowers` based on an Initiative's workstream or phase. (Mirrored to Github Issue)
4. Task - A portion of implementation in a spec that can be delivered in an atomic Pull Request. (Mirrored to Github Sub-Issue)
5. Feature - an implemented feature of the system, the result of completion of one or more specs.

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
| `docs/features/`                                   | Completed features describing system behavior with GitHub issue & PR links  |
| `docs/initiatives/{initiative}/`                   | gstack initiative planning, discovery, and design review artifacts          |
| `docs/specs/{initiative}/`                         | Active superpowers implementation plans and specs for that initiative       |
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
