# Visual Artifact — Task Item Details Drawer

> `target = production`, Standard Lane. Form B — low-fidelity wireframes. Carried into the feature doc's `## Visual Record` at close-out.

## 1. Today — tapping a wrapped title (before)

```text
 resting                        editing (tapped)
┌───────────────────────────┐    ┌───────────────────────────┐
│ ○  Buy oat milk           │    │ ○  Buy oat milk           │
│ ○  Call the vet about the │ ─▶ │ ○  [ Call the vet abou… ] │  ← two lines collapse to one:
│    booster shot on Friday │    │ ◉  Renew passport         │    the row loses 22px and
│ ◉  Renew passport         │    │                           │    everything below jumps up
└───────────────────────────┘    └───────────────────────────┘
```

## 2. After — the row holds its shape, and gains (i)

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

## 3. Task Item Drawer — mobile (sheet from the bottom)

```text
┌──────────────────────────────────────┐
│ ○  Buy oat milk           (dimmed)   │
├──────────────────────────────────────┤
│  ✕          Task            ✓        │  ← ✓ disabled until the title changes
├──────────────────────────────────────┤
│  [ Call the vet__________________ ]  │
├──────────────────────────────────────┤
│  Completed        —                  │
│  Last updated     23 Sep 2026, 14:02 │
│  Created          21 Sep 2026, 09:47 │
├──────────────────────────────────────┤
│              Delete                  │  ← centred, destructive colour
└──────────────────────────────────────┘
```

## 4. Desktop (shell ≥ 768px) — same drawer, centred modal

```text
┌──────────────────────────────────────────────────────┐
│  Sidebar   │   Groceries                             │
│            │ ┌────────────────────────────────────┐  │
│            │ │  ✕         Task          ✓         │  │
│            │ ├────────────────────────────────────┤  │
│            │ │  [ Call the vet _______________ ]  │  │
│            │ │  Completed / Last updated / Created│  │
│            │ │              Delete                │  │
│            │ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Notes

- **No visual jump on edit:** the edit field is an auto-growing `textarea`, not an `input`, so it inherits the rendered title's font, padding, wrapping and height and the row never changes size at the moment of the tap. Enter commits (it does not insert a newline); the field grows only as typed text needs a new line.
- **Timestamp empty state:** a task that is not complete shows `—` for Completed, never a blank row.
- **Close vs confirm semantics match `MoveToListDrawer`:** ✕ discards and closes; ✓ commits and closes; Escape behaves as ✕.
- **`MoveToListDrawer` changes too** — wireframe 4 applies to it unchanged, so both drawers share one desktop presentation.
- Delete closes the drawer immediately and soft-deletes optimistically; the task lands in Recently Deleted like any other deletion.
