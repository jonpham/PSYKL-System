# Production Development Workflow

> The heavyweight lane. Use it when shipping a decided feature into the product.
> For prototyping an unproven UI/UX idea, or for shipping a small decided change to a surface that already exists, use [`lightweight-feature-workflow.md`](lightweight-feature-workflow.md) instead — `target = prototype` and `target = production` respectively.
> Lane selection is documented in [`AGENTS.md`](../../AGENTS.md) → Workflow Routing.

This document holds the Initiative → Spec → DevTask → Step ceremony: planning, execution
gating, file and status discipline, subagent dispatch, design-doc rules, and skill transitions.
It was extracted verbatim from `AGENTS.md` so that the always-loaded working agreement stays
small; the rules themselves are unchanged and remain binding for all production work.

`AGENTS.md` remains authoritative for everything that applies to **both** lanes — vocabulary,
response style, commit messages, Test Discipline, Code Standards, and Git Conventions.
Nothing here overrides it.

---

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

### File & Status Discipline

- After completing a Step, update the corresponding checkbox in the active spec doc's `## DevTasks` section (NOT the feature doc — feature docs are written once at Spec completion)
- After completing a spec, update frontmatter: `status`, `branch`, `pr`, `completed_at`
- After completing a spec, summarize changes implemented, significant design decisions, and architectural decisions (ADR) into the spec's associated feature document.
- **Spec integration PRs must include close-out work before they merge to `main`.** The final Spec integration PR is not complete until it carries the feature doc, durable-doc refreshes, status handoff, and obsolete per-Spec artifact deletions. Do not defer close-out docs to a follow-up branch after the Spec PR merges; the next Spec should be startable from `main` without revisiting the previous Spec.
- **`superpowers:finishing-a-development-branch` does not bypass Spec close-out.** In PSYKL, the final DevTask branch of a Spec is not "implementation complete" until the close-out work above is committed on that same branch. When using `superpowers:finishing-a-development-branch` for the final DevTask in a Spec, complete the feature doc, durable-doc refreshes, `PROJECT_STATUS.md` handoff, and obsolete artifact deletions before marking the PR ready for review or telling the user the branch is ready to merge.
- Commit feature doc changes as part of the same PR as the implementation. CHANGELOG.md should be updated to include a change log for each feature implemented.
- **Any Spec that introduces or changes a user-facing surface ships a `visual-artifact.md` alongside its spec doc**, as a sibling file beside it — `docs/specs/{initiative}/{YYYYMMDD}-Spec{N}-{spec-slug}-visual-artifact.md`, so a heavyweight Spec stays a file and does not become a folder (AGENTS.md → Workflow Routing) — written **before** implementation starts and reviewed with the operator at the same checkpoint as the spec. Use the same template and the same one-of-four forms the lightweight workflow uses ([`docs/templates/visual-artifact.md`](../templates/visual-artifact.md)): one Mermaid flow, two to four low-fidelity wireframes, one state storyboard, or one Storybook state set. Text-based forms only — it has to survive into the feature doc, and screenshots do not. A Spec that touches no surface a user can see (schema, CI, infrastructure) does not need one; say so in the spec's Overview rather than leaving the question open.
- **At Spec close-out, `visual-artifact.md` is carried into the feature doc's `## Visual Record` and then deleted with the rest of the per-Spec planning set.** Ship the picture of what was actually built, not the plan it started from, and note any divergence in a line beneath it. The picture is how the next reader understands the surface without running the app; losing it at close-out is the failure this rule exists to prevent.
- **Implementation screenshots are local review material, never committed artifacts.** Capture them after implementation for developer review, keep them in a gitignored local directory, and remove them before Spec close-out. Summarize any finding needed for the durable feature doc in words; do not copy image files or screenshot links into `docs/features/`.
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
  3. Execution plan deleted (`docs/specs/{initiative}/{slug}.md`), and its `visual-artifact.md` carried into the feature doc's `## Visual Record` before deletion (or the doc says _none — no user-facing surface changed_).
  4. Companion docs with `deleted_at_spec_closeout: true` frontmatter deleted; content folded into feature doc or `README.md`.
  5. Durable docs refreshed: `README.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `docs/PROJECT_STATUS.md`.
  6. `honors_decisions:` frontmatter refreshed on every spec doc touched by a decision re-open.
  7. `grep -r` durable docs for references to deleted planning files; update or comment as intentional.
  8. Confirm implementation screenshots are absent from the staged diff and PR; delete local review captures at close-out.
  9. If the Spec ships a new GitHub Actions workflow, the first run on the merge-to-`main` commit MUST show `conclusion: success`. Failed first runs → post-merge fixup PRs + ADR operational footnotes (precedent: ADR-M1-026, ADR-M1-027). Spec PR description carries a pending-verification checkbox.
  10. Parent worktree `main` fast-forwarded.
  11. Merged DevTask + Spec branches deleted locally and remotely.
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
- **HARD RULE: each DevTask opens and merges its own PR against the Spec branch before the next DevTask starts, even during continuous same-session execution.** "Commit directly onto the Spec branch, single PR at close-out" is no longer an offerable option — it produces one unreviewable Spec PR (precedent: PR #70, 83 files). The task-review step already required by this skill _is_ the DevTask PR's review; open it, get it merged (self-approved or operator-approved per the file-limit and merge-approval rules below), then branch the next DevTask off the updated Spec branch. The Spec PR at close-out is then a fast-forward aggregate of already-reviewed commits, not a fresh read.

### Design Doc Discipline

- **Candidate lists in initiative/design docs are constraints-first, not options-first.** A design doc must NOT pre-narrow framework, tool, or library choices unless those choices were explicitly discussed during the design session. Carry the constraint set; let candidates surface during the answer pass (typically `/plan-eng-review` or spec drafting).
- **Acronyms are defined on first use within a doc**, even if defined elsewhere in the project. Each doc is read independently; the glossary travels with the doc or appears inline.
- **A design doc's Decisions appendix is normative once status is `APPROVED`.** Subsequent skills (`superpowers:writing-plans`, spec authors, executors) MUST treat those decisions as locked. Re-opening a closed decision requires explicit user permission.
  - **Wide-scope re-open** (changes that ripple through multiple Specs, alter the test pyramid taxonomy, or change a cross-component contract): requires a new `/plan-eng-review` pass against the affected design doc before the re-open lands.
  - **Narrow-scope re-open** (a contained tooling swap or toolchain replacement within one Spec, no contract change, no cross-component effect): may use the lighter ceremony — rewrite the original decision in place, add a new decision with explicit rationale and a back-link to the original decision number, and propagate the change through every doc that references the old decision number (including AGENTS.md sections and spec doc `honors_decisions:` frontmatter). No `/plan-eng-review` pass required. The bar for "narrow scope" is conservative: when in doubt, take the wide-scope path.
- **A design doc's Spec / DevTask Breakdown is an authoritative starting suggestion, not a rigid contract.** `superpowers:writing-plans` may adjust DevTask grouping, split a DevTask into more DevTasks, or split a DevTask into multiple Steps — but MUST cover everything the breakdown enumerates and MUST honor the trilemma resolution rule below.
- **Trilemma resolution (≤10 production behavior source files per DevTask PR vs tests-in-same-PR vs DevTask count):** When three constraints collide, prefer **(C) splitting DevTasks** over (A) bending the ≤10 production-behavior-source-file rule, and never give on (B) tests-in-same-PR. A design doc's DevTask count is a target, not a ceiling. If a planned DevTask needs >10 production behavior source files, split it. Do not split merely because required tests, configuration, documentation, assets, generated files, or lockfile changes push the total Pull Request diff above 10 files. The Test-Driven Development (TDD) discipline is sacred. The file-count rule applies to DevTask Pull Requests only; Spec integration Pull Requests aggregate all DevTask diffs and have no file limit (see Git Conventions -> Spec/DevTask branching workflow).
- **External-resource naming confirmation before plan finalization.** Any decision that names an out-of-code resource (mirror repos, image registries, secret names, GitHub Actions secrets, cloud project IDs, domain names, external API endpoints, third-party account identifiers) must be confirmed against the actual-created resource with the user before the plan's status flips to `APPROVED`. Required form: "Decision #N names `{resource}`. Has this resource been created yet, and if so, what is its actual name?" Discovered-divergence at execution time triggers a narrow-scope re-open (precedent: Decision #16 → #35).

### UI/UX-First Development Discipline

- **Default DevTask ordering within a Spec is UI/UX first, backend/sync second.** `superpowers:writing-plans` sequences a Spec's DevTasks so the earliest DevTasks stand up a testable, demoable UI experience — against local/stubbed data, in-memory fakes, or a minimal contract-only backend stub — before any DevTask implements the durable backend plumbing (persistence, sync queue, API endpoints) needed to make that experience real. The user iterates on the interaction and experience first; backend implementation is built to match what that iteration validates, not the other way around.
- **Rationale (established after `todo-experience` Spec 2):** Spec 2 built backend/sync plumbing first (DevTasks 7-10: restore endpoints, purge job, orphan sweep, sync-queue wiring) and the actual Recently Deleted screen last (DevTask 11) — the reverse of the user's preferred workflow. Backend work built ahead of a validated UI risks needing rework once real interaction/UX feedback lands, and the user does not get to see or react to the feature until the very end.
- **Exception:** when a UI genuinely cannot take shape without an already-agreed data contract (e.g., a screen whose fields depend on a response shape that doesn't exist anywhere yet), the design doc's Decisions appendix locks that minimal contract first — but implementation still starts with a UI DevTask built against a fake/stub honoring that locked contract, not a full backend DevTask. Contract-first is about the shape of the agreement, not the order of implementation.
- **This governs implementation-DevTask ordering, not design-phase ordering.** `/office-hours` and `/plan-design-review` remain the tools for validating the UX concept itself before any DevTask breakdown is drafted.

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
