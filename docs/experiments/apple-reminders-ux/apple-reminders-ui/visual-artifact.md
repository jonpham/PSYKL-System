# Visual Artifact — Reminders-Grade List Skin

Form B — low-fidelity wireframes. Reference: Apple Reminders, single list, iOS 18.

## 1 — Loaded list @ 390px

```text
┌──────────────────────────────┐
│ ☰                            │  44px chrome, tint glyph
│                              │
│ Tasks                      ● │  title 34/41 bold · sync dot
│ ──────────────────────────── │  separator, full bleed
│  ◯  Book dentist             │  row 44px min · title 17/22
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │  separator inset to title edge
│  ◯  Draft the offline sync   │
│     notes for Thursday       │  wraps, never truncates
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ✔  ̶R̶e̶n̶e̶w̶ ̶p̶a̶s̶s̶p̶o̶r̶t̶         │  completed sink below open
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ✔  ̶P̶a̶y̶ ̶i̶n̶v̶o̶i̶c̶e̶            │
│                              │
│                              │
│ ⊕ New Reminder               │  56px bar, bottom-anchored, tint
└──────────────────────────────┘
```

## 2 — Capture, keyboard up @ 390px

```text
┌──────────────────────────────┐
│  ◯  Book dentist             │
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ◯  Draft the offline sync…  │
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ◯  ▏                        │  new row appended in place,
│                              │  caret live, no modal
├──────────────────────────────┤
│  q w e r t y u i o p         │  Return commits + opens the
│   a s d f g h j k l          │  next empty row; empty blur
│    z x c v b n m  ⌫          │  discards it
│  ─────── space ───── return  │
└──────────────────────────────┘
```

## 3 — Empty list @ 390px

```text
┌──────────────────────────────┐
│ ☰                            │
│ Tasks                        │
│ ──────────────────────────── │
│                              │
│                              │
│         No Reminders         │  secondary, centred, 17/22
│                              │
│                              │
│ ⊕ New Reminder               │
└──────────────────────────────┘
```

## 4 — Desktop @ 1024px

```text
┌───────────────┬──────────────────────────────────────────┐
│ PSYKL         │  Tasks                                 ● │
│  ▸ Tasks   ✓  │  ────────────────────────────────────────│
│  ▸ Sync       │   ◯  Book dentist                        │
│  ▸ Recently…  │      ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ▸ Settings   │   ◯  Draft the offline sync notes        │
│               │      ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│               │   ✔  ̶R̶e̶n̶e̶w̶ ̶p̶a̶s̶s̶p̶o̶r̶t̶                    │
│               │                                          │
│               │   ⊕ New Reminder                         │
└───────────────┴──────────────────────────────────────────┘
        content column max 680px, gutters absorb the rest
```

## Notes

- **Tokens** are iteration-local, scoped to `.reminders-experiment`, derived from Apple Reminders: system font stack; tint `#007AFF` / `#0A84FF` dark; app ground `#FFF` / `#000`; secondary text `#8E8E93`; separator `#C6C6C8` / `#38383A`; radius 10px.
- **Checkbox** 22px circle, 1.5px `#C7C7CC` stroke unchecked; fills tint with a white check when done. 44px hit target.
- **Motion** — check fill + strike 200ms `ease-out`; row settle to its new position 250ms `ease-in-out`; press `#D1D1D6` at 100ms. All collapse to instant under `prefers-reduced-motion`.
- **Ordering** — open tasks in current order, completed below in completion order. Issue #86 asks for bottom-ordering; completed rows stay visible rather than hidden.
- Reminders' title scroll-collapse into the nav bar is **not** in this iteration.
