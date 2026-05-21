# Milestone M3 — Apple-native Clients + Product Discovery

**Status:** Open (sketch — design doc to be drafted via `/office-hours` once M2 ships and dogfood retrospective is in)
**Design doc:** _not yet drafted_
**Effort:** TBD (likely XL — first native-client work plus the first real product-discovery features)

## Description

Two themes land together because they reinforce each other: build SwiftUI native clients for iPhone, iPad, and Mac (the surfaces the user actually lives on, per `/office-hours` decision), and start shipping the features that make PSYKL-System distinct from any other task app — energy retrospectives and adaptive PSYKL-boundary coaching.

The dogfood month after M2 produces the signal that informs M3 scope. Until that retrospective lands, this milestone is a sketch, not a plan.

## Tentative Scope — Native Clients

- `components/ios_client` SwiftUI app for iPhone + iPad
- Shared SwiftUI codebase extended to macOS (Mac Catalyst or SwiftUI multiplatform — decided during design)
- Authentication against `service-task` using the same `X-User-Id: local` header (M1/M2 wire format) until M4 lands real auth
- Sync engine on the iOS side, mirroring the offline-first patterns established in M2 on the web
- Native push notifications (iOS only) for PSYKL-boundary prompts when a cycle ends

## Tentative Scope — Product Discovery Features

- PSYKL execution loop: start a cycle, run the countdown timer (default 25 min, user-tunable per `/office-hours` premise), terminate by user-completion / fatigue-pause / timer-expiry
- PSYKL-boundary coaching prompts: at each terminal point, suggest break / next task / recharge / higher-energy task based on emerging history
- Retrospective view: calendar-grid visualization of completed cycles and tasks
- Initial energy-pattern surface (server-side or client-side aggregation decision — TBD per `/office-hours` parking)

## Success Criteria (preliminary, refine during design)

- TBD — depend heavily on M2 dogfood signals.
- Stretch goal: a user can complete a full workday using only the iOS or iPadOS client, with sync back to the PWA working.

## What gets deferred to M4+

- Multi-user authentication and login UI
- Homelab multi-instance support
- Apple Watch integration (per `docs/PRODUCT.md` future features)
- iCloud / Google Calendar sync
- Import from Apple Reminders

## Prerequisites

- M2 complete.
- 30-day M2 dogfood retrospective documented.
- `/office-hours` design doc for M3 written and APPROVED.
- Apple Developer account active and configured for code signing.
