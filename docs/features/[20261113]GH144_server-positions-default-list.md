---
status: DONE
issue: GH144
branches:
  - spec/online-offline-modes-s2-server-positions-default-list # Spec integration branch
  - feat/online-offline-modes-s2-dt5-default-list-undeletable-ui
  - feat/online-offline-modes-s2-dt6-list-api-contract
  - feat/online-offline-modes-s2-dt7-seeded-default-list
prs:
  - https://github.com/jonpham/PSYKL-System/pull/151
  - https://github.com/jonpham/PSYKL-System/pull/152
  - _tbd_ # DevTask 7
completed_at: # set when the Spec integration PR merges to main
created_at: 2026-11-13
initiative: online-offline-modes
spec: docs/specs/online-offline-modes/20261113-Spec2-server-positions-default-list.md (deleted at close-out; this doc is the record)
---

# Server Positions and an Undeletable Default List

> Glossary:
>
> - PWA = Progressive Web App.
> - Default list = the "Tasks" list every account starts with, identified by the fixed id `DEFAULT_LIST_ID` (`00000000-0000-7000-8000-000000000001`).
> - Position = a list's `fractional-indexing` key, stored as text `COLLATE "C"`, which orders the lists.
> - Seed = the start-up step in `service-task` that keeps the default list in place.

## User Story

As a PSYKL user, I always have my "Tasks" list, so that a task whose list is gone always has somewhere to land. As a client of the list API, I can create a list without picking its position, so that an online-only client (Spec 3) needs no ordering logic of its own.

## Features

