# Visual Artifact — Every surface works with Offline Mode off (Spec 4)

> Written by `superpowers:writing-plans` for [`20261117-Spec4-online-only-surfaces.md`](20261117-Spec4-online-only-surfaces.md).
> Production workflow → visual artifact beside the spec doc. Carried into the feature doc's `## Visual Record` at close-out.
> Form C — state storyboard, plus wireframes of the header and navigation with Offline Mode on and off.

## Wireframe — list header

The sync control belongs to the sync path. With Offline Mode off nothing waits on the device, so there is nothing for it to report.

```text
Offline Mode on (unchanged)                 Offline Mode off
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│ ☰ PSYKL        Tasks          ⟳   ⋯   │   │ ☰ PSYKL        Tasks              ⋯   │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
                                  ↑ sync control                       ↑ gone; List options stays
```

## Wireframe — navigation

```text
Offline Mode on (unchanged)        Offline Mode off
┌ PSYKL ─────────────────────┐     ┌ PSYKL ─────────────────────┐
│ ▤ Lists                  ⌄ │     │ ▤ Lists                  ⌄ │
│     Tasks                  │     │     Tasks                  │
│     Groceries              │     │     Groceries              │
│ 🗑 Recently Deleted         │     │ 🗑 Recently Deleted         │
│ ────────────────────────── │     │ ────────────────────────── │
│ ⟳ Sync                     │     │ ⚙ Settings                 │  ← the divider moves up
│ ⚙ Settings                 │     └────────────────────────────┘
└────────────────────────────┘
```

## Wireframe — Recently Deleted with Offline Mode off

Same screen as with Offline Mode on. Restore now works: the row leaves once the server has restored it, and the task or list is back where it came from.

```text
┌ Recently Deleted ─────────────────────────┐
│ ☐ Milk                 task     30d  Restore │
│ ▤ Groceries      list · 1 item  29d  Restore │
└───────────────────────────────────────────┘
```

## State storyboard

| State                            | What the user sees                                                                                  | How they got here                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| On (default)                     | Unchanged: sync control in the header, Sync in the navigation, the Sync destination at `/sync`.     | Offline Mode on                                    |
| Off, a list                      | No sync control in the header; List options stays.                                                  | Offline Mode off                                   |
| Off, navigation open             | No Sync item; the divider sits above Settings.                                                      | Opened the navigation                              |
| Off, opens `/sync`               | Lands on their list instead.                                                                        | A bookmark or typed address                        |
| Off, Recently Deleted            | What the server holds as deleted in the last 30 days, with days left.                               | Opened Recently Deleted                            |
| Off, just deleted something      | The deleted task or list is in Recently Deleted without a reload.                                   | Deleted, then opened Recently Deleted              |
| Off, Restore                     | The row leaves after the server answers; the task or list, with the tasks deleted with it, is back. | Pressed Restore                                    |
| Off, a refused Restore           | The row stays. Nothing else changes.                                                                | The server refused or could not be reached         |
| Off, a browser without IndexedDB | The app works. Appearance, contrast, "show completed" and the open list are kept across reloads.    | Private browsing, blocked site data, or no support |

## Notes

- **Nothing changes with Offline Mode on.** The sync control, Sync item and Sync destination look and behave as they do today.
- **No new copy.** Every string on these screens exists already.
