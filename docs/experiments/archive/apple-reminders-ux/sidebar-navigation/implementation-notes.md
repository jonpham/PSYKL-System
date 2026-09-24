# Implementation Notes — Sidebar Navigation on Desktop and Mobile

Iteration 1 of the [`apple-reminders-ux`](../feature-card.md) experiment. The route is the long-lived shell; each iteration adds to it rather than replacing it.

## First slice

- Experiment shell at `/exp/apple-reminders-ux` holding local `destination` state (`list | recently-deleted | settings`) and `sidebarOpen` state, rendering the existing task UI for the list destination.
- Sidebar hidden below 768px / persistent above, via a CSS media query — no JS breakpoint listener.
- The implementation uses a CSS container query at the same 768px threshold so the isolated shell is responsive both at the route and inside its 390px Storybook harness; there is still no JS breakpoint listener.
- Mobile open control: `☰ PSYKL` (hamburger glyph alongside the wordmark), one toggle carrying `aria-expanded`.

## Files

- `components/web_client/src/experiment/apple-reminders-ux/AppleRemindersUxExperiment.tsx` — new (shell, destination + open state)
- `components/web_client/src/experiment/apple-reminders-ux/SidebarNav/SidebarNav.tsx` — new (nested; only consumer is the shell)
- `components/web_client/src/experiment/apple-reminders-ux/SettingsView/SettingsView.tsx` — new (main-area Settings incl. version block)
- `components/web_client/src/experiment/apple-reminders-ux/index.ts` — new
- `components/web_client/src/experiment/registry.ts` — one entry added
- `components/web_client/src/experiment/registry.types.ts` + `ExperimentFrame/ExperimentFrame.tsx` + `ExperimentRouter/ExperimentRouter.tsx` — see Layout below
- Reused read-only: `components/VersionFooter`, `components/RecentlyDeleted`, `components/TaskList`, `components/TaskCreateForm`, `components/Toast`, `components/OutOfSyncBanner`, `hooks/useLists`, `hooks/useActiveList`

## Layout (was the 640px "constraint")

`ExperimentFrame` currently hard-codes `maxWidth: 640` for every experiment, which would cap this shell at a width the hypothesis is explicitly about. Fix rather than accept: add an optional `layout: 'centered' | 'full'` field to `Experiment` (default `centered`, so no other experiment changes) which `ExperimentRouter` passes to `ExperimentFrame`; `full` drops the max-width and page padding so the shell owns the viewport. This touches experiment infrastructure only — `src/experiment/*`, no production module — and its three existing unit tests get a case for the new mode.

Experiment chrome is one collapsed-by-default floating toolbar. Expanding it reveals the prototype warning and `Close experiment`; because it is fixed-positioned, neither state changes the experiment viewport or responsive layout.

## Boundaries

- No schema, API, shared-model, or production-module changes. `App.tsx` is untouched — the experiment is a parallel shell, not a refactor of the real one.
- `RecentlyDeleted` and `Settings` are production dialog components (`open`/`onClose`). The experiment renders `RecentlyDeleted` with `open` fixed true inside the main area rather than editing it; Settings content is re-composed in `SettingsView` (reusing `ExperimentsIndex` + `VersionFooter`) instead of reusing the production dialog, because the production one is dialog-shaped by design.

## Tests

- Storybook: `__tests__/AppleRemindersUxExperiment.stories.tsx` — one play function for the primary path (tap `☰ PSYKL` → sidebar open → select Settings → Settings visible, sidebar closed) at a 390px viewport.
- Unit: `SidebarNav.unit.test.tsx` only if destination/active-state logic grows beyond a switch; plus the added `ExperimentFrame` layout case. No E2E, no integration (workflow Test Floor).

## Evidence

Into `screenshots/`: 390px closed, floating toolbar expanded, 390px sidebar open, 390px Settings destination, and 1024px persistent sidebar.

## Open questions

_None blocking._ Resolved in review: no task counts in the sidebar; mobile control is the hamburger glyph alongside the `PSYKL` wordmark.
