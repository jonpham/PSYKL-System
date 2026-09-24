# Task Row and Sidebar Touch Gestures

> Lightweight feature workflow — `docs/workflows/lightweight-feature-workflow.md`. Target: **production**. Lane: **Standard**.
> Issue: [#128](https://github.com/jonpham/PSYKL-System/issues/128). Follows [#127](https://github.com/jonpham/PSYKL-System/issues/127) (task item details drawer).

## User

A mobile PWA user on a touch screen, working through a list of tasks quickly with one thumb.

## Problem

Deleting one task takes three or four sequential taps today — tap the title, tap **(i)**, tap delete, tap delete again — or a trip through selection mode. Opening the sidebar is a single target at the top-left of the screen, reachable only by shifting grip.

## Outcome

Swipe a task row left to reveal **Details** and **Delete** behind it; swipe it all the way to delete outright. Swipe in from the left edge of the viewport to open the sidebar, and swipe the sidebar left to close it.

## Scope

Ordinary (non-selection) task rows, and the narrow-layout sidebar. Pointer-driven so it works on iPhone. Existing taps, the **(i)** drawer, and the backdrop dismiss are all unchanged.

## Not now

No swipe on selection-mode rows (the trailing column is the drag handle's), no swipe-right-to-complete, no undo toast (deletes already land in Recently Deleted), no gestures on list rows in the sidebar.

## Done when

On an iPhone, a half swipe on a task row holds open a Details + Delete rail, a full swipe deletes the task, and the sidebar opens and closes by swipe.

## Verdict

{Filled at the exit.}
