# UX Plan: Todo Experience — screens, stories, and gestures

Written by `/design-consultation` (gstack) on 2026-08-13.
Branch: `feat/plan-psykl-loop`
Status: **PROPOSED** — input to `/plan-design-review`, then `/plan-eng-review`.
Initiative: [`DESIGN.md`](DESIGN.md) · [`MILESTONE.md`](MILESTONE.md)
Visual system: [`docs/DESIGN.md`](../../DESIGN.md) — durable, not deleted at initiative close-out.
Prototype brief: [`PROTOTYPE-PROMPT.md`](PROTOTYPE-PROMPT.md)

`deleted_at_spec_closeout: false` — this doc is initiative-level. It is deleted at **initiative** close-out along with `DESIGN.md` and `MILESTONE.md`, after its content is folded into the per-Spec feature docs.

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes. A PSYKL _session_ is one start/stop event against a task.
> - E2E = End-to-End, the top layer of the five-layer test pyramid.
> - LWW = Last-Write-Wins.
> - UX / UI = User Experience / User Interface.

---

## 1. The thesis this UX has to deliver

**The list is arranged, not scored.** Position in the list is the priority. Nothing in the interface ranks, flags, sorts, or scores on the user's behalf. Prioritization is an activity the user performs on their own cadence by dragging things upward.

Two rules everything below answers to:

1. **Drag-to-reorder is the hero interaction.** It is not a feature on the list; it is the thing the app is for. Every screen decision is checked against "does this stay legible and calm at forty rows while being rearranged?"
2. **Effort is retrospective, never declared.** Capture never asks how big a task is. There is no weight, estimate, priority, or urgency input anywhere in this initiative — and no effort _display_ either, because until `psykl-loop` ships sessions there is no honest data to show.

**Two completion paths, neither second-class.** A sub-5-minute task gets ticked. A long task gets PSYKL loops run against it until it is done. The row must afford both without privileging either. As far as this review found, no app in the category has this problem: Reminders has only the tick, focus timers have only the session.

---

## 2. Screen inventory

| Screen                         | Purpose                                                             | Arrives in   |
| ------------------------------ | ------------------------------------------------------------------- | ------------ |
| **List view**                  | The app. One list's tasks, in sections, in the user's order.        | Spec 1       |
| **List switcher** (sheet)      | Pick, create, rename, reorder, delete lists.                        | Spec 1       |
| **Task detail** (sheet)        | Title, notes, due date, tags. Later: Start PSYKL + session history. | Spec 4       |
| **Search** (overlay)           | Query across all lists.                                             | Spec 6       |
| **Live session** (full screen) | Reserved. Not built here.                                           | `psykl-loop` |

There is no home screen, no dashboard, no Today view, and no settings screen in this initiative. The app opens directly into the last list the user was in.

### Why there is no Today view

Every competitor's centre of gravity is a Today list assembled from due dates. The moment "Today" is computed from dates, the app has made a claim on the user's attention, which Premise P2 refuses. If a Today surface is ever built it is hand-dragged, not derived. This will feel like a missing feature for roughly two weeks and is the sharpest expression of the product's anti-clock stance.

---

## 3. Row anatomy

```
┌──────────────────────────────────────────────────────────┐
│ [ ]  Draft the migration plan                    Aug 20  │  44px
└──────────────────────────────────────────────────────────┘
  ── hairline rule, full bleed ──
┌──────────────────────────────────────────────────────────┐
│ [ ]  Rewrite the sync queue dispatch                     │
│      ▤  INFRA  DEEP                              Aug 22  │  60px
└──────────────────────────────────────────────────────────┘
  ── hairline rule ──
┌──────────────────────────────────────────────────────────┐
│ [✓]  ~~Call the dentist~~                                │  40px
└──────────────────────────────────────────────────────────┘
```

- **Leading edge: the checkbox.** 24px target inside a 44px touch area. It stays. It is the affordance for the short-task path.
- **Title:** `row` token, Plex Sans 400, single line, truncated with an ellipsis. Never wraps in the list — the full title lives in the detail sheet. A wrapping title destroys the scan rhythm that makes density calm.
- **Metadata line** (only when there is metadata): note indicator `▤`, then tags in `meta-xs` mono uppercase, then the due date right-aligned in `meta-sm` mono. The right-aligned mono column aligns vertically down the whole list. That column is doing most of the "instrument" work.
- **Trailing edge:** nothing. No chevron, no play button, no overflow menu. The row is not a call to action.
- **Completed:** title strikes through and drops to `--ink-tertiary`, row collapses to 40px, metadata line is dropped.

