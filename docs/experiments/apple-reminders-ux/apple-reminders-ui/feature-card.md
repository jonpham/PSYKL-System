# Reminders-Grade List Skin

Iteration 3 of [`apple-reminders-ux`](../feature-card.md). Lane: Standard. Status: exploring. Source: [issue #86](https://github.com/jonpham/PSYKL-System/issues/86).

## User

The solo iPhone PWA user working a single list daily, and the same person at a desktop browser.

## Problem

The shell is Reminders-shaped but the list inside it is not: unstyled rows with inline styles, a top-anchored `Create` form, no checkbox, no type scale, no motion. It does not read as a to-do app anyone would rate highly.

## Outcome

Add a task from a (+) affordance and complete it in a list whose rows, checkbox, capture flow, and motion are indistinguishable in craft from Apple Reminders' single-list view, at phone and desktop width.

## Scope

Experiment-local task row, list, and inline capture components consuming `useTasks`; a token set for this iteration derived from Apple Reminders (system type scale, 22px circle checkbox, inset separators, system blue tint, light + dark); completed rows filled, struck, dimmed, and sorted below open tasks.

## Not now

Swipe actions, detail sheet, sections, due dates, tags, reorder, list tint colors, and any edit to production components, schema, or API. Reconciling this look with `docs/DESIGN.md` / `UX.md` is deferred to promotion — this prototype is the proposal that supersedes them.

## Done when

On an iPhone at `/exp/apple-reminders-ux`, (+) opens an inline row that commits on Return, tapping a checkbox animates it filled and settles the row below the open tasks, and the surface reads as Reminders at 390px and as a composed desktop list at 1024px.

## Verdict

_Open._
