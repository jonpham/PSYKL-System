# Lightweight Feature Workflow for Coding Agent(s)

This document defines a lightweight pre-implementation workflow for user-facing work, for use when a small amount of structure improves quality and reduces rework **without** the overhead of the full Initiative → Spec → DevTask cycle.

It is designed for repositories that already have `AGENTS.md`, style guides, testing standards, and project-specific documentation rules.

---

## Purpose

Fully detailed multi-stage AI workflows become too heavy for a solo builder or small team in two situations that look different but need the same small planning kit:

1. **Prototyping** a user-facing idea whose value is unproven.
2. **Iterating quickly on shipped production behaviour** — bug fixes, UX refinements, and small feature additions on a surface that already exists.

Both want short artifacts, one visible design checkpoint, one thin vertical slice, and proportional rigor. Neither wants a design review chain.

The difference between them is **where the work lands and what it must prove** — not how it is planned. That difference is captured by this workflow's **target**.

This workflow is intentionally biased toward:

- short artifacts,
- one visible design checkpoint,
- planning implementation across one thin vertical slice,
- fast iteration,
- and proportional rigor.

---

## Targets

**Every use of this workflow declares a target before any file is created.** Say which one you are in, in your first response on the task.

|                  | **`target = prototype`**                                              | **`target = production`**                                             |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Use when**     | The idea's value is unproven and you want to try it before committing | The behaviour is decided and small, on a surface that already ships   |
| **Artifacts**    | `docs/experiments/{slug}/{iteration}/`                                | `docs/specs/{initiative}/{YYYYMMDD}-{slug}/`                          |
| **Code**         | `components/{client}/src/experiment/{slug}/` only                     | The production modules the change actually belongs in                 |
| **Reachable at** | `/exp/{slug}` — behind the experiments index                          | The app's real routes. **Assume a user hits it the moment it merges** |
| **May change**   | UI layer only. No schema, no API, no shared models                    | Anything the change genuinely needs — but see _Backend changes_ below |
| **Test floor**   | Reduced — see _Test Floor_                                            | **Full.** The standard pyramid in `AGENTS.md`, E2E included           |
| **Ends**         | Discard, pause, or promote                                            | Merged and recorded in `CHANGELOG.md`                                 |

The planning kit — feature card, one visual artifact, acceptance checks, implementation notes — is **identical for both targets**. Only the root path, the code location, and the test floor differ.

### Choosing a target

- Unproven idea, want to see it running before deciding → **prototype**.
- Decided behaviour, small, on an existing surface → **production**.
- Decided behaviour, but it introduces a new domain concept, a cross-cutting architectural change, or a data-model decision that other work will build on → **neither**. Use [`production-dev-workflow.md`](production-dev-workflow.md). See _When to escalate_.

A prototype that proves out does **not** graduate into `target = production` on this workflow by default. One promoted iteration maps to one production Spec under the heavyweight workflow, because promotion is where the vertical stack, the data model, and the test mandate all arrive at once. Promote through `target = production` only when the promoted surface is genuinely small and touches no schema or API — and say so explicitly when you do.

### Backend changes under `target = production`

Do not assert "this is UI-only" up front. Read the code first. If the change wants a schema migration, a new endpoint, or a change to a shared model, **stop and bring the proposal to the operator before implementing it**. The operator decides whether it stays in this workflow or escalates.

A migration that other features will depend on is a signal to escalate, not a signal to move fast.

---

## Relationship to Existing Repository Rules

This document is **additive**.

It does **not** replace:

- `AGENTS.md`,
- project-level or package-level `AGENTS.md`,
- code style guides,
- UI style guides,
- accessibility standards,
- testing standards,
- architecture rules,
- or deployment conventions.

Those documents remain the source of truth for implementation standards. Style, lint, typecheck, commit messages, and Git Conventions apply unchanged under **both** targets. Only the planning ceremony is reduced — and under `target = prototype`, the test-layer floor.

