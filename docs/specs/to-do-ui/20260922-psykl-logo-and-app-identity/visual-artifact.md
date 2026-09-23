# Visual Artifact — PSYKL Logo & App Identity

> Form B — low-fidelity wireframes. Before/after at two widths, plus the icon surfaces.

## 1. Mobile (≤767 px) — closed shell

```text
BEFORE                             AFTER
┌──────────────────────────┐       ┌──────────────────────────┐
│ ☰  PSYKL                 │       │ ◎  PSYKL                 │   ◎ = PSYKL mark, 24px,
├──────────────────────────┤       ├──────────────────────────┤       currentColor (accent)
│ Reminders            ⋯   │       │ Reminders            ⋯   │   tap target unchanged
│ ○ task                   │       │ ○ task                   │   aria-label unchanged:
└──────────────────────────┘       └──────────────────────────┘   "Open PSYKL navigation"
```

## 2. Mobile — sidebar open

```text
BEFORE                             AFTER
┌──────────────────────────┐       ┌──────────────────────────┐
│ ✕  PSYKL                 │       │ ◎  PSYKL                 │   still a button
├──────────────────────────┤       ├──────────────────────────┤   aria-label unchanged:
│ ☰ Lists              ⌄   │       │ ☰ Lists              ⌄   │   "Close PSYKL navigation"
│   Reminders              │       │   Reminders              │   Esc + backdrop unchanged
└──────────────────────────┘       └──────────────────────────┘
```

## 3. Desktop (≥768 px) — permanent sidebar

```text
BEFORE                                        AFTER
┌───────────────┬──────────────────┐          ┌───────────────┬──────────────────┐
│ ✕  PSYKL      │  Reminders       │          │ ◎  PSYKL      │  Reminders       │
│ ☰ Lists    ⌄  │  ○ task          │          │ ☰ Lists    ⌄  │  ○ task          │
│   Reminders   │                  │          │   Reminders   │                  │
└───────────────┴──────────────────┘          └───────────────┴──────────────────┘
  ↑ ✕ closes nothing — sidebar is             ↑ static <h1>, no button, not in
    static at this width                        the tab order
```

## 4. Icon surfaces (assets, not layout)

```text
tab favicon        iOS home screen        Android launcher
┌────┐             ┌────────┐             ┌────────┐
│ ◎  │ PSYKL       │  ◎     │             │ ( ◎ )  │  maskable, safe-zone
└────┘ 16/32px     │        │ 180px        │        │  crop-proof 192/512
                   └────────┘ opaque      └────────┘
```

## Notes

- The mark is a single-colour path set (`fill:#121212` in source) → inlined with `fill="currentColor"` so it inherits `--accent` and both contrast modes automatically. No PNG in the header.
- The desktop/mobile split is the CSS container query that already exists (`@container psykl-shell (min-width: 768px)`). Both the close button and a static brand heading live in the DOM; the query decides which one is `display: none`. `display: none` removes an element from the tab order and the accessibility tree, so no JS width check is needed — `visibility: hidden` or an off-screen shift would not be enough.
- Open affordance risk, flagged for the operator: replacing ☰ with the mark removes the universal "menu" signal. The adjacent live text "PSYKL" and the unchanged `aria-label` keep it discoverable, but this is the one judgement call in the change. Alternative if it reads wrong on device: keep ☰ on the mobile trigger and use the mark in the sidebar header only.
