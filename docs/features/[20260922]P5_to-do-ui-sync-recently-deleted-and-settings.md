---
status: IN-PROGRESS
issue: P5
branches:
  - feat/to-do-ui-s5-dt10-sync-view
  - feat/to-do-ui-s5-dt12-recently-deleted-and-settings
  - feat/to-do-ui-s5-dt11-stale-writes
prs:
  - https://github.com/jonpham/PSYKL-System/pull/111
  - https://github.com/jonpham/PSYKL-System/pull/112
  - https://github.com/jonpham/PSYKL-System/pull/115
completed_at:
created_at: 2026-09-22
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260921-Spec5-sync-recently-deleted-and-settings.md (deleted at Spec close-out; see git history)
---

# Sync, Recently Deleted, and Settings

## User Story

As someone working across two devices, I open Sync to see what has not reached the server, what was
refused, and which of my edits another device replaced — and I set how the app looks on this device
without changing it on the other.

## Features

1. A **Sync** destination listing queued operations, permanently failed ones with the reason given,
   and conflicts where another device's edit replaced this device's.
2. A conflict record keeps **both versions** — what this device wrote and what replaced it — collapsed
   until the user opens it, dismissible, and otherwise kept for 30 days.
3. **Recently Deleted** re-rendered as a destination in the row language.
4. **Settings** with Appearance (System / Light / Dark) and Contrast (Standard / Increased), both
   device-local, composing into four combinations.
5. `Toast` and `OutOfSyncBanner` retired.

## Verification Steps

**Associated E2E tests:** `e2e/sync_view.e2e.spec.ts`, `e2e/settings.e2e.spec.ts`,
`e2e/recently_deleted.e2e.spec.ts`, `e2e/offline_pressure.e2e.spec.ts`

**Manual verification**

_Setup / Preconditions_ — two browser profiles against the same account.

_Steps_

1. Take one offline, edit a task on it, edit the same task on the other, bring the first back online.
2. Open Sync on the first device and expand the conflict.
3. Switch appearance and contrast; reload; check the second device is unaffected.

_Expectation_ — the losing device lists the conflict with both versions and keeps it until dismissed;
preferences survive a reload and never travel between devices.

## Affected Components

- `components/web_client/src/components/SyncView/` — queued, failed, and replaced-edit records
- `components/web_client/src/preferences/staleWrites.ts` — conflict records in `sync_meta`
- `components/web_client/src/sync/stale-write.ts` — records both versions at the conflict
- `components/web_client/src/components/SettingsView/`, `src/hooks/useAppearance.ts` — appearance and contrast
- `components/web_client/src/components/RecentlyDeleted/` — re-rendered as a destination
- `components/web_client/src/components/Toast/`, `src/components/OutOfSyncBanner/` — **deleted**

## Design Decisions

Operator decisions, 2026-09-22, answering the three questions the Spec required before implementation:

- **Best-effort survivability.** Conflict records live in `sync_meta`; clearing the app's local data
  clears them. No new store, no schema version bump, no API change.
- **Both versions are shown.** A record carries the change this device wrote and the change that
  superseded it. Both were already in hand at `replay.ts` — `entry.body` and the server's response —
  so showing the user their own words costs nothing extra.
- **Dismissible, else 30 days.** A user can dismiss a record they have read; otherwise it expires after
  30 days, the same window Recently Deleted uses. No count cap.
- **A conflict is a fact, not an event.** That is why `Toast` goes: a banner that vanishes is no use
  hours later. Permanent failures move to the Sync view's "Could not be sent" section, so nothing that
  `Toast` reported is lost — it stops interrupting and starts waiting to be found.
- **The offline nag keeps its behaviour, loses its banner.** The 25-change nag and the 100-change write
  ceiling are unchanged; the signal is the header sync control and the Sync view.

## Architecture Decisions (ADR)

- None. Entirely client-side: no schema change, no API surface, no sync-protocol change.

## Change Log

| Date       | PR                                                       | Summary                                                        |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 2026-09-22 | [#111](https://github.com/jonpham/PSYKL-System/pull/111) | Sync destination with queued and failed work                   |
| 2026-09-22 | [#112](https://github.com/jonpham/PSYKL-System/pull/112) | Appearance and contrast settings; Recently Deleted re-rendered |
| 2026-09-22 | [#113](https://github.com/jonpham/PSYKL-System/pull/115) | Conflict records; `Toast` and `OutOfSyncBanner` retired        |
