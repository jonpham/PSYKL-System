---
status: DONE
issue: GH127
branches:
  - feat/127-list-item-details-drawer
prs:
  - https://github.com/jonpham/PSYKL-System/pull/140
completed_at: 2026-09-23
created_at: 2026-09-23
initiative: to-do-ui
spec: none — lightweight feature workflow, `target = production` (artifact folder consolidated into this doc at close-out)
---

# Task item details drawer

> Lightweight `target = production` change, Standard Lane, under [`docs/workflows/lightweight-feature-workflow.md`](../workflows/lightweight-feature-workflow.md). Source: [#127](https://github.com/jonpham/PSYKL-System/issues/127), against the surface [#126](https://github.com/jonpham/PSYKL-System/issues/126) and [#138](https://github.com/jonpham/PSYKL-System/issues/138) shipped.

## User Story

As a PWA user looking at one task, I want to open it on its own to read when it was created, changed, or finished, rename it, or delete it, so that acting on a single task does not require entering a selection mode built for batches.

## Features

1. **Tapping a title no longer moves the row.** The inline edit field was an `<input>`, which cannot wrap: a two-line title collapsed to one line and the row lost 22px under the user's finger, pulling everything below it up. The field is now an auto-growing `<textarea>` wearing the rendered title's own class, so font, padding, wrapping and box are identical and the row keeps its height at the moment of the tap. It grows by measured `scrollHeight` as typing needs another line, rather than scrolling inside a fixed box. Enter still ends the edit rather than inserting a newline.
2. **An (i) button appears on the row being edited**, in the trailing column the drag handle occupies in selection mode. The two are mutually exclusive by construction, so a tap in that column means one thing at a time; selection mode is unchanged.
3. **The Task Item Drawer** opens from it: an editable title, then `Completed`, `Last updated` and `Created`, then a centred delete. Its header is `MoveToListDrawer`'s grammar unchanged — ✕ discards and closes, ✓ commits and closes, Escape reads as ✕ — and ✓ stays inert until the title actually differs.
4. **A task that is not finished shows an em dash for Completed**, never a blank row, which would read as a surface that failed to load.
5. **Deleting one task takes two presses**, the same grammar as the selection bar's batch delete: the first arms the same control with a destructive ring and the label `Delete Task?`, the second performs it. Editing the title disarms it, because anything that changes what the press would destroy retires the confirmation. The deletion is the ordinary soft delete, so the task lands in Recently Deleted like any other.
6. **Both drawers are modal in fact, not only in ARIA.** They now sit in the scrim `DeleteListDialog` already used, so the list and the capture button are covered and unreachable behind an open drawer instead of floating over it.
7. **Both drawers become centred modals on desktop**, at the shell's existing 768px breakpoint — a bottom-anchored sheet sits far from where a wide-window user is looking. `MoveToListDrawer` gets this for free: the shared placement now lives in `styles/drawer.css` and neither drawer's own stylesheet says anything about where it sits.

## Visual Record

> The shipped surfaces at ~390px (iPhone), carried from the planning `visual-artifact.md` and
> updated to what was built. See the note at the end for how the two differ.

### 1. Before — tapping a wrapped title

```text
 resting                        editing (tapped)
┌───────────────────────────┐    ┌───────────────────────────┐
│ ○  Buy oat milk           │    │ ○  Buy oat milk           │
│ ○  Call the vet about the │ ─▶ │ ○  [ Call the vet abou… ] │  ← two lines collapse to one:
│    booster shot on Friday │    │ ◉  Renew passport         │    the row loses 22px and
│ ◉  Renew passport         │    │                           │    everything below jumps up
└───────────────────────────┘    └───────────────────────────┘
```

### 2. After — the row holds its shape, and gains (i)

```text
 resting                        editing (tapped)
┌───────────────────────────┐    ┌───────────────────────────┐
│ ○  Buy oat milk           │    │ ○  Buy oat milk           │
│ ○  Call the vet about the │ ─▶ │ ○  Call the vet about the │  ← same wrap, same two lines,
│    booster shot on Friday │    │    booster shot on F|  (i)│    caret where the finger
│ ◉  Renew passport         │    │ ◉  Renew passport         │    landed, (i) on the row
└───────────────────────────┘    └───────────────────────────┘
```

The (i) sits in the trailing column at the same x-position the ≡ drag handle holds in
selection mode, pinned to the row's first line like the pending-sync dot.

### 3. Task Item Drawer — mobile (sheet from the bottom, over a scrim)

```text
░░░░░░░ scrim: the list and (+) are covered ░░░░░░░
┌──────────────────────────────────────┐
│  ✕          Task            ✓        │  ← ✓ disabled until the title changes
├──────────────────────────────────────┤
│                                      │
│  [ Call the vet__________________ ]  │  ← 20px, no caption above it
│                                      │
├──────────────────────────────────────┤
│  Completed        —                  │  ← each row centred between its rules
│  Last updated     23 Sep 2026, 14:02 │
│  Created          21 Sep 2026, 09:47 │
├──────────────────────────────────────┤
│           Delete Task                │  ← resting: destructive colour, no ring
│                                      │
│   ── first press ──▶                 │
│                                      │
│        ┏━━━━━━━━━━━━━━━━┓            │
│        ┃  Delete Task?  ┃            │  ← armed: red ring on the
│        ┗━━━━━━━━━━━━━━━━┛            │     same control; a second
│                                      │     press deletes
└──────────────────────────────────────┘
```

### 4. Desktop (shell ≥ 768px) — same drawer, centred modal

```text
┌──────────────────────────────────────────────────────┐
│  Sidebar   │   Groceries                             │
│            │ ┌────────────────────────────────────┐  │
│            │ │  ✕         Task          ✓         │  │
│            │ ├────────────────────────────────────┤  │
│            │ │  [ Call the vet _______________ ]  │  │
│            │ │  Completed / Last updated / Created│  │
│            │ │           Delete Task              │  │
│            │ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**How the shipped surface differs from the plan:** three changes came out of operator review. The drawer's title field lost its `Title` caption and went to 20px — a single large field under a `Task` header is already the title — and was then centred in the gap between the header and the details, which the caption's removal had unbalanced. The detail rows were centred between their separators rather than baseline-aligned against the top rule. And the drawer gained the scrim: the `+` was visible over an open drawer, which the plan had not accounted for at all.

## Verification Steps

**Associated E2E tests:** `e2e/task_details.e2e.spec.ts` — eight scenarios covering the drawer's timestamps, rename, cancel, the two-press delete landing in Recently Deleted, the arming retiring on edit, the row holding its shape on tap, and the list being unreachable behind an open drawer.

**Manual verification**

_Setup / Preconditions_ — the Compose stack up (`docker compose up -d --build`), a list holding at least one task whose title is long enough to wrap to two lines.

_Steps_

1. Tap the wrapped title and watch the row as the field opens.
2. Tap the (i) that appears on the right of that row.
3. Read `Completed`, `Last updated`, `Created`; press ✓ before typing anything.
4. Edit the title and press ✓.
5. Reopen the drawer, press `Delete Task` once, then type in the title field.
6. Press `Delete Task` twice, then open Recently Deleted.
7. Widen the window past 768px and reopen the drawer; repeat with Move to List from selection mode.

_Expectation_ — (1) the row does not change height and the caret lands where the finger did; (2) the drawer rises over a scrim with the list and the `+` covered; (3) an unfinished task shows `—` for Completed and ✓ is disabled; (4) the list shows the new name and it survives a reload; (5) the armed ring retires as soon as the title changes; (6) the task leaves the list and appears in Recently Deleted; (7) both drawers render as centred modals.

## Affected Components

- `components/web_client/src/components/TaskList/TaskItemDrawer/` — new
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — trailing action slot, and a child slot for the drawer
- `components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx` — (i), drawer state, rename and delete, the auto-growing field
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — the textarea sharing the title's box; the (i) sharing the handle's column
- `components/web_client/src/hooks/useInlineEdit.ts` — widened over `HTMLInputElement | HTMLTextAreaElement`
- `components/web_client/src/styles/drawer.css` — new; the scrim and sheet both drawers share
- `components/web_client/src/components/TaskList/MoveToListDrawer/` — placement moved out to the shared sheet

**Unchanged:** `components/service-task` entirely. No schema change, no migration, no new endpoint.

## Design Decisions

- **No backend change, and none needed.** `created_at`, `updated_at` and `completed_at` already ship on the `Task` payload, and the drawer's delete reuses the soft-delete path `useTaskSelection.deleteSelected` already calls one task at a time — so it inherits the offline queue and its recovery like every other write.
- **An `<input>` could never have satisfied the requirement.** The CSS already matched font, size, line-height and padding between the rendered title and the edit field; the jump came from `overflow-wrap` and `white-space` being dead rules on an element that cannot wrap. A textarea was the only fix that keeps one shared class.
- **The list-title editor keeps its `<input>`.** `useInlineEdit` is shared with `AppShell/EditableTitle`; the hook widened over both element types rather than forcing both call sites onto a textarea, because a list name is one line by design.
- **The (i) fires on `pointerdown`, not `click`** — the title field's blur unmounts the button before a click could land on it.
- **Opening the drawer ends the inline edit.** The row shows its title as static text while the drawer is open, so there are never two live fields over one title.
- **The arming flag is local state in the drawer, mirroring `SelectionBar`'s, not a shared abstraction.** Two call sites is not a pattern; a third is when to extract one.
- **The drawers got the existing scrim rather than a new z-index.** They already claimed `aria-modal`, so the list being tappable behind them was a defect in its own right, and the delete-list dialog had the answer already.

## Architecture Decisions (ADR)

None. No new ADR; no existing ADR is amended.

## Change Log

| Date       | PR                                                       | Summary                                                                                  |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 2026-09-23 | [#140](https://github.com/jonpham/PSYKL-System/pull/140) | Task item details drawer, non-jumping inline edit, shared drawer scrim and desktop modal |
