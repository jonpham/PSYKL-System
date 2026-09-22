# Visual Artifact — Production/prototype parity

> Form B — low-fidelity wireframes, before (shipped v0.5.0) / after (prototype parity). 390px width.

## 1. Task list — before → after

```text
BEFORE (production today)            AFTER (prototype parity)
┌──────────────────────────────┐     ┌──────────────────────────────┐
│ ☰ PSYKL                      │     │ ☰ PSYKL                      │
│ Tasks            (◉)  (⋯)    │     │ Tasks              (◉)(⋯)    │  ← fixed 40px + 48px
│──────────────────────────────│     │                              │     trailing columns
│ ○ Milk              Delete   │     │ ○ Milk                       │  ← no Delete button
│──────────────────────────────│     │ ⌐ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← separator inset to
│ ○ Bread             Delete   │     │ ○ Bread                      │     the title edge
│══════════════════════════════│     │ ⌐ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ ○ [new task…]                │     │ ○ [new task…]                │  ← one rule, not two
│──────────────────────────────│     │                              │
│ ⊘ Done              Delete   │     │ ⊘ Done                       │
│                              │     │                        ╭───╮ │
│ + New Task                   │     │                        │ + │ │  ← floating, sticky,
└──────────────────────────────┘     └────────────────────────╰───╯─┘     bottom-trailing
```

## 2. Lists header action — before → after

```text
BEFORE                               AFTER
│ Lists                    +   │     │ Lists                  (+)   │  ← 40px grey circle in
                                                                        the trailing column
```

## 3. Settings — before → after

```text
BEFORE                               AFTER
┌──────────────────────────────┐     ┌──────────────────────────────┐
│ Settings                     │     │ Settings                     │
│ Appearance                   │     │ Appearance                   │
│ [System][Light][Dark]  ← 3   │     │ ┌────────┬───────┬────────┐  │  ← one segmented
│   separate pill buttons      │     │ │ System │ Light │  Dark  │  │     control, equal
│ Contrast                     │     │ └────────┴───────┴────────┘  │     columns, raised
│ [Standard][Increased]        │     │ Contrast                     │     selected segment
│ Experiments                  │     │ ┌───────────┬─────────────┐  │
│ …                            │     │ │ Standard  │  Increased  │  │
│                              │     │ └───────────┴─────────────┘  │
│                              │     │ Experiments                  │
│                              │     │ …                            │
│ web a1b2c3 · api a1b2c3      │     │ About                        │
│ in sync   ← on EVERY view    │     │   Version                    │
└──────────────────────────────┘     │   web a1b2c3 · api a1b2c3    │
                                     │   in sync  ← Settings only   │
                                     └──────────────────────────────┘
```

## Notes

- Row vertical rhythm: the title owns the padding (`11px 0`, 44px min-height) instead of the row
  (`padding: .5rem 0`), which is what makes production's rows read as top-weighted.
- The doubled rule is `TaskRow`'s `border-bottom` on every row plus `CaptureRow`'s own top rule; the fix is the
  prototype's `+ ::before` inset separator, drawn once between adjacent rows only.
- The floating capture button keeps production's offline-ceiling behaviour: disabled, with the
  `Reconnect to keep adding.` accessible label. The prototype had no ceiling state.
- Sync view keeps production's `Everything is synced.` copy (issue #122 item 4a) — no change.
