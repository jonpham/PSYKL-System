# UX Plan: Todo Experience — screens, behaviors, and interactions

Rewritten during `/plan-design-review` (gstack) on 2026-08-14, replacing the version written by `/design-consultation` on 2026-08-13.
**Reconciled 2026-09-21** against the accepted `apple-reminders-ux` prototype, which shipped in `v0.4.1` and is now the visual and chrome baseline.
Branch: `feat/plan-psykl-loop`
Status: **PROPOSED — initiative paused.** `todo-experience` Specs 1-2 shipped; Specs 3-7 wait on the [`to-do-ui`](../to-do-ui/DESIGN.md) migration and are rebased onto the new surface afterwards.
Initiative: [`DESIGN.md`](DESIGN.md) · [`MILESTONE.md`](MILESTONE.md)
Visual system: [`docs/DESIGN.md`](../../DESIGN.md) — durable, not deleted at initiative close-out. **It outranks this file on anything visual.**

> **Reconciliation note, 2026-09-21.** This document was written before any of the surface existed. The `apple-reminders-ux` experiment then built it, and four operator review rounds changed several things this file had specified: the list-switcher sheet became a navigation drawer, the bottom-anchored capture field became a floating capture button, titles stopped truncating, row and type metrics moved, and completed tasks now show by default rather than hide. Those sections are corrected in place below and flagged **↺ reconciled**. What is _not_ corrected is the feature scope of Specs 3-7 — sections, ordering, notes, due dates, tags, search — which is unchanged and still to be rebased onto the new surface when those Specs resume.

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

↺ **Reconciled 2026-09-21** — the list-switcher sheet is gone, and three surfaces now arrive in `to-do-ui` rather than here.

| Screen                             | Purpose                                                             | Arrives in                          |
| ---------------------------------- | ------------------------------------------------------------------- | ----------------------------------- |
| **List view**                      | The app. One list's tasks, in sections, in the user's order.        | Spec 1                              |
| **Navigation drawer**              | Move between lists and destinations. Replaces the switcher sheet.   | `to-do-ui` Spec 1                   |
| **Lists page**                     | Create, rename, reorder, delete lists.                              | `to-do-ui` Spec 1                   |
| **Task detail** (sheet)            | Title, notes, due date, tags. Later: Start PSYKL + session history. | Spec 5                              |
| **Search** (overlay)               | Query across all lists.                                             | Spec 7                              |
| **Recently Deleted** (destination) | Deleted lists, sections, and tasks. Restore, or wait 30 days.       | Spec 2 · restyled `to-do-ui` Spec 5 |
| **Sync** (destination)             | Queued, failed, and stale-write records.                            | `to-do-ui` Spec 5                   |
| **Settings** (destination)         | Appearance (System / Light / Dark).                                 | `to-do-ui` Spec 5                   |
| **Live session** (full screen)     | Reserved. Not built here.                                           | `psykl-loop`                        |

**The list switcher is retired.** It was a modal detour for the app's most common navigation. The drawer replaces it and also gives Sync, Recently Deleted, and Settings a home; list management moves to a full Lists page rather than living inside a sheet.

There is no Today view and no dashboard. The app opens directly into the last list the user was in. A Today view is a date-derived surface and premise P2 keeps date-derived attention claims out of this product; if one is ever built it is a later decision, not a gap in this initiative.

### List view chrome

↺ **Reconciled 2026-09-21.** The chrome sketched here was replaced by what the prototype built and review accepted. Canonical description: [`docs/DESIGN.md`](../../DESIGN.md) → Chrome and Navigation. In summary, top to bottom:

- **A header row** carrying the drawer toggle on the leading edge and the sync control on the trailing edge, both as glyph tiles. The header glyph holds the same position whether the drawer is open or closed.
- **The list title** in `large-title` (34/41), followed by a full-bleed separator. There is no task count in the header, and Reminders' scroll-collapse of the title is not adopted.
- **The overflow menu** still owns low-frequency list operations: `New Section`, `Show/Hide Completed`, `Rename List`, `Delete List`. `Settings` left the menu — it is a drawer destination now. This still resolves the missing section-creation affordance that Spec 3's story needs.
- **A floating circular capture button** in the trailing bottom corner, clear of the safe-area inset, opening a capture row in place. **The bottom-anchored 56px capture field specified here was replaced during review** and does not exist.
- **Search** is reachable by pulling down at the top of the list, the convention in all three reference apps. Unchanged, still Spec 7.

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

