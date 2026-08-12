# Milestone `multi-tenant-auth` — Multi-user Auth + Multi-tenant Isolation

**Status:** Deferred (sketch — no design doc drafted)
**Design doc:** _not yet drafted_
**Effort:** TBD

> **Deferred 2026-08-12.** This milestone is **not sequenced** — it has no position in a milestone
> order and no date. Per Premise 6 below, it was always gated on a demand signal rather than on a
> calendar; the current focus is growing the PWA into a semi-mature product
> ([`psykl-loop`](../psykl-loop/MILESTONE.md)). It becomes real when somebody actually wants to
> self-host PSYKL-System.

> **Rescoped 2026-07-23 → auth-only.** The homelab deployment scope originally bundled here has
> been handled ahead of this milestone: the Helm chart is deployed to a k3s cluster (robin) via ArgoCD from a
> separate GitOps repo, and the deploy + validation flow is documented in
> [`README.md` → Deploy to k3s (homelab / robin)](../../../README.md#deploy-to-k3s-homelab--robin).
> This milestone now covers only authentication + multi-tenant data isolation, and reuses that validated deploy
> flow rather than defining a new one.

## Description

Replace the hardcoded `user_id = "local"` value (single-user assumption from M1) with real authentication and **multi-tenant** support. Make `service-task` deployable on someone else's homelab as a multi-tenant instance where each user has their own **siloed** data. **No multi-user collaboration** — each user's data remains private; this milestone is about TENANT SEPARATION on shared infrastructure, not shared data access. (See `docs/PRODUCT.md` → Sync and Sharing Model.)

This is the milestone that turns PSYKL-System from a single-user dogfood tool into something other people can self-host. Per the `/office-hours` Premise 6 (OSS adoption is downstream of dogfood), this lands only after the dogfood-validation period demonstrates the product is worth others adopting.

## Tentative Scope

- Authentication on `service-task` (token-based; specific scheme — Open Authorization (OAuth) provider, magic-link email, password+session — decided during design)
- User registration / login flows in the PWA and iOS clients
- The data-model premise from `/office-hours` (every record has `user_id` from M1) means no schema migration — the `user_id` column just starts carrying a real value instead of `"local"`
- Per-user data isolation enforced at the middleware layer (already enforced by `user_id` matching since M1; this milestone just connects the value to authenticated identity)
- Account-level settings (timezone, default PSYKL length, notification preferences)
- ~~Homelab deployment guide using the helm chart from M1~~ — **done ahead of this milestone** (2026-07-23);
  the robin/k3s ArgoCD GitOps deploy is validated + documented in `README.md`. This milestone adds only the
  auth/multi-tenant configuration on top of the existing flow.

## Success Criteria (preliminary, refine during design)

- A user can register on a fresh `service-task` instance, log in, create tasks, and have those tasks isolated from other users on the same instance.
- A second user on the same instance cannot see or modify the first user's tasks (enforced and tested).
- The helm chart deployed to a homelab Kubernetes cluster (deploy flow already validated on robin/k3s) serves multiple authenticated users.
- Documentation for self-hosters: how to configure auth, how to back up, how to upgrade. (Deploy itself is already documented in `README.md` → Deploy to k3s.)

## What this milestone does not cover

- Server-side retro aggregation across multiple devices for one user (still parked from `/office-hours`)
- Apple Watch integration
- iCloud / Google Calendar sync, calendar import/export
- Conflict-free Replicated Data Type (CRDT) sync, if last-write-wins from M2 turns out to be insufficient for multi-device users
- Public-facing managed instance (vs. self-hosted-only)

## Prerequisites

- A decision to un-defer this milestone.
- Demand signal for multi-user / self-hosted PSYKL-System (per Premise 6 — don't build this until somebody actually wants to self-host).
- An `/office-hours` design doc written and APPROVED.
