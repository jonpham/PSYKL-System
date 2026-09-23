# Visual Artifact — Select and edit multiple list items

> Lightweight feature workflow, `target = production`. Form B — low-fidelity wireframes (4).
> Widths drawn at ~390px (iPhone). Existing chrome is marked `=`; new chrome is marked `+`.

## 1. Normal list view (today) — entry point

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries  ⟳  ⋯   │ = ⋯ opens the list options menu
├──────────────────────────────────────┤
│ ○  Oat milk                          │ = tap circle toggles, tap title edits
│ ○  Sourdough                         │
│ ●  Coffee beans          (completed) │ + mark becomes a FILLED DISC, no tick
├──────────────────────────────────────┤
│  ⋯ menu ▾                            │
│   Hide Completed (1)                 │ =
│ + Select Items                       │ + new menu item
│   Delete List                        │ =
├──────────────────────────────────────┤
│                 (+)                  │ = new-task button, right of the bar
└──────────────────────────────────────┘
```

## 2. Selection mode, nothing selected yet

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries  ⟳  ✓   │ + ✓ replaces ⋯ and exits selection mode
├──────────────────────────────────────┤
│ ○  Oat milk                      ≡   │ + titles are not tappable (no edit)
│ ○  Sourdough                     ≡   │ + ≡ drag handle on open tasks only
│ ●  Coffee beans                      │ + completed rows: no handle, filled disc
├──────────────────────────────────────┤
│                                      │
│           (no action bar)            │ + bar appears only with >= 1 selected
└──────────────────────────────────────┘
```

## 3. Two rows selected — floating action bar

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries  ⟳  ✓   │
├──────────────────────────────────────┤
│ ✓  Oat milk                      ≡   │ + tapping anywhere on the row selects
│ ○  Sourdough                     ≡   │ + selected = checkmark in the circle
│ ✓  Coffee beans                      │
├──────────────────────────────────────┤
│        ┌──────────────────┐          │ + centred on the same vertical plane
│        │  ●    ≡+    ⌫    │          │   the (+) button occupies; (+) hidden
│        └──────────────────┘          │   ● complete · ≡+ move · ⌫ delete
└──────────────────────────────────────┘
```

## 4. Move drawer (from bottom), opened by the move glyph

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries  ⟳  ✓   │
│ ✓  Oat milk                      ≡   │  (dimmed behind the drawer)
├──────────────────────────────────────┤
│  ✕            Move to:           ✓   │ + ✕ closes, ✓ commits the move
│ ──────────────────────────────────── │
│  ◯  Errands                          │ + current list is absent from the list
│  ◉  Weekend                          │ + one destination at a time
│  ◯  Reading                          │
└──────────────────────────────────────┘
```

## Notes

- Drag re-order applies to **open** tasks only; a drop above or below a completed row clamps to the end of the open group.
- Exiting selection mode clears the pool; it is not remembered across a reload.
- Batch delete reuses the existing soft-delete path, so the tasks land in Recently Deleted.
- The completed-mark change (tick to filled disc) is global to the list view, not scoped to selection mode, so a selected row's tick is never confusable with a completed row.
