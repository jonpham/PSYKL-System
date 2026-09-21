---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 5
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - 1
  - 3
  - 4
---

# Sync, Recently Deleted, and Settings — Implementation Spec

> **Outline fidelity.** Expanded by `superpowers:writing-plans` when this Spec starts.
> **This Spec carries the initiative's highest chance of a backend proposal — read the Data Model
> section before planning.**

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 5/6
**Spec User Story:** _As someone who works offline and on more than one device, I open a Sync destination to see what is still waiting, what failed, and where another device replaced an edit of mine; I restore things I deleted by mistake; and I choose the app's appearance and find that choice still set tomorrow._
**Status:** see frontmatter
**Time-box:** ~3 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md) — **Decisions 3 and 4 are load-bearing here.**
**UI reference:** `screenshots/390-settings.png`, `390-recently-deleted.png`.

---

## Overview

Ships the three remaining destinations in the new visual language, and retires the two transient
surfaces the bootstrap shell used:

- **Sync** — a destination carrying queued operations, failed operations, **and stale-write records**
  (Decision 3: a stale write is a fact about data, not an event; it belongs somewhere durable the user
  can open hours later). Retires `components/OutOfSyncBanner/` and `components/Toast/`.
- **Recently Deleted** — the existing 30-day restore surface, re-rendered in row language.
- **Settings** — System / Light / Dark appearance, persisted device-locally to `sync_meta` using the
  pattern Spec 4 established.

Touches `components/web_client`. **Possibly `components/service-task` — see below.**

---

## Data Model

**Anticipated: none required.** Stale writes are already detectable client-side —
`src/sync/replay.ts` emits a `sync:stale-write` event and `src/sync/stale-write.ts` exists — and
`sync_meta` can hold the records the Sync view lists. Queued and failed operations are already in the
`sync_queue` and `failed_ops` stores.

**This is the most likely place in the initiative where that turns out to be wrong.** If the Sync view
needs something `sync_meta` cannot carry — a durable per-record stale-write history, a server-side
notion of which write won, or a retention policy for these records — **stop and bring the operator a
proposal before any implementation.** Mark this Spec `BLOCKED` and write the proposal into this
section. Do not invent the change, and do not quietly weaken the Sync view to avoid needing it.

Concretely, resolve during `superpowers:brainstorming` and raise if the answer is not "no":

1. Does a stale-write record need to survive a `sync_meta` clear, or is best-effort acceptable?
2. Does the user need to know **what** the other device's value was, or only that theirs was replaced?
3. Is there a retention limit, and who enforces it?

## API

**Anticipated: no API surface.** The same escalation rule applies — a proposal to the operator, never
an inferred contract change.

---

## Implementation Components

### `components/web_client/`

- `src/components/SyncView/` (new) — queued, failed, and stale-write records.
- `src/preferences/staleWrites.ts` (new) — records fed by the existing `sync:stale-write` event.
- `src/components/RecentlyDeleted/` — re-rendered in row language; keeps `useRecentlyDeleted`.
- `src/components/SettingsView/` (new) — System / Light / Dark, `sync_meta`-backed, replacing the
  prototype's `localStorage` `themeStore.ts`.
- `src/components/OutOfSyncBanner/`, `src/components/Toast/` — **deleted**.
- `src/App.tsx` — drops both.

---

## Test Plan

### Unit tests

| File                                                       | What it asserts                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/preferences/__tests__/appearance.unit.test.ts`        | the choice round-trips through `sync_meta` and is never enqueued                              |
| `src/preferences/__tests__/staleWrites.unit.test.ts`       | a `sync:stale-write` event produces a record; records are readable after a reload             |
| `src/components/SyncView/__tests__/SyncView.unit.test.tsx` | queued, failed, and stale-write sections render independently; each empty state reads plainly |

### Component tests (Storybook + play functions + MSW)

| File                                                                   | What it asserts                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/components/SyncView/__tests__/SyncView.stories.tsx`               | a queued op appears and clears when it drains; a failure is listed with its reason |
| `src/components/RecentlyDeleted/__tests__/RecentlyDeleted.stories.tsx` | restore returns the item to its list                                               |
| `src/components/SettingsView/__tests__/SettingsView.stories.tsx`       | switching appearance repaints without a reload                                     |

### End-to-End tests

| File                               | Title                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| `e2e/recently_deleted.e2e.spec.ts` | a user restores a task from Recently Deleted           |
| `e2e/sync_view.e2e.spec.ts`        | a user opens Sync and sees what is waiting             |
| `e2e/sync_view.e2e.spec.ts`        | a user is told when another device replaced their edit |
| `e2e/settings.e2e.spec.ts`         | a user switches appearance and it survives a reload    |

**Existing E2E specs to update in the same PR:** `e2e/offline_pressure.e2e.spec.ts` (the nag banner it
asserts on is retired — the signal moves to the header sync control and the Sync view),
`e2e/recently_deleted.e2e.spec.ts`, `e2e/task_list-offline-sync.e2e.spec.ts`.

> The offline nag at 25 changes and the hard write ceiling at 100 are **behaviour, not chrome**. They
> survive `OutOfSyncBanner`'s deletion; only their presentation moves. An E2E spec proving the ceiling
> still refuses writes must stay green.

### TDD order

1. Appearance preference unit tests (including never-enqueued) → implement → green
2. Stale-write record unit tests → implement → green
3. `SyncView` unit tests and story → implement → green
4. Recently Deleted and Settings stories → re-render → green
5. New and updated E2E specs → green
6. Delete `OutOfSyncBanner/` and `Toast/`; prove nothing imports them

---

## DevTasks

3 DevTasks off `spec/to-do-ui-s5-sync-recently-deleted-and-settings`.

### DevTask 10: Ship the Sync destination with queued and failed records

**Files:** ~5
**Branch:** `feat/to-do-ui-s5-dt10-sync-view`

### DevTask 11: Surface stale writes in the Sync view and retire `Toast` / `OutOfSyncBanner`

**Files:** ~5
**Branch:** `feat/to-do-ui-s5-dt11-stale-writes`

### DevTask 12: Re-render Recently Deleted and ship Settings appearance

**Files:** ~5
**Branch:** `feat/to-do-ui-s5-dt12-recently-deleted-and-settings`

---

## Verification (manual)

1. With the API down, make several edits — the header control and the Sync view both show the queue.
2. Bring the API back — the queue drains and the view empties.
3. Edit the same task on two devices — the losing device lists a stale-write record in Sync.
4. Switch appearance, reload — still set; check a second device — **not** set there.
5. Delete and restore a task.

## Open Questions / Risks

- The three questions in the Data Model section are unresolved and may produce a backend proposal.
- Retiring `Toast` removes the app's only transient feedback channel; confirm no other surface depends
  on it before deleting.

## Affected by / Depends on

Specs 1-4 must merge first; Spec 4 establishes the `sync_meta` preference pattern this Spec reuses.
