# Lightweight User-Facing Prototype Workflow for Coding Agent(s)

This document adds a lightweight pre-implementation workflow for proposed user-facing features to be prototyped alongside application clients for experimentation.

It is designed for repositories that already have `AGENTS.md`, style guides, testing standards, and project-specific documentation rules.

Its purpose is to reduce ambiguity before coding **without** adding the kind of overhead associated with heavyweight product, UX, and engineering workflows.

---

## Purpose

Use this workflow for user-facing feature discovery when a small amount of pre-implementation structure will improve quality, reduce rework, and make Claude Code more reliable.

This workflow exists because fully detailed multi-stage AI workflows can become too heavy for a solo builder or small team while experimenting on new features and assessment for adoption in the production application. The goal here is to preserve the benefits of clarity and visual review while minimizing document churn.

This workflow is intentionally biased toward:

- short artifacts,
- one visible design checkpoint,
- planning implementation across one thin vertical slice,
- fast iteration of just UI/UX feature flow (prototyping),
- and proportional rigor.

After cycles of experimentation using this workflow, the experimental implementation is intended to be either:

- discarded (abandon experiment and hypothesis)
- integrated into the production application (approved experience, ready for robust implementation across vertical stack)
- kept as an experiment for future iteration (paused discovery)

## Experiment / Feature Code Isolation

This workflow is intended to create Experimental views with new features that can be quickly prototyped, discarded, or integrated into a production application client.

- It be visible from a client using Experimental toggles or paths.
- New features in prototypes will be purely UI-layer based without affecting data service abstractions/APIs.
- No database changes, no changing common models.
- New components or views shall be colocated in an experimental folder and can use existing production components.

### Client Experiment Paths

| Client       | Folder                                         | Route                    |
| ------------ | ---------------------------------------------- | ------------------------ |
| `web_client` | `components/web_client/src/experiment/{slug}/` | `/exp/{experiment-slug}` |

Inside `components/web_client/src/experiment/`:

| Path                | Purpose                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `{slug}/`           | One experiment, across all of its iterations. Follows the UI Component folder layout in `AGENTS.md`. |
| `registry.ts`       | The list of experiments. Adding an experiment is one entry here.                                     |
| `ExperimentRouter/` | Dispatches `/exp/*` to the matching registry entry.                                                  |
| `ExperimentsIndex/` | The `/exp` landing list; also rendered inside Settings → Experiments.                                |
| `ExperimentFrame/`  | Shared chrome — the "not production" banner and the back-to-app link.                                |
| `index.ts`          | The only sanctioned import seam for production code. Deep imports are lint-blocked.                  |

Experiments may import production components, hooks, and services freely. Production code
must not import experiment internals; ESLint enforces this one-way boundary.

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

Those documents remain the source of truth for implementation standards.

This document only defines the minimum pre-implementation workflow for user-facing features so that Claude Code produces concise, reviewable artifacts before making production changes.

---

## When to Use This Workflow

Use this workflow for:

- new user-facing features,
- meaningful UI or UX changes,
- multi-state interactions,
- flows with success, pending, error, retry, or undo behavior,
- and features where acceptance criteria should be explicit before coding.

Do **not** require this workflow for:

- pure refactors with no behavior change,
- tiny bug fixes,
- internal implementation work,
- infrastructure-only changes,
- or trivial cosmetic changes that can be safely reviewed directly in a browser.

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

---

## Workflow Lanes

### Fast Lane

Use for small, reversible UI changes.

Required:

- short feature card,
- one quick visual reference or direct browser preview,
- three acceptance checks max,
- then implementation.

### Standard Lane

Use for most user-facing features.

Required:

- short feature card,
- one visual artifact,
- three to eight acceptance checks,
- one thin vertical slice plan,
- then implementation of only UI/UX layer as an experimental view.

### High-Rigor Lane

Use only when the change is expensive to reverse or high risk, such as:

- authentication,
- payments,
- destructive actions,
- multi-user workflows,
- privacy/security-sensitive flows,
- or major cross-application user journeys.

Additional rigor may be added here, but only when justified.

---

## Required Artifacts

For Standard Lane work, create an experiment folder containing one iteration folder with the
following minimum artifacts:

```text
docs/experiments/<experiment-slug>/
  feature-card.md                 # the experiment: hypothesis, scope, iteration log, verdict
  <iteration-slug>/
    feature-card.md
    visual-artifact.md
    acceptance-checks.md
    implementation-notes.md
    screenshots/                  # created after implementation or review
```

The experiment folder name matches the route (`/exp/<experiment-slug>`) and the code folder
(`src/experiment/<experiment-slug>/`). An experiment that will only ever have one iteration still
gets the nesting — the second iteration should not force a reorganization.

`docs/initiatives/` is reserved for gstack initiative planning (`DESIGN.md`, `MILESTONE.md`)
and `docs/specs/` for production execution plans. Experiment artifacts never go there.

---

## Iterating an Experiment

An experiment is a surface, not a single feature. A Reminders-parity shell, for example, is iterated
feature by feature against the same route: sidebar navigation, then list sections, then swipe
actions. The route, the code folder, and the registry entry stay fixed across all of them.

Each iteration:

- gets its own `docs/experiments/<experiment-slug>/<iteration-slug>/` with the full artifact set —
  **never overwrite a previous iteration's artifacts**, they are the record of what was tried,
- adds a row to the experiment card's `## Iterations` table (slug, status, verdict),
- adds code under the existing `src/experiment/<experiment-slug>/` tree rather than a new folder,
- and passes through the same review checkpoint (workflow step 6) on its own.

