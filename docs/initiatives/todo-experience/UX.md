# UX Plan: Todo Experience — screens, behaviors, and interactions

Rewritten during `/plan-design-review` (gstack) on 2026-08-14, replacing the version written by `/design-consultation` on 2026-08-13.
Branch: `feat/plan-psykl-loop`
Status: **PROPOSED** — input to `/plan-eng-review`.
Initiative: [`DESIGN.md`](DESIGN.md) · [`MILESTONE.md`](MILESTONE.md)
Visual system: [`docs/DESIGN.md`](../../DESIGN.md) — durable, not deleted at initiative close-out.

`deleted_at_spec_closeout: false` — initiative-level. Deleted at **initiative** close-out along with `DESIGN.md` and `MILESTONE.md`, after its content is folded into the per-Spec feature docs.

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work. A PSYKL _session_ is one start/stop event against a task. Sessions ship in the `psykl-loop` initiative, not this one.
> - E2E = End-to-End, the top layer of the five-layer test pyramid.
> - LWW = Last-Write-Wins.
> - AT = Assistive Technology (screen readers, switch control, voice control).
> - UX / UI = User Experience / User Interface.

---

## 1. What this initiative is

**A good baseline task manager, built to the craft standard of Apple Reminders, Things 3, and TickTick.**

The three reference apps set the bar for interaction quality — how a row feels to tick, how a drag settles, how a sheet opens. They are not a feature list. The feature scope of this initiative is unchanged from the approved [`DESIGN.md`](DESIGN.md) Feature Inventory: lists, sections, manual ordering, notes, optional due dates, tags, swipe actions, density and animation polish, and search. Notifications, repeat rules, priority flags, subtasks, and shared lists remain out or deferred exactly as that document has them.

Two things this initiative does not do:

1. **It does not invent interaction patterns.** Where the three reference apps agree, PSYKL follows. Innovation budget belongs to the PSYKL session in the next initiative.
2. **It does not build the PSYKL loop.** Premise P1. Section 9 records what is reserved so sessions attach additively later.

---

## 2. Screen inventory

| Screen                         | Purpose                                                             | Arrives in   |
| ------------------------------ | ------------------------------------------------------------------- | ------------ |
| **List view**                  | The app. One list's tasks, in sections, in the user's order.        | Spec 1       |
| **List switcher** (sheet)      | Pick, create, rename, reorder, delete lists.                        | Spec 1       |
| **Task detail** (sheet)        | Title, notes, due date, tags. Later: Start PSYKL + session history. | Spec 4       |
| **Search** (overlay)           | Query across all lists.                                             | Spec 6       |
| **Recently Deleted** (list)    | Deleted lists, sections, and tasks. Restore, or wait 30 days.       | Spec 1       |
| **Settings** (sheet)           | Theme selection. Nothing else in this initiative.                   | Spec 5       |
| **Live session** (full screen) | Reserved. Not built here.                                           | `psykl-loop` |

There is no Today view and no dashboard. The app opens directly into the last list the user was in. A Today view is a date-derived surface and premise P2 keeps date-derived attention claims out of this product; if one is ever built it is a later decision, not a gap in this initiative.

### List view chrome

Previously unspecified, and a real gap. Top to bottom:

- **Header**, 56px, scrolls with the list rather than sticking: the list name in `title`, then a task count in `meta`. Trailing edge carries a single overflow button (`⋯`).
- **The overflow menu** is where low-frequency list operations live, so no screen chrome is spent on them: `New Section`, `Show/Hide Completed`, `Rename List`, `Delete List`, `Settings`. This resolves the missing section-creation affordance — Spec 2's story `a user adds a section to a list` had no UI behind it in the previous version of this document.
- **Search** is reachable by pulling down at the top of the list, the convention in all three reference apps.
- **The capture field** is bottom-anchored, 56px, and never scrolls away.

---

## 3. Row anatomy

