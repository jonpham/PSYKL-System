# Task Row Gestures and Touch Polish

> Lightweight feature workflow — `docs/workflows/lightweight-feature-workflow.md`. Target: **production**. Lane: **Standard**.
> Issue: [#128](https://github.com/jonpham/PSYKL-System/issues/128). Follows [#127](https://github.com/jonpham/PSYKL-System/issues/127) (task item details drawer). Revised after device feedback on [PR #141](https://github.com/jonpham/PSYKL-System/pull/141#issuecomment-5822771416).

## User

A mobile PWA user on a touch screen, working through a list of tasks quickly with one thumb.

## Problem

Deleting one task takes three or four sequential taps — tap the title, tap **(i)**, tap delete, tap delete again — or a trip through selection mode. Starting a task means reaching for one small (+) at the bottom of the screen.

## Outcome

Swipe a task row left to reveal **Details** and **Delete** behind it; swipe it all the way to delete outright. The row being acted on is framed so its edges stay legible. Tapping the empty space below a list starts a task. With the sidebar open, Safari's chrome keeps the app's background colour.

## Scope

Ordinary (non-selection) task rows, the empty list area, and the browser tint. Pointer-driven so it works on iPhone. Existing taps, the **(i)** drawer, the sidebar's button and backdrop, and the (+) are all unchanged.

## Not now

**No sidebar swipe** — dropped after device testing: Safari's own back-swipe owns the left edge. No swipe on selection-mode rows, no swipe-right-to-complete, no undo toast (deletes land in Recently Deleted).

## Done when

On an iPhone, a half swipe on a framed task row holds open boxed Details + Delete actions, a full swipe deletes the task, and tapping below the list starts one.

## Verdict

{Filled at the exit.}
