# Milestone M4 — Multi-user Auth + Homelab Multi-instance

**Status:** Open (sketch — design doc to be drafted via `/office-hours` after M3 ships)
**Design doc:** _not yet drafted_
**Effort:** TBD

## Description

Replace the hardcoded `user_id = "local"` value (single-user assumption from M1) with real authentication and multi-user support. Make `service-task` deployable on someone else's homelab as a multi-user instance where each user has their own isolated data.

This is the milestone that turns PSYKL-System from a single-user dogfood tool into something other people can self-host. Per the `/office-hours` Premise 6 (OSS adoption is downstream of dogfood), this lands only after the dogfood-validation period demonstrates the product is worth others adopting.

## Tentative Scope

- Authentication on `service-task` (token-based; specific scheme — Open Authorization (OAuth) provider, magic-link email, password+session — decided during design)
- User registration / login flows in the PWA and iOS clients
- The data-model premise from `/office-hours` (every record has `user_id` from M1) means no schema migration — the `user_id` column just starts carrying a real value instead of `"local"`
- Per-user data isolation enforced at the middleware layer (already enforced by `user_id` matching since M1; M4 just connects the value to authenticated identity)
- Account-level settings (timezone, default PSYKL length, notification preferences)
- Homelab deployment guide using the helm chart from M1

## Success Criteria (preliminary, refine during design)

- A user can register on a fresh `service-task` instance, log in, create tasks, and have those tasks isolated from other users on the same instance.
- A second user on the same instance cannot see or modify the first user's tasks (enforced and tested).
- The helm chart deployed to a homelab Kubernetes cluster serves multiple authenticated users.
- Documentation for self-hosters: how to deploy, how to configure auth, how to back up, how to upgrade.

## What gets deferred to M5+

- Server-side retro aggregation across multiple devices for one user (still parked from `/office-hours`)
- Apple Watch integration
- iCloud / Google Calendar sync, calendar import/export
- Conflict-free Replicated Data Type (CRDT) sync, if last-write-wins from M2 turns out to be insufficient for multi-device users
- Public-facing managed instance (vs. self-hosted-only)

## Prerequisites

- M3 complete.
- Demand signal for multi-user / self-hosted PSYKL-System (per Premise 6 — don't build this until somebody actually wants to self-host).
- `/office-hours` design doc for M4 written and APPROVED.