```
┌──────────────────────────────────────────────────────────┐
│ ( )  Draft the migration plan                    Aug 20  │  48px
├─────  inset rule  ───────────────────────────────────────┤
│ ( )  Rewrite the sync queue dispatch by entity    Aug 22 │
│      type                                                │  68px
│      ▤  Infra                                            │
├──────────────────────────────────────────────────────────┤
│ (✓)  ~~Call the dentist~~                                │  48px
└──────────────────────────────────────────────────────────┘
```

- **Leading edge: a 22px circular checkbox** in a 44px touch target. Unchecked is a `1px` ring in `--text-tertiary`; checked fills with `--accent`.
- **Title:** `row` token, wraps to a maximum of two lines, then truncates with an ellipsis. Validated against 44 real tasks in the 2026-08-13 prototype — single-line truncation cut more than half of them, and cut them where the meaning was.
- **Due date:** always right-aligned on the **title's first line**, whether or not a metadata line exists. When a metadata line is present the date does not move down to join it; that alternation destroys the column the date is supposed to form. Past due renders in `--destructive`.
- **Metadata line** (only when there is a note or tags): note indicator `▤`, then tags. `--text-secondary`.
- **Trailing edge:** nothing at rest. On hover (pointer) or during a drag, a grip appears.
- **Completed:** title strikes through and drops to `--text-tertiary`; the metadata line is dropped.
- **Pending sync:** unchanged from M2 — rows unsynced for >2s dim to 0.6 and carry a pending dot.

---

## 4. Gesture vocabulary

Complete for the list view. Adding a gesture requires editing this table rather than quietly appending.

| Gesture               | Target                      | Result                                            | Arrives in   |
| --------------------- | --------------------------- | ------------------------------------------------- | ------------ |
| Tap                   | Checkbox                    | Toggle complete / incomplete                      | Shipped (M2) |
| Tap                   | Row title                   | Edit the title inline, in place                   | Shipped (M2) |
| Tap                   | Row, trailing detail button | Open task detail sheet                            | Spec 4       |
| Swipe right           | Row                         | Complete / uncomplete                             | Spec 5       |
| Swipe left            | Row                         | Reveal Delete; moves the task to Recently Deleted | Spec 5       |
| Long-press, then drag | Row                         | Reorder within and across sections                | Spec 3       |
| Modifier + ↑ / ↓      | Focused row                 | Reorder without a pointer; announced via ARIA     | Spec 3       |
| Long-press, then drag | Section header              | Reorder sections within the list                  | Spec 3       |
| Tap                   | Section header              | Collapse / expand section                         | Spec 2       |
| Tap                   | List name                   | Open list switcher sheet                          | Spec 1       |
| Tap                   | Overflow `⋯`                | Open the list menu                                | Spec 1       |
| Pull down             | Top of list                 | Reveal search                                     | Spec 6       |
| Tap                   | Capture field               | Focus the input                                   | Shipped (M2) |
| Enter                 | Capture field               | Commit and keep focus for the next capture        | Shipped (M2) |
| **Reserved**          | Detail sheet primary button | **Start PSYKL session**                           | `psykl-loop` |

**Pull-to-refresh does not exist.** Sync is automatic and continuous. The pull gesture at the top of the list is spent on search instead, which is what the reference apps do.

### Inline edit and the detail sheet both survive

The previous version of this document moved title editing into the detail sheet and flagged the resulting two-tap regression as "the most likely thing in this document to be wrong." It was. Reminders solves this by giving the row two targets: tapping the title edits in place, and a trailing detail button opens the sheet. PSYKL does the same. M2 Spec 5's inline edit is preserved rather than regressed, and the sheet still owns notes, dates, tags, and the reserved Start button.

The trailing detail button appears on row hover or focus, and is always present for AT. It does not add visual noise at rest.

### Making the drag discoverable

