---
status: DONE
issue: GH128
branches:
  - feat/128-list-item-and-sidebar-gestures
prs:
  - https://github.com/jonpham/PSYKL-System/pull/141
completed_at: 2026-09-24
created_at: 2026-09-24
initiative: none — `fast-feature` (the `to-do-ui` initiative closed while this was in flight)
spec: none — lightweight feature workflow, `target = production` (artifact folder consolidated into this doc at close-out)
---

# Task swipe actions and touch polish

> Lightweight `target = production` change, Standard Lane, under [`docs/workflows/lightweight-feature-workflow.md`](../workflows/lightweight-feature-workflow.md). Source: [#128](https://github.com/jonpham/PSYKL-System/issues/128), following [#127](https://github.com/jonpham/PSYKL-System/issues/127). Revised once after on-device review ([feedback](https://github.com/jonpham/PSYKL-System/pull/141#issuecomment-5822771416)).

## User Story

As a mobile PWA user working through a list with one thumb, I want to swipe a task for its actions — or all the way across to delete it — and to start a task by tapping the empty space below my list, so that managing a list does not take a chain of small, precise taps.

## Features

1. **Swipe a task left to reveal Details and Delete.** Past a quarter of the row's width, the row holds open on the two actions painted behind it. **Details** opens the task drawer from #127; **Delete** is one press, because the swipe itself was the deliberate act.
2. **Swipe all the way across to delete.** Past 60% of the row, a red Delete pane fills the task's box before the finger lifts, and releasing deletes it. The delete is the ordinary soft delete, so the task lands in Recently Deleted.
3. **The row being acted on is framed.** Editing its title, swiping it, or holding its rail open puts the row in a grey boundary with the task as a rounded white box inside it, and each rail action is its own rounded box. The frame grows outward into the page gutter, so no text moves. Every other row renders exactly as before.
4. **Scrolling still wins.** A drag is only a swipe once it is more horizontal than vertical; one row is open at a time; scrolling, swiping another row, entering selection mode, or tapping the covered row closes it.
5. **Tap the empty space to start a task.** Everything between the last row (or the empty-state copy) and the (+) opens capture exactly as the (+) does. It is inert in selection mode and past the offline write ceiling, and an open rail takes the tap to close instead.
6. **"Nothing to do yet."** replaces "No tasks yet. Create your first one."
7. **The iOS status bar takes the app's colour.** As an installed web app the bar holding the clock was solid white, matching neither the sidebar nor the page; with the sidebar open in Safari, the browser chrome took the colour of the shaded overlay. The app now draws under the status bar, and `theme-color` follows the resolved page background.

## Visual Record

> The shipped surfaces at ~390px (iPhone), carried from the planning `visual-artifact.md` and
> updated to what was built. See the note at the end for how the two differ.

### 1. Row at rest (unchanged)

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                                │   ← 44px rows, tap title = edit
│ ( )  Call the plumber                        │
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

### 2. Focused row, rail open (released between 25% and 60% of the row's width)

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                                │
╭──────────────────────────────────────────────╮  ← grey frame (--bg-selected), 4px
│╭──────────────────────╮╭────────╮╭─────────╮│
││ ( )  Call the plumbe ││  (i)   ││   🗑    ││  ← white task box (--bg-app), then
││                      ││Details ││ Delete  ││    two boxed actions, 88px each
│╰──────────────────────╯╰────────╯╰─────────╯│
╰──────────────────────────────────────────────╯
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

The same frame, without the rail, marks a row whose title is open for editing.

### 3. Past the full-swipe threshold (> 60% of the row's width)

```text
╭──────────────────────────────────────────────╮
│╭─────╮╭────────────────────────────────────╮│
││ mbe ││                         🗑  Delete  ││  ← red, rounded, inside the frame;
│╰─────╯╰────────────────────────────────────╯│    releasing here deletes
╰──────────────────────────────────────────────╯
```

### 4. Tapping the empty space

```text
┌──────────────────────────────────────────────┐
│ Nothing to do yet.                           │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ ┆            tap anywhere here             ┆ │  ← opens capture, like (+)
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│                                         (+)  │
└──────────────────────────────────────────────┘
```

**How the shipped surface differs from the plan:** the plan's fourth frame was the sidebar tracking a drag in from the left edge. It was built, then removed after device testing — Safari's back-swipe owns that edge, so it never fired. The focus frame, the boxed rail actions, the empty-space tap, the new copy and the status-bar fix all came out of that same review; none was in the first plan.

## Verification Steps

**Associated E2E tests:** `e2e/task_swipe_actions.e2e.spec.ts` — eight user stories: the rail, a full-swipe delete restored from Recently Deleted, the one-press rail delete, details from the rail, a short swipe changing nothing, closing by tap without starting an edit, one open row at a time, and the empty space starting a task. `e2e/app_identity.e2e.spec.ts` → browser chrome covers the `theme-color` tint, light, dark, and a system flip without a reload. The long-title case in `e2e/task_details.e2e.spec.ts` now measures the title rather than the framed row.

**Manual verification**

_Setup / Preconditions_ — the Compose stack up with the LAN override from [`README.md` → Verify locally](../../README.md#verify-locally-uiux), opened on an iPhone or iPad, and added to the home screen for step 5. A list holding a few tasks.

_Steps_

1. Swipe a task left about a third of the way and let go; tap Details; close the drawer.
2. Swipe it again and tap Delete; open Recently Deleted.
3. Swipe another task all the way across.
4. Start a vertical scroll with your thumb on a task; then tap the empty space below the last task.
5. From the home-screen app, open the sidebar in both light and dark appearance.

_Expectation_ — (1) the row is framed and holds open on two rounded buttons, and Details opens that task; (2) the task leaves the list and is in Recently Deleted; (3) a red pane fills the row before release, and the task is gone after it; (4) the list scrolls without any row opening, and the tap opens a new-task field; (5) the bar holding the clock shows the sidebar's or the page's own colour, never solid white, and nothing sits under the clock.

## Affected Components

- `components/web_client/src/hooks/swipeTrack.ts`, `useSwipeTrack.ts` — new; the gesture's two pure decisions, and its pointer plumbing
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — the grid moved onto a sliding `__surface`; the `<li>` is the clip and carries `data-focused`
- `components/web_client/src/components/TaskList/TaskRow/useRowSwipe.ts` — new; per-swipe measuring, surface placement, release verdict
- `components/web_client/src/components/TaskList/TaskRow/SwipeRail/` — new; the two revealed actions and the full-swipe `DeletePane`
- `components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx` — supplies Delete and Details, and reports editing as focus
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — surface, rail, focus frame, delete pane, dismiss cover
- `components/web_client/src/components/TaskList/TaskList.tsx`, `task-list.css` — the one open rail; the empty space
- `components/web_client/src/components/TaskList/useOpenRail.ts` — new; which row is open
- `components/web_client/src/components/TaskList/usePendingTaskIds.ts` — new; a pure move out of `TaskList.tsx` for the line cap
- `components/web_client/src/components/TaskList/EmptyState/EmptyState.tsx` — copy
- `components/web_client/src/components/AppShell/app-shell.css` — safe-area insets; the sidebar scrim no longer `fixed`; `html`/`body` paint `--bg-app`
- `components/web_client/src/preferences/apply.ts`, `bootstrap.ts` — `theme-color` follows `--bg-app`
- `components/web_client/index.html` — `viewport-fit=cover`, `apple-mobile-web-app-status-bar-style: black-translucent`, a white `theme-color` default

**Unchanged:** `components/service-task` entirely. No schema change, no migration, no new endpoint.

## Design Decisions

- **No backend change, and none needed.** Both deletes are the existing soft delete (`deleteTask`) the drawer and the batch delete already call, so they inherit the offline queue and Recently Deleted.
- **Pointer events, not touch events.** One code path serves the phone, a desktop mouse, and Playwright — which is how the E2E suite drives a swipe at all.
- **The gesture yields to the scroller.** The axis is only claimed for a drag more horizontal than vertical, past 10px; the surface carries `touch-action: pan-y`; and `pointercancel` abandons with no verdict, so a scroll takeover never opens a row. Velocity is sampled over the gesture's last 100ms and ignored below 8ms, where two samples are too close to divide by.
- **The window is listened to only during a gesture**, and widths are measured once per swipe. Both came out of the close-out review: every row had held three window listeners for its lifetime, and each move forced a layout by reading a width after the surface moved.
- **A mouse swipe swallows its closing click.** The surface carries whatever the pointer went down on, so without this a desktop swipe that began on the title also opened an edit. A finger sends no click after a drag.
- **The rail's controls only exist while reachable.** It stays in the layout for measuring, but a closed rail's buttons would have been a second, invisible Details and Delete on every row.
- **One open rail lives in the list, not the row**, because "open this one" and "close the other" are the same event.
- **The focus frame grows outward.** Its padding is cancelled by a matching negative margin, so the title and every row below stay put; `--bg-selected` around `--bg-app` keeps the boundary visible in both appearances, where `--bg-grouped` and `--bg-elevated` are identical in dark.
- **The sidebar swipe was cut, not fixed.** Safari's back-swipe owns the left edge in a tab and in an installed web app alike, and the gesture carried a cost on every page for no value.
- **The status bar is translucent, not themed.** An installed iOS web app ignores `theme-color` for its status bar and draws its `default` style — solid white — unless the page opts into `black-translucent` with `viewport-fit=cover` and pads itself clear with `env(safe-area-inset-*)`. The operator's Seerr install was the working reference.

## Open follow-ups

- **The two drawers' scrims are still `position: fixed`**, which is what tinted Safari's chrome for the sidebar's. Not reported; not changed.
- **`black-translucent` draws the clock in white** whatever the page behind it. The operator approved the UX with it in place; if the clock is ever unreadable over a light page, switch the tag per appearance — translucent for dark, `default` for light.

## Architecture Decisions (ADR)

None. No new ADR; no existing ADR is amended.

## Change Log

| Date       | PR                                                       | Summary                                                                                              |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2026-09-24 | [#141](https://github.com/jonpham/PSYKL-System/pull/141) | Task swipe actions, focus frame, empty-space capture, iOS status bar and tint; sidebar swipe removed |