**No weight rail, no priority dot, no flag, no colour.** The row is monochrome by design; see [`docs/DESIGN.md`](../../DESIGN.md) → Color → The accent is reserved.

---

## 4. Gesture vocabulary

Complete and closed. Any interaction not in this table does not exist, and adding one requires re-opening this table rather than quietly appending.

| Gesture               | Target                      | Result                                      | Arrives in   |
| --------------------- | --------------------------- | ------------------------------------------- | ------------ |
| Tap                   | Checkbox                    | Toggle complete / incomplete                | Shipped (M2) |
| Tap                   | Row body                    | Open task detail sheet                      | Spec 4       |
| Swipe right           | Row                         | Complete / uncomplete                       | Spec 5       |
| Swipe left            | Row                         | Reveal Delete; second swipe or tap confirms | Spec 5       |
| Long-press, then drag | Row                         | Reorder within and across sections          | Spec 3       |
| Long-press, then drag | Section header              | Reorder sections within the list            | Spec 3       |
| Tap                   | Section header              | Collapse / expand section                   | Spec 2       |
| Tap                   | List name in header         | Open list switcher sheet                    | Spec 1       |
| Tap                   | Quick-add rail              | Focus the input                             | Shipped (M2) |
| Enter                 | Quick-add input             | Commit and keep focus for the next capture  | Shipped (M2) |
| Tap                   | Search icon                 | Open search overlay                         | Spec 6       |
| **Reserved**          | Detail sheet primary button | **Start PSYKL session**                     | `psykl-loop` |

**Pull-to-refresh does not exist.** Sync is automatic and continuous; a manual refresh gesture would imply the user is responsible for it and invite the belief that data can be stale.

### The drag handle problem, deliberately beaten

