# Acceptance Checks — Bulk edit and list deletion UX fixes

- [ ] **Bulk toggle inverts each task** — a pool holding one complete and one incomplete task flips both: the complete one becomes incomplete and the incomplete one becomes complete.
- [ ] **Bulk delete arms with a ring, not a fill** — the first press on the trash outlines the icon in red without filling the button; the second deletes the pool; changing the pool disarms it.
- [ ] **Deleting a list asks what happens to its items** — pressing Delete List on a list holding tasks closes the menu and opens a modal naming the list, its item count, and three choices.
- [ ] **With Items deletes the list and its tasks** — both leave the list surface and the user lands on another list.
- [ ] **Just the List keeps the items** — the tasks appear in the default list and the list itself is gone.
- [ ] **Cancel changes nothing** — the modal closes, the list and its items are untouched; Escape does the same.
- [ ] **Recently Deleted says what each row was** — a deleted list reads as a list carrying its item count, and every deleted task reads as a task, including the ones deleted with that list.
- [ ] **Restoring a list brings its items back with it** — one press on the list row returns the list and every task deleted with it, and those tasks are in that list.
- [ ] **Restoring one cascaded task alone works** — restoring a task whose list is still deleted brings back only that task, into the default list.
- [ ] **Keyboard, focus, and narrow layout** — the modal traps focus and returns it to the list menu trigger on close; at ~390px the armed ring does not clip and the modal fits without horizontal scroll.

## Verified

{Filled after the slice runs.}
