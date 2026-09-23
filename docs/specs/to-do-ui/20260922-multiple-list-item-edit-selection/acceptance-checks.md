# Acceptance Checks — Select and edit multiple list items

> Lightweight feature workflow, `target = production`. These are the source for the E2E test titles
> this change ships (written after the operator approves the UX, per the operator's iteration rule).

- [ ] **Enter and leave selection mode** — "Select Items" in the list options menu turns the list into selection mode, the ⋯ trigger becomes a ✓ that leaves it, and leaving restores tappable titles and the (+) button.
- [ ] **Primary path, batch delete** — tapping three rows shows a checkmark in each circle, the centred action bar appears, and 🗑 removes all three from the list in one action; they are recoverable from Recently Deleted.
- [ ] **Batch complete** — ● marks every selected row complete, the rows sink to the completed group, and the completed mark is a filled disc rather than a tick.
- [ ] **Batch move** — ☰＋ opens a from-bottom drawer titled "Move to:" that omits the current list; picking a destination and confirming with ✓ moves every selected task there, ✕ dismisses with nothing moved.
- [ ] **Titles are not editable in selection mode** — tapping a row's title selects the row instead of opening the edit input.
- [ ] **Manual re-order (session-local this iteration)** — dragging an open task's ≡ handle moves it, the new order holds while the list view stays open, and completed tasks stay ordered by completion time. A reload deliberately falls back to the existing `created_at` order until the persisted slice lands.
- [ ] **Offline and recovery** — with the network down, a batch action applies on screen and queues; a failed action surfaces through the existing sync affordances rather than silently dropping.
- [ ] **Narrow layout and keyboard** — at 390px the action bar stays horizontally centred and clear of the safe area; the ✓, drawer, and handles are reachable by keyboard, Escape closes the drawer, and re-order is achievable without a pointer drag.

## Verified

{Filled after the slice runs locally — date, what passed, what differed from the visual artifact.}
