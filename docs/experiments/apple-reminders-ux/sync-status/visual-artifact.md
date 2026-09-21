# Visual Artifact — Sync Status Without a Banner

Form C — state storyboard. The same compact control occupies the content header in every state.

| State               | What the user sees                                                                                       | How they got here                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Clear               | `Groceries` with a circular green `↻` control; Sidebar has a green `↻ Sync` row; no banner               | No queued or permanently failed changes              |
| Attention           | `Groceries` with a circular yellow `↻` control; Sidebar has a yellow `↻ Sync` row; no count in either    | One or more changes are queued or permanently failed |
| Details — clear     | A `Sync` main view showing `All changes synced`, `Waiting to sync: 0`, and `Failed: 0`                   | Activates the green control                          |
| Details — attention | A `Sync` main view showing `Needs attention`, queued and failed counts, plus non-actionable explanations | Activates the yellow control                         |

## Notes

- Green means both counts are zero; yellow means either count is non-zero. An accessible name reinforces the icon's color state; counts appear only in details.
- The header icon has explicit equal width and height; the Sidebar row opens the same detail destination.
- The Sync view is read-only. Selecting a List, Recently Deleted, or Settings in the sidebar leaves it.
- No toast, banner, or assertive announcement accompanies ordinary status changes.
