# Implementation Notes — Sync Status Without a Banner

Iteration 2 of [`apple-reminders-ux`](../feature-card.md). Planning only; implementation starts after artifact approval.

## First slice

- Replace `OutOfSyncBanner` in the experiment shell with a compact content-header sync icon and add `sync` to the experiment's destination state.
- Render a read-only Sync view from existing queue and failed-operation stores; green means both counts are zero, yellow means either count is non-zero.
- Add a status-colored `Sync` row to the existing Sidebar; both icon treatments use explicit equal dimensions and circular borders.

## Files

- `components/web_client/src/experiment/apple-reminders-ux/AppleRemindersUxExperiment.tsx` — compose the header control and Sync destination; remove the banner from this shell only
- `components/web_client/src/experiment/apple-reminders-ux/SyncStatus/` — new nested control and detail view, styles, and experiment-local state adapter
- `components/web_client/src/experiment/apple-reminders-ux/SidebarNav/SidebarNav.tsx` — expose the Sync destination and mirror its clear/attention state
- `components/web_client/src/experiment/apple-reminders-ux/types.ts` — add the Sync destination
- Reused read-only: `hooks/useSyncDiscrepancy`, `db/idb` failed-operation query, Task/list change subscriptions

## Boundaries

- No schema, API, shared-model, sync-engine, or production-component changes. The existing production banner remains unchanged outside this experiment.
- Status derives only from existing queued and permanently failed records; connectivity and “last synced” time are not invented.

## Tests

- Storybook: the 390px attention story opens the Sidebar Sync row and verifies separate queue/failure counts.
- Unit tests cover icon-only clear/attention rendering, activation, detail counts, and the live failed-count hook. No End-to-End or Integration test.

## Evidence

- Captured `390-main.png`, `390-sidebar.png`, `390-details.png`, and `1024-main.png` in `screenshots/`; the local offline state supplies the yellow attention case.

## Open questions

- Implemented the approved icon-only control; its accessible name communicates clear/attention state, while queued and failed counts remain in details.
