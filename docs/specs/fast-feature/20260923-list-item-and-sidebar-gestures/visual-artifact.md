# Visual Artifact — Task Row Gestures and Touch Polish

> Lightweight feature workflow, `target = production`. Form B — low-fidelity wireframes.
> Four frames: row at rest, a focused row with its rail open, past the full-swipe threshold, and tapping the empty list space.
> Revised after device feedback on PR #141: the sidebar-drag frame is gone, and the focus frame is new.

## 1 — Row at rest (today, unchanged)

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                                │   ← 44px rows, tap title = edit
│ ( )  Call the plumber                        │
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

## 2 — Focused row, rail open (released between 25% and 60% of row width)

The row the user is acting on — editing its title, swiping it, or holding its rail open — is **framed**: a grey boundary (`--bg-selected`) with the task as a rounded white box (`--bg-app`) inside it. The frame grows outward into the page gutter, so no text moves. The rail's actions are their own rounded boxes inside the same frame. Every other row is untouched.

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                                │
╭──────────────────────────────────────────────╮  ← grey frame, 4px
│╭──────────────────────╮╭────────╮╭─────────╮│
││ ( )  Call the plumbe ││  (i)   ││   🗑    ││  ← white task box, then two
││                      ││Details ││ Delete  ││    boxed actions (88px each)
│╰──────────────────────╯╰────────╯╰─────────╯│
╰──────────────────────────────────────────────╯
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

`Details` opens the same `TaskItemDrawer` the **(i)** button opens. `Delete` performs the ordinary soft delete — one press, because the swipe itself was the deliberate act.

## 3 — Past the full-swipe threshold (> 60% of row width)

The Delete pane fills the task's own rounded box inside the frame, so the commit is visible before the finger lifts. Release here deletes; drag back under the threshold and it returns to frame 2's rail.

```text
╭──────────────────────────────────────────────╮
│╭─────╮╭────────────────────────────────────╮│
││ mbe ││                         🗑  Delete  ││  ← red, rounded, inside the frame
│╰─────╯╰────────────────────────────────────╯│
╰──────────────────────────────────────────────╯
```

## 4 — Tapping the empty space

Everything between the last row (or the empty-state copy) and the (+) starts a task, exactly as the (+) does.

```text
┌──────────────────────────────────────────────┐
│ Nothing to do yet.                           │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ ┆            tap anywhere here             ┆ │  ← opens capture, like (+)
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│                                         (+)  │
└──────────────────────────────────────────────┘
```

---

## Notes

- **Axis lock.** A gesture claims the horizontal axis only once `|dx| > 10px` and `|dx| > |dy|`; until then vertical scrolling wins and the row never moves. The swipe surface carries `touch-action: pan-y`.
- **Thresholds.** The rail opens and stays open past 25% of the row's width; full-swipe arms past 60%. A flick faster than 0.5 px/ms decides on its own.
- **Snap motion** is a 220ms ease transform, applied only when the finger is up; suppressed under `prefers-reduced-motion`.
- **One row open at a time.** Opening another rail, scrolling, entering selection mode, tapping the covered row, or tapping the empty space closes it.
- **Empty space is inert** in selection mode and past the offline write ceiling, where the (+) is replaced or disabled.
- **Safari tint.** With the sidebar open, the notch and toolbar keep `--bg-app` rather than the scrim's shade.
- **Nothing here is the only route to anything.** Details and Delete remain reachable through the **(i)** drawer, and starting a task through the (+).
