# Implementation Notes — Production/prototype parity

## First slice

One slice per surface, in this order, each red-test-first: (1) shell chrome + version footer relocation,
(2) Settings segmented controls + About, (3) task list rows/separator/spacing, (4) floating capture button.
Slice 3 is the one that changes user capability (task Delete removal) and is where the E2E suite moves.

## Files

Production source (11 — CSS is 5 of them):

- `components/web_client/src/App.tsx` — drop `<VersionFooter />`; pass `data-destination` through to the shell
- `components/web_client/src/components/AppShell/AppShell.tsx` — `data-destination` on the content header
- `components/web_client/src/components/AppShell/app-shell.css` — header column widths + `column-gap: 0`; `__header-action` becomes a 40px grey circle in column 3
- `components/web_client/src/components/SettingsView/SettingsView.tsx` — segmented Appearance + Contrast; new `About` → `Version` section
- `components/web_client/src/components/SettingsView/settings-view.css` — segmented-control styling ported from `reminders-settings__segmented`
- `components/web_client/src/components/VersionFooter/VersionFooter.tsx` — drop inline styles; render under a `Version` sub-heading
- `components/web_client/src/components/VersionFooter/version-footer.css` — new
- `components/web_client/src/components/TaskList/TaskList.tsx` — floating capture button, keeps the offline-ceiling disabled state
- `components/web_client/src/components/TaskList/task-list.css` — sticky bottom-trailing capture bar
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — remove the Delete button and its confirm window
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — `+ ::before` inset separator; padding moves from row to title

Reused unchanged: `useTasks`, `useLists`, `useAppearance`, `useSyncDiscrepancy`, `ListMenu`, `ListsPage`, `SyncView`, `SidebarNav`, `src/styles/tokens.css`.

## Data / API

**Empty.** No schema change, no endpoint change, no shared-model change. `deleteTask` stays on `useTasks` and
in the API client — only its UI trigger is removed.

## Tests

- **Unit** — `TaskRow` no longer renders a Delete control; `SettingsView` renders both radiogroups as segments and an About/Version block; `VersionFooter` renders under a `Version` heading.
- **Component (Storybook)** — `TaskList.capture.stories.tsx` retargeted to the floating button; a new story pinning capture-below-last-open-task so the single-separator rule is visible; `SettingsView` segmented story.
- **E2E** — `settings.e2e.spec.ts` gains "the version readout is only on Settings"; `task_list.e2e.spec.ts` gains "a user adds a task from the floating button" and drops its delete path. **`recently_deleted.e2e.spec.ts`, `task_list-offline-sync.e2e.spec.ts` and `e2e/helpers/multi-device.ts` delete tasks through the UI** — with the button gone they must delete via `taskServiceClient`/API seeding in the harness, not through a UI affordance that no longer exists.
- Static analysis unchanged: `pnpm -r lint typecheck format:check`.

## Evidence

Screenshots into `screenshots/`: task list (idle, capturing, offline ceiling), Lists header, Settings (light + dark, standard + increased contrast), at 390px and 1280px.

## Decisions (operator, 2026-09-22)

1. **Task deletion** — remove the row's Delete button now and accept the gap. A task can be completed but not deleted from the UI until swipe-to-delete lands as its own later change; Recently Deleted keeps working for lists. `recently_deleted.e2e.spec.ts`, `task_list-offline-sync.e2e.spec.ts` and `e2e/helpers/multi-device.ts` delete through the API instead.
2. **Floating button label** — keep `New Task`. Visual parity with the prototype, PSYKL's domain noun, no E2E selector churn. Deliberate deviation from the prototype's `New Reminder`.

## Open questions

- **PR size.** 11 production source files, 5 of them CSS. Proposed: one PR, since the eleven are one coherent visual change; split into chrome/settings and task-list PRs if review prefers.
