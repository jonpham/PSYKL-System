# Implementation Notes — Experiment Tools Toggle

## First slice

One slice, built in this order: the tools flag store → the extracted `ExperimentTools` pill with a live experience label → the `ExperimentSwitcher` picker → mounting the pill on production routes from `Root` → the `ExperimentsIndex` theming/row pass and the `status` removal.

## Files

- `components/web_client/src/experiment/experimentToolsStore.ts` — new. `localStorage` key `psykl:experiment-tools`, `read()/write()/subscribe()` in the shape of `apple-reminders-ux/themeStore.ts`; try/catch so a blocked store degrades to off.
- `components/web_client/src/experiment/ExperimentTools/ExperimentTools.tsx` — new. The floating pill, moved out of `ExperimentFrame` unchanged in position and styling; takes the current experience and renders collapsed / expanded / picker-open.
- `components/web_client/src/experiment/ExperimentTools/ExperimentSwitcher/ExperimentSwitcher.tsx` — new, nested (one consumer). `<dialog>`-based picker over `experiments` from the registry plus a synthetic Production row.
- `components/web_client/src/experiment/ExperimentFrame/ExperimentFrame.tsx` — renders `<ExperimentTools />` instead of inlining the pill; turns tools on when it mounts.
- `components/web_client/src/experiment/index.ts` — export `ExperimentTools` and the store.
- `components/web_client/src/experiment/ExperimentsIndex/ExperimentsIndex.tsx` + new `experiments-index.css` — inline `#666`/inherited-UA colors replaced with `var(--text-primary)` / `var(--text-secondary)` / `var(--separator)` from `src/styles/tokens.css` (which already covers Dark and Increased contrast); each entry becomes one bordered full-width `<button>` row (radius `var(--radius-control)`, `var(--row-min)` minimum height, `var(--bg-pressed)` press state) wrapping title and summary, so the whole row is the target. Same component serves Settings, `/exp`, and the picker rows.
- `components/web_client/src/experiment/registry.types.ts` — `ExperimentStatus` and the `status` field deleted; the "an experiment left in the registry is exploring" rule moves into the `Experiment` doc comment.
- `components/web_client/src/experiment/registry.ts` — `status` line dropped from the one entry.
- `components/web_client/src/Root.tsx` — **the only production module touched.** Renders `<ExperimentTools />` next to `<App />` when the flag is on.

Production files read but not changed: `hooks/usePathname.ts` (`navigate`), `components/SettingsView` (unchanged entry point into `/exp`).

## Data / API

**Empty.** No schema, no endpoint, no shared-model change. The only new state is one device-local `localStorage` key, never synced.

## Tests

Per operator instruction for this iteration, the floor is temporarily lowered: **unit tests only**, TDD-ordered.

- `experimentToolsStore.unit.test.ts` — on/off round-trip, default off, blocked-storage fallback.
- `ExperimentTools.unit.test.tsx` — label reads "Production" off an `/exp` path and the experiment title on one; Close clears the flag and navigates to `/`.
- `ExperimentSwitcher.unit.test.tsx` — lists Production + registry entries, marks the current one, navigates on select, Escape closes.
- `Root.unit.test.tsx` — extended: pill renders on a production route only when the flag is on.
- `ExperimentsIndex.unit.test.tsx` — updated: the existing "lists every registered experiment with its status" test loses the status assertion; new assertions that each entry is a single row-level button carrying title and summary. Colour itself is verified by eye, not asserted.

Existing `status` fixtures in `ExperimentRouter.unit.test.tsx`, `ExperimentsIndex.unit.test.tsx`, and `ExperimentsIndex.stories.tsx` are updated in the same pass (the stories file is touched only to keep it compiling; its play coverage is part of the deferred work).

**Deferred until the operator approves the UX:** the Storybook component story and the `e2e/` spec, both written from the acceptance checks above before close-out.

## Evidence

Local screenshots (gitignored, deleted at close-out): production collapsed, production expanded, picker open, experiment expanded — at 390px and desktop width.

## Open questions

None blocking. Optional follow-up if the picker feels heavy: collapse it to a cycle-through button when exactly one experiment is registered — not built now.
