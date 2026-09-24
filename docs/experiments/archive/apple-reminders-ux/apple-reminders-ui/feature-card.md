# Reminders-Grade List Skin

Iteration 3 of [`apple-reminders-ux`](../feature-card.md). Lane: Standard. Status: exploring. Source: [issue #86](https://github.com/jonpham/PSYKL-System/issues/86).

## User

The solo iPhone PWA user working a single list daily, and the same person at a desktop browser.

## Problem

The shell is Reminders-shaped but the list inside it is not: unstyled rows with inline styles, a top-anchored `Create` form, no checkbox, no type scale, no motion. It does not read as a to-do app anyone would rate highly.

## Outcome

Add a task from a (+) affordance and complete it in a list whose rows, checkbox, capture flow, and motion are indistinguishable in craft from Apple Reminders' single-list view, at phone and desktop width.

## Scope

Experiment-local task row, list, and inline capture components consuming `useTasks`; a token set for this iteration derived from Apple Reminders (system type scale, 22px circle checkbox, inset separators, system blue tint, light + dark); completed rows filled, struck, dimmed, and sorted below open tasks. Widened by the 2026-09-21 review round (see `acceptance-checks.md` → Review round 2): one glyph set at one tile size, a collapsible Lists section with Recently Deleted inside it, a Lists page for rename and re-order, a per-list show/hide-completed toggle, and Sync / Recently Deleted / Settings rendered in the same visual language.

## Not now

Swipe actions, detail sheet, sections, due dates, tags, task reorder, list tint colors, drag-to-reorder lists, and any edit to production components, schema, or API. Reconciling this look with `docs/DESIGN.md` / `UX.md` is deferred to promotion — this prototype is the proposal that supersedes them.

## Done when

On an iPhone at `/exp/apple-reminders-ux`, (+) opens an inline row that commits on Return, tapping a checkbox animates it filled and settles the row below the open tasks, and the surface reads as Reminders at 390px and as a composed desktop list at 1024px.

## Verdict

**Promoted** — 2026-09-24, across `to-do-ui` Specs 2-4: the task row and list
([P2](../../../../features/%5B20260922%5DP2_to-do-ui-task-list-and-row.md)), inline capture
([P3](../../../../features/%5B20260922%5DP3_to-do-ui-inline-capture.md)), and list options with
per-list completed visibility
([P4](../../../../features/%5B20260922%5DP4_to-do-ui-list-options-and-completed-visibility.md)).
The token set became `src/styles/tokens.css` and the baseline of `docs/DESIGN.md`; the glyph set,
the collapsible Lists section, and the Lists page all shipped. The deferred reconciliation named in
`## Not now` was done before implementation, not after: `docs/DESIGN.md` and
`docs/initiatives/todo-experience/UX.md` were rewritten to this prototype's built values on
2026-09-21.