---

## When to Use This Workflow

Use this workflow for:

- new user-facing features that are small and well understood,
- meaningful UI or UX changes,
- multi-state interactions,
- flows with success, pending, error, retry, or undo behavior,
- bug fixes whose correct behaviour is worth writing down before coding,
- and features where acceptance criteria should be explicit before coding.

Do **not** require this workflow for:

- pure refactors with no behavior change,
- one-line bug fixes with an obvious correct answer,
- internal implementation work,
- infrastructure-only changes,
- or trivial cosmetic changes that can be safely reviewed directly in a browser.

An ordinary branch and PR is enough for those. Tests are still required where behaviour changes.

### When to escalate to the production workflow

Leave this workflow and use [`production-dev-workflow.md`](production-dev-workflow.md) when any of these is true:

- the work introduces or changes a **domain concept** in the data model,
- it spans **more than one system component** in a way that needs a designed contract,
- it needs a **design or architecture review** before the shape is settled,
- it is large enough to need a **DevTask breakdown** to stay reviewable,
- or it is the **promotion of a prototype** that is anything more than a thin surface.

Escalating late is cheap. Discovering mid-implementation that a "small fix" is a schema change is the signal — stop and raise it.

---

## Overhead Guardrails

To prevent this workflow from becoming too heavy:

- Feature card must stay within **10 to 15 lines**.
- Visual artifact must be exactly **one** of the following unless the feature is explicitly high-risk:
  - one Mermaid flow,
  - two to four low-fidelity wireframes,
  - one state storyboard,
  - or one prototype route / Storybook state set.
- Acceptance checks should usually stay within **3 to 8 checks**.
- Do not create long PRDs, multi-document design packets, or extended review chains for standard features.
- Prefer a real runnable prototype over large amounts of prose.
- Move to implementation once the first thin vertical slice is clear enough to build and verify.

If the artifacts are straining against these limits, that is the escalation signal.

---

## Rigor Lanes

Rigor is chosen independently of target. A production bug fix can be Fast Lane; a prototype of a destructive action is High-Rigor.

### Fast Lane

Use for small, reversible changes.

Required:

- short feature card,
- one quick visual reference or direct browser preview,
- three acceptance checks max,
- then implementation.

### Standard Lane

Use for most user-facing work.

Required:

- short feature card,
- one visual artifact,
- three to eight acceptance checks,
- one thin vertical slice plan,
- then implementation.

### High-Rigor Lane

Use only when the change is expensive to reverse or high risk, such as:

- authentication,
- payments,
- destructive actions,
- multi-user workflows,
- privacy/security-sensitive flows,
- or major cross-application user journeys.

Additional rigor may be added here, but only when justified. Under `target = production`, High-Rigor work is usually a sign to escalate instead.

---

## Required Artifacts

The same four artifacts under both targets. Only the root differs.

**`target = prototype`:**

```text
docs/experiments/<experiment-slug>/
  feature-card.md                 # the experiment: hypothesis, scope, iteration log, verdict
  <iteration-slug>/
    feature-card.md
    visual-artifact.md
    acceptance-checks.md
    implementation-notes.md
```

The experiment folder name matches the route (`/exp/<experiment-slug>`) and the code folder (`src/experiment/<experiment-slug>/`). An experiment that will only ever have one iteration still gets the nesting — the second iteration should not force a reorganization.

**`target = production`:**

```text
docs/specs/<initiative>/<YYYYMMDD>-<slug>/
  feature-card.md
  visual-artifact.md
  acceptance-checks.md
  implementation-notes.md
```

There is no experiment card and no iteration nesting — production work is not a shell being iterated, it is a change being shipped.

Use the initiative the surface belongs to. For work that belongs to no initiative — standalone fixes, stabilization passes — use `docs/specs/maintenance/`.

