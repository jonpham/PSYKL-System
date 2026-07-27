---
status: TODO
issue: P5
pr:
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 5
devtasks_total: 2
devtasks_complete: 1
step_gating: false
honors_decisions: [35, 47, 48, 55]
---

# PWA CRUD UI Polish — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Complete user-facing Task Create/Read/Update/Delete (CRUD) interactions in the PWA and polish empty, loading, offline, and error states.

**Architecture:** UI mutation controls write to IDB through `replay.enqueue()` and never call `fetch` directly. Presentation components stay in per-component folders and use Storybook play functions for component-layer behavior.

**Tech Stack:** React, Storybook 8, MSW, `@storybook/test-runner`, Vitest, CSS modules or existing local styling conventions.

---

## Overview

As a user, I can edit a task inline, mark it complete, delete it with confirmation, and understand whether data is loading, empty, queued offline, or failed permanently. This spec touches `components/web_client`.

## Data Model

No schema changes. UI sends:

- PATCH title: `{ title, updated_at }`
- PATCH complete: `{ completed_at: nowIso, updated_at: nowIso }`
- PATCH uncomplete: `{ completed_at: null, updated_at: nowIso }`
- DELETE: `{ deleted_at: nowIso, updated_at: nowIso }`

## API

No new API surface. Uses Spec 1 endpoints through Spec 3 enqueue/replay.

## Implementation Components

- Modify `src/components/TaskList/TaskList.tsx`.
- Add private nested `TaskRow` component under `TaskList/TaskRow/`.
- Add loading skeleton component under `TaskList/TaskListSkeleton/`.
- Add private nested empty-state component under `TaskList/EmptyState/`.
- Extend `src/components/Toast/`.
- Update stories, unit tests, and MSW handlers.

## Test Plan

Unit:

| File                                                                                    | Assertion                                                       |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `components/web_client/src/components/TaskList/TaskRow/__tests__/TaskRow.unit.test.tsx` | edit, complete/uncomplete, and delete confirmation event wiring |
| `components/web_client/src/components/TaskList/__tests__/TaskList.unit.test.tsx`        | skeleton, empty state, queued state rendering                   |

Component:

| File                                                                           | Assertion                                                       |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx` | edit, complete, delete, offline queue, stale-write notification |
| `components/web_client/src/components/Toast/__tests__/Toast.stories.tsx`       | offline banner and permanent-fail toast states                  |

End-to-End: deferred to Spec 6.

## DevTasks

Spec integration branch: `spec/m2-s5-pwa-crud-ui-polish`.

### DevTask M2-11: Add edit, complete, and delete affordances

**Branch:** `feat/m2-s5-dt11-task-crud-affordances`
**Affected:** `components/web_client/src/components/TaskList/TaskList.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.unit.test.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx`, `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx`, `components/web_client/src/components/TaskList/TaskRow/__tests__/TaskRow.unit.test.tsx`, `components/web_client/src/components/TaskList/TaskRow/index.ts`, `components/web_client/src/test/msw-handlers.ts`.

- [x] Step 1: Write failing `TaskRow` tests for click-title-to-edit, Enter save, blur save, Escape cancel, complete toggle, uncomplete toggle, and two-click delete confirmation within 3 seconds.
- [x] Step 2: Write failing Storybook play functions proving each mutation enqueues the expected operation and does not call `fetch` directly from the component.
- [x] Step 3: Implement `TaskRow` as a private child of `TaskList`.
- [x] Step 4: Wire Task row actions to `enqueue()` with correct `updated_at`, `completed_at`, and `deleted_at` values.
- [x] Step 5: Add stale-write reconciliation story where server returns a newer row and IDB rerender replaces the local edit.
- [x] Step 6: Run `pnpm --filter @psykl/web-client test:unit` and `pnpm --filter @psykl/web-client test:component`.
- [x] Step 7: Commit with `feat: add pwa task edit complete delete controls`.

### DevTask M2-12: Add skeleton, empty state, and toast polish

**Branch:** `feat/m2-s5-dt12-task-ui-polish`
**Affected:** `components/web_client/src/components/TaskList/TaskList.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx`, `components/web_client/src/components/TaskList/TaskListSkeleton/TaskListSkeleton.tsx`, `components/web_client/src/components/TaskList/TaskListSkeleton/index.ts`, `components/web_client/src/components/TaskList/EmptyState/EmptyState.tsx`, `components/web_client/src/components/TaskList/EmptyState/index.ts`, `components/web_client/src/components/Toast/Toast.tsx`, `components/web_client/src/components/Toast/__tests__/Toast.stories.tsx`.

- [ ] Step 1: Write failing unit tests for IDB hydration loading skeleton and empty state when all tasks are tombstoned.
- [ ] Step 2: Write failing Storybook tests for offline banner, permanent-fail toast, and stale-write replacement toast.
- [ ] Step 3: Implement skeleton rows with stable dimensions so content does not shift when tasks load.
- [ ] Step 4: Implement empty state text: `No tasks yet. Create your first one.`
- [ ] Step 5: Extend toast component to support offline, permanent-fail, and stale-write messages.
- [ ] Step 6: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, and delete the P5 issue brief plus this spec at close-out.
- [ ] Step 7: Run `pnpm --filter @psykl/web-client test:unit` and `pnpm --filter @psykl/web-client test:component`.
- [ ] Step 8: Commit with `feat: polish pwa task states`.

## Verification

1. `pnpm verify:static`
2. `pnpm --filter @psykl/web-client test:unit`
3. `pnpm --filter @psykl/web-client test:component`

## Decisions made during spec drafting

- `TaskRow` is nested under `TaskList` because it has one consumer at creation time.

## Open Questions / Risks

- Text must be verified on mobile viewport during execution because this spec introduces denser row controls.

## Affected by / Depends on

- Depends on Specs 1, 2, and 3.
- Can run in parallel with Spec 4 after Spec 3 lands.
