# Experiment Tools Toggle

> Lightweight feature workflow, `target = production`, Standard Lane. Issue [#123](https://github.com/jonpham/PSYKL-System/issues/123) (parent [#121](https://github.com/jonpham/PSYKL-System/issues/121)).

## User

A developer comparing a prototype view at `/exp/{slug}` against the production view of the same surface.

## Problem

The 🧪 pill renders only on `/exp/*`. Today its expanded state says "Not production" and offers **Close**, which drops you into production with no way back — you must reach Settings → Experiments and re-enter the experiment to compare again.

## Outcome

Wherever the pill is visible, the developer sees which experience they are on (**Production** or the experiment title) and can switch to any other experience in two taps.

## Scope

- Expanded pill states the current experience as a button, not static "Not production" text.
- That button opens an experience picker listing **Production** plus every registered experiment; choosing one navigates to that root (`/` or `/exp/{slug}`).
- Entering any `/exp` route turns experiment tools **on** (device-local flag), which keeps the pill visible on production routes; **Close** turns them off and hides the pill.
- `ExperimentsIndex` (Settings → Experiments and `/exp`) is themed and re-laid-out: theme-token colors so titles stay legible in Dark, and each experiment as a bordered, full-width row rather than a run of text.
- The registry's `status` property is removed — an experiment still in the app is by definition exploring; any other verdict means deleting it.

## Not now

No per-experiment deep links (picker navigates to roots only), no experiment enable/disable of features inside an experiment, no other change to the registry shape.

## Done when

From a production route with tools on, the developer opens the picker, chooses `apple-reminders-ux`, lands on it, switches back to Production, and presses Close — after which the pill is gone and stays gone across a refresh.

## Verdict

{Filled at close-out.}
