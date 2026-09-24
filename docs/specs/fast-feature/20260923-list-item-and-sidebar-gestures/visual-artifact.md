# Visual Artifact — Task Row and Sidebar Touch Gestures

> Lightweight feature workflow, `target = production`. Form B — low-fidelity wireframes.
> Four frames: row at rest, row with its rail open, row past the full-swipe threshold, sidebar mid-drag.

## 1 — Row at rest (today, unchanged)

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                             ⋮⋮ │   ← 44px row, tap title = edit
│ ( )  Call the plumber                        │
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

## 2 — Rail open (released between 25% and 60% of row width)

Row surface translates left by the rail width; the rail is painted behind it, revealed not pushed.

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                             ⋮⋮ │
│ ( )  plumber        │   (i)      │    🗑      │   ← 88px + 88px rail
│                     │  Details   │  Delete   │
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
      ↑ row surface, translateX(-176px)
```

`Details` opens the same `TaskItemDrawer` the **(i)** button opens. `Delete` performs the ordinary soft delete — one press, because the swipe itself was the deliberate act.

## 3 — Past the full-swipe threshold (> 60% of row width)

The Delete pane takes the whole row behind the surface, so the commit is visible before the finger lifts. Release here deletes; drag back under the threshold and it returns to frame 2's rail.

```text
┌──────────────────────────────────────────────┐
│ ( )  Buy milk                             ⋮⋮ │
│ mber │            🗑  Delete                  │   ← rail floods the row
│ (●)  Water the plants                        │
└──────────────────────────────────────────────┘
```

## 4 — Sidebar mid-drag (narrow layout only, < 768px container)

Touch starts in the leftmost 24px gutter and drags right; the sidebar tracks the finger 1:1 from `translateX(-100%)`, with the backdrop fading in proportionally. Release past 40% of the sidebar's width settles it open, otherwise it settles shut. On the open sidebar the same drag, leftwards, closes it.

```text
      ┆ 24px edge zone
┌─────┆────────────────────────────────────────┐
│░░░░░│▒▒▒▒▒                                   │
│ PSY │  Lists  ▒▒▒  My Tasks                  │   ← sidebar at translateX(-42%)
│ Sid │  ▒▒▒▒▒  ▒▒▒  Shopping                  │      backdrop at 0.58 × full
│ ebar│  ▒▒▒▒▒                                 │
└─────┆────────────────────────────────────────┘
      └──→ finger
```

---

## Notes

- **Axis lock.** A gesture claims the horizontal axis only once `|dx| > 10px` and `|dx| > |dy|`; until then vertical scrolling wins and the row never moves. The swipe surface carries `touch-action: pan-y`.
- **Thresholds.** Rail opens/stays open past 25% of row width; full-swipe arms past 60%. Sidebar settles open/closed past 40% of its own width, or on a flick faster than 0.5 px/ms in either direction.
- **Snap motion** is a 220ms ease transform, applied only when the finger is up; suppressed under `prefers-reduced-motion`.
- **One row open at a time** — opening a rail, scrolling the list, entering selection mode, or tapping anywhere else closes it.
- **Nothing here is the only route to anything.** Details and Delete both remain reachable by tap through the **(i)** drawer, and the sidebar by its header button, so keyboard and pointer users lose nothing.
