# Acceptance Checks — Sidebar Navigation on Desktop and Mobile

Observable at `/exp/apple-reminders-ux`. Narrow = ~390px (iPhone PWA); wide = ≥768px.

- [ ] **Primary path (mobile)** — At 390px the sidebar is hidden; tapping the `PSYKL` heading opens it; tapping `Settings` shows Settings in the main area and closes the sidebar in one action.
- [ ] **All three destinations** — Lists (each list by name), Recently Deleted, and Settings are each reachable from the sidebar and each replaces the main view.
- [ ] **No leftover chrome** — No list-switcher, Recently Deleted, or Settings buttons remain in the main content area at any width.
- [ ] **Version info relocated** — Web/API commit and sync status appear inside the Settings view only, not as a footer under the task list.
- [ ] **Wide layout** — At ≥768px the sidebar is visible without opening it, the main view sits beside it and uses the full viewport width (no 640px cap), and selecting a destination leaves the sidebar open.
- [ ] **Dismissal** — With the sidebar open on mobile, tapping the dimmed main area or pressing `Escape` closes it without changing the destination.
- [ ] **Keyboard & focus** — The heading control is reachable by Tab and reports `aria-expanded`; opening moves focus into the sidebar, and closing returns focus to the heading control.
- [ ] **Active state** — The current destination is marked in the sidebar (visually and via `aria-current`).

## Verified

- Storybook primary mobile path and focus behavior: `pnpm --filter @psykl/web-client test:component:stories`.
- Wide sidebar/content placement is covered by the desktop Storybook state.
- Browser review captured at 390×844 and 1024×768 in [`screenshots/`](screenshots/).
- iPhone operator review at `http://10.0.1.120:5173/exp/apple-reminders-ux` remains pending; checks stay open until that review.
