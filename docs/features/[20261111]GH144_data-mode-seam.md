---
status: DONE
issue: GH144
branches:
  - feat/144-web-app-api-store # Spec integration branch; DevTask 1 (architecture sandbox) landed here directly
  - feat/online-offline-modes-s1-dt2-service-client-injection
  - feat/online-offline-modes-s1-dt3-offline-mode-switch
  - feat/online-offline-modes-s1-dt4-tests-and-close-out
prs:
  - https://github.com/jonpham/PSYKL-System/pull/145
  - https://github.com/jonpham/PSYKL-System/pull/146
completed_at: # set when the Spec integration PR merges to main
created_at: 2026-11-11
initiative: online-offline-modes
spec: docs/specs/online-offline-modes/20261111-Spec1-data-mode-seam.md (deleted at close-out; this doc is the record)
---

# Data-Mode Seam — Offline Mode switch and per-mode Service Clients

> Glossary:
>
> - PWA = Progressive Web App.
> - IDB = IndexedDB, the browser's local database.
> - Offline Mode = the user setting that chooses the IDB + sync data path (on, the default) or the online-only data path (off).
> - Seam = the single point inside each `use{Entity}()` hook that picks one of the two data paths.
> - Shim = the stateless `{entity}ServiceClient` that routes each call to the sync client or the API client.

## User Story

As a PWA developer, I can switch the app between the IndexedDB sync path and an online-only path from Settings, so that I can compare local data against the server's canonical data. The online path stays stubbed until `online-offline-modes` Spec 3.

## Features

