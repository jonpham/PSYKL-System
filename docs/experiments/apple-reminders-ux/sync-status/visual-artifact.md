# Visual Artifact — Sync Status Without a Banner

Form C — state storyboard. The same compact control occupies the content header in every state.

| State               | What the user sees                                                                                       | How they got here                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Clear               | `Groceries` with a green `↻` icon control; no sync banner above the Task form                            | No queued or permanently failed changes              |
| Attention           | `Groceries` with a yellow `↻` icon control; the Task form remains directly below the header              | One or more changes are queued or permanently failed |
| Details — clear     | A `Sync` main view showing `All changes synced`, `Waiting to sync: 0`, and `Failed: 0`                   | Activates the green control                          |
| Details — attention | A `Sync` main view showing `Needs attention`, queued and failed counts, plus non-actionable explanations | Activates the yellow control                         |

## Notes

- Green means both counts are zero; yellow means either count is non-zero. An accessible name reinforces the icon's color state; counts appear only in details.
- The Sync view is read-only. Selecting a List, Recently Deleted, or Settings in the sidebar leaves it.
- No toast, banner, or assertive announcement accompanies ordinary status changes.
