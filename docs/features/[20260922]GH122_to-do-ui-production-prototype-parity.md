---
status: IN-PROGRESS
issue: GH122
branches:
  - feat/122-production-prototype-v0.5-parity
prs:
  - https://github.com/jonpham/PSYKL-System/pull/130
completed_at:
created_at: 2026-09-22
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260922-production-prototype-parity/ (deleted at close-out; see git history)
---

# Production UX parity with Apple Reminders prototype

## User Story

As someone using the shipped task planner on a phone or desktop, I want its task list, Lists header,
and Settings to behave like the accepted prototype so that everyday capture and navigation are consistent.

## Features

1. The build and API version readout appears only in Settings → About → Version. Appearance and
   Contrast use equal-width segmented controls; changes apply immediately and survive refresh.
2. Task rows show a checkbox, title, and delayed pending-sync dot without an inline Delete button.
   Row spacing and inset separators match the prototype, including a single rule above capture.
3. A circular `New Task` control floats at the bottom-trailing edge of the task list above the safe
   area. It opens capture after the last open task and remains disabled at the offline write ceiling.
4. The task-list header uses aligned sync and options columns, and Lists has a circular New List
   action. Sync retains production's `Everything is synced.` copy and the existing empty state.

## Verification Steps

**Associated E2E tests:** `e2e/task_list.e2e.spec.ts`, `e2e/task_list_layout.e2e.spec.ts`,
`e2e/lists.e2e.spec.ts`, `e2e/settings.e2e.spec.ts`, `e2e/offline_pressure.e2e.spec.ts`,
`e2e/recently_deleted.e2e.spec.ts`, and `e2e/task_list-offline-sync.e2e.spec.ts`.

**Manual verification**

_Setup / Preconditions_ — open production routes at phone width and desktop width with an open and
a completed task.

_Steps_

1. Open the task list, start capture, and check the floating control and single inset rule.
2. Open Lists and Settings; change Appearance and Contrast, then refresh Settings.
3. Open Sync and Recently Deleted; check that Version appears only in Settings and that none of the
   five destinations scrolls horizontally at phone width.

_Expectation_ — the accepted prototype's control layout is present while production Sync copy,
offline ceiling, and existing empty-state behavior remain intact. Physical iPhone Safari was not
available for verification; WebKit phone emulation passed the five-destination width and capture checks.

## Affected Components

- `components/web_client/src/App.tsx`, `components/AppShell/` — version placement and header grid
- `components/web_client/src/components/SettingsView/`, `components/VersionFooter/` — segmented
  controls and About → Version
- `components/web_client/src/components/TaskList/` — rows, separators, and floating capture
- `e2e/` — user stories and API-based task deletion fixtures for flows without a Delete button

## Design Decisions

- **Task deletion leaves a deliberate UI gap.** The row Delete button and confirmation window are
  removed. Tasks can still be completed, and the delete API remains available; swipe-to-delete is a
  separate future change. Browser test fixtures delete through the API when needed.
- **The capture label remains `New Task`.** This preserves PSYKL's domain language while matching
  the prototype's circular control.
- **Production copy wins where chosen.** Sync keeps `Everything is synced.` and the task list keeps
  its existing empty state.

## Architecture Decisions (ADR)

- None. No schema, endpoint, shared-model, or sync-protocol change.

## Change Log

| Date       | PR                                                       | Summary                                                                |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-09-22 | [#130](https://github.com/jonpham/PSYKL-System/pull/130) | Align production presentation and controls with the accepted prototype |
