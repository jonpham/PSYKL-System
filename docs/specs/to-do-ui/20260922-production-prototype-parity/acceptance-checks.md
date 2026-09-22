# Acceptance Checks — Production/prototype parity

> Target `production`: these are the source for the E2E test titles this change ships.
> Each is observable by a person using the app at its real routes.

- [ ] **Version readout is only in Settings** — the build/commit line appears under Settings → About → Version and on no other destination (#122 item 1).
- [ ] **A task row carries no Delete button** — a row shows only its checkbox and title, with the pending-sync dot when unsynced (#122 item 2a).
- [ ] **Capture starts from a floating button** — a round `+` floats in the bottom-trailing corner of the task list, stays put while the list scrolls, and opens an inline capture row (#122 item 2b).
- [ ] **Capture inserts a single separator** — starting capture below the last open task draws one rule above the new row, not two, and the rule is inset to the title's leading edge (#122 item 2c).
- [ ] **Header controls sit on the prototype's grid** — on a task list, the sync control and list-options menu occupy fixed 40px/48px trailing columns with no gap between them; task rows' pending dots line up under the sync control (#122 items 2d, 2e).
- [ ] **New List is a circled icon button** — the Lists header action is a 40px grey circle with a tinted `+`, in the trailing column (#122 item 3a).
- [ ] **Appearance and Contrast are segmented controls** — each is one full-width control of equal segments with the selected segment raised; choosing a segment applies immediately and survives a refresh (#122 items 5a, 5b).
- [ ] **Narrow layout holds at 390px** — no horizontal scroll on any destination; the floating capture button clears the iOS home indicator via `env(safe-area-inset-bottom)`.

## Unchanged by decision

- Sync view still reads `Everything is synced.` when nothing is queued or failed (#122 item 4a — production copy preferred; prototype's counter panel is not adopted).

## Verified

Filled after the slice runs.
