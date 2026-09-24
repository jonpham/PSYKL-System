# Milestone `to-do-ui` — Migrate the accepted Reminders-grade UI into production

**Status:** Active
**Design doc:** [`DESIGN.md`](DESIGN.md)
**Effort:** M — six specs, ~10-12 DevTasks, no backend work anticipated
**Opened:** 2026-09-21

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md)):
>
> - PWA = Progressive Web App.
> - UI / UX = User Interface / User Experience.
> - E2E = End-to-End (Playwright, full stack).
> - MSW = Mock Service Worker.
> - LWW = Last-Write-Wins.

## Description

Move the accepted `apple-reminders-ux` prototype from `/exp/apple-reminders-ux` to `/`.

The prototype survived four operator review rounds and shipped in `v0.4.1`. Production still renders
the M1 bootstrap shell. This milestone replaces it in place, slice by slice, at the production
quality bar — full test pyramid, component folder layout, and layering that the experimental lane was
explicitly allowed to skip.

It adds **no new user-facing capability**. Everything it ships, the app can already do; it ships it
in a surface someone would rate highly.

## Scope

1. **Shell and navigation** — token sheet, one glyph set, header with sync control, drawer,
   destinations, and a Lists page that absorbs what `ListSwitcher` owns today.
2. **Task list and row** — circle checkbox with fill animation, wrapping 17px titles, inset
   separators, inline edit, completed tasks settling below open ones, pending-sync dots.
3. **Capture** — an inline row opened from a trailing `+`, committing on Return and reopening, in
   place of the top-anchored create form.
4. **List options and completed visibility** — overflow menu, list delete, and a per-list
   show/hide-completed preference persisted device-locally.
5. **Sync, Recently Deleted, and Settings** — full destinations in the same visual language, with the
   Sync view carrying queued, failed, **and stale-write** records.
6. **Retirement and close-out** — delete the experiment, archive all three iteration folders with
   verdicts, write the feature doc, and rewrite the superseded visual docs.

## Architectural risk to settle during execution

**The existing E2E suite drives the surface being replaced.** Five specs (`task_list`, `lists`,
`recently_deleted`, `offline_pressure`, `task_list-offline-sync`) select against the bootstrap shell.
In-place migration invalidates their selectors slice by slice. The rule is not negotiable: **each
spec updates the E2E specs covering the surface it changes, in the same PR.** A slice that leaves a
red or skipped E2E spec behind has not landed.

**Nothing outside `components/web_client` is expected to change — but "expected" is not "ruled out".**
Where a slice's behaviour implies a change to a service object, schema, or contract, the spec stops
and brings the operator a proposal before implementing. Spec 5's stale-write record is the most
likely place this surfaces. See [`DESIGN.md`](DESIGN.md) → On schema and API surface.

## Success Criteria

- **Production at `/` behaves exactly as the prototype does today**, judged by walking
  `docs/experiments/archive/apple-reminders-ux/apple-reminders-ui/acceptance-checks.md` against `/` rather
  than `/exp/*` — at 390px and 1024px, in light and dark, compared against the recorded
  `screenshots/`.
- Both device-local preferences (completed visibility, appearance) survive a reload **without**
  appearing on a second device.
- Every user-visible behaviour on the new surface is covered by an E2E test whose title reads as a
  user story; collapsed to their titles, the E2E suite describes the app a user actually gets.
- No production component keeps an inline `style={{…}}` object or a hardcoded hex.
- `/exp/apple-reminders-ux` is gone — registry entry removed, tree deleted — while the `/exp`
  infrastructure (`registry.ts`, `ExperimentRouter`, `ExperimentsIndex`, `ExperimentFrame`) stays for
  future experiments.
- `docs/features/` carries the consolidated record, and all three experiment iterations are archived
  with a recorded verdict.

## What is deferred

- **`todo-experience` Specs 3-7** — Sections, manual ordering, notes and due dates, interaction polish
  and theming, tags and search. Paused, not cancelled; they rebase onto this surface afterwards.
- **Swipe actions, detail sheet, list tint colours, drag-to-reorder for lists** — deferred by the
  prototype itself and still deferred.
- **The selectable Ledger theme.** `--accent-session` stays reserved; the theme itself waits.
- **Apple-native clients** and **multi-user auth** — unchanged, see their own milestones.

## Prerequisites

None outstanding. The experiment is accepted, released in `v0.4.1`, and deployed. Every capability
the migration surfaces already exists end-to-end from `todo-experience` Specs 1-2.
