# Sidebar Navigation on Desktop and Mobile

Iteration 1 of the [`apple-reminders-ux`](../feature-card.md) experiment — route `/exp/apple-reminders-ux`.
Lane: Standard. Status: exploring. Source: [issue #87](https://github.com/jonpham/PSYKL-System/issues/87).

## User

Me (solo user), mobile-first on an iPhone PWA, moving between a list, Recently Deleted, and Settings; desktop secondary.

## Problem

The app shell spends a row of bulky buttons (list switcher, Recently Deleted, Settings) on navigation, and Settings then opens inline and pushes the task list down. On a 390px-wide screen that is a large share of the visible area spent on chrome rather than tasks.

## Outcome

Navigation moves into a sidebar — hidden by default on mobile and opened by tapping the `PSYKL` heading, persistent on desktop — so the content area is spent on tasks.

## Scope

Sidebar listing Lists, Recently Deleted, Settings; `☰ PSYKL` as the mobile open control; selection switches the main view and closes the sidebar on mobile; Settings rendered as a main-area view rather than in the sidebar; version/provenance info relocated into that Settings view.

## Not now

No list create/rename/delete from the sidebar, no task counts, no swipe-to-open gesture, no icon set or theming, no changes to task rendering, no production-module edits.

## Done when

On an iPhone PWA at `/exp/apple-reminders-ux`, all three destinations are reachable from a sidebar opened from the `PSYKL` heading that auto-closes on selection, with no navigation buttons left in the main content area — and the same shell is usable at desktop width with the sidebar persistent.

## Verdict

**Promoted** — 2026-09-24, in `to-do-ui` Spec 1 (shell navigation and lists). The sidebar, the
`☰ PSYKL` open control, the auto-close on selection, the persistent desktop rail, and Settings as a
main-area view all shipped to the production surface; version and provenance info moved into that
Settings view as proposed. Record: [`docs/features/[20260921]P1_to-do-ui-shell-navigation-and-lists.md`](../../../../features/%5B20260921%5DP1_to-do-ui-shell-navigation-and-lists.md).
