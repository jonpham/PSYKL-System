# Acceptance Checks — Task Row Gestures and Touch Polish

> Lightweight feature workflow, `target = production`. Verified on an iPhone against a LAN deploy,
> then by the test layers named in `implementation-notes.md`. Each line is an E2E test title once the
> operator accepts the interaction (see the test-floor deviation in the implementation notes).

- [ ] **Primary path — rail** — A user swipes a task row left and releases; the row holds open on boxed Details and Delete buttons, and neither the row's title nor its checkbox is reachable while it is open.
- [ ] **Primary path — full swipe** — A user swipes a task row all the way left and releases; the task is deleted and the rows below close the gap.
- [ ] **Focus frame** — The row being edited, swiped, or held open sits in a grey frame as a rounded white box; every other row looks exactly as it did, and nothing shifts when the frame appears.
- [ ] **Rail actions** — Details on an open rail opens that task's details drawer; Delete on an open rail deletes the task in one press.
- [ ] **Recovery** — A task deleted by either swipe appears in Recently Deleted and restores from there; a swipe abandoned before its threshold snaps the row back with nothing changed.
- [ ] **Scrolling still wins** — A vertical drag that starts on a task row scrolls the list without opening any rail, and an open rail closes when the list is scrolled or another row is swiped.
- [ ] **Empty space starts a task** — Tapping between the last row (or "Nothing to do yet.") and the (+) opens capture; it does nothing in selection mode or while writes are paused at the offline ceiling.
- [ ] **Safari tint** — With the sidebar open on iPhone Safari and as an installed web app, the notch and toolbar show the app's background, not the scrim's shade.

## Verified

{Filled after the slice runs on device. Date, what passed, what differed from the visual artifact.}

### Iteration 1 — 2026-09-24, operator on iPhone ([feedback](https://github.com/jonpham/PSYKL-System/pull/141#issuecomment-5822771416))

- **Sidebar swipe — failed, removed.** The left-edge drag never fired in Safari or the installed web app; Safari's back-swipe owns that edge. Dropped as low value for its cost.
- **Row swipe — worked, but the row's edges were hard to see while moving.** Answered by the focus frame.
- **New asks, added above:** the Safari tint, tap-the-empty-space capture, and the copy "Nothing to do yet."
