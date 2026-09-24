# Sync Status Without a Banner

Iteration 2 of [`apple-reminders-ux`](../feature-card.md). Lane: Standard. Status: exploring. Source: [issue #91](https://github.com/jonpham/PSYKL-System/issues/91).

## User

The solo iPhone PWA user checking Tasks while changes may still be waiting to reach the server.

## Problem

The sync banner takes focus and vertical space from the Task list, while detailed sync information is not available on demand.

## Outcome

A compact green/yellow sync icon communicates status at a glance and opens a read-only detail view.

## Scope

Replace the experiment's banner with a circular content-header sync icon and a status-colored Sidebar row; show queued and permanently failed counts only in a Sync destination.

## Not now

No manual retry, queue editing, new sync data, notification toasts, API changes, or production-module edits.

## Done when

The main Task view has no sync banner, status remains visible at mobile and desktop widths, and its control opens understandable sync details.

## Verdict

**Promoted** — 2026-09-24, in `to-do-ui` Spec 5 (sync, Recently Deleted, and Settings). The banner is
gone; the circular status glyph in the content header, the status-coloured sidebar row, and the
read-only Sync destination carrying queued and failed counts all shipped as prototyped. Record:
[`docs/features/[20260922]P5_to-do-ui-sync-recently-deleted-and-settings.md`](../../../../features/%5B20260922%5DP5_to-do-ui-sync-recently-deleted-and-settings.md).
