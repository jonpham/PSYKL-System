# Visual Artifact — Offline Mode works (Spec 3)

> Written by `superpowers:writing-plans` for [`20261114-Spec3-online-only-lists-tasks.md`](20261114-Spec3-online-only-lists-tasks.md).
> Production workflow → visual artifact beside the spec doc. Carried into the feature doc's `## Visual Record` at close-out.
> Form C — state storyboard, plus wireframes of the two Settings states that change.

## Wireframe — Settings → Data, switch now available

The track uses the accent color when on, as every other switch does. The muted "not yet available" color from Spec 1 is gone.

```text
┌ Settings ─────────────────────────────────┐
│ Data                                      │
│ Offline Mode                  ( ░░░░●)    │  ← accent track when on
│ Keep a copy on this device and sync       │
│ when online.                              │
└───────────────────────────────────────────┘
```

## Wireframe — Settings → Data, while turning Offline Mode off

Shown only while changes made on this device are still being sent, for up to 5 seconds. With nothing waiting, the switch flips at once and this state never shows.

```text
┌ Settings ─────────────────────────────────┐
│ Data                                      │
│ Offline Mode                  ( ●░░░░)    │  ← knob moved; switch disabled, aria-busy
│ Sending changes made on this device…      │  ← replaces the description
└───────────────────────────────────────────┘
```

## State storyboard

| State                        | What the user sees                                                                                                                                        | How they got here                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| On (default)                 | Accent track, knob right. The app behaves as today.                                                                                                       | Nothing stored, or `psykl:offline-mode` ≠ `false`  |
| Turning off, changes waiting | Knob left, switch disabled, "Sending changes made on this device…" in place of the description.                                                           | Tapped the switch while the sync queue held writes |
| Off                          | Muted track, knob left. Lists and tasks are what the server holds. Adding, renaming, moving, completing and deleting work, each after the server answers. | The flush finished, failed, or ran past 5 seconds  |
| Off, a write fails           | The change does not appear. Capture keeps its text, as it does today when a write is refused.                                                             | Server unreachable or refused the write            |
| Off, server unreachable      | "Failed to load tasks" where the list would be, as the offline path shows on a failed first load.                                                         | Opened the app with the server down                |
| Turning on                   | Switch flips at once; no sending step. The app remounts on the offline path.                                                                              | Tapped the switch while off                        |

## List options and Lists page with Offline Mode off

Unchanged from the offline path: Delete List is offered on every list except "Tasks" and except the last remaining list (Spec 2 rule, now applied to this path too). Re-ordering on the Lists page works.

## Notes

- **Unsent writes after a failed flush** stay queued on the device. They are sent the next time Offline Mode is on (Decision 11). While off, the app does not show them.
- **No pending dots** with Offline Mode off: nothing waits on the device, so every row is either saved or not there.