1. [#144](https://github.com/jonpham/PSYKL-System/issues/144): **the PWA never offers to delete the default list** (Decision 16).
   - List options on "Tasks" shows no Delete List, even after the list is renamed. Every other list still offers it.
   - `useLists()` returns `canDeleteList(id)` in place of the single `canDelete` flag. The sync path refuses to delete the default list as well as the last remaining list.
   - The default list follows its fixed id (S2-5). Moving another list above "Tasks" no longer moves tasks without a list there.
2. **The list API refuses to delete the default list** (Decision 16). `DELETE /lists/{DEFAULT_LIST_ID}` answers `409` "The default list cannot be deleted". A caller who doesn't own it still gets `404`. A delete a device queued before the rule lands in Failed, like any refused write.
3. **`POST /lists` takes an optional `position`** (Decision 10). Without one, the server appends the list after the caller's highest position, deleted lists included (S2-4). One transaction per create keeps two simultaneous creates on distinct keys. A position the client sends is stored as sent.
4. **The server keeps the default list** (Decision 15). At start-up and after a test reset, `service-task` creates the default list if it's missing and restores it if a device deleted it before Decision 16 (S2-1, S2-2).

## Visual Record

**The "Tasks" default list → List options.** There is no Delete List item. Nothing replaces it: no disabled item and no explanation. The menu simply holds fewer actions, as it already does when only one list exists.

```text
┌ Tasks ───────────────── ⟳  ⋯ ┐
│ ○ buy stamps                  │
│ ○ call the dentist            │      ┌──────────────────────┐
│                               │      │ Show Completed (2)   │
│                               │      │ Select Items         │
│                               │      └──────────────────────┘
└───────────────────────────────┘
```

**Any other list → List options.** Nothing changes: Delete List is still offered and still opens the existing delete question.

```text
┌ Groceries ───────────── ⟳  ⋯ ┐
│ ○ oat milk                    │      ┌──────────────────────┐
│                               │      │ Show Completed (0)   │
│                               │      │ Select Items         │
│                               │      │ Delete List          │  ← red, as today
└───────────────────────────────┘      └──────────────────────┘
```

Built as planned. The rule follows the list's fixed id, not its title: a renamed default list still cannot be deleted, and a user-made list titled "Tasks" can. With Offline Mode off, the online path offers no Delete List on any list until Spec 3.

## Verification Steps

**Associated E2E test:** `e2e/list_deletion.e2e.spec.ts` → "a user is never offered to delete their Tasks list, even after renaming it".

**Manual verification**

_Setup / Preconditions_ — `pnpm install && docker compose up --build`.

_Steps_

1. `curl -s localhost:3000/lists -H 'X-User-Id: local'` returns one list: `Tasks`, `a0`.
2. `curl -s -X POST localhost:3000/lists -H 'X-User-Id: local' -H 'Content-Type: application/json' -d '{"id":"0199bbbb-0000-7000-8000-000000000001","title":"Reading","updated_at":"2026-11-13T10:00:00.000Z"}'` returns `"position":"a1"`.
3. `curl -s -o /dev/null -w '%{http_code}' -X DELETE localhost:3000/lists/00000000-0000-7000-8000-000000000001 -H 'X-User-Id: local' -H 'Content-Type: application/json' -d '{"deleted_at":"2026-11-13T10:00:00.000Z"}'` prints `409`.
4. In the PWA, open List options on both lists. "Tasks" shows no Delete List; "Reading" still offers it.

_Expectation_ — the server starts with the default list, appends lists sent without a position, and never deletes the default list; the PWA never offers to.

## Affected Components

- `components/web_client`:
  - `src/services/default-list.ts` (new): `DEFAULT_LIST_ID`, `isDefaultList`
  - `src/hooks/useLists.ts`, `useLists.sync.ts`, `useLists.api.ts`, `useLists.default-list.ts`
  - `src/App.tsx`
- `packages/shared-types`:
  - `src/schemas/list.ts`: optional `ListInput.position`; `DEFAULT_LIST_ID`, `DEFAULT_LIST_TITLE`
  - `src/openapi/list-paths.ts`: the `409` on DELETE
- `components/service-task`:
  - `src/list/list.service.ts`: the `409`, `appendPosition`
  - `src/list/default-list.seed.ts` (new), `src/app.bootstrap.ts` (new), `src/main.ts`
  - `src/testing/test-reset.controller.ts`: re-seeds after the truncate
  - New dependency: `fractional-indexing@^4.0.0`, the version `web_client` pins

## Design Decisions

- **S2-1 — The seed creates the default list if it's missing and restores it if it's deleted.** Under Decision 16 the list is never deleted, so the seed only repairs data from before the rule. A recreated list goes ahead of the user's first list, where a new user finds it.
- **S2-2 — Seed from start-up (`prepareApp`) and the test reset, not from `createDb()`.** This keeps every existing test's empty database empty. `prepareApp` also moves CORS and the guard out of `main.ts`, so a contract test runs the real start-up.
- **S2-3 — A newly created seed has the epoch as `updated_at`; a restore uses `now()`.** A device's edit wins over a fresh seed, and a restore wins over the stale tombstone.
- **S2-4 — Appended positions count deleted lists.** A restored list cannot land on the same key as one created while it was deleted.
- **S2-5 — `getDefaultListId` follows `DEFAULT_LIST_ID`** (operator, 2026-11-13). The earliest list stays as a fallback for a device that doesn't hold "Tasks" locally yet.
- **No new client code for a refused delete.** A queued delete of the default list from before the rule gets `409`, lands in Failed (`sync/replay.ts`), and start-up restores the list.
- **Process deviation:** DevTask PRs were stacked as drafts (DevTask 6 on 5, 7 on 6) at the operator's request, though DevTasks 6 and 7 do not depend on DevTask 5's code.
- **Known gaps:**
  - A device holding a local tombstone of "Tasks" from before the rule shows it as deleted until the next pull brings back the restored row, and then shows one Failed entry, the refused delete.
  - A stored position that `fractional-indexing` cannot parse makes a create without a position answer `500`. Every writer today uses the library, so no such key exists.
  - "Unless its owner is deleted" waits for `multi-tenant-auth` (#117). No users exist yet.
  - `DEFAULT_LIST_ID` is defined twice, in `web_client` and in `shared-types`, because the PWA does not import shared-types at runtime (it would bundle Zod). A unit test on each side pins the value.

## Architecture Decisions (ADR)

- [ADR-OOM-003](../ARCHITECTURE.md): The Server Assigns List Positions and Keeps an Undeletable Default List. It extends ADR-TE-002.

## Change Log

| Date       | PR                                                       | Summary                                                                                 |
| ---------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 2026-11-13 | [#151](https://github.com/jonpham/PSYKL-System/pull/151) | DevTask 5: the PWA never offers to delete the default list                              |
| 2026-11-13 | [#152](https://github.com/jonpham/PSYKL-System/pull/152) | DevTask 6: the list API refuses it with `409` and appends lists sent without a position |
| 2026-11-13 | _tbd_                                                    | DevTask 7: the server seeds or restores the default list; Spec close-out                |