The [Pratt critique of Reminders](https://ixd.prattsi.org/2024/12/design-critique-reminders-macos-app/) identifies drag-to-reorder as undiscoverable — no handle appears until you already know the gesture exists. Since reordering is PSYKL's hero interaction, this is not acceptable here.

**On long-press, a `⠿` grip glyph fades into the row's trailing edge in `--ink-tertiary` and stays for the duration of the drag.** The lifted row takes `--pressed` ground, and an insertion gap opens that other rows animate around. On pointer devices the grip appears on hover. The list's first-run empty state also names the gesture in words.

### Where title editing went, and what it costs

M2 Spec 5 shipped tap-to-edit-inline on the row title. Spec 4 takes that tap for the detail sheet, so title editing moves into the sheet, where the title is rendered as a focused text input at the top.

This is a real regression for the "fix a typo" path — two taps instead of one — and it matches Reminders rather than beating it. It is accepted because the sheet is the only sane home for notes, due date, tags, and the reserved Start button, and because a second row-level tap target would clutter the leading edge that the checkbox owns. **Flagged for `/plan-design-review` as the most likely thing in this document to be wrong.**

---

## 5. User stories

Written as E2E test titles, per `AGENTS.md` → Test Discipline: collapsed to their titles, the E2E suite is the plain-language record of what the client lets a user do. Each is committed `test.skip` when its behavior does not yet exist and activated as implementation lands.

### Spec 1 — Generalized sync queue + Lists

- `a user creates a list and it appears in the list switcher`
- `a user renames a list and the header updates without losing scroll position`
- `a user creates a task while a specific list is open and the task lands in that list`
- `a user switches lists and the previously open list's arrangement is preserved`
- `a user deletes a list and its tasks go with it`
- `a user creates a list while offline and it appears on a second device after reconnecting`
- `a user's existing tasks from before lists existed appear in the default list`
- `a user with queued offline writes upgrades the app and loses none of them`

### Spec 2 — Sections

- `a user adds a section to a list and it appears as a header in the flow of the list`
- `a user moves a task into a section by dragging it under the header`
- `a user collapses a section and its tasks are hidden but its count remains visible`
- `a user renames a section and tasks under it stay put`
- `a user deletes a section and its tasks return to the list's unsectioned area rather than being deleted`

### Spec 3 — Manual ordering

- `a user drags a task to the top of the list and it stays there after reload`
- `a user sees a grip appear when long-pressing a task, before the drag starts`
- `a user drags a task from one section into another and it keeps its new position`
- `a user reorders sections and the tasks travel with their headers`
- `a user rearranges a list on two offline devices and no hand-made arrangement is lost after both reconnect`

That last one is the initiative's stated success criterion and the hardest test in the milestone.

### Spec 4 — Notes and optional due date

- `a user taps a task and sees its full title, notes, due date, and tags`
- `a user writes a note on a task and a note indicator appears on the row`
- `a user sets a due date and it appears right-aligned in the row's metadata`
- `a user sets a due time only when the deadline has a real time, and the time is optional`
- `a user sees no visual escalation on a task whose due date has passed`
- `a user edits a task title in the detail sheet and the row updates`

### Spec 5 — Interaction polish

- `a user swipes right on a task to complete it without opening anything`
- `a user swipes left on a task and must confirm before it is deleted`
- `a user completes a task and watches the row compact rather than celebrate`
- `a user with reduced-motion enabled sees state changes without animation`
- `a user scrolls a list of forty tasks and the metadata column stays aligned`

### Spec 6 — Tags and search

- `a user applies a tag to a task and it appears in the row's metadata`
- `a user applies the same tag to tasks in different lists`
- `a user searches for a word and sees matching tasks from every list`
- `a user searches by tag and sees every task carrying it`
- `a user searches while offline and still gets results`

---

## 6. Empty and edge states

Each one is a designed screen, not a blank area. All copy is in `--ink-secondary`, `body` token, left-aligned under the header — never centered, never illustrated, never exclamatory.

| State                             | Content                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **First run, no lists**           | The default list already exists and is open, so this state is never reached. Migration puts every pre-existing task there. See Open Question 1.                                                                                 |
| **List with no tasks**            | `Nothing here yet.` Then, one line smaller: `Add a task below. Long-press any task to drag it into position.` The second line is where the reorder gesture is taught.                                                           |
| **Section with no tasks**         | The header stays with a `0` count in mono. Empty sections are not auto-removed — a section is a container the user made on purpose, and deleting it behind their back is the kind of thing that erodes trust in an arrangement. |
| **All tasks in a list completed** | The completed rows remain, compacted. No congratulation, no empty-state swap, no celebration. The work being done is not an event the app has feelings about.                                                                   |
| **Search, no results**            | `No tasks match "<query>".` Nothing else. No suggestions, no "did you mean."                                                                                                                                                    |
| **Offline with queued writes**    | Unchanged from M2: rows that have been unsynced for >2s dim to 0.6 and show a pending dot. Offline is a normal operating mode, not an error, and it never gets a banner.                                                        |
| **Sync failed permanently**       | A single row above the quick-add rail in `--ash`: `<n> changes could not be saved.` Tapping it opens the failed-operations detail. This is the only place `--ash` appears outside of delete.                                    |

---

## 7. Dense-list behavior

The thesis is that density and calm are compatible. These are the rules that have to hold for it to be true.

- **The list is virtualized above ~200 rows**, but scroll position and drag behavior must be identical either side of that threshold. A user must never be able to tell where the boundary is.
- **Titles truncate, never wrap.** One row, one line. A wrapping title breaks the vertical rhythm that makes a long list scannable, and the full text is one tap away in the sheet.
- **The metadata column is right-aligned and monospaced**, so dates and counts form a true column down the screen regardless of title length. This is the single strongest density device in the design.
- **Section headers do not stick.** A sticky header floating over a list you are dragging within is a fight between two motions. The list is one continuous surface; headers scroll with it.
- **Completed tasks stay in place for the current viewing, then sweep.** A task ticked now stays exactly where it was so the arrangement does not shift underfoot mid-triage. On the next open of that list, completed tasks are collapsed into a single `n COMPLETED` row at the bottom of their section, expandable. See Open Question 4.
- **No row is ever taller than 60px** and no interaction makes a row grow in place. Everything that needs more room opens the sheet.

---

## 8. Apple Reminders comparison bar

The initiative's honest success criterion is that the operator prefers PSYKL for daily capture. This is the specific bar.

| Capability                           | Reminders                | PSYKL                                         | Verdict                |
| ------------------------------------ | ------------------------ | --------------------------------------------- | ---------------------- |
| Lists                                | ✅                       | ✅ Spec 1                                     | **Match**              |
| Sections within a list               | ✅                       | ✅ Spec 2                                     | **Match**              |
| Manual drag-to-reorder               | ✅                       | ✅ Spec 3                                     | **Match**              |
| Discoverable drag handle             | ❌ invisible until known | ✅ grip on long-press + taught in empty state | **Beat**               |
| Notes on a task                      | ✅                       | ✅ Spec 4                                     | **Match**              |
| Due date                             | ✅                       | ✅ Spec 4, optional time                      | **Match**              |
| Tags                                 | ✅                       | ✅ Spec 6                                     | **Match**              |
| Search                               | ✅                       | ✅ Spec 6                                     | **Match**              |
| Swipe to complete / delete           | ✅                       | ✅ Spec 5                                     | **Match**              |
| Offline-first with multi-device sync | ⚠️ iCloud, opaque        | ✅ shipped in M2, tested                      | **Beat**               |
| Subtasks                             | ✅                       | ❌ deferred by P3                             | **Lose, deliberately** |
| Notifications and alerts             | ✅                       | ❌ never                                      | **Refuse**             |
| Repeat rules                         | ✅                       | ❌ templates later, not repeats               | **Refuse**             |
| Priority flags                       | ✅                       | ❌ ordering instead                           | **Refuse**             |
| Date-derived Today view              | ✅                       | ❌ never derived                              | **Refuse**             |
| Overdue escalation                   | ✅ red                   | ❌ none                                       | **Refuse**             |
| Shared lists, assignees              | ✅                       | ❌ single-user by design                      | **Refuse**             |
| Focused work sessions against a task | ❌                       | ✅ `psykl-loop`                               | **The differentiator** |

Nine matches, two beats, seven deliberate refusals. If the operator ends up missing something in the Refuse column during real use, that is the signal Premise P3 exists to catch — and it should change the design rather than be endured.

---

## 9. Reserved for `psykl-loop`

Premise P5 says not to make sessions harder to attach later. These are the specific reservations this UX makes now so `psykl-loop` is additive rather than a rewrite.

1. **The detail sheet's primary button position is left empty.** It is where **Start PSYKL** goes. Nothing else may claim it.
2. **`--ember` is unspent.** The entire initiative ships without using the accent, so a live session is the first coloured thing the user ever sees.
3. **The detail sheet has room below notes for session history** — a mono tally of past sessions against the task. It is the natural home for the retrospective data, and it costs nothing to leave the space.
4. **Tags are a first-class row citizen, not a detail-sheet-only field.** Productivity rate is eventually classified by tag and by parent-list tags, which makes tags the dimension the entire retrospective is computed over. They ship late in the sequence but they ship _visible_.
5. **No row-level gesture is spent frivolously.** Tap, swipe-left, swipe-right, and long-press are all allocated above; the session entry point deliberately went into the sheet rather than consuming a fifth gesture that does not exist.

---

## 10. Open questions for `/plan-design-review`

1. **What is the default list called, and is it special?** Existing tasks need a home at migration. Reminders has an inbox concept. Is the default list deletable? Renameable? Does a task created from search or from a future quick-capture surface land there? (Carried from the initiative design's Open Question 3.)
2. **Is moving title editing into the detail sheet acceptable?** It is a regression against M2 Spec 5's inline edit and against Reminders. Section 4 argues for it; this is the most likely thing here to be wrong.
3. **Do sections collapse, and does collapse state sync?** Collapse is listed in the gesture table. If it syncs it is per-device state on a shared entity, which is a sync-model question, not a UX one. If it does not sync, a collapsed section on the phone is expanded on the laptop.
4. **When exactly do completed tasks sweep?** Section 7 proposes "on next open of the list." Alternatives: immediately, after a timeout, never (manual clear only), or a user setting. Getting this wrong makes the arrangement feel unstable.
5. **Does a task belong to exactly one list?** Assumed yes throughout. Tags are the cross-cutting dimension. Worth stating explicitly before the schema is locked.
6. **Is a bottom-anchored quick-add still right once lists and sections exist?** Where does a task typed into the rail land — end of list, end of the current section, or top? "Arranged, not scored" argues for a predictable, boring answer.
7. **Does the 720px desktop cap hold, or does desktop earn a list sidebar?** This initiative says sheet-only. A sidebar is more useful and less coherent with a mobile-first single-surface design.
