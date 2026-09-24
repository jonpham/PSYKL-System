# Acceptance Checks — Task Row and Sidebar Touch Gestures

> Lightweight feature workflow, `target = production`. Verified on an iPhone against a LAN dev server,
> then by the test layers named in `implementation-notes.md`. Each line is an E2E test title once the
> operator accepts the interaction (see the test-floor deviation in the implementation notes).

- [ ] **Primary path — rail** — A user swipes a task row left and releases; the row holds open on a Details and a Delete button, and neither the row's title nor its checkbox is reachable while it is open.
- [ ] **Primary path — full swipe** — A user swipes a task row all the way left and releases; the task is deleted and the rows below close the gap.
- [ ] **Rail actions** — Details on an open rail opens that task's details drawer; Delete on an open rail deletes the task in one press.
- [ ] **Recovery** — A task deleted by either swipe appears in Recently Deleted and restores from there; a swipe abandoned before its threshold snaps the row back with nothing changed.
- [ ] **Scrolling still wins** — A vertical drag that starts on a task row scrolls the list without opening any rail, and an open rail closes when the list is scrolled or another row is swiped.
- [ ] **Primary path — sidebar** — A user drags in from the left edge of the viewport and the sidebar opens; dragging the open sidebar left closes it, as does tapping outside it.
- [ ] **Keyboard & focus** — Every swipe action stays reachable without a pointer: the (i) button opens the drawer, the drawer still deletes, the header button still opens the sidebar, and Escape still closes both.
- [ ] **Narrow and wide layout** — At ~390px the row rail and the edge swipe both work; past 768px, where the sidebar is permanent, the edge swipe does nothing and the row rail is unaffected.

## Verified

{Filled after the slice runs on device. Date, what passed, what differed from the visual artifact.}
