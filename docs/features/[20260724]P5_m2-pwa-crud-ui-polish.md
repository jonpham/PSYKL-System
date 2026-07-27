---
status: DONE
issue: P5 (local plan; no GitHub issue)
branches:
  - feat/m2-s5-dt11-task-crud-affordances
  - feat/m2-s5-dt12-task-ui-polish
prs:
  - [#67](https://github.com/jonpham/PSYKL-System/pull/67)
  - [#68](https://github.com/jonpham/PSYKL-System/pull/68)
spec_pr: [#66](https://github.com/jonpham/PSYKL-System/pull/66)
completed_at: 2026-07-24
created_at: 2026-07-24
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 5: PWA CRUD UI Polish

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans` with `superpowers:test-driven-development`.

## User Story

As a user, I can edit a task inline, mark it complete, delete it with confirmation, and understand whether my data is loading, empty, queued offline, or permanently failed — all offline-first, with mutations flowing through the sync queue rather than direct network calls.

## Features

1. A private `TaskRow` component under `TaskList` provides the full Task CRUD surface:
   - **Inline title edit** — click the title to edit; **Enter** or **blur** saves, **Escape** cancels. Empty or unchanged titles enqueue nothing.
   - **Complete / uncomplete toggle** — a checkbox that sets or clears `completed_at`.
   - **Two-click delete** — the first click arms a `Confirm?` affordance that disarms after a 3-second window; the second click enqueues the delete and optimistically removes the row.
2. All `TaskRow` mutations route through `enqueue()` + `enqueueWithReplay()` (IndexedDB sync queue) with correct `updated_at`, `completed_at`, and `deleted_at` values — the component never calls `fetch` directly. `TaskList` delegates row rendering to `TaskRow` while preserving the pending-sync affordance from Spec 3.
3. A `TaskListSkeleton` renders fixed-height placeholder rows (`role="status"`, "Loading tasks") during IndexedDB hydration so content does not shift when tasks load.
4. An `EmptyState` component shows `No tasks yet. Create your first one.` when there are no visible (non-tombstoned) tasks.
5. The `Toast` component now covers three sync states: an **offline banner** (driven by the browser `online`/`offline` events), the pre-existing **permanent-fail** toast, and a new **stale-write** toast.
6. Stale-write reconciliation is wired end-to-end: `replay.ts` emits a `sync:stale-write` event (via `emitStaleWriteIfSuperseded`) when a successful `PATCH` response does not echo the `updated_at` we sent — i.e. the server kept a newer last-write-wins row from another device. The `Toast` surfaces `"<title>" was updated on another device and replaced your change.`
7. Component-layer coverage: Storybook play functions prove each mutation enqueues the expected op (not a direct fetch), offline-queue retention, offline banner, permanent-fail, and stale-write toasts.

## Design Decisions

- **`TaskRow` is nested under `TaskList`** because it has exactly one consumer at creation time (UI Component Folder Layout nesting rule).
- **Edit commit uses a single blur-driven path.** Enter and Escape both blur the input so `onBlur` is the only commit site; Escape arms a cancel ref so the ensuing blur discards the draft. This avoids double-enqueue and drops the earlier skip-blur indirection.
- **Stale-write detection = "server did not echo our `updated_at`."** On a winning last-write-wins `PATCH`, the service echoes the client `updated_at`; on a losing (stale) write it returns its own newer row, so `serverTask.updated_at !== body.updated_at` is a reliable, contract-light conflict signal. Non-patch ops never conflict this way.
- **Scope deviation from the plan's affected-files list (noted):** the plan scoped M2-12 to the `Toast` component only, but a stale-write toast with no emitter would be a dead listener. `src/sync/stale-write.ts` + a one-line call in `replay.ts` were added so the toast reflects real behavior, with dedicated unit coverage. Production behavior files in the two DevTask PRs stayed within the ≤10 limit.
- **Test/story file splits for `max-lines` (150).** `TaskRow` interaction tests split into `TaskRow.unit.test.tsx` (edit/complete) and `TaskRow.interactions.unit.test.tsx` (delete/pending); mutation stories split into `TaskList.mutations.stories.tsx`. Tests are excluded from the per-DevTask-PR production-file count.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m2-pwa-crud-offline/DESIGN.md`.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P5_m2-pwa-crud-ui-polish.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S5-pwa-crud-ui-polish.md` (deleted by this PR).

## DevTasks

| DevTask | Branch                                  | Summary                                       |
| ------- | --------------------------------------- | --------------------------------------------- |
| M2-11   | `feat/m2-s5-dt11-task-crud-affordances` | `TaskRow` edit / complete / delete controls   |
| M2-12   | `feat/m2-s5-dt12-task-ui-polish`        | Skeleton, empty state, and Toast state polish |

## Verification Steps

**Associated End-to-End test:** none in this Spec. M2 Spec 6 covers full multi-device offline flows.

**Manual verification**

Setup / Preconditions:

- Node 24 LTS is active; dependencies installed with `pnpm install`; generated artifacts refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:static`.
2. Run `pnpm --filter @psykl/web-client test:unit`.
3. Run `pnpm --filter @psykl/web-client test:component`.
4. Build and preview the PWA with `pnpm --filter @psykl/web-client build && pnpm --filter @psykl/web-client preview`.
5. In the running app: create a task, click its title to edit and save with Enter; toggle it complete and back; click Delete then Confirm to remove it.
6. Reload with an empty store and confirm the skeleton flashes during hydration, then the empty-state copy `No tasks yet. Create your first one.` appears.
7. Toggle the browser offline (DevTools → Network) and confirm the offline banner appears; go back online and confirm it clears.
