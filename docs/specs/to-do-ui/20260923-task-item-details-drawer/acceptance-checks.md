# Acceptance Checks — Task Item Details Drawer

> `target = production`. These are the source for the E2E test titles this change ships (see implementation notes — E2E is deferred by operator instruction until UX is approved).

- [ ] **Primary path** — a user taps a task title, taps the (i) that appears, reads Created / Last updated / Completed, edits the title, confirms with ✓, and sees the renamed task in the list.
- [ ] **Affordance scoping** — (i) appears only on the row being edited, only outside selection mode; selection mode still shows the ≡ drag handle in that slot and no (i).
- [ ] **Delete one** — Delete in the drawer removes that task from the list without selection mode, and the task appears in Recently Deleted.
- [ ] **Recovery** — ✕ or Escape closes the drawer leaving the title unchanged; ✓ is inert until the title actually differs.
- [ ] **Timestamps** — an incomplete task shows `—` for Completed; completing a task and reopening the drawer shows a Completed time.
- [ ] **Persistence** — a title edited through the drawer survives a page refresh.
- [ ] **Keyboard & focus** — focus lands on ✕ when the drawer opens and returns to the row when it closes; the drawer is `role="dialog"` with `aria-modal`.
- [ ] **Layout** — at ~390px the drawer is a bottom sheet; at shell width ≥ 768px both it and Move to List render as centred modals over a scrim.

## Verified

{Filled after operator verification on device.}
