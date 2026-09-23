---
status: DONE
issue: GH123
branches:
  - feat/123-experiment-tools-toggles
prs:
  - https://github.com/jonpham/PSYKL-System/pull/132
completed_at: 2026-09-22
created_at: 2026-09-22
initiative: to-do-ui
spec: none — lightweight feature workflow, `target = production`, Standard Lane
---

# Experiment Tools Toggle

## User Story

As a developer comparing a prototype against the shipped app, I want to switch between experiences from wherever the experiment button is visible, so that comparing a `/exp` surface with its production counterpart does not mean closing the experiment and navigating back through Settings.

## Features

1. The expanded 🧪 pill names the current experience — **Production**, **Experiments**, or the experiment's title — where it previously read a static "Not production" ([#123](https://github.com/jonpham/PSYKL-System/issues/123)).
2. That name opens a modal experience picker listing **Production** first and always, then every registered experiment; choosing one navigates to its root.
3. The tools follow the developer onto production routes once any `/exp` surface has been opened on that device, and **Close** turns them off — a decision that survives a reload.
4. The experiments list is themed and re-laid-out: theme-token colours, one bordered full-width row per experiment, no status word.

## Verification Steps

**Associated E2E test:** `e2e/experiment_tools.e2e.spec.ts` (5 stories)

**Manual verification**

_Setup / Preconditions_ — the full stack running (`docker compose up --build`), a browser with no `psykl:experiment-tools` key in `localStorage` for the origin.

_Steps_

1. Open `/` and confirm no experiment chrome is present. Open `/settings` and confirm the same.
2. Open `/exp/apple-reminders-ux`, expand 🧪, and read the experience name.
3. Open the picker, choose **Production**, and confirm the pill came along and now reads Production.
4. Open the picker again, choose the experiment, and confirm the round trip.
5. Press **Close**, then reload, and confirm the pill stays gone.
6. In `/settings` under Dark appearance, read the Experiments list.

_Expectation_ — switching experiences is two taps in either direction from anywhere the pill is visible; the pill is absent for anyone who has never opened an experiment; every experiment row is legible in both appearances and is its own tappable target.

## Affected Components

- `components/web_client/src/experiment/experimentToolsStore.ts` — new; device-local `psykl:experiment-tools` flag with a subscriber set, storage-failure safe.
- `components/web_client/src/experiment/useExperimentTools.ts` — new; `useSyncExternalStore` binding.
- `components/web_client/src/experiment/ExperimentTools/` — new; the floating chrome, extracted from `ExperimentFrame`.
- `components/web_client/src/experiment/ExperimentTools/ExperimentSwitcher/` — new; the picker, nested because `ExperimentTools` is its only consumer.
- `components/web_client/src/experiment/ExperimentFrame/ExperimentFrame.tsx` — delegates to `ExperimentTools`; mounting is the tools' activation gesture.
- `components/web_client/src/experiment/ExperimentsIndex/ExperimentsIndex.tsx` — theme tokens, one bordered row per experiment, status removed.
- `components/web_client/src/experiment/registry.types.ts`, `registry.ts` — `ExperimentStatus` and the `status` field deleted.
- `components/web_client/src/Root.tsx` — the only production module touched; mounts the pill over `<App />` while the flag is on.

## Design Decisions

- **Sticky activation over always-on or dev-only.** Rendering the pill unconditionally would ship developer chrome to every user of the PWA; gating it on `import.meta.env.DEV` would make it unreachable on the homelab deploy, which is where phone testing actually happens. Entering `/exp` is the activation gesture, and Close is the deactivation — operator decision at plan review.
- **Production is a synthetic picker row, not a registry entry.** It is always offered however many experiments exist, and it reports as a `null` slug rather than a reserved string.
- **`status` removed from the registry.** Every exit in the lightweight workflow — discard, pause past a verdict, promote — ends with the experiment's code and registry entry deleted, so a registered experiment is by definition being explored and the field could only ever read `exploring`.
- **The experiments list inherited a user-agent colour.** `<button>` with `font: inherit` but no `color` renders `buttontext` — black — which disappeared on the dark Settings surface. Every colour in that component now comes from `src/styles/tokens.css`, which already carries Dark and Increased contrast.
- **`/exp` (the index) is its own experience name.** It is neither production nor a registered prototype, so the pill reads "Experiments" there rather than mislabelling it.

## Architecture Decisions (ADR)

None. The experiment/production boundary recorded as [ADR-EXP-001](../ARCHITECTURE.md) is unchanged: production still depends on the experiment tree only through the `src/experiment` barrel, which the `no-restricted-imports` rule continues to enforce, and deleting the experiment tree would still leave the production build intact apart from `Root.tsx`'s one conditional mount.

## Change Log

| Date       | PR                                                       | Summary                                                                                                           |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-09-22 | [#132](https://github.com/jonpham/PSYKL-System/pull/132) | Experience switcher in the experiment pill; tools follow onto production; experiments list themed, status removed |