1. [#144](https://github.com/jonpham/PSYKL-System/issues/144): a **seam** in `useLists()` and `useTasks()`.
   - Each hook returns `use{Entity}SyncClient()` (today's code, now in `*.sync.ts`) or `use{Entity}ApiClient()` (a stub in `*.api.ts`), chosen by Offline Mode.
   - Both return the same `Use{Entity}Result`, so components cannot tell which one they got (DESIGN.md Decisions 1, 14).
2. **`SettingsProvider`** owns Offline Mode.
   - The setting is stored in `localStorage` under `psykl:offline-mode`. Only the exact string `false` turns it off; anything else, including storage that throws, reads as on (Decision 5).
   - Its children are keyed on the mode, so changing it remounts the tree, and every hook starts fresh on the new path (Decision 3).
3. **Service Client shims, injected per mode** (Decision 6).
   - `createListServiceClient(offlineCapable)` and `createTaskServiceClient(offlineCapable)` replace the module-level `listServiceClient` / `taskServiceClient` singletons. The inner API and sync clients stay singletons; the shim is stateless and rebuilt freely.
   - `SettingsProvider` provides the shims for the current mode through `ServiceClientsContext`, and `useRecentlyDeleted` and `usePendingTaskIds` read theirs from `useServiceClients()`.
4. **Settings → Data → Offline Mode**: a `role="switch"` control, on by default.
   - It stays muted (`--text-tertiary`) while `ONLINE_PATH_AVAILABLE` is `false`, which marks it as not yet functional (Decision 12).
   - With Offline Mode off, the app shows empty lists and tasks, and every write is rejected with a named error (`<op> is not available with Offline Mode off yet`) instead of being silently dropped.

## Visual Record

### Settings — the new `Data` section

```text
┌ Settings ─────────────────────────────────┐
│ Appearance   [System][Light][Dark]        │
│ Contrast     [Standard][Increased]        │
│                                           │
│ Data                                      │
│ Offline Mode                  ( ░░░░●)    │  ← switch, role="switch"
│ Keep a copy on this device and sync       │
│ when online.                              │
│                                           │
│ Experiments …                             │
│ About …                                   │
└───────────────────────────────────────────┘
```

### State storyboard

| State                        | What the user sees                                                                                  | How they got here                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| On, not yet functional       | Knob right; track in the **muted** color (`--text-tertiary`), not the accent. App behaves as today. | Default: nothing stored, or `psykl:offline-mode` ≠ `false` |
| Off, not yet functional      | Knob left; same muted track. Lists and tasks are empty; any write is refused (stubbed API path).    | Tapped the switch                                          |
| Remount on change            | The whole app re-renders once (lists and tasks reload); no page refresh.                            | Any change to the switch (Decision 3)                      |
| Reload                       | The chosen state survives a page reload.                                                            | Stored in `localStorage` (Decision 5)                      |
| Functional (Spec 3, not now) | Knob right uses the **accent** color (`--accent`).                                                  | Spec 3 flips `ONLINE_PATH_AVAILABLE` to `true`             |

Built as planned. The knob slides in 150 ms, and `prefers-reduced-motion: reduce` turns the slide off. Operator approved the UX on 2026-11-11.

## Verification Steps

**Associated E2E test:** `e2e/settings.e2e.spec.ts`. It covers two user stories:

- "a user sees Offline Mode on by default and marked not yet available"
- "a user who turns Offline Mode off keeps that choice after reloading"

**Manual verification**

_Setup / Preconditions_ — the stack is running (`docker compose up`, or `pnpm dev` in `components/web_client` with `service-task` running).

_Steps_

1. Open `/settings`. The **Data** section shows **Offline Mode** on, with a muted track.
2. Add a task on the home screen. It behaves exactly as before (sync path).
3. Turn Offline Mode off. The app remounts with empty lists and tasks. Adding a task is refused with the inline "could not be saved" message. The switch stays muted and keeps keyboard focus.
4. Reload. The switch is still off. Turn it back on, and the earlier tasks reappear.

_Expectation_ — with Offline Mode on, nothing about the app changes. With it off, the app runs on the stubbed online path without crashing, and the choice persists.

## Affected Components

All changes are in `components/web_client`; there are no server or schema changes.

- Seam:
  - `src/hooks/useLists.ts`, `useLists.sync.ts`, `useLists.api.ts`
  - `src/hooks/useTasks.ts`, `useTasks.sync.ts`, `useTasks.api.ts`
  - `src/hooks/online-path.stub.ts`
- Settings:
  - `src/hooks/useUserSettings.ts`
  - `src/preferences/offlineMode.ts`
  - `src/components/SettingsProvider/`
  - `src/Root.tsx`
- Service Clients:
  - `src/services/service-client.ts`, `list-service-client.ts`, `task-service-client.ts`
  - `src/hooks/useServiceClients.ts`
  - `src/hooks/useRecentlyDeleted.ts`
  - `src/components/TaskList/usePendingTaskIds.ts`
- Switch:
  - `src/components/SettingsView/SettingsView.tsx`, `settings-view.css`
- Smell comments only (Decision 7): `src/hooks/useLists.positions.ts`, `useLists.default-list.ts`

## Design Decisions

- **S1-1 — The sync store keeps a private sync shim.**
  - `useLists.sync.ts` and `useTasks.sync.ts` build `create{Entity}ServiceClient(true)` themselves, because their snapshot store runs outside React (page sync triggers, BroadcastChannel) and cannot read the context.
  - This is a bounded exception to Decision 6. It is retired with the store in Spec 5.
- **S1-2 — The inner clients stay module-private.** `list-service-client.ts` and `task-service-client.ts` export only the factory, its type and the test reset.
- **S1-3 — The availability flag lives in `online-path.stub.ts`.** The file that marks the stubs is also the one that says they are not functional, so Spec 3 removes both at once.
- **S1-4 — A `role="switch"` button, not a segmented control.** A two-state on/off setting reads as a switch.
- **Test floor (operator override).** Storybook and E2E tests were written after the operator approved the UX on a local deployment, not test-first. This was scoped to this Spec.
- **Process deviations, recorded for the Spec PR review:**
  - DevTask 1 landed directly on the Spec branch with 12 production files, as the operator-requested architecture sandbox.
  - The Spec branch is named `feat/144-web-app-api-store` (operator choice), not `spec/…`.
- **Known gaps:**
  - Recently Deleted is half online with Offline Mode off: reads go through the API shim, and restore is refused through `notImplementedOnline('restore')` (it would otherwise have written to the server and left IndexedDB stale). Spec 4 owns moving it online.
  - Creating a list on the Lists page with Offline Mode off is rejected, but `ListsPage` does not catch it, so the title disappears with no message.
  - IndexedDB is still written with Offline Mode off: the active-list hydration and the page sync triggers run the sync stores, which pull from the server. Spec 4 owns the sync-only surfaces.
  - Offline Mode is not shared between open tabs; there is no `storage` event listener.
  - Color is the only signal that the switch is not yet functional, which fails WCAG 1.4.1 (Use of Color). The operator accepted this (Decision 12).
- **Final review fixes:** restore is refused with Offline Mode off, and the switch keeps keyboard focus across the remount, which otherwise drops focus to `<body>`.
- **Test note:** in this jsdom setup, `rejects.toThrow('<message>')` fails even for a bare rejected `Error`. Assert rejections with `rejects.toMatchObject({ message })`.

## Architecture Decisions (ADR)

- [ADR-OOM-001](../ARCHITECTURE.md): Data-Mode Seam in the `use{Entity}()` Hooks, Remounted on Change.
- [ADR-OOM-002](../ARCHITECTURE.md): Stateless Service Client Shims Built per Offline Mode and Injected Through Context. It narrows ADR-TE-003.

## Change Log

| Date       | PR                                                       | Summary                                                              |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| 2026-11-11 | — (Spec branch)                                          | DevTask 1: seam, `SettingsProvider`, online stubs                    |
| 2026-11-11 | [#145](https://github.com/jonpham/PSYKL-System/pull/145) | DevTask 2: per-mode Service Client shims injected through context    |
| 2026-11-11 | [#146](https://github.com/jonpham/PSYKL-System/pull/146) | DevTask 3: Offline Mode switch in Settings, marked not yet available |
| 2026-11-11 | DevTask 4 PR                                             | DevTask 4: Storybook story, two E2E tests, Spec close-out            |