The experiment card stays thin: shell-level user, problem, outcome, shared non-goals, and the
iteration log. Anything specific to one feature belongs in that iteration's card, not the root.

---

## Artifact Definitions

### 1. Feature Card

Purpose: define the smallest shared understanding of the feature before coding.

Keep it concise.

Start from [`docs/templates/feature-card.md`](../templates/feature-card.md).

### 2. Visual Artifact

Purpose: give a human something visible to review before implementation.

Start from [`docs/templates/visual-artifact.md`](../templates/visual-artifact.md).

Use exactly one of:

- one Mermaid flow for a multi-step process,
- two to four low-fidelity wireframes,
- one state storyboard,
- or one isolated prototype route / Storybook state set.

Text-only planning is not sufficient for Standard Lane work.

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

### 4. Implementation Notes

Purpose: define the smallest vertical slice that can be built and verified for production implementation if experiment is proves favorable.

Start from [`docs/templates/implementation-notes.md`](../templates/implementation-notes.md).

This should stay brief and practical:

- files likely to change,
- data/API concerns,
- test approach,
- first slice to implement,
- and what evidence will be captured.

---

## Test Floor

Experiments sit under the E2E carve-out in `AGENTS.md` → Test Discipline. The floor is:

- **Unit tests** only where the experiment contains real logic worth pinning,
- **no Storybook story play tests, E2E spec, and no Integration test.**

Static analysis is not reduced: lint, format, and typecheck must pass exactly as they do for
production code. Promoting an experiment restores the full mandate — the promotion DevTask
writes the E2E spec.

---

## Exits

Every experiment ends in one of three ways. None of them is "leave it there".

Exits apply per iteration and, once every iteration has exited, to the experiment as a whole.

| Exit        | Code                                                                                                                 | Docs                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discard** | Remove the iteration's components; delete `src/experiment/{slug}/` and its `registry.ts` entry once nothing is left. | Move `docs/experiments/{slug}/{iteration}/` to `docs/experiments/archive/{slug}/{iteration}/` with a one-line verdict in both cards.                                        |
| **Pause**   | Leave in place; set the registry entry's `status` to `paused` when the whole experiment is parked.                   | Leave in place; note what would unblock it in the iteration card.                                                                                                           |
| **Promote** | Leave in place until the production implementation merges, then remove the promoted iteration's code from the shell. | **One iteration maps to one production Spec.** Its four artifacts are the Spec's inputs. Archive that iteration's folder once the feature doc exists; the shell stays live. |

What each promoted artifact feeds:

| Artifact                  | Feeds                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `acceptance-checks.md`    | Spec acceptance criteria, and the E2E test titles the promotion DevTask must write |
| `visual-artifact.md`      | the initiative's `UX.md` section for that feature                                  |
| `implementation-notes.md` | DevTask breakdown seed, plus the production modules the real version must touch    |
| `screenshots/`            | evidence in the resulting `docs/features/` doc                                     |

---

## Standard Workflow

1. Read repository `AGENTS.md` and any relevant project-level instructions.
2. Read the applicable style guide, architecture documents, and testing standards.
3. Pick the experiment: a new `docs/experiments/{slug}/` with an experiment card, or a new
   `{iteration}/` subfolder under an existing one. Then create the iteration's `feature-card.md`.
4. Create exactly one visual artifact.
5. Create `acceptance-checks.md`.
6. Pause for human review unless the task is already explicitly approved to continue.
7. Create brief `implementation-notes.md` for one thin vertical slice.
8. Implement the smallest UI/UX slice that proves the feature outcome.
9. Add or update the lowest-cost meaningful tests.
10. Run the feature locally and capture screenshots for relevant viewports/states.
11. Compare the result to the visual artifact and acceptance checks.
12. Iterate prototype in small steps.
13. Prototype cleanup;
    a. If operator indicates prototype accepted for implementation, update artifacts in preparation for usage as inputs to production development workflow

---

## Worked Example — cost of one experiment

A `task-sections` experiment, once the groundwork exists:

```text
docs/experiments/task-sections/
  feature-card.md              # the experiment — ~14 lines
  sections-in-list/
    feature-card.md            # the iteration — ~14 lines
    visual-artifact.md         # one Mermaid flow, or 3 wireframes
    acceptance-checks.md       # 5 checks
    implementation-notes.md    # ~6 bullets
    screenshots/

components/web_client/src/experiment/task-sections/
  TaskSectionsExperiment.tsx
  index.ts
  __tests__/TaskSectionsExperiment.stories.tsx
```

Plus one entry appended to `components/web_client/src/experiment/registry.ts`. A second iteration
adds one doc subfolder, one row in the experiment card's iteration table, and components under the
existing `task-sections/` tree — no new route and no new registry entry.

Total: three new code files, one registry line, five short documents, one ordinary feature
branch and PR. No Spec branch, no DevTask breakdown, no feature doc, no close-out checklist.

---

## Definition of Ready

A user-facing feature is ready for implementation when:

- the target user and outcome are written down,
- scope and non-goals are explicit,
- one visual artifact exists,
- acceptance checks are observable,
- and unresolved questions are small enough not to block the first thin vertical slice.

If those conditions are not met, Claude Code should ask targeted questions instead of inventing missing product behavior.

---

## Definition of Done for a Slice

A thin vertical slice is done when:

- the primary outcome works end to end,
- the most relevant acceptance checks for that slice pass,
- tests were added or updated where appropriate,
- the result was reviewed in a browser,
- screenshots or equivalent evidence were captured,
- and any differences from the original artifact are documented.
