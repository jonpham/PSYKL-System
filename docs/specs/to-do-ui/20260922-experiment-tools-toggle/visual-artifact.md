# Visual Artifact — Experiment Tools Toggle

> Form C — state storyboard. One surface (the floating experiment pill) across its states.

## States

| State                       | What the developer sees                                                                                        | How they got here                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Off (production)            | Nothing. No pill, no chrome.                                                                                   | Never opened an experiment, or pressed Close.            |
| Collapsed                   | 🧪 circle button, leading corner, above the safe-area inset.                                                   | Tools on; the pill starts collapsed on every page load.  |
| Expanded — on production    | 🧪 · **Production ▾** · Close                                                                                  | Tapped the 🧪 circle while on a production route.        |
| Expanded — in an experiment | 🧪 · **Apple Reminders UX ▾** · Close                                                                          | Tapped the 🧪 circle while on `/exp/apple-reminders-ux`. |
| Picker open                 | Modal dialog "Switch experience": Production (✓ when current) plus each registered experiment, one row apiece. | Tapped the current-experience button.                    |
| Experiments list            | One bordered, full-width row per experiment — title above summary, no status word — legible in Light and Dark. | Settings → Experiments, or `/exp`.                       |

## Wire sketch

```text
collapsed                    expanded (production)
+------+                     +--------------------------------+
|  🧪  |                     | 🧪   Production  v     [Close] |
+------+                     +--------------------------------+

picker (modal, centered; full-width sheet under 30rem)
+--------------------------------+
| Switch experience          [x] |
+--------------------------------+
| (*) Production                 |
| ( ) Apple Reminders UX         |
|     Try Apple Reminders-grade  |
|     navigation over existing   |
|     PSYKL features.            |
+--------------------------------+
```

```text
experiments list — before                experiments list — after
Apple Reminders UX  exploring            +------------------------------+
Try Apple Reminders-grade                | Apple Reminders UX         >  |
navigation over existing PSYKL           | Try Apple Reminders-grade     |
features.                                | navigation over existing      |
-------------------------------          | PSYKL features.               |
(title inherits UA button color          +------------------------------+
 -> black on dark; status shown)         (one bordered row = one target,
                                          theme tokens, no status word)
```

## Notes

- The pill keeps its current position (fixed, leading corner, safe-area aware) so an experiment still owns the trailing corner where a primary action sits on a phone.
- Expanded width stays capped at `min(20rem, calc(100vw - 1.5rem))`; the experience label truncates with an ellipsis rather than wrapping.
- The picker is a real modal: Escape closes it, focus moves into it on open and returns to the experience button on close.
- Choosing the experience you are already on closes the picker and navigates nowhere.