**A lightweight production artifact set is a folder; a heavyweight Spec is a file** (`{YYYYMMDD}-Spec{N}-{slug}.md`). That distinction is deliberate: the two can sit side by side in the same initiative directory without competing for Spec numbering. Lightweight work is never assigned a Spec number.

`docs/initiatives/` is reserved for gstack initiative planning (`DESIGN.md`, `MILESTONE.md`). Neither target writes there.

**Screenshots are local review material, not planning artifacts.** Capture them after implementation in a gitignored local directory, use them for developer review, then delete them at close-out. Never commit screenshots or carry them into a feature doc; preserve durable findings as text.

---

## Iterating

### `target = prototype`

An experiment is a surface, not a single feature. A Reminders-parity shell, for example, is iterated feature by feature against the same route: sidebar navigation, then list sections, then swipe actions. The route, the code folder, and the registry entry stay fixed across all of them.

Each iteration:

- gets its own `docs/experiments/<experiment-slug>/<iteration-slug>/` with the full artifact set — **never overwrite a previous iteration's artifacts**, they are the record of what was tried,
- adds a row to the experiment card's `## Iterations` table (slug, status, verdict),
- adds code under the existing `src/experiment/<experiment-slug>/` tree rather than a new folder,
- and passes through the same review checkpoint (workflow step 6) on its own.

The experiment card stays thin: shell-level user, problem, outcome, shared non-goals, and the iteration log. Anything specific to one feature belongs in that iteration's card, not the root.

### `target = production`

Each change is its own dated folder and its own PR. There is no iteration nesting: a follow-up refinement to something already shipped is a new folder with a new date, not a subfolder of the old one. Cross-reference the earlier folder from the new feature card when the history matters.

---

## Artifact Definitions

### 1. Feature Card

Purpose: define the smallest shared understanding of the feature before coding.

Keep it concise.

Start from [`docs/templates/feature-card.md`](../templates/feature-card.md).

Under `target = production`, state the user-visible behaviour being changed and what it is today — a fix is only legible against the behaviour it replaces.

### 2. Visual Artifact

Purpose: give a human something visible to review before implementation.

Start from [`docs/templates/visual-artifact.md`](../templates/visual-artifact.md).

Use exactly one of:

- one Mermaid flow for a multi-step process,
- two to four low-fidelity wireframes,
- one state storyboard,
- or one isolated prototype route / Storybook state set.

Text-only planning is not sufficient for Standard Lane work. For a `target = production` bug fix where the visual outcome is "it does what it already claims to do", a before/after state pair is enough.

