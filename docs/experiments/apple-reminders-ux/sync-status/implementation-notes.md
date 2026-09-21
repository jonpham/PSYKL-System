# Implementation Notes — Sync Status Without a Banner

Iteration 2 of [`apple-reminders-ux`](../feature-card.md). Planning only; implementation starts after artifact approval.

## First slice

- Replace `OutOfSyncBanner` in the experiment shell with a compact content-header Sync control and add `sync` to the experiment's destination state.
- Render a read-only Sync view from existing queue and failed-operation stores; green means both counts are zero, yellow means either count is non-zero.

## Files

- `components/web_client/src/experiment/apple-reminders-ux/AppleRemindersUxExperiment.tsx` — compose the header control and Sync destination; remove the banner from this shell only
- `components/web_client/src/experiment/apple-reminders-ux/SyncStatus/` — new nested control and detail view, styles, and experiment-local state adapter
- `components/web_client/src/experiment/apple-reminders-ux/SidebarNav/SidebarNav.tsx` — recognize the Sync destination for active-state behavior only if needed
- `components/web_client/src/experiment/apple-reminders-ux/types.ts` — add the Sync destination
- Reused read-only: `hooks/useSyncDiscrepancy`, `db/idb` failed-operation query, Task/list change subscriptions

## Boundaries

- No schema, API, shared-model, sync-engine, or production-component changes. The existing production banner remains unchanged outside this experiment.
- Status derives only from existing queued and permanently failed records; connectivity and “last synced” time are not invented.

## Tests

- Storybook state set: clear header, attention header, and attention details at 390px; the attention story activates the control and verifies separate queue/failure counts.
- Unit-test only the experiment-local status derivation if combining queued and failed counts introduces logic beyond rendering. No End-to-End or Integration test.

## Evidence

- Capture 390px clear main view, 390px attention main view, 390px attention details, and 1024px clear main view into `screenshots/`.

## Open questions

- Review decision: whether the yellow control displays the combined count (`queued + failed`) or only a dot; the plan recommends the count because it communicates state without color alone.
