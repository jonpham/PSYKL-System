---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 3
devtasks_total: 2
devtasks_complete: 0
honors_decisions:
  - 1
---

# Inline Capture — Implementation Spec

> **Outline fidelity.** Expanded by `superpowers:writing-plans` when this Spec starts.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 3/6
**Spec User Story:** _As someone adding several tasks at once, I tap a `+` and get an empty row right where the task will live, type, press Return, and get another empty row — so that capturing five things takes five lines, not five round trips through a form._
**Status:** see frontmatter
**Time-box:** ~1-2 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md).
**UI reference:** `screenshots/390-capture.png`, `390-empty.png`.

---

## Overview

Retires `components/web_client/src/components/TaskCreateForm/` — the top-anchored create form — and
replaces it with an inline capture row opened from a trailing `+` affordance, appended after the last
open task. Return saves and reopens; blurring an empty row discards it; Escape leaves capture.

Touches `components/web_client` only.

---

## Data Model

**None required, because** capture creates a task through the existing `useTasks` create path with a
client-minted `uuidv7`, exactly as `TaskCreateForm` does today.

## API

**No API surface.** Same reasoning. If capture's placement ever implies a persisted position rather
than a derived one, that is a proposal for the operator — stop and ask, do not infer.

---

## Implementation Components

### `components/web_client/`

- `src/components/TaskList/CaptureRow/` (new, nested — single consumer) — the inline row.
- `src/components/TaskList/TaskList.tsx` — hosts the capture row after the last open task and owns the
  `+` affordance.
- `src/components/TaskCreateForm/` — **deleted**.
- `src/App.tsx` — drops the `TaskCreateForm` slot.

**The fix that must survive the port:** the capture input takes focus in `useLayoutEffect`, **not**
via `autoFocus`. `autoFocus` focuses after paint, so keystrokes typed in that window land on the
button and are lost — `Book dentist` arrived as `k dentist`. This behaviour gets its own unit test so
the regression cannot return silently.

---

## Test Plan

### Unit tests

| File                                                                    | What it asserts                                                                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/TaskList/CaptureRow/__tests__/CaptureRow.unit.test.tsx` | the input holds focus synchronously on mount (the dropped-keystroke regression); Return commits and reopens; Escape closes; blur on empty discards; blur with text commits |

### Component tests (Storybook + play functions + MSW)

| File                                                                | What it asserts                                                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/components/TaskList/__tests__/TaskList.stories.tsx` (extended) | typing immediately after tapping `+` lands every character; a failed save keeps the typed title on screen |

**`PSYKL/TaskList › IntegratedWithCreateForm` is already flaky on CI** — most recently on
`expect(await listSyncQueue()).toHaveLength(0)`. This Spec retires `TaskCreateForm`, so **replace that
story rather than porting it**: MSW handlers and `resetStore()`, no IndexedDB writes, no sync-queue
drain assertion.

### End-to-End tests

| File                        | Title                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `e2e/task_list.e2e.spec.ts` | a user adds a task from the add button and keeps adding without reopening it |
| `e2e/task_list.e2e.spec.ts` | a user abandons an empty new task                                            |
| `e2e/task_list.e2e.spec.ts` | a user's typed title survives a failed save                                  |

**Existing E2E specs to update in the same PR:** every spec that creates a task through the old form —
`e2e/task_list.e2e.spec.ts`, `e2e/task_list-offline-sync.e2e.spec.ts`,
`e2e/offline_pressure.e2e.spec.ts`, `e2e/recently_deleted.e2e.spec.ts`.

### TDD order

1. Focus-timing unit test (must fail against `autoFocus`) → implement `useLayoutEffect` → green
2. Remaining `CaptureRow` unit tests → implement → green
3. Replace the flaky story with an MSW-backed one → green
4. Rewrite the affected E2E specs → green
5. Delete `TaskCreateForm/` and prove nothing imports it

---

## DevTasks

2 DevTasks off `spec/to-do-ui-s3-inline-capture`.

### DevTask 6: Ship the inline capture row

**Files:** ~4
**Branch:** `feat/to-do-ui-s3-dt6-capture-row`

### DevTask 7: Retire `TaskCreateForm` and rewrite its tests

**Files:** ~3
**Branch:** `feat/to-do-ui-s3-dt7-retire-create-form`

---

## Verification (manual)

Walk acceptance checks **Capture**, **Empty + failure** and **Keyboard & focus**. Specifically: tap
`+` and begin typing immediately — every character must land.

## Open Questions / Risks

- Focus timing is the known trap and is covered by a dedicated test.
- The mobile keyboard changes the viewport; the capture row must stay visible above it at 390px.

## Affected by / Depends on

Specs 1 and 2 must merge first — capture renders inside the new list.
