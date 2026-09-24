# Acceptance Checks — Reminders-Grade List Skin

Verified by hand at `/exp/apple-reminders-ux`, iPhone (or 390px) first, then 1024px.

- [x] **Capture** — Tapping `⊕ New Reminder` appends an empty focused row in place (no modal, no top form); typing and pressing Return saves the task and opens the next empty row; blurring an empty row discards it.
- [x] **Complete** — Tapping a checkbox fills it with the tint, strikes and dims the title within ~200ms, and the row settles below the last open task; tapping again reverses it and returns the row to the open group.
- [x] **Row craft** — Every row is ≥44px with a 22px circle checkbox, titles at 17px wrapping rather than truncating, and hairline separators inset to the title's leading edge.
- [x] **Empty + failure** — An empty list shows centred `No Reminders` and the capture bar; a save that fails surfaces the error without losing the typed title.
- [x] **Dark mode** — Switching the OS to dark renders a designed dark surface (black ground, `#0A84FF` tint), not an inversion; text and the checkbox remain legible in both.
- [x] **Persistence** — Created and completed tasks survive a refresh, and completed ones return below the open tasks in the same order.
- [x] **Keyboard & focus** — Tab reaches the capture affordance and every checkbox with a visible focus ring; Space/Return toggles completion; Escape leaves an in-progress capture row.
- [x] **Desktop** — At 1024px the list sits in a ≤680px content column beside the persistent sidebar, with the same row metrics and no stretched full-width rows.

## Verified

2026-09-21, against the Vite dev server at 390×780 and 1024×768, light and dark, with the API
deliberately down (so every row also carries the pending-sync dot). Evidence in `screenshots/`.

Observed directly: tab order runs sync control → checkbox → title → next row; Space toggles a
focused checkbox; Escape dismisses an in-progress capture row; two tasks and their completion
state survived a reload in the same order.

Differences from `visual-artifact.md`:

| Difference                                                      | Why                                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| No hairline under the large title                               | Reminders has none until the title collapses on scroll, and the collapse is out of scope this iteration                 |
| Checkbox column is 36px, not 44px                               | Matches Reminders' title inset; the 44px hit target reaches back into the page gutter instead of overlapping the title  |
| A failed task load is silent while the device has tasks to show | Offline-first — the local list is the truth and the header's sync control already carries the unreachable-server signal |
| Rows carry no delete affordance                                 | Deferred with swipe actions; `Recently Deleted` cannot be fed from this view until that iteration                       |

One real bug surfaced and was fixed here: `autoFocus` on the capture input focused after paint, so
characters typed immediately after tapping `New Reminder` were swallowed by the button —
`Book dentist` arrived as `k dentist`. Focus is now taken synchronously in a layout effect.
