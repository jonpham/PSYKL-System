# Acceptance Checks — Sync Status Without a Banner

Observable at `/exp/apple-reminders-ux`. Narrow = ~390px; wide = ≥768px.

- [ ] **At a glance** — With no queued or failed changes, the content header has a compact green Sync control whose accessible name says sync is clear.
- [ ] **Attention without interruption** — When either count is non-zero, the same control is yellow and exposes the combined attention count without a banner, toast, or other main-view notification.
- [ ] **Details** — Activating the control opens a Sync main view that separately reports changes waiting to sync and permanently failed changes in plain language.
- [ ] **Live state** — Queue changes update the control and open detail view without a refresh; reloading derives the same status from existing local sync stores.
- [ ] **No retry** — The detail view has no retry, delete, or queue-management action.
- [ ] **Keyboard & focus** — The Sync control is reachable by Tab, communicates state without color alone, and receives `aria-current` while its detail view is active.
- [ ] **Responsive placement** — The control remains visible without opening the sidebar at ~390px and does not overlap the title or experiment toolbar; the same information is available at ≥768px.

## Verified

_Pending implementation and browser review._
