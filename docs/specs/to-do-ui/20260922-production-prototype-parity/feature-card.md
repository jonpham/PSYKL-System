# Production UX parity with the `apple-reminders-ux` prototype

> Lightweight feature workflow — `docs/workflows/lightweight-feature-workflow.md`. Target: **production**. Lane: **Standard**.
> Tracks [#122](https://github.com/jonpham/PSYKL-System/issues/122). Initiative: `to-do-ui`.

## User

Solo user on iPhone and desktop browser, using the shipped v0.5.0 surface every day.

## Problem

The shipped surface is a partial migration of the accepted prototype. The version footer bleeds onto every
destination, the task list shows a permanent `Delete` button and a bottom-of-page `+ New Task` link instead of
the floating capture control, capture inserts a doubled separator, header and row spacing drift from the
prototype, and Settings uses free-standing buttons with no About section.

## Outcome

Every production destination looks and behaves as the accepted prototype did, so v0.5 can be iterated on
without re-litigating chrome.

## Scope

Presentation and control affordances on five surfaces — app shell header, task list, lists page, sync, settings —
plus moving the version readout into a Settings → About → Version block. No schema, no API, no shared models.

## Not now

Restoring v0.4 functionality; swipe-to-delete gestures; Recently Deleted redesign; the prototype's
`No Reminders` empty-state copy (production's `EmptyState` stays).

## Done when

All eight acceptance checks pass on iPhone Safari and desktop Chrome at 390px and >=768px, and the E2E suite is
green with the task-delete affordance removed.

## Verdict

Filled at close-out.
