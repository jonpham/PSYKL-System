# Milestone `online-offline-modes` — Online-only and Offline data paths in the PWA

**Status:** Planning — design DRAFT awaiting operator review
**Design doc:** [`DESIGN.md`](DESIGN.md)
**Effort:** M (four Specs, client-only)
**Opened:** 2026-10-11
**Issues:** [#144](https://github.com/jonpham/PSYKL-System/issues/144), [#135](https://github.com/jonpham/PSYKL-System/issues/135)

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - IDB = IndexedDB, the browser's local database.
> - Offline Mode = the user setting choosing between the IDB + sync path (`true`, default) and the online-only path (`false`).

## Description

Give the PWA a second, online-only data path so the server's canonical data can be viewed without the local store, and isolate sync so the rest of the app does not know it exists.

## Scope

1. A Settings-level **Offline Mode** toggle, default on.
2. A seam in each `use{Entity}()` hook choosing the sync or API implementation.
3. An online-only implementation over TanStack Query.
4. Sync code moved behind `services/` (#135).

## Success Criteria

- With Offline Mode on, behaviour is identical to today and all existing tests pass unchanged in meaning.
- With Offline Mode off, Lists, Tasks, and Recently Deleted read and write the server directly and the app never opens the sync queue.
- No file under `hooks/` (other than `*.sync.ts`) or `components/` (other than the sync surfaces) imports `sync/`.
