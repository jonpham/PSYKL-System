# Acceptance Checks — Sync Status Without a Banner

Observable at `/exp/apple-reminders-ux`. Narrow = ~390px; wide = ≥768px.

- [x] **At a glance** — With no queued or failed changes, the content header has a compact green Sync control whose accessible name says sync is clear.
- [x] **Attention without interruption** — When either count is non-zero, the same icon control is yellow without exposing counts, a banner, a toast, or another main-view notification.
- [x] **Details** — Activating the control opens a Sync main view that separately reports changes waiting to sync and permanently failed changes in plain language.
- [x] **Live state** — Queue changes update the control and open detail view without a refresh; reloading derives the same status from existing local sync stores.
- [x] **No retry** — The detail view has no retry, delete, or queue-management action.
- [x] **Keyboard & focus** — The Sync control is reachable by Tab, communicates state without color alone, and receives `aria-current` while its detail view is active.
- [x] **Responsive placement** — The control remains visible without opening the sidebar at ~390px and does not overlap the title or experiment toolbar; the same information is available at ≥768px.

## Verified

- 2026-09-20: Unit tests cover icon-only clear/attention semantics, detail counts, activation, and live failed-count updates; Storybook covers the mobile attention flow.
- Browser review captured the main and detail states at 390×844 and the wide main state at 1024×768 in [`screenshots/`](screenshots/).
- The local API was intentionally absent during capture, so Task loading showed its existing error state; this did not block the isolated sync-status checks.
