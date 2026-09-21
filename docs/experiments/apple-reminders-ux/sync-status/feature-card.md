# Sync Status Without a Banner

Iteration 2 of [`apple-reminders-ux`](../feature-card.md). Lane: Standard. Status: exploring. Source: [issue #91](https://github.com/jonpham/PSYKL-System/issues/91).

## User

The solo iPhone PWA user checking Tasks while changes may still be waiting to reach the server.

## Problem

The sync banner takes focus and vertical space from the Task list, while detailed sync information is not available on demand.

## Outcome

A compact green/yellow Sync control communicates status at a glance and opens a read-only detail view.

## Scope

Replace the experiment's banner with a content-header Sync control; show queued and permanently failed change counts in a Sync destination.

## Not now

No manual retry, queue editing, new sync data, notification toasts, API changes, or production-module edits.

## Done when

The main Task view has no sync banner, status remains visible at mobile and desktop widths, and its control opens understandable sync details.

## Verdict

_Open._