↺ **Reconciled 2026-09-21** — metrics below are the built ones. The wireframe above still shows the 48px row and the truncating second line; read it for anatomy, not for numbers.

- **Leading edge: a 22px circular checkbox** with a `1.5px` `--text-tertiary` stroke unchecked, filling `--accent` when checked, in a 44px touch target. It sits in a **36px column** matching the title inset, not a 44px one — a 44px column reaches back into the page gutter.
- **Row floor is 44px**, not 48px. At 17px type with 11px padding the row already clears 44px; the extra 4px only cost rows on screen.
- **Title:** `row` token at **17/22**, and it **wraps without ever truncating.** The two-line-then-ellipsis cap specified here was built and removed — it cut real titles where the meaning was, for no layout benefit, and Reminders does not truncate either.
- **Wrapped titles align the checkbox and the pending dot to the first line**, not the block center.
- **Due date:** always right-aligned on the **title's first line**, whether or not a metadata line exists. When a metadata line is present the date does not move down to join it; that alternation destroys the column the date is supposed to form. Past due renders in `--destructive`.
- **Metadata line** (only when there is a note or tags): note indicator `▤`, then tags. `--text-secondary`.
- **Trailing edge:** nothing at rest. On hover (pointer) or during a drag, a grip appears.
- **Completed:** title strikes through and drops to `--text-tertiary`; the metadata line is dropped.
- **Pending sync:** rows unsynced for >2s carry an 8px pending dot, in a column that hangs directly under the header's sync control so the relationship reads without a legend.

---

## 4. Gesture vocabulary

Complete for the list view. Adding a gesture requires editing this table rather than quietly appending.

| Gesture               | Target                      | Result                                            | Arrives in        |
| --------------------- | --------------------------- | ------------------------------------------------- | ----------------- |
| Tap                   | Checkbox                    | Toggle complete / incomplete                      | Shipped (M2)      |
| Tap                   | Row title                   | Edit the title inline, in place                   | Shipped (M2)      |
| Tap                   | Row, trailing detail button | Open task detail sheet                            | Spec 5            |
| Swipe right           | Row                         | Complete / uncomplete                             | Spec 6            |
| Swipe left            | Row                         | Reveal Delete; moves the task to Recently Deleted | Spec 6            |
| Long-press, then drag | Row                         | Reorder within and across sections                | Spec 4            |
| Modifier + ↑ / ↓      | Focused row                 | Reorder without a pointer; announced via ARIA     | Spec 4            |
| Long-press, then drag | Section header              | Reorder sections within the list                  | Spec 4            |
| Tap                   | Section header              | Collapse / expand section                         | Spec 3            |
| Tap                   | Drawer toggle               | Open the navigation drawer ↺                      | `to-do-ui` Spec 1 |
| Tap                   | Overflow `⋯`                | Open the list menu                                | `to-do-ui` Spec 4 |
| Tap                   | Sync control                | Open the Sync destination ↺                       | `to-do-ui` Spec 5 |
| Pull down             | Top of list                 | Reveal search                                     | Spec 7            |
| Tap                   | Capture button `+`          | Open a capture row after the last open task ↺     | `to-do-ui` Spec 3 |
| Enter                 | Capture row                 | Commit and open the next empty row                | `to-do-ui` Spec 3 |
| Escape                | Capture row                 | Leave capture; an empty row is discarded          | `to-do-ui` Spec 3 |
| **Reserved**          | Detail sheet primary button | **Start PSYKL session**                           | `psykl-loop`      |

**Pull-to-refresh does not exist.** Sync is automatic and continuous. The pull gesture at the top of the list is spent on search instead, which is what the reference apps do.

### Inline edit and the detail sheet both survive

The previous version of this document moved title editing into the detail sheet and flagged the resulting two-tap regression as "the most likely thing in this document to be wrong." It was. Reminders solves this by giving the row two targets: tapping the title edits in place, and a trailing detail button opens the sheet. PSYKL does the same. M2 Spec 6's inline edit is preserved rather than regressed, and the sheet still owns notes, dates, tags, and the reserved Start button.

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

