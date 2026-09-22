---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 4
devtasks_total: 2
devtasks_complete: 0
honors_decisions:
  - 1
  - 4
---

# List Options and Completed Visibility — Implementation Spec

> **Outline fidelity.** Expanded by `superpowers:writing-plans` when this Spec starts.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 4/6
**Spec User Story:** _As someone whose list fills with finished work, I hide completed tasks from a list's options menu and find them still hidden when I come back tomorrow, and I delete a list I no longer need from the same menu._
**Status:** see frontmatter
**Time-box:** ~1-2 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md) — **Decision 4 is load-bearing here.**
**UI reference:** `screenshots/390-list-menu.png`.

---

## Overview

Adds the per-list overflow menu: show/hide completed, and delete list. The completed-visibility
preference is **device-local and persisted to the `sync_meta` IndexedDB store** — never enqueued,
never synced (Decision 4). This Spec establishes the `sync_meta` preference pattern that Spec 5's
appearance setting reuses.

Touches `components/web_client` only.

---

## Data Model

**None required, because** `sync_meta` is already in IndexedDB schema v2 and `putMeta` / `getMeta` /
`deleteMeta` already exist in `src/db/idb.ts`. **No version bump.** The preference is keyed per list
so hiding completed in one list does not hide them in another.

The prototype's `showCompletedStore.ts` used `localStorage` — an experiment-lane shortcut. It is
**rewritten onto `sync_meta`, not ported.**

**If a per-list key turns out not to fit `sync_meta`'s shape**, stop and bring the operator a proposal
before implementing.

## API

**No API surface, because** list delete already exists as a move to Recently Deleted
(`todo-experience` Spec 2) and the preference never leaves the device by design.

---

## Implementation Components

### `components/web_client/`

- `src/components/ListMenu/` (new) — the overflow menu, opened from the header.
- `src/preferences/completedVisibility.ts` (new) — `sync_meta`-backed read/write, replacing the
  prototype's `localStorage` store.
- `src/hooks/useCompletedVisibility.ts` (new) — the hook `TaskList` reads.
- `src/components/TaskList/TaskList.tsx` — filters completed tasks when hidden.
- `src/components/AppShell/` — mounts the menu in the header.

---

## Test Plan

### Unit tests

| File                                                         | What it asserts                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/preferences/__tests__/completedVisibility.unit.test.ts` | the preference round-trips through `sync_meta`; it is keyed per list; it is **never** enqueued to `sync_queue` |
| `src/components/ListMenu/__tests__/ListMenu.unit.test.tsx`   | the toggle reflects current state; delete asks before acting; Escape and outside-click dismiss                 |

### Component tests (Storybook + play functions + MSW)

| File                                                     | What it asserts                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/components/ListMenu/__tests__/ListMenu.stories.tsx` | hide completed → completed rows leave the list; show again → they return below the open ones |

### End-to-End tests

| File                           | Title                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| `e2e/list_options.e2e.spec.ts` | a user hides completed tasks and the setting survives a reload |
| `e2e/list_options.e2e.spec.ts` | a user deletes a list from its options menu                    |

**Existing E2E specs to update in the same PR:** `e2e/lists.e2e.spec.ts` (list delete moves from
`ListSwitcher` to the options menu), `e2e/recently_deleted.e2e.spec.ts` (a deleted list must still
arrive there).

**INHERITED OBLIGATION from Spec 1 — one skipped test to activate.** Spec 1 rewrote
`e2e/recently_deleted.e2e.spec.ts` and left exactly one test individually `test.skip`ped, because
deleting a list has no home on `/` until this Spec's options menu ships:

| File                               | Title                                                  | Action                                     |
| ---------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| `e2e/recently_deleted.e2e.spec.ts` | a user restores a deleted list and its tasks come back | remove `test.skip` and prove it green here |

It already drives `List options` → `Delete List` → `Delete List?` — the menu this Spec builds.
**Nothing in the test file says any of this**: per `docs/STYLE.md` → Code Comments, activation lives in
spec docs, not in code. This Spec does not close out until that test is green.

### TDD order

1. `sync_meta` preference unit tests, including the never-enqueued assertion → implement → green
2. `ListMenu` unit tests → implement → green
3. Story for the visibility toggle → wire `TaskList` → green
4. New E2E spec, plus updates to `lists` and `recently_deleted` → green

---

## DevTasks

2 DevTasks off `spec/to-do-ui-s4-list-options-and-completed-visibility`.

### DevTask 8: Persist completed visibility to `sync_meta`

**Files:** ~4
**Branch:** `feat/to-do-ui-s4-dt8-completed-visibility`

### DevTask 9: Ship the list options menu and move list delete into it

**Files:** ~4
**Branch:** `feat/to-do-ui-s4-dt9-list-menu`

---

## Verification (manual)

1. Hide completed, reload — still hidden.
2. Open the same account on a second device (or a second browser profile) — completed are **still
   shown** there. A preference that syncs is a bug, not a nicety.
3. Delete a list and find it in Recently Deleted.

## Open Questions / Risks

- This is the first `sync_meta` preference in production. Get the pattern right; Spec 5 copies it.
- The never-synced property is easy to break and invisible when broken — hence the explicit
  never-enqueued unit assertion.

## Affected by / Depends on

Specs 1-3 must merge first.