**Keep it in a text-based form** — ASCII wireframes, Mermaid, or a state table — because this artifact does not end at close-out: it is carried into the durable record (`docs/features/` → `## Visual Record`, or the initiative's `UX.md` on promotion). Screenshots cannot be carried, which is the other reason they stay local.

### 3. Acceptance Checks

Purpose: define what must be observably true.

Start from [`docs/templates/acceptance-checks.md`](../templates/acceptance-checks.md).

These are **not** a large requirements document.

They are a concise checklist of behavior that should usually include:

- primary success path,
- at least one recovery or failure condition when relevant,
- persistence or refresh behavior when relevant,
- keyboard/focus behavior when relevant,
- and mobile/narrow-layout behavior when relevant.

Under `target = production`, these are the source for the E2E test titles the change must ship.

### 4. Implementation Notes

Purpose: define the smallest vertical slice that can be built and verified.

Start from [`docs/templates/implementation-notes.md`](../templates/implementation-notes.md).

This should stay brief and practical:

- files likely to change,
- data/API concerns,
- test approach,
- first slice to implement,
- and what evidence will be captured.

Under `target = production`, the data/API line is where a backend change is declared. If that line is not empty, raise it with the operator before implementing.

---

## Test Floor

**This is the one place the two targets genuinely diverge. Do not carry the prototype floor into production work.**

### `target = prototype`

Experiments sit under the E2E carve-out in `AGENTS.md` → Test Discipline. The floor is:

- **Unit tests** only where the experiment contains real logic worth pinning,
- **no Storybook story play tests, no E2E spec, and no Integration test.**

### `target = production`

**No reduction whatsoever.** The full five-layer pyramid in `AGENTS.md` → Test Discipline applies, including:

- **TDD ordering is mandatory** — failing test, then implementation.
- **Every new user-visible UI behavior ships with an E2E test in the same PR.** A fix to broken behaviour ships with the test that would have caught it.
- Tests live in the same PR as the implementation they cover.

The planning ceremony is what this workflow reduces. The test pyramid is not ceremony — it is the thing that makes fast iteration safe.

### Both targets

Static analysis is not reduced under either target: lint, format, and typecheck must pass exactly as they do for any production code.

---

## Exits

### `target = prototype`

Every experiment ends in one of three ways. None of them is "leave it there".

Exits apply per iteration and, once every iteration has exited, to the experiment as a whole.

| Exit        | Code                                                                                                                 | Docs                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discard** | Remove the iteration's components; delete `src/experiment/{slug}/` and its `registry.ts` entry once nothing is left. | Move `docs/experiments/{slug}/{iteration}/` to `docs/experiments/archive/{slug}/{iteration}/` with a one-line verdict in both cards.                                        |
| **Pause**   | Leave in place; set the registry entry's `status` to `paused` when the whole experiment is parked.                   | Leave in place; note what would unblock it in the iteration card.                                                                                                           |
| **Promote** | Leave in place until the production implementation merges, then remove the promoted iteration's code from the shell. | **One iteration maps to one production Spec.** Its four artifacts are the Spec's inputs. Archive that iteration's folder once the feature doc exists; the shell stays live. |

What each promoted artifact feeds:

| Artifact                  | Feeds                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `acceptance-checks.md`    | Spec acceptance criteria, and the E2E test titles the promotion DevTask must write                     |
| `visual-artifact.md`      | the initiative's `UX.md` section for that feature, and later the Spec's feature doc `## Visual Record` |
| `implementation-notes.md` | DevTask breakdown seed, plus the production modules the real version must touch                        |
| Local screenshots         | review only; summarize findings in text before deleting the captures                                   |

### `target = production`

One exit: **shipped**. The change merges and is recorded.

- Add the entry to `CHANGELOG.md` under `## Unreleased`, in the same PR.
- The artifact folder is the record by default. If the operator requests production-style close-out, consolidate its decisions and verification into a `docs/features/` document and delete the artifact folder in the same PR before merge.
- **A close-out that deletes the artifact folder carries `visual-artifact.md` into the feature doc's `## Visual Record` first.** The picture is the part of the planning set that stays useful after the change ships — it is how the next reader sees the surface without running it. Update it to what was actually built if the two diverged, and note the difference in a line beneath it. Deleting the folder without carrying the picture loses it.
- Update `docs/PROJECT_STATUS.md` if the work changes what is active, blocked, or next.
- Capture screenshots locally for review, then delete them at close-out; never commit the image files.

Abandoned production work is deleted, branch and folder both. There is no "paused" state for a production change — if it is not shipping, it is an idea, and ideas belong in `docs/BACKLOG_IDEAS.md`.

---

## Git Conventions

Git Conventions in `AGENTS.md` apply in full under both targets — including the HARD RULES on merging and on pushing with a verified upstream.

|        | `target = prototype`                   | `target = production`       |
| ------ | -------------------------------------- | --------------------------- |
| Branch | `(feat\|chore)/exp-{slug}-{iteration}` | `(feat\|fix\|chore)/{slug}` |
| Base   | `main`                                 | `main`                      |
| PRs    | One                                    | One                         |

**Neither target uses a Spec integration branch or a stack of DevTask PRs.** One change, one branch, one PR, merged on its own. If the work is big enough to want stacking, it is big enough to escalate.

---

## Standard Workflow

1. Read repository `AGENTS.md` and any relevant project-level instructions.
2. Read the applicable style guide, architecture documents, and testing standards.
3. **Declare the target** (`prototype` or `production`) and the rigor lane, and say so in your first response.
4. Create the artifact folder for that target and write `feature-card.md`.
5. Create exactly one visual artifact.
6. Create `acceptance-checks.md`.
7. **Pause for human review** unless the task is already explicitly approved to continue.
8. Create brief `implementation-notes.md` for one thin vertical slice. If its data/API line is not empty under `target = production`, raise it with the operator now.
9. Implement the smallest slice that proves the outcome — writing the failing test first under `target = production`.
10. Add or update tests to the floor for that target.
11. Run the feature locally and capture screenshots for relevant viewports/states in a gitignored local directory.
12. Compare the result to the visual artifact and acceptance checks.
13. Iterate in small steps.
14. Delete local screenshots, then close out for that target:
    - **prototype** — if the operator accepts it for implementation, update the artifacts in preparation for use as inputs to the production development workflow;
    - **production** — add the `CHANGELOG.md` entry, refresh `docs/PROJECT_STATUS.md` if the work changed what is active, carry `visual-artifact.md` into the feature doc's `## Visual Record` if the operator asked for a production-style close-out, and open the PR.

---

## Worked Examples

### `target = prototype` — cost of one experiment

A `task-sections` experiment, once the groundwork exists:

```text
docs/experiments/task-sections/
  feature-card.md              # the experiment — ~14 lines
  sections-in-list/
    feature-card.md            # the iteration — ~14 lines
    visual-artifact.md         # one Mermaid flow, or 3 wireframes
    acceptance-checks.md       # 5 checks
    implementation-notes.md    # ~6 bullets

components/web_client/src/experiment/task-sections/
  TaskSectionsExperiment.tsx
  index.ts
  __tests__/TaskSectionsExperiment.stories.tsx
```

Plus one entry appended to `components/web_client/src/experiment/registry.ts`. A second iteration adds one doc subfolder, one row in the experiment card's iteration table, and components under the existing `task-sections/` tree — no new route and no new registry entry.

Total: three new code files, one registry line, five short documents, one ordinary feature branch and PR. No Spec branch, no DevTask breakdown, no feature doc, no close-out checklist.

### `target = production` — cost of one shipped fix

Renaming a list from the list itself, on the shipped surface:

```text
docs/specs/to-do-ui/20260923-rename-list-in-place/
  feature-card.md            # ~12 lines
  visual-artifact.md         # before/after state pair
  acceptance-checks.md       # 4 checks
  implementation-notes.md    # ~6 bullets

components/web_client/src/components/ListsPage/ListsPage.tsx
components/web_client/src/components/ListsPage/__tests__/ListsPage.rename.unit.test.tsx
e2e/lists.e2e.spec.ts        # one new test, titled from an acceptance check
```

Plus a `CHANGELOG.md` entry. No Spec number, no DevTask breakdown, no feature doc by default, no Spec integration branch — but the E2E test is not optional, because a user reaches this the moment it merges. An operator-requested close-out replaces the artifact folder with a feature doc in this same PR.

---

## Definition of Ready

Work is ready for implementation when:

- the target (`prototype` or `production`) is declared,
- the target user and outcome are written down,
- scope and non-goals are explicit,
- one visual artifact exists,
- acceptance checks are observable,
- any backend change under `target = production` has been raised and settled with the operator,
- and unresolved questions are small enough not to block the first thin vertical slice.

If those conditions are not met, the coding agent should ask targeted questions instead of inventing missing product behavior.

---

## Definition of Done for a Slice

A thin vertical slice is done when:

- the primary outcome works end to end,
- the most relevant acceptance checks for that slice pass,
- tests were added or updated to the floor for the declared target,
- the result was reviewed in a browser,
- screenshots or equivalent evidence were reviewed locally and the image files were not committed,
- and any differences from the original artifact are documented.
