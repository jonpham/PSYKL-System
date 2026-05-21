# Milestone M1 — Bootstrap (Vertical Slice + Test Pyramid + Infra)

**Status:** Open (ready for spec writing)
**Design doc:** [`DESIGN.md`](./DESIGN.md) (APPROVED — all architecture decisions closed via `/plan-eng-review` + adversarial-review sweep on 2026-05-20)
**Effort:** XL (~3-5 weeks human / ~4-7 days Claude Code)

## Description

Establish the repository foundation and the development style PSYKL-System will use for every subsequent milestone. Ship a minimal vertical slice (Create + Read on a `Task` with a `title`) that travels through `web_client` (PWA) → `service-task` (API) → SQLite → back, with a full 5-layer test pyramid (Static Analysis → Unit → Integration → Component → End-to-End, per AGENTS.md → Test Discipline) green on every Pull Request. Stand up Continuous Integration plus Continuous Deployment: container images published to a registry, components subtree-synced to upstream mirrors, helm chart packaged, and a tagged-release workflow ready to fire on `v*.*.*`.

M1 is explicitly NOT product discovery. M1 proves the architecture and trains the gstack → superpowers → execute agentic workflow loop on real (not throwaway) domain code. The MVP loop described in `docs/PRODUCT.md` (backlog → daily plan → PSYKL execution) lands across M2 and M3.

## Success Criteria

- `docker compose up` from a fresh clone produces a running PWA at a local URL with a working API and persistent SQLite.
- A user can create a Task with a title via the PWA and see it appear in the list after a refresh.
- All five test pyramid layers (Static Analysis, Unit, Integration, Component, E2E) have at least one passing test exercising real behavior, including `user_id` default-deny Component-layer contract tests.
- CI runs the full pyramid on every PR; merge is blocked on failure.
- End-to-end suite runs against the Docker Compose stack in CI on every PR.
- On merge to `main`: CD publishes `service-task` and `web_client` container images to the registry, subtree-syncs to upstream mirrors, and packages the helm chart.
- A `v0.1.0` tag triggers the release workflow end-to-end (image publish + helm package + GitHub Release notes) and closes M1.
- A feature doc summarizing M1 lands in `docs/features/`.
- A retrospective in conversation surfaces what worked and what didn't in the agentic workflow loop — input to refining AGENTS.md before M2.

## What gets deferred to M2

- `PATCH /tasks/:id` and `DELETE /tasks/:id` plus UI affordances
- `completed_at` column and migration
- Loading states, empty states, optimistic updates, real UX polish
- PWA service worker + offline cache + local-first sync engine
- Choosing where the published images and helm chart actually deploy

## Specs

M1 decomposes into **6 Specs containing approximately 11-14 DevTasks total** (one DevTask = one PR, each ≤10 files). The 11-DevTask count is a target; `superpowers:writing-plans` may split DevTasks per the AGENTS.md trilemma resolution rule (tests-in-same-PR + ≤10-files-per-PR collide when a DevTask's implementation needs >7 files). Spec/DevTask breakdown in [`DESIGN.md`](./DESIGN.md#spec--devtask-breakdown-mapped-to-agentsmd-hierarchy).