↺ Spec 1 shipped against the list switcher. `to-do-ui` Spec 1 retires it, and rewrites the three titles below that name it — `a user creates a list and it appears in the navigation`, `a user re-orders their lists`, and the switcher's own navigation story becomes `a user opens the navigation and switches between lists`. The behaviors are unchanged; only the surface they drive is.

- `a user creates a list and it appears in the list switcher`
- `a user renames a list and the header updates without losing scroll position`
- `a user creates a task while a specific list is open and the task lands in that list`
- `a user switches lists and the previously open list's arrangement is preserved`
- `a user reorders their lists in the switcher and the order persists`
- `a user deletes their only list and a default list remains`
- `a user creates a list while offline and it appears on a second device after reconnecting`
- `a user's existing tasks from before lists existed appear in the default list`
- `a user with queued offline writes upgrades the app and loses none of them`

### Spec 2 — Recently Deleted and offline posture

- `a user deletes a list and it moves to Recently Deleted with its tasks intact`
- `a user restores a deleted list and its tasks come back in their original order`
- `a user deletes a task while offline and it moves to Recently Deleted without needing the network`
- `a user sees how many days remain before a deleted item is purged`
- `a user's task whose list was deleted on another device appears in the default list rather than vanishing`
- `a user offline with 25 queued changes sees a banner telling them to reconnect`
- `a user offline with 100 queued changes cannot add a new task until they reconnect`

### Spec 3 — Sections

- `a user adds a section from the list menu and it appears as a header in the flow of the list`
- `a user moves a task into a section by dragging it under the header`
- `a user collapses a section and its tasks are hidden but its count remains visible`
- `a user renames a section and tasks under it stay put`
- `a user deletes a section and its tasks return to the list's unsectioned area rather than being deleted`
- `a user collapses a section on one device and it stays expanded on another`

### Spec 4 — Manual ordering

- `a user drags a task to the top of the list and it stays there after reload`
- `a user sees a grip appear when long-pressing a task, before the drag starts`
- `a user drags a task from one section into another and it keeps its new position`
- `a user reorders a task using only the keyboard and hears the move announced`
- `a user reorders sections and the tasks travel with their headers`
- `a user rearranges a list on two offline devices and no hand-made arrangement is lost after both reconnect`

That last one is the initiative's stated success criterion and the hardest test in the milestone.

### Spec 5 — Notes and optional due date

- `a user taps a task title and edits it in place without leaving the list`
- `a user opens a task's detail and sees its full title, notes, due date, and tags`
- `a user writes a note on a task and a note indicator appears on the row`
- `a user sets a due date and it appears right-aligned on the row's title line`
- `a user sets a due time only when the deadline has a real time, and the time is optional`
- `a user sees a past due date rendered as overdue`

### Spec 6 — Interaction polish and theming

- `a user swipes right on a task to complete it without opening anything`
- `a user swipes left on a task and must confirm before it is deleted`
- `a user with reduced-motion enabled sees state changes without animation`
- `a user scrolls a list of forty tasks and the date column stays aligned`
- `a user switches to the Ledger theme and the whole app changes appearance`
- `a user's chosen theme survives a reload but does not follow them to a second device`

### Spec 7 — Tags and search

- `a user applies a tag to a task and it appears in the row's metadata`
- `a user applies the same tag to tasks in different lists`
- `a user searches for a word and sees matching tasks from every list`
- `a user searches by tag and sees every task carrying it`
- `a user searches while offline and still gets results`

---

## 6. Empty, loading, and edge states

Each is a designed screen, not a blank area. Copy is in `--text-secondary`.

↺ **Reconciled 2026-09-21.** Three changes: the empty-list copy is **centred**, not left-aligned under the header; the offline nag and permanent-failure rows are no longer anchored above a capture field that no longer exists — both move to the header sync control and the Sync destination; and **completed tasks show by default**, sorted below the open ones, rather than hiding.

