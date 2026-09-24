# Visual Artifact — Sidebar Navigation on Desktop and Mobile

Form B — low-fidelity wireframes. Three frames: mobile closed, mobile open, wide screen.

## 1. Mobile, sidebar closed (~390px) — default

```text
┌─────────────────────────────┐
│ ☰ PSYKL            (tap ↩)  │  ← heading is the open control
├─────────────────────────────┤
│ Groceries                   │  ← active destination title
│ ┌─────────────────────────┐ │
│ │ + Add a task            │ │
│ └─────────────────────────┘ │
│ [ ] Oat milk                │
│ [ ] Coffee beans            │
│ [x] Bread                   │
│                             │
│                             │
└─────────────────────────────┘
   no navigation buttons in the content area
```

## 2. Mobile, sidebar open — after tapping `PSYKL`

```text
┌───────────────────┬─────────┐
│ ✕ PSYKL           │▒▒▒▒▒▒▒▒▒│
├───────────────────┤▒ dimmed │
│ LISTS             │▒ main   │
│  • Groceries    ✓ │▒ view   │
│  • Work           │▒       ▒│
│                   │▒ tap or │
│ ─────────────     │▒ Esc to │
│  ↺ Recently Del.  │▒ close  │
│  ⚙ Settings       │▒▒▒▒▒▒▒▒▒│
└───────────────────┴─────────┘
   selecting any row → view changes AND sidebar closes
```

## 3. Wide screen (≥768px) — sidebar persistent

```text
┌──────────────┬──────────────────────────────┐
│ PSYKL        │ Settings                     │
│              │                              │
│ LISTS        │  Experiments                 │
│  • Groceries │   … prototypes list …        │
│  • Work    ✓ │                              │
│ ──────────── │  About                       │
│  ↺ Recently  │   web a1b2c3 · api a1b2c3    │
│  ⚙ Settings ✓│   in sync                    │
└──────────────┴──────────────────────────────┘
   Settings occupies the main area; version info lives inside it
```

## Notes

- The `PSYKL` heading is the only open affordance on mobile; it carries `aria-expanded` and toggles.
- Sidebar open/close is an instant show/hide in the first slice — no slide animation until the layout is agreed.
- Recently Deleted and Settings become main-area destinations, not dialogs, so the same route model covers all three.
