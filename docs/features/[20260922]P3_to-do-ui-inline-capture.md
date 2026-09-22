---
status: IN-PROGRESS
issue: P3
branches:
  - feat/to-do-ui-s3-dt6-capture-row
  - feat/to-do-ui-s3-dt7-retire-create-form
prs:
  - https://github.com/jonpham/PSYKL-System/pull/107
  - https://github.com/jonpham/PSYKL-System/pull/108
completed_at:
created_at: 2026-09-22
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260921-Spec3-inline-capture.md (deleted at Spec close-out; see git history)
---

# Inline Capture

## User Story

As someone adding tasks in a burst, I tap an add control, type, and press Return to save and be handed
the next empty row, so that capturing five things takes five lines rather than five round trips to a
form at the top of the page.

## Features

1. An inline capture row appended after the last **open** task, so a new task never appears beneath the
   completed ones.
2. Return saves and reopens; Escape leaves capture; blurring an empty row discards it; blurring a typed
   row saves it.
3. Focus lands on the input before paint, so a user who types immediately loses no characters.
4. The offline write ceiling now refuses capture at the add control itself.
5. `TaskCreateForm` — the top-anchored form — is deleted.

## Verification Steps

**Associated E2E tests:** every spec that captures a task now drives the capture row —
`e2e/task_list.e2e.spec.ts`, `e2e/lists.e2e.spec.ts`, `e2e/recently_deleted.e2e.spec.ts`,
`e2e/offline_pressure.e2e.spec.ts`, and `e2e/helpers/multi-device.ts`.

**Manual verification**

_Setup / Preconditions_ — `pnpm dev` at 390px.

_Steps_

1. Tap the add control and begin typing **immediately**; check every character landed.
2. Press Return several times in a row, capturing a burst.
3. Press Escape; then open a row and blur it while empty.

_Expectation_ — no dropped keystrokes, no empty tasks created, and capture always sits below the last
open task.

## Affected Components

- `components/web_client/src/components/TaskList/CaptureRow/` — the inline row
- `components/web_client/src/components/TaskList/TaskList.tsx` — hosts capture, owns the add control
  and the write-ceiling refusal
- `components/web_client/src/components/TaskCreateForm/` — **deleted**

## Design Decisions

- **Focus is set in `useLayoutEffect`, never `autoFocus`.** `autoFocus` focuses after paint, so
  keystrokes typed in that window land on the add button — "Book dentist" arrived as "k dentist".
- **The focus regression is guarded in a real browser, not in jsdom.** jsdom focuses `autoFocus`
  synchronously during commit, so no jsdom test can distinguish the two implementations. Proven by
  reverting the component and watching the unit test still pass. The guard is
  `TaskList.capture.stories.tsx` → `TypingStartsImmediately`.
- **The write ceiling moved from the form's input to the add control.** Deleting the form would
  otherwise have deleted a shipped offline behavior; `e2e/offline_pressure.e2e.spec.ts` now asserts
  the disabled control.
- **"A typed title survives a failed save" was dropped as unreachable.** `createTask` queues the write
  offline-first rather than throwing, so a network failure is a successful capture. The reachable
  refusal is the write ceiling; the rejecting-`onCreate` branch is covered at the unit layer.

## Architecture Decisions (ADR)

- None. No schema, API, or sync-protocol change.

## Change Log

| Date       | PR                                                       | Summary                                                              |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| 2026-09-22 | [#107](https://github.com/jonpham/PSYKL-System/pull/107) | The inline capture row                                               |
| 2026-09-22 | [#108](https://github.com/jonpham/PSYKL-System/pull/108) | `TaskCreateForm` retired; the write ceiling moved to the add control |
