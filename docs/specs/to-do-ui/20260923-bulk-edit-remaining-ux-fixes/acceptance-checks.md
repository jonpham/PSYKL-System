# Acceptance Checks — Bulk edit and list deletion UX fixes

- [x] **Bulk toggle inverts each task** — a pool holding one complete and one incomplete task flips both: the complete one becomes incomplete and the incomplete one becomes complete.
- [x] **Bulk delete arms with a ring, not a fill** — the first press on the trash outlines the icon in red without filling the button; the second deletes the pool; changing the pool disarms it.
- [x] **Deleting a list asks what happens to its items** — pressing Delete List on a list holding tasks closes the menu and opens a modal naming the list, its item count, and three choices.
- [x] **With Items deletes the list and its tasks** — both leave the list surface and the user lands on another list.
- [x] **Just the List keeps the items** — the tasks appear in the default list and the list itself is gone.
- [x] **Cancel changes nothing** — the modal closes, the list and its items are untouched; Escape does the same.
- [x] **Recently Deleted says what each row was** — a deleted list reads as a list carrying its item count, and every deleted task reads as a task, including the ones deleted with that list.
- [x] **Restoring a list brings its items back with it** — one press on the list row returns the list and every task deleted with it, and those tasks are in that list.
- [x] **Restoring one cascaded task alone works** — restoring a task whose list is still deleted brings back only that task, into the default list.
- [x] **Keyboard, focus, and narrow layout** — the modal traps focus and returns it to the list menu trigger on close; at ~390px the armed ring does not clip and the modal fits without horizontal scroll.

## Verified

2026-09-23. Every check holds. 387 unit tests, 50 Storybook component tests, 71 E2E specs green against the Compose stack.

Two differences from the plan, both deliberate:

- The toggle keeps the **existing** filled-disc glyph (operator's call). The half-filled disc the visual artifact first proposed was dropped: a per-row inversion has no single direction to draw, so the accessible name carries it instead.
- `Delete List`'s armed red border was replaced outright by the modal (operator's call mid-plan), so the two destructive surfaces no longer share an armed treatment — the selection bar arms with a ring, and list deletion asks a question instead of arming.
