# Acceptance Checks — Task Item Details Drawer

> `target = production`. These are the source for the E2E test titles this change ships (see implementation notes — E2E is deferred by operator instruction until UX is approved).

- [ ] **Primary path** — a user taps a task title, taps the (i) that appears, reads Created / Last updated / Completed, edits the title, confirms with ✓, and sees the renamed task in the list.
- [ ] **Affordance scoping** — (i) appears only on the row being edited, only outside selection mode; selection mode still shows the ≡ drag handle in that slot and no (i).
- [ ] **Edit in place is not a jump** — tapping a title leaves the row visually where it was: same font, same position, same height, and a title that wrapped to two lines is still two wrapped lines while being edited (Apple Reminders behaviour). Typing past the line grows the row rather than scrolling a single line.
- [ ] **Delete one takes two presses** — the first press on Delete arms it (red ring, label changes); the second removes the task without selection mode, and it appears in Recently Deleted. One press alone destroys nothing.
- [ ] **Arming is retired** — editing the title or closing and reopening the drawer returns Delete to its resting state.
- [ ] **Recovery** — ✕ or Escape closes the drawer leaving the title unchanged; ✓ is inert until the title actually differs.
- [ ] **Timestamps** — an incomplete task shows `—` for Completed; completing a task and reopening the drawer shows a Completed time.
- [ ] **Persistence** — a title edited through the drawer survives a page refresh.
- [ ] **Keyboard & focus** — focus lands on ✕ when the drawer opens and returns to the row when it closes; the drawer is `role="dialog"` with `aria-modal`.
- [ ] **Layout** — at ~390px the drawer is a bottom sheet; at shell width ≥ 768px both it and Move to List render as centred modals over a scrim.

## Verified

{Filled after operator verification on device.}
