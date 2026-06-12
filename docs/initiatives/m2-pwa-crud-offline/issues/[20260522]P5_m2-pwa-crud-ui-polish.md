---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: GH#42
branches: # one entry per DevTask (each branches off spec/m2-s5-... per revised workflow)
  -
prs: # one entry per DevTask PR (each targets the Spec branch)
  -
spec_branch: # spec/m2-s5-pwa-crud-ui-polish once cut
spec_pr: # PR URL for spec/m2-s5-... → main
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 5
devtasks_total: 2 # M2-11 + M2-12
devtasks_complete: 0
---

# 20260522 - M2 Spec 5: PWA CRUD UI (edit / complete / delete) + loading / empty / toast polish

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **user**, I want to **edit a task title inline, mark it complete, and delete it — with loading skeletons on cold start, a friendly empty state when I have no tasks, and clear toast errors when something can't sync** so that **the app feels finished, every action is reversible or recoverable, and I always know what's happening with my data**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-11 — Edit / complete / delete UI affordances.** Three new interaction surfaces: (a) inline title edit (click title → input field → blur or Enter to PATCH; Escape to cancel); (b) complete checkbox toggling `completed_at` between `now()` and `null` via PATCH (Decision #35 — toggle freely); (c) delete button with a confirmation step (single-button-double-click: first click shows "Confirm delete?", second click within 3s fires DELETE). All paths route through `replay.enqueue()` from Spec 3 — the UI never calls `fetch` directly. Component-layer tests using MSW for the underlying API: happy paths for each verb, offline path (op lands in `sync_queue`, no immediate network), LWW stale-write reconciliation (server returns newer state; UI re-renders from IDB). ~6 production behavior source files.
2. **DevTask M2-12 — Loading skeletons + empty state + toast system.** (a) Minimal skeleton component (gray pulsing rows) shown for the brief window between PWA cold-start render and IDB hydration completion — typically <100ms; the skeleton exists to avoid a flash-of-empty for users on slow devices. (b) Empty state: when `tasks` is empty (no tasks ever created, OR all tasks tombstoned), show a centered "No tasks yet. Create your first one." message with the create form prominent. (c) Toast component (already introduced in Spec 3 for permanent-fail) extended to cover: stale-write notifications ("Your edit was replaced by a more recent version"), bulk-delete confirmations, and offline-mode banner ("You're offline. Changes will sync when you reconnect."). Component-layer tests for each state transition. ~5 production behavior source files.

## Verification Steps

**Associated E2E test:** `e2e/m2-pwa-crud.e2e.spec.ts` (new, lands in this Spec) covers the happy path: create → edit title → mark complete → un-mark complete → delete. Multi-device LWW + offline scenarios live in Spec 6 (M2-13).

**Manual verification:**

_Setup / Preconditions_

- Specs 1, 2, 3, and 4 merged into `main`. (Or DevTasks present in dev stack.)
- Spec branch `spec/m2-s5-pwa-crud-ui-polish` cut from `main`; draft PR opened against `main`.
- `service-task` running on `:3000`. `web_client` running on `:5173`.
- Empty database (`docker volume rm psykl-pglite-data && docker compose up`) so empty state can be verified.

_Steps_

1. Run `pnpm --filter web_client test:component` — Component-layer tests pass for edit, complete-toggle, delete-confirmation, stale-write reconciliation, skeleton, empty state, all toast variants.
2. Run `pnpm test:e2e` (root-level) — the new M2 E2E spec passes against the Compose stack.
3. Open PWA. With no tasks in IDB and no tasks on server, observe: brief skeleton (~100ms), then empty state with the create-form prompt.
4. Create a task. Empty state disappears; task renders.
5. Click the task title. Input field appears with current title selected. Type a new title. Press Enter. Title updates. (DevTools → Network: one PATCH fires with new `updated_at`.)
6. Click the task title again. Type a new title. Press Escape. Edit cancels. No PATCH fires.
7. Click the complete checkbox. Task row updates (visual treatment for completed state — strikethrough or muted color). (DevTools → Network: PATCH with `completed_at: <ISO timestamp>`.)
8. Click the checkbox again. Task un-completes. (DevTools → Network: PATCH with `completed_at: null`.)
9. Click delete button. Button changes to "Confirm delete?". Wait 4 seconds. Confirmation reverts; no DELETE fires.
10. Click delete again. Confirmation shows. Click again within 3s. Task disappears. (DevTools → Network: DELETE with `deleted_at: <ISO timestamp>`. IDB → tasks store: the row carries `deleted_at`; `useTasks()` filters it from the displayed list.)
11. Trigger a permanent-fail manually: temporarily mock the server to return 422 on PATCH (via DevTools → Network → request blocking, or by editing service code locally). Edit a task title. Observe toast "Couldn't sync — see console." IDB `failed_ops` populated. Row keeps the local typed value (Decision #48 — keep local state).
12. Trigger a stale-write: in `curl`, PATCH a task with a future `updated_at`. Then edit the same task in the PWA UI with a "natural" `updated_at` (now). PATCH fires from PWA but server returns 200 with the curl-applied (newer) state. PWA toast: "Your edit was replaced by a more recent version." Task row updates to the server value.
13. Toggle Network "Offline" ON. Observe offline banner toast appears. Create or edit a task. Confirm row renders with opacity+dot (Spec 3 affordance). Toggle "Offline" OFF. Banner disappears. Pending rows sync.

_Expectation_
M2 ships a feel-finished UX. Every action has a clear affordance, a fast optimistic response, a recoverable confirmation for destructive operations, and a clear surface when something can't sync. The user never has to know whether they're online or offline — the app just works.

## Affected Components

- `components/web_client/` (extended):
  - `src/components/TaskList/TaskRow/TaskRow.tsx` (new — inline edit, complete checkbox, delete button with confirmation step).
  - `src/components/TaskList/TaskRow/__tests__/TaskRow.unit.test.tsx` (new — edit / complete / delete / cancel paths).
  - `src/components/TaskList/Skeleton/Skeleton.tsx` (new — gray pulsing placeholder rows, private to TaskList until a second consumer exists).
  - `src/components/TaskList/EmptyState/EmptyState.tsx` (new — empty-list messaging, private to TaskList until a second consumer exists).
  - `src/components/Toast/Toast.tsx` (extended — variants: error, info, offline-banner).
  - `src/components/Toast/__tests__/Toast.stories.tsx` (component coverage — variant + dismissal states).
  - `src/components/TaskList/TaskList.tsx` (extended — render skeleton / empty / list depending on hydration + count).
  - `src/api/mutations.ts` (extended — `editTitle()`, `toggleCompleted()`, `softDelete()` helpers that call `replay.enqueue()`).
  - `e2e/m2-pwa-crud.e2e.spec.ts` (new — happy-path E2E for create / edit / complete / delete).

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix:

- **#35** Completed Tasks can be un-completed by toggling `completed_at: null` via PATCH.
- **#46** UI source of truth: IDB only via `useSyncExternalStore`. UI components never call `fetch` directly.
- **#47** Pending-state UI: opacity (60%) + small dot. (Already implemented in Spec 3; this Spec uses it.)
- **#48** Rollback behavior on permanent fail: keep local state; toast + indicator persist.

## Architecture Decisions (ADR)

- **ADR-M2-017:** Inline title edit uses click-to-edit (not a separate edit page or modal). Reason: minimum-friction edit is essential for a tool used dozens of times per day; modals add a click without adding clarity.
- **ADR-M2-018:** Delete confirmation is a single-button-double-click within a 3s window, NOT a modal dialog. Reason: modal dialogs interrupt flow; double-click gating with visible state ("Confirm delete?") provides the same protection against accidental clicks without a context switch. The 3s timeout is the standard "fat-finger protection" window.
- **ADR-M2-019:** Skeleton is shown ONLY when `useTasks()` reports `isHydrating === true` AND the IDB read has been pending for >50ms. For most cold starts the IDB read completes faster than the skeleton would render; the threshold avoids a flash-of-skeleton.
- **ADR-M2-020:** Empty state and skeleton are mutually exclusive; the UI never shows both. Skeleton implies "I'm fetching"; empty state implies "I'm done fetching and there's nothing." The UI tracks `(hydrating, tasks.length)` to pick the right one.
- **ADR-M2-021:** Toast variants: `error` (red, 8s, dismissible), `info` (gray, 4s, auto-dismiss), `offline-banner` (yellow, persistent until online). Three variants only. No success toasts — successful sync is the default state, communicating it explicitly is noise.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