The [Pratt critique of Reminders](https://ixd.prattsi.org/2024/12/design-critique-reminders-macos-app/) identifies drag-to-reorder as undiscoverable — no handle appears until you already know the gesture exists. Manual ordering matters here, so:

- On long-press, a grip glyph fades in at the row's trailing edge and stays for the duration of the drag. On pointer devices it appears on hover.
- The lifted row takes `--bg-pressed` and an insertion gap opens that other rows animate around.
- The empty-list state names the gesture in words.
- **A keyboard path exists** (modifier + arrows, with an ARIA live-region announcement). Pointer-only reorder is inaccessible, and this is the interaction the product cares most about.

---

## 5. User stories

Written as E2E test titles, per `AGENTS.md` → Test Discipline: collapsed to their titles, the E2E suite is the plain-language record of what the client lets a user do. Each is committed `test.skip` when its behavior does not yet exist and activated as implementation lands.

### Spec 1 — Generalized sync queue + Lists

- `a user creates a list and it appears in the list switcher`
- `a user renames a list and the header updates without losing scroll position`
- `a user creates a task while a specific list is open and the task lands in that list`
- `a user switches lists and the previously open list's arrangement is preserved`
- `a user reorders their lists in the switcher and the order persists`
- `a user deletes a list and it moves to Recently Deleted with its tasks intact`
- `a user restores a deleted list and its tasks come back in their original order`
- `a user deletes a task while offline and it moves to Recently Deleted without needing the network`
- `a user deletes their only list and a default list remains`
- `a user creates a list while offline and it appears on a second device after reconnecting`
- `a user's existing tasks from before lists existed appear in the default list`
- `a user with queued offline writes upgrades the app and loses none of them`
- `a user offline with 25 queued changes sees a banner telling them to reconnect`
- `a user offline with 100 queued changes cannot add a new task until they reconnect`

### Spec 2 — Sections

- `a user adds a section from the list menu and it appears as a header in the flow of the list`
- `a user moves a task into a section by dragging it under the header`
- `a user collapses a section and its tasks are hidden but its count remains visible`
- `a user renames a section and tasks under it stay put`
- `a user deletes a section and its tasks return to the list's unsectioned area rather than being deleted`
- `a user collapses a section on one device and it stays expanded on another`

### Spec 3 — Manual ordering

- `a user drags a task to the top of the list and it stays there after reload`
- `a user sees a grip appear when long-pressing a task, before the drag starts`
- `a user drags a task from one section into another and it keeps its new position`
- `a user reorders a task using only the keyboard and hears the move announced`
- `a user reorders sections and the tasks travel with their headers`
- `a user rearranges a list on two offline devices and no hand-made arrangement is lost after both reconnect`

That last one is the initiative's stated success criterion and the hardest test in the milestone.

### Spec 4 — Notes and optional due date

- `a user taps a task title and edits it in place without leaving the list`
- `a user opens a task's detail and sees its full title, notes, due date, and tags`
- `a user writes a note on a task and a note indicator appears on the row`
- `a user sets a due date and it appears right-aligned on the row's title line`
- `a user sets a due time only when the deadline has a real time, and the time is optional`
- `a user sees a past due date rendered as overdue`

### Spec 5 — Interaction polish and theming

- `a user swipes right on a task to complete it without opening anything`
- `a user swipes left on a task and must confirm before it is deleted`
- `a user with reduced-motion enabled sees state changes without animation`
- `a user scrolls a list of forty tasks and the date column stays aligned`
- `a user switches to the Ledger theme and the whole app changes appearance`
- `a user's chosen theme survives a reload but does not follow them to a second device`

### Spec 6 — Tags and search

- `a user applies a tag to a task and it appears in the row's metadata`
- `a user applies the same tag to tasks in different lists`
- `a user searches for a word and sees matching tasks from every list`
- `a user searches by tag and sees every task carrying it`
- `a user searches while offline and still gets results`

---

## 6. Empty, loading, and edge states

Each is a designed screen, not a blank area. Copy is in `--text-secondary`, left-aligned under the header.

| State                           | Content                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **First paint**                 | The app shell renders immediately and the list area holds three placeholder rows at `--bg-surface` until IndexedDB resolves. No spinner: the local read is fast, and a spinner would imply a network wait that is not happening.                                                                                                                          |
| **First run**                   | The default list exists and is open. Migration puts every pre-existing task there.                                                                                                                                                                                                                                                                        |
| **List with no tasks**          | `Nothing here yet.` Then, smaller: `Add a task below. Long-press any task to drag it into position.` This is where the reorder gesture is taught.                                                                                                                                                                                                         |
| **Section with no tasks**       | The header stays with a `0` count. Empty sections are not auto-removed — a section is a container the user made on purpose.                                                                                                                                                                                                                               |
| **All tasks completed**         | Completed rows are hidden by default, so the list reads as empty and shows the empty-list copy plus a `Show Completed` entry in the list menu. No celebration.                                                                                                                                                                                            |
| **Search, no results**          | `No tasks match "<query>".` Nothing else.                                                                                                                                                                                                                                                                                                                 |
| **Offline, few queued writes**  | Unsynced rows dim to 0.6 and show a pending dot, as in M2. No banner below the nag threshold.                                                                                                                                                                                                                                                             |
| **Offline, 25+ queued writes**  | A persistent banner above the capture field: `<n> changes waiting to sync. Reconnect to save them.` It blocks nothing.                                                                                                                                                                                                                                    |
| **Offline, 100+ queued writes** | The capture field is disabled and reads `Reconnect to keep adding.` Writes to existing rows are refused with the same message. Offline is a degraded mode and the app says so plainly.                                                                                                                                                                    |
| **Recently Deleted, empty**     | `Nothing deleted in the last 30 days.`                                                                                                                                                                                                                                                                                                                    |
| **Recently Deleted, populated** | Rows show what was deleted with the remaining days right-aligned in the metadata column: `28d`. Restore returns the item to its original list; if that list is itself deleted, it goes to the default list.                                                                                                                                               |
| **Sync failed permanently**     | A single row above the capture field in `--destructive`: `<n> changes could not be saved.` Tapping it opens the failed-operations detail.                                                                                                                                                                                                                 |
| **Arrangement reconciled**      | When a sync resolves a concurrent reorder and the local order changes as a result, the affected rows animate to their new positions rather than snapping, and a dismissible line reads `List order updated from another device.` A hand-made arrangement changing silently is the failure mode the success criterion exists to prevent; the user is told. |

---

## 7. Dense-list behavior

- **The list is virtualized above ~200 rows**, but scroll position and drag behavior must be identical either side of that threshold.
- **Titles wrap to two lines, then truncate.**
- **The due date column is right-aligned on the title's first line**, always at the same offset, so it forms a true column down the screen.
- **Section headers do not stick.** A sticky header floating over a list being dragged within is a fight between two motions.
- **Completed tasks are hidden by default**, revealed by `Show Completed` in the list menu, where they appear in place, struck through and dimmed. This replaces the previous "sweep on next open" proposal, which was an invention; hide-with-a-toggle is what all three reference apps do and it has no surprising timing.
- **No interaction makes a row grow in place.** Everything needing more room opens the sheet.

---

## 8. Reference app parity

The initiative's honest success criterion is that the operator prefers PSYKL for daily capture. This table is the functional bar; craft parity is judged separately, by use.

| Capability                           | Reminders                | PSYKL                            | Verdict                |
| ------------------------------------ | ------------------------ | -------------------------------- | ---------------------- |
| Lists                                | ✅                       | ✅ Spec 1                        | **Match**              |
| Sections within a list               | ✅                       | ✅ Spec 2                        | **Match**              |
| Manual drag-to-reorder               | ✅                       | ✅ Spec 3                        | **Match**              |
| Discoverable drag handle             | ❌ invisible until known | ✅ grip + keyboard path + taught | **Beat**               |
| Inline title edit                    | ✅                       | ✅ shipped M2                    | **Match**              |
| Notes on a task                      | ✅                       | ✅ Spec 4                        | **Match**              |
| Due date, optional time              | ✅                       | ✅ Spec 4                        | **Match**              |
| Overdue indication                   | ✅                       | ✅ Spec 4                        | **Match**              |
| Tags                                 | ✅                       | ✅ Spec 6                        | **Match**              |
| Search                               | ✅                       | ✅ Spec 6                        | **Match**              |
| Swipe to complete / delete           | ✅                       | ✅ Spec 5                        | **Match**              |
| Theming                              | ❌                       | ✅ Spec 5                        | **Beat**               |
| Offline-first with multi-device sync | ⚠️ iCloud, opaque        | ✅ shipped in M2, tested         | **Beat**               |
| Subtasks                             | ✅                       | ❌ deferred by P3                | **Lose, deliberately** |
| Notifications and alerts             | ✅                       | ❌ out, per P2                   | **Out of scope**       |
| Repeat rules                         | ✅                       | ❌ templates later, not repeats  | **Out of scope**       |
| Priority flags                       | ✅                       | ❌ ordering instead              | **Out of scope**       |
| Date-derived Today view              | ✅                       | ❌ out, per P2                   | **Out of scope**       |
| Shared lists, assignees              | ✅                       | ❌ single-user by design         | **Out of scope**       |
| Focused work sessions against a task | ❌                       | ✅ `psykl-loop`                  | **The differentiator** |

Eleven matches, three beats. If the operator misses something in the out-of-scope rows during real use, that is the signal premise P3 exists to catch, and it should change the roadmap rather than be endured.

---

## 9. Reserved for `psykl-loop`

Premise P5 says not to make sessions harder to attach later.

1. **The detail sheet's primary button position is left empty.** It is where **Start PSYKL** goes.
2. **`--accent-session` is unspent** in every theme, so a live session is the first time the user sees that color.
3. **The detail sheet has room below notes for session history** — a tally of past sessions against the task.
4. **Tags are a first-class row citizen**, because productivity is eventually classified by tag and by parent-list tags, which makes tags the dimension the retrospective is computed over.
5. **The generalized sync queue** built in Spec 1 is what the session entity needs, so the cost is paid once and used twice.

---

## 10. Decisions closed by this review

The previous version carried seven open questions. Five are answered here; two are data-model questions that belong to `/plan-eng-review`.

| #   | Question                                | Decision                                                                                                                                                                                             |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What is the default list?               | **Named `Tasks`, renameable, and not special beyond one rule: the last remaining list cannot be deleted.** Migration puts pre-existing tasks there. A task created without list context lands there. |
| 2   | Where does title editing live?          | **Both.** Tap the title to edit in place (M2 behavior preserved); tap the trailing detail button for the sheet. The previous single-target proposal was the regression it flagged itself as.         |
| 3   | Do sections collapse, and does it sync? | **Collapse is device-local, not synced.** It describes how one device is being looked at, not the data. Same rule as theme choice. `/plan-eng-review` confirms against the sync model.               |
| 4   | When do completed tasks sweep?          | **They do not sweep — they are hidden by default**, revealed by `Show Completed`. No timing to get wrong and no arrangement shifting underfoot.                                                      |
| 5   | Does a task belong to exactly one list? | **Yes.** Tags are the cross-cutting dimension. Stated here; `/plan-eng-review` locks the schema.                                                                                                     |
| 6   | Where does a captured task land?        | **Appended to the end of the list**, outside any section, always. The predictable answer. If the user wants it elsewhere they drag it, which is the interaction the product is built around.         |
| 7   | Does the 720px desktop cap hold?        | **Yes for this initiative.** A desktop list sidebar is a real improvement and a real scope increase; it is a candidate for a later initiative, not a gap here.                                       |

### Answered by `/plan-eng-review`, 2026-08-18

All four carried questions are closed. See [`DESIGN.md`](DESIGN.md) → Offline Posture for the full table.

- **Section representation** — a real `sections` table, no foreign key, same nullable-reference pattern as `list_id`.
- **Ordering representation** — the `fractional-indexing` package, keys minted client-side, stored as `text COLLATE "C"`.
- **Sync-queue upgrade** — migrate in place, never drain; draining needs network and Spec 1's own story forbids losing offline writes.
- **Device-local preferences** — theme choice and section collapse state live in the existing `sync_meta` IndexedDB store, which never enqueues and therefore never syncs.

That review also reversed the offline posture: offline is now a degraded mode with a nag at 25 queued changes and a hard write ceiling at 100, and deletes are non-destructive moves to `Recently Deleted` with a 30-day server-side purge. `docs/PRODUCT.md` and ADR-M2-012 were updated to match.
