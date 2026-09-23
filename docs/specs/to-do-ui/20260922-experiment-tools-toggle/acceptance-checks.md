# Acceptance Checks — Experiment Tools Toggle

- [ ] **Primary path** — On a production route with tools on, expand the pill, tap **Production**, choose **Apple Reminders UX**, and land on `/exp/apple-reminders-ux` with the pill now reading that experiment's title.
- [ ] **Return path** — From inside the experiment, open the picker and choose **Production**; the app lands on `/` and the pill reads "Production".
- [ ] **Activation** — A developer who has never opened an experiment sees no pill on production; visiting `/exp` (including via Settings → Experiments) turns the pill on for production routes.
- [ ] **Close** — Pressing **Close** from either experience returns to `/` and hides the pill; it stays hidden after a refresh until an `/exp` route is visited again.
- [ ] **Persistence** — With tools on, a refresh on a production route keeps the pill, collapsed.
- [ ] **Keyboard & focus** — The picker traps nothing the user can't escape: Escape closes it, focus lands inside on open and returns to the experience button on close.
- [ ] **Narrow layout** — At 390px the expanded pill fits with the Close button fully visible and the experience label truncated, not wrapped; the picker is usable without horizontal scroll.
- [ ] **Dark mode legibility** — In Settings → Experiments under Dark appearance, each experiment's title and summary are readable; they follow the theme instead of staying black on a dark surface, and the same holds at `/exp` and in the picker.
- [ ] **Distinct rows** — Each experiment reads as its own tappable item — a bordered, full-width row with a visible press state — rather than a run of text; the whole row is the target, not just the title.
- [ ] **No status** — No experiment shows a status word anywhere in the UI, and `status` is gone from the registry type and entry.

## Verified

{Filled after the slice runs — operator manual verification on iPhone and desktop browser.}
