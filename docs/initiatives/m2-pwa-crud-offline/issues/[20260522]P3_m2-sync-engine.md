---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: GH#40
branches: # one entry per DevTask (each branches off spec/m2-s3-... per revised workflow)
  -
prs: # one entry per DevTask PR (each targets the Spec branch)
  -
spec_branch: # spec/m2-s3-sync-engine once cut
spec_pr: # PR URL for spec/m2-s3-... → main
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 3
devtasks_total: 2 # M2-7 + M2-8
devtasks_complete: 0
---

# 20260522 - M2 Spec 3: Sync engine (shared replay module + page-side triggers + optimistic UI)

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **user**, I want **the PWA to queue my edits locally when I'm offline and quietly sync them when I'm back online** so that **I never have to wait for the network before seeing my work, never lose a task because Wi-Fi cut out mid-save, and never see a sync failure that requires me to retype anything**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-7 — Shared replay module + IDB lock.** New `src/sync/replay.ts` — importable from BOTH the page bundle AND the Service Worker context (Decision #52). Exposes `enqueue(op)` (atomic IDB tx: write to `tasks` + write to `sync_queue`), `replay()` (drain sync_queue FIFO with backoff + Idempotency-Key + LWW reconciliation), `acquireReplayLock()` / `releaseReplayLock()` with a 30-second stale-after timeout backed by a `sync_meta.replay_lock` row. Exponential backoff with jitter on 5xx / network. Permanent-fail (4xx) deletes the op from `sync_queue`, writes to `failed_ops`, and emits a `sync:permanent-fail` event. Unit + Integration tests using `fake-indexeddb` + MSW. ~6 production behavior source files.
2. **DevTask M2-8 — Page-side triggers + optimistic UI affordances.** Page registers `window.addEventListener('online', () => replay())`, `document.addEventListener('visibilitychange', ...)` (replay on app-focus), and a post-write trigger (replay after each `enqueue()`). UI affordances: rows with at least one `sync_queue` row matching their `task_id` render at 60% opacity AND carry a small dot indicator (Decision #47). Indicator clears when the queue drains for that task. Toast surface (reused later in Spec 5) for permanent-fail events. Component-layer tests cover replay-on-online, replay-on-focus, optimistic affordance render, and toast on `sync:permanent-fail`. ~6 production behavior source files.

## Verification Steps

**Associated E2E test:** none directly in this Spec — Spec 6 (M2-13) covers the full offline-create-online-sync E2E with two Playwright contexts. This Spec ships Component-layer tests using DevTools-Offline-equivalent stubs (MSW + fake network state).

**Manual verification:**

_Setup / Preconditions_

- Specs 1 and 2 merged into `main`. (Or DevTasks present in dev stack.)
- Spec branch `spec/m2-s3-sync-engine` cut from `main`; draft PR opened against `main`.
- `service-task` running on `:3000`. `web_client` running on `:5173`.
- At least two Tasks exist (so list rendering can show mixed pending/synced states).

_Steps_

1. Run `pnpm --filter web_client test:unit` — `replay.ts` pure-function tests pass (enqueue atomicity, queue FIFO order, LWW reconciliation logic, lock acquire/release contract).
2. Run `pnpm --filter web_client test:integration` — replay loop tests pass against real IDB + MSW stub service: happy-path replay, retry-on-5xx with backoff, permanent-fail on 4xx writes to `failed_ops` and removes from `sync_queue`, stale-write reconciliation overwrites local row with server response.
3. Run `pnpm --filter web_client test:component` — page-side trigger tests pass: `online` event triggers replay, `visibilitychange` triggers replay, post-write triggers replay, opacity+dot render for queued tasks, toast appears on `sync:permanent-fail`.
4. Open PWA at `:5173`. Toggle DevTools → Network → "Offline" ON.
5. Click "Create Task", type a title, submit. Confirm: task appears in the list IMMEDIATELY (no spinner, no network), rendered at 60% opacity with the small dot indicator.
6. Inspect DevTools → Application → IndexedDB → `psykl` → `sync_queue` — one row exists with `op_type=create`, the new task's payload, and an `Idempotency-Key`-shaped `op_id`.
7. Toggle "Offline" OFF.
8. Within ~1 second, the row's opacity returns to full and the dot disappears. `sync_queue` is empty. Network shows one POST `/tasks` with `Idempotency-Key` header.
9. Repeat steps 5-8 but, before going back online, perform 3 quick edits to the new task's title. `sync_queue` shows one `create` + three `patch` rows. Going online drains them in order; final server state matches final client state.
10. Test stale-write reconciliation: in a parallel `curl` session, PATCH a task with a later `updated_at` than your offline-pending edit. Then go online with the PWA. The PWA's pending PATCH replays, server returns 200 with the current (newer) state, IDB reconciles, UI updates to show the server's value.

_Expectation_
The PWA's offline-first promise is real. Edits never block on network. The queue is durable across reloads. Replay is FIFO, idempotent, and LWW-correct. The user sees a quiet pending indicator that resolves itself — no spinners, no errors for transient network issues.

## Affected Components

- `components/web_client/` (extended):
  - `src/sync/replay.ts` (new — shared replay module).
  - `src/sync/__tests__/replay.unit.test.ts`, `tests/integration/replay.integration.test.ts` (new test files).
  - `src/sync/lock.ts` (new — IDB-backed replay lock with 30s stale timeout).
  - `src/sync/triggers.ts` (new — page-side `online` / `visibilitychange` / post-write trigger registration).
  - `src/sync/__tests__/triggers.unit.test.ts` (new — trigger contract tests).
  - `src/components/TaskList/TaskList.tsx` (extended — opacity + dot rendering for queued rows).
  - `src/components/TaskList/PendingIndicator/PendingIndicator.tsx` (new — the dot component, private to TaskList until a second consumer exists).
  - `src/components/Toast/Toast.tsx` (new — toast surface, also used in Spec 5).
  - `src/hooks/useSyncEvents.ts` (new — subscription to `sync:*` events for UI consumers).

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix:

- **#40** Sync queue model: operation log + client-side append-only. FIFO replay.
- **#41** Idempotency wire format: HTTP header `Idempotency-Key: <UUID v7>`.
- **#42** Permanent-fail handling: `failed_ops` IDB store + console error + toast. No UI surface in M2.
- **#43** LWW timestamp authority: hybrid. Client `updated_at` is the comparison key.
- **#47** Pending-state UI: opacity (60%) + small dot.
- **#48** Rollback behavior on permanent fail: keep local state; toast + indicator persist.
- **#52** Sync engine location: hybrid — shared `src/sync/replay.ts` imported by both bundle and Service Worker (Spec 4 wires the SW side). IDB lock prevents concurrent replay.

## Architecture Decisions (ADR)

- **ADR-M2-009:** Replay is FIFO across the entire queue, not per-task. Enforced by the single replay lock. Per-task FIFO with parallel replay across tasks is rejected — increases complexity and creates interleaving edge cases for marginal throughput gain. See Decision #40.
- **ADR-M2-010:** Replay lock is an IDB row, not a `navigator.locks` Web Lock. Reason: `navigator.locks` is not available inside the Service Worker reliably across browsers; the IDB row works identically in both contexts. The 30s stale-after timeout is conservative — long-running replays (offline-for-weeks user with hundreds of ops) emit heartbeat updates to the lock row every 10s to defer expiry.
- **ADR-M2-011:** `enqueue()` and `replay()` are pure with respect to the rest of the app. UI components fire `enqueue()` and walk away; they do NOT await network results. The hook system updates the UI when IDB changes (per Spec 2's `useTasks()` subscription). This decoupling is what makes offline-first UX instant.
- **ADR-M2-012:** Idempotency-Key is generated as UUID v7 at enqueue time (same time as the op_id IDB primary key). On retry, the same key is reused. UUID v7 sorts by time, so the FIFO queue order is preserved by primary-key sort.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