| State                           | Content                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **First paint**                 | The app shell renders immediately and the list area holds three placeholder rows at `--bg-grouped` until IndexedDB resolves. No spinner: the local read is fast, and a spinner would imply a network wait that is not happening.                                                                                                                                                                                                                      |
| **First run**                   | The default list exists and is open. Migration puts every pre-existing task there.                                                                                                                                                                                                                                                                                                                                                                    |
| **List with no tasks**          | ↺ Centred `No Reminders` in `--text-secondary` at `row` size, with the capture button still present. The reorder gesture is taught here once drag lands in Spec 4 — it has no UI to teach yet.                                                                                                                                                                                                                                                        |
| **Section with no tasks**       | The header stays with a `0` count. Empty sections are not auto-removed — a section is a container the user made on purpose.                                                                                                                                                                                                                                                                                                                           |
| **All tasks completed**         | ↺ Completed rows are **shown** by default, struck through and dimmed, sorted in completion order. The list does not read as empty. `Hide Completed` in the list menu collapses them, and that choice is a per-list device-local preference. No celebration.                                                                                                                                                                                           |
| **Search, no results**          | `No tasks match "<query>".` Nothing else.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Offline, few queued writes**  | Unsynced rows dim to 0.6 and show a pending dot, as in M2. No banner below the nag threshold.                                                                                                                                                                                                                                                                                                                                                         |
| **Offline, 25+ queued writes**  | ↺ The header sync control takes `--status-warn` and carries the count; the Sync destination lists what is waiting. The nag threshold is unchanged behavior — only its presentation moved off the retired banner. It blocks nothing.                                                                                                                                                                                                                   |
| **Offline, 100+ queued writes** | ↺ Capture is refused and says so; writes to existing rows are refused with the same message. The ceiling is unchanged behavior. Offline is a degraded mode and the app says so plainly.                                                                                                                                                                                                                                                               |
| **Recently Deleted, empty**     | `Nothing deleted in the last 30 days.`                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Recently Deleted, populated** | Rows show what was deleted with the remaining days right-aligned in the metadata column: `28d`. Restore returns the item to its original list; if that list is itself deleted, it goes to the default list.                                                                                                                                                                                                                                           |
| **Sync failed permanently**     | ↺ The header sync control takes `--destructive` and carries the count; the Sync destination lists each failed operation with its reason.                                                                                                                                                                                                                                                                                                              |
| **Arrangement reconciled**      | When a sync resolves a concurrent reorder and the local order changes as a result, the affected rows animate to their new positions rather than snapping, and the change is recorded in the **Sync destination** rather than as a dismissible line. A hand-made arrangement changing silently is the failure mode the success criterion exists to prevent; the user is told, somewhere they can go back and look (`to-do-ui` DESIGN.md → Decision 3). |

---

## 7. Dense-list behavior

- **The list is virtualized above ~200 rows**, but scroll position and drag behavior must be identical either side of that threshold.
- ↺ **Titles wrap and never truncate.**
- **The due date column is right-aligned on the title's first line**, always at the same offset, so it forms a true column down the screen.
- **Section headers do not stick.** A sticky header floating over a list being dragged within is a fight between two motions.
- ↺ **Completed tasks are shown by default**, sorted below the open ones in completion order, struck through and dimmed. `Hide Completed` in the list menu collapses them, per list, device-locally. This still replaces the "sweep on next open" proposal, which was an invention; what changed is the default — the built surface showed that hiding completed work by default makes the list feel like it forgets what you did.
- **No interaction makes a row grow in place.** Everything needing more room opens the sheet.

---

## 8. Reference app parity

The initiative's honest success criterion is that the operator prefers PSYKL for daily capture. This table is the functional bar; craft parity is judged separately, by use.

