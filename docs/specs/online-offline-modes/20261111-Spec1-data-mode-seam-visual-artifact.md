# Visual Artifact — Offline Mode toggle (Spec 1, non-functional state)

> Written by `superpowers:writing-plans` for [`20261111-Spec1-data-mode-seam.md`](20261111-Spec1-data-mode-seam.md).
> Production workflow → visual artifact beside the spec doc. Carried into the feature doc's `## Visual Record` at close-out.
> Form C — state storyboard, plus one wireframe of the new Settings section.

## Wireframe — Settings, new `Data` section

```text
┌ Settings ─────────────────────────────────┐
│ Appearance   [System][Light][Dark]        │
│ Contrast     [Standard][Increased]        │
│                                           │
│ Data                                      │
│ Offline Mode                  ( ░░░░●)    │  ← switch, role="switch"
│ Keep a copy on this device and sync       │
│ when online.                              │
│                                           │
│ Experiments …                             │
│ About …                                   │
└───────────────────────────────────────────┘
```

## State storyboard

| State                        | What the user sees                                                                                  | How they got here                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| On, not yet functional       | Knob right; track in the **muted** color (`--text-tertiary`), not the accent. App behaves as today. | Default: nothing stored, or `psykl:offline-mode` ≠ `false` |
| Off, not yet functional      | Knob left; same muted track. Lists and tasks are empty; any write is refused (stubbed API path).    | Tapped the switch                                          |
| Remount on change            | The whole app re-renders once (lists and tasks reload); no page refresh.                            | Any change to the switch (Decision 3)                      |
| Reload                       | The chosen state survives a page reload.                                                            | Stored in `localStorage` (Decision 5)                      |
| Functional (Spec 3, not now) | Knob right uses the **accent** color (`--accent`).                                                  | Spec 3 flips `ONLINE_PATH_AVAILABLE` to `true`             |

## Notes

- The color is the only signal that the switch is not yet functional — operator decision (DESIGN.md Decision 12). Known gap: WCAG 1.4.1 (Use of Color) is not met by color alone. A text cue is not added in Spec 1.
- The knob moves with a 150 ms slide; `prefers-reduced-motion: reduce` disables it.
