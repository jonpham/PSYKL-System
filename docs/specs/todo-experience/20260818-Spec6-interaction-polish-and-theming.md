---
status: TODO
issue: P6
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 6
devtasks_total: 4
devtasks_complete: 0
honors_decisions:
  - design-two-tier-token-architecture
  - design-theme-is-device-local
  - design-accent-session-reserved
---

# Interaction Polish and Theming — Implementation Spec

> **Outline.** Per-Step TDD detail is written when this Spec starts.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 6/7
**Spec User Story:** _As the operator, I complete and delete tasks with a swipe, and I choose how the app looks, so that daily use feels finished rather than functional._
**Time-box:** ~4 days human / ~1-2 Claude Code sessions

---

## Overview

Two halves that share a Spec because both are pure presentation and neither touches the sync model.

1. **Interaction polish** — swipe to complete, swipe to delete (a move to Recently Deleted, per Spec 2), completion animation, reduced-motion support.
2. **Theming** — the two-tier token system from `docs/DESIGN.md`, shipping the **Plain** default and the **Ledger** alternate.

Theming ships here rather than earlier because a theme layer is only proved by a second theme, and the second theme is only worth building once the components it styles exist.

---

## Implementation Components

### Token layer

Components reference **semantic tokens only** (`--text-primary`, `--bg-app`, `--separator`, `--accent`). A theme supplies primitives and maps them to the same semantic names. Adding a theme changes no component CSS.

Two rules are enforced by a lint check, not by convention:

- **No raw hex values in component CSS.** A stylelint rule fails the build on any literal colour outside a theme file.
- **`--accent-session` appears nowhere.** It is reserved for a live PSYKL session in the next initiative. A grep check in CI fails if any component references it.

Theme choice persists in `sync_meta` — device-local, never enqueued, same store as `active_list_id` and section collapse state.

---

## DevTasks

| #   | Title                                 | Branch                                       | Files | Depends on |
| --- | ------------------------------------- | -------------------------------------------- | ----- | ---------- |
| 20  | Semantic token layer + Plain theme    | `feat/todo-experience-s6-dt20-token-layer`   | ~6    | Spec 5     |
| 21  | Ledger theme + settings sheet         | `feat/todo-experience-s6-dt21-ledger-theme`  | ~5    | DevTask 20 |
| 22  | Swipe to complete and delete          | `feat/todo-experience-s6-dt22-swipe-actions` | ~4    | DevTask 20 |
| 23  | Completion animation + reduced motion | `feat/todo-experience-s6-dt23-motion`        | ~3    | DevTask 22 |

### DevTask 21 — Ledger

Ports the retired bespoke identity to the token contract: warm paper `#F4F2ED`, hairline rules, IBM Plex Sans and Plex Mono **self-hosted and precached** (a CDN font renders in fallback on a cold offline start), 2px radii. Primitive values are recoverable from the 2026-08-13 revision of `docs/DESIGN.md` at commit `e8c0ef6`.

### DevTask 22 — swipe

Swipe right completes. Swipe left reveals Delete, which **moves the task to Recently Deleted** — never a destroy, per Spec 2.

Carry the same pointer-handling lessons as Spec 4 DevTask 15: `touch-action` must be managed explicitly, and `pointercancel` must be handled, or a swipe that the browser reclaims as a scroll strands the row.

---

## Test Plan

- **Unit:** swipe threshold arithmetic; theme token resolution for both themes in both colour schemes.
- **Component:** Storybook play functions for swipe-complete and swipe-delete; a contrast test asserting `--text-primary` and `--text-secondary` clear WCAG AA on both themes in light and dark.
- **Static analysis:** stylelint rule banning raw hex in components; CI grep asserting `--accent-session` is unused.
- **E2E:** `e2e/task_swipe.e2e.spec.ts`; `e2e/theming.e2e.spec.ts` covering `a user switches to the Ledger theme and the whole app changes appearance` and `a user's chosen theme survives a reload but does not follow them to a second device`.

## Open Questions / Risks

- **Self-hosted Plex adds ~50KB to the precache** and only the Ledger theme needs it. Consider lazy-loading the font when that theme is selected, and precaching only the Plain theme's system stack.
- **The contrast test needs a colour library.** Pick one small enough to justify, or hand-roll the WCAG relative-luminance formula (about 15 lines).

## Affected by / Depends on

- **Depends on:** Spec 2 (Recently Deleted, for the delete swipe), Spec 5 (row layout must be final before it is animated).
- **Blocks:** nothing.