| Capability                           | Reminders                | PSYKL                            | Verdict                |
| ------------------------------------ | ------------------------ | -------------------------------- | ---------------------- |
| Lists                                | ✅                       | ✅ Spec 1                        | **Match**              |
| Sections within a list               | ✅                       | ✅ Spec 3                        | **Match**              |
| Manual drag-to-reorder               | ✅                       | ✅ Spec 4                        | **Match**              |
| Discoverable drag handle             | ❌ invisible until known | ✅ grip + keyboard path + taught | **Beat**               |
| Inline title edit                    | ✅                       | ✅ shipped M2                    | **Match**              |
| Notes on a task                      | ✅                       | ✅ Spec 5                        | **Match**              |
| Due date, optional time              | ✅                       | ✅ Spec 5                        | **Match**              |
| Overdue indication                   | ✅                       | ✅ Spec 5                        | **Match**              |
| Tags                                 | ✅                       | ✅ Spec 7                        | **Match**              |
| Search                               | ✅                       | ✅ Spec 7                        | **Match**              |
| Swipe to complete / delete           | ✅                       | ✅ Spec 6                        | **Match**              |
| Appearance (System / Light / Dark)   | ✅                       | ✅ `to-do-ui` Spec 5             | **Match**              |
| Theming beyond appearance            | ❌                       | ⚪ deferred, nothing scheduled   | **Not yet**            |
| Offline-first with multi-device sync | ⚠️ iCloud, opaque        | ✅ shipped in M2, tested         | **Beat**               |
| Subtasks                             | ✅                       | ❌ deferred by P3                | **Lose, deliberately** |
| Notifications and alerts             | ✅                       | ❌ out, per P2                   | **Out of scope**       |
| Repeat rules                         | ✅                       | ❌ templates later, not repeats  | **Out of scope**       |
| Priority flags                       | ✅                       | ❌ ordering instead              | **Out of scope**       |
| Date-derived Today view              | ✅                       | ❌ out, per P2                   | **Out of scope**       |
| Shared lists, assignees              | ✅                       | ❌ single-user by design         | **Out of scope**       |
| Focused work sessions against a task | ❌                       | ✅ `psykl-loop`                  | **The differentiator** |

↺ The theming row split on 2026-09-21: appearance shipped and is a match, not a beat; a fuller theme layer is deferred with nothing scheduling it. Ten matches, two beats. If the operator misses something in the out-of-scope rows during real use, that is the signal premise P3 exists to catch, and it should change the roadmap rather than be endured.

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

| #   | Question                                | Decision                                                                                                                                                                                                                                                           |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | What is the default list?               | **Named `Tasks`, renameable, and not special beyond one rule: the last remaining list cannot be deleted.** Migration puts pre-existing tasks there. A task created without list context lands there.                                                               |
| 2   | Where does title editing live?          | **Both.** Tap the title to edit in place (M2 behavior preserved); tap the trailing detail button for the sheet. The previous single-target proposal was the regression it flagged itself as.                                                                       |
| 3   | Do sections collapse, and does it sync? | **Collapse is device-local, not synced.** It describes how one device is being looked at, not the data. Same rule as theme choice. `/plan-eng-review` confirms against the sync model.                                                                             |
| 4   | When do completed tasks sweep?          | ↺ **They do not sweep.** They sink below the open tasks and stay visible; `Hide Completed` collapses them per list. Revised 2026-09-21 — the original answer hid them by default, which the built surface showed makes the list feel like it forgets what you did. |
| 5   | Does a task belong to exactly one list? | **Yes.** Tags are the cross-cutting dimension. Stated here; `/plan-eng-review` locks the schema.                                                                                                                                                                   |
| 6   | Where does a captured task land?        | **Appended to the end of the list**, outside any section, always. The predictable answer. If the user wants it elsewhere they drag it, which is the interaction the product is built around.                                                                       |
| 7   | Does the 720px desktop cap hold?        | ↺ **No — it is 680px, and the desktop sidebar exists.** Revised 2026-09-21: measured at 1024px beside the persistent sidebar, 720px read as stretched. The sidebar that was deferred here shipped in the prototype and lands in `to-do-ui` Spec 1.                 |

### Answered by `/plan-eng-review`, 2026-08-18

All four carried questions are closed. See [`DESIGN.md`](DESIGN.md) → Offline Posture for the full table.

- **Section representation** — a real `sections` table, no foreign key, same nullable-reference pattern as `list_id`.
- **Ordering representation** — the `fractional-indexing` package, keys minted client-side, stored as `text COLLATE "C"`.
- **Sync-queue upgrade** — migrate in place, never drain; draining needs network and Spec 1's own story forbids losing offline writes.
- **Device-local preferences** — theme choice and section collapse state live in the existing `sync_meta` IndexedDB store, which never enqueues and therefore never syncs.

That review also reversed the offline posture: offline is now a degraded mode with a nag at 25 queued changes and a hard write ceiling at 100, and deletes are non-destructive moves to `Recently Deleted` with a 30-day server-side purge. `docs/PRODUCT.md` and ADR-M2-012 were updated to match.
