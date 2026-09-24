# Implementation Notes — Reminders-Grade List Skin

## First slice

- One experiment-local `TaskListView` replacing `TaskCreateForm` + `TaskList` inside the shell's `list` destination: sorted rows, Reminders checkbox, inline title edit, bottom-anchored inline capture.
- One iteration-local token sheet scoped to `.reminders-experiment`, with the shell, sidebar, and sync control repointed at it so the whole surface is coherent in light and dark.

## Files

- `experiment/apple-reminders-ux/tokens.css` — new; light + dark values on `.reminders-experiment`
- `experiment/apple-reminders-ux/TaskListView/` — new: `TaskListView.tsx`, `sortTasks.ts`, `task-list-view.css`, `index.ts`
- `…/TaskListView/TaskRow/` — new; nested, single consumer
- `…/TaskListView/CaptureRow/` — new; nested, single consumer
- `…/AppleRemindersUxExperiment.tsx` — swaps the two production list components for `TaskListView`
- `…/apple-reminders-ux.css`, `SidebarNav/sidebar-nav.css`, `SyncStatus/sync-status.css` — hardcoded hexes replaced with tokens
- Read-only reuse: `hooks/useTasks`, `services/task-service-client.listPending`, `components/Toast`

## Boundaries

No schema, API, shared-model, or production-module changes — production components are dropped from this destination rather than restyled. Ordering is computed in the experiment: open tasks ascending by `created_at` (the hook returns descending), completed below them descending by `completed_at`. Nothing else about the data path changes.

**Known regression, accepted:** rows carry no delete affordance this iteration — delete belongs to the swipe iteration. `Recently Deleted` stays reachable but cannot be fed from this view until then.

## Tests

- `sortTasks.unit.test.ts` — open/completed partition, ordering within each group, stability.
- `TaskListView.unit.test.tsx` — capture commits on Return and reopens an empty row; empty blur discards; toggling completion moves the row below the open tasks.
- One added story in the existing `AppleRemindersUxExperiment.stories.tsx` pinning the loaded skin.

## Evidence

`screenshots/` — 390px: loaded list (light), loaded list (dark), capture row active, empty state. 1024px: loaded list.

## Built

- Landed as planned. Two deviations, both recorded in `acceptance-checks.md` → Verified: a failed
  task load is suppressed while local tasks are on screen, and the checkbox column is 36px rather
  than 44px.
- The Storybook story caught a dropped-keystroke bug in the capture row (`autoFocus` focuses after
  paint); focus is now taken in `useLayoutEffect`. Worth carrying into the production version.

## Open questions

- Whether the tinted large title should collapse into the header on scroll, as Reminders does — deferred, not blocking.
