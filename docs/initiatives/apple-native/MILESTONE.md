# Milestone `apple-native` — Apple-native Clients (iOS, iPadOS, macOS)

**Status:** Deferred (sketch — no design doc drafted)
**Design doc:** _not yet drafted_
**Effort:** TBD (likely XL — first native-client work, and a second sync-engine implementation)

> **Deferred 2026-08-12.** Apple-native work is postponed in favour of growing the PWA into a
> semi-mature product first. The product-discovery scope that used to be bundled into this
> milestone (PSYKL execution loop, boundary coaching, retrospectives) moved to
> [`psykl-loop`](../psykl-loop/MILESTONE.md), where it ships on the PWA. Those features never
> needed a native client, and building them first produces exactly the dogfooding signal this
> milestone wants before committing to a native client's shape.
>
> This milestone is **not sequenced**. It has no position in a milestone order and no date. It
> becomes real when the operator decides a native Apple client is the next most valuable thing
> to build.

> **Glossary:** PWA = Progressive Web App. LWW = Last-Write-Wins (the M2 conflict-resolution rule).

## Description

Build SwiftUI native clients for iPhone, iPad, and Mac — the surfaces the operator actually lives on day-to-day. The PWA remains the permanent first-class surface for Android, non-Mac desktops, and every non-Apple user (per [`docs/PRODUCT.md`](../../PRODUCT.md) → Surface Areas); the Apple clients are additive, not a replacement.

## Tentative Scope

- `components/ios_client` SwiftUI app for iPhone + iPad
- Shared SwiftUI codebase extended to macOS (Mac Catalyst or SwiftUI multiplatform — decided during design)
- Authentication against `service-task` using the same `X-User-Id: local` header (the M1/M2 wire format) until [`multi-tenant-auth`](../multi-tenant-auth/MILESTONE.md) lands real auth
- Sync engine on the Swift side, mirroring the offline-first patterns established on the web in M2 (IndexedDB source-of-truth → sync queue → LWW reconciliation)
- Native push notifications (iOS only) for PSYKL-boundary prompts when a cycle ends
- Whatever product surfaces `psykl-loop` has proven out by then, rebuilt natively

## Cost note

The largest single line item is **a second full sync-engine implementation in Swift**. M2 spent four Specs establishing offline-first behavior on the web; the Apple clients cannot reuse that TypeScript. Deferring this milestone defers that cost, and every month of PWA dogfooding first reduces the risk of building the wrong thing twice.

## Success Criteria (preliminary — refine during design)

- Stretch goal: a user can complete a full workday using only the iOS or iPadOS client, with sync back to the PWA working.

## What this milestone does not cover

- Multi-user authentication and login UI — [`multi-tenant-auth`](../multi-tenant-auth/MILESTONE.md)
- Apple Watch integration, iCloud / Google Calendar sync, Apple Reminders import — parked in [`docs/PRODUCT.md`](../../PRODUCT.md) → Future Features

## Prerequisites

- A decision to un-defer this milestone.
- An `/office-hours` design doc written and APPROVED.
- Apple Developer account active and configured for code signing.
