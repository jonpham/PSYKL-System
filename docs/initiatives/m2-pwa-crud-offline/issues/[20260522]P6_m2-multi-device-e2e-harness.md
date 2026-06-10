---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: # GH#N once a GitHub Issue is manually created from this brief
branches: # one entry per DevTask (each branches off spec/m2-s6-... per revised workflow)
  -
prs: # one entry per DevTask PR (each targets the Spec branch)
  -
spec_branch: # spec/m2-s6-multi-device-e2e-harness once cut
spec_pr: # PR URL for spec/m2-s6-... → main
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 6
devtasks_total: 1 # M2-13 (single integration-focused DevTask; may split if file count requires)
devtasks_complete: 0
---

# 20260522 - M2 Spec 6: Multi-device E2E + offline test harness (two Playwright contexts)

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer**, I want **CI to prove the offline → online → LWW → tombstone flows work end-to-end against the real Compose stack with two simulated devices** so that **multi-device sync bugs surface in CI rather than in dogfood, and a regression to the LWW guard or the tombstone propagation path blocks merge automatically**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-13 — Two-Playwright-context harness + four E2E specs.** Playwright config gains a new test setup that opens two independent `browser.newContext()` instances against the same running Compose stack (one `service-task` + one `web_client` + the pglite volume from the M1 `docker-compose.e2e.yml` overlay). Each context is a "device." Four new E2E specs:
   - `m2-offline-create-sync.e2e.spec.ts` — single context. `setOffline(true)`, create task, observe IDB+queue, `setOffline(false)`, observe replay, assert server state.
   - `m2-lww-conflict.e2e.spec.ts` — two contexts. Both edit the same task with different `updated_at` values; assert deterministic winner (latest client `updated_at` wins) on both contexts after a refresh.
   - `m2-tombstone-propagation.e2e.spec.ts` — two contexts. Context A creates a task, B observes it. A deletes it. B observes the tombstone (task disappears from B's list after next sync pull).
   - `m2-idempotent-retry.e2e.spec.ts` — single context. Drop network mid-PATCH (Playwright `page.route()` interception to fail one request, then allow), assert exactly one server-side write occurs (verified via the `idempotency` table's response_snapshot count).
     ~4 production behavior source files (config/helper/test files excluded from the AGENTS.md ≤10 count); may split into two DevTasks if the production behavior source file count grows past ≤10.

## Verification Steps

**Associated E2E test:** this Spec IS the E2E. The four specs listed above are the verification.

**Manual verification:**

_Setup / Preconditions_

- Specs 1, 2, 3, 4, and 5 merged into `main`. (Or DevTasks present in dev stack.)
- Spec branch `spec/m2-s6-multi-device-e2e-harness` cut from `main`; draft PR opened against `main`.
- Docker available locally. M1's `docker-compose.yml` + `docker-compose.e2e.yml` overlay still works.
- Playwright Chromium installed (`pnpm exec playwright install chromium`).

_Steps_

1. Run `pnpm test:e2e` (root) — all four new specs pass against a freshly-booted Compose stack. The `m2-lww-conflict` and `m2-tombstone-propagation` specs use two Playwright contexts each; `m2-offline-create-sync` and `m2-idempotent-retry` use one.
2. Run the suite a second time without restarting Compose. Tests should still pass — the M1 `docker-compose.e2e.yml` overlay tmpfs ensures each run starts clean.
3. Inspect CI run on the Spec PR: GitHub Actions runs `pnpm test:e2e` against the Compose stack. All four specs green; CI logs show network-toggle events.
4. Deliberate sabotage: edit `service-task` LWW guard to compare server time instead of client time (revert Decision #43). Re-run `m2-lww-conflict` — must fail. Revert the sabotage; re-run; must pass. This proves the test exercises real LWW behavior, not a stub.
5. Deliberate sabotage: edit `service-task` to skip the idempotency check. Re-run `m2-idempotent-retry` — must fail (server writes twice; `response_snapshot` count is 2). Revert; re-run; must pass. Proves the idempotency assertion is meaningful.

_Expectation_
M2's load-bearing claims (offline-first works, LWW resolves deterministically, tombstones propagate, idempotent retries are safe) are pinned by CI. A regression to any of these decisions in M3+ blocks merge automatically.

## Affected Components

- `e2e/` (extended):
  - `e2e/playwright.config.ts` (extended — add a `multi-device` project that opens two browser contexts).
  - `e2e/m2-offline-create-sync.e2e.spec.ts` (new).
  - `e2e/m2-lww-conflict.e2e.spec.ts` (new).
  - `e2e/m2-tombstone-propagation.e2e.spec.ts` (new).
  - `e2e/m2-idempotent-retry.e2e.spec.ts` (new).
  - `e2e/helpers/two-context.ts` (new — utility for spinning up paired contexts against the same backend).
  - `e2e/helpers/network-control.ts` (new — wraps `page.context().setOffline()` + `page.route()` patterns for readability in specs).
- `.github/workflows/` (extended if needed — confirm the existing E2E job picks up the new spec files via glob; no per-spec entry expected).

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix:

- **#50** Multi-device sync testing: two Playwright browser contexts at the E2E layer. No new pyramid layer.
- **#51** Offline-transition test tooling: Chrome DevTools "Offline" for dev + Playwright `page.context().setOffline(true/false)` for CI E2E.

Also references:

- **M1 Decision #27** (E2E data reset via `docker-compose.e2e.yml` overlay tmpfs).
- **M1 Decision #28** (Playwright Chromium as the E2E driver).
- **M2 Decisions #41, #43, #45** (Idempotency, LWW, tombstones — the behaviors these E2E specs pin).

## Architecture Decisions (ADR)

- **ADR-M2-022:** Two-context model rather than two-browser model. Two `browser.newContext()` calls in the same Playwright `browser` instance share zero state (separate storage, separate Service Workers, separate cookies) — they're functionally equivalent to two devices for our test purposes. Spinning up two whole browser processes would add ~5s of test startup per spec for zero behavioral fidelity gain.
- **ADR-M2-023:** No mocking at the E2E layer. Specs hit the real Compose stack (`service-task` + pglite via tmpfs overlay). Mock-at-E2E was considered and rejected — it would hide the very integration bugs E2E exists to catch (per AGENTS.md Test Discipline: "Tests must exercise real behavior, not stubs").
- **ADR-M2-024:** Network simulation is per-context, not per-stack. `context.setOffline(true)` simulates THIS device being offline; the other context (and the server) remain online. This matches real-world failure modes (one device's Wi-Fi cuts out while another stays connected) far more accurately than tearing down the whole network.
- **ADR-M2-025:** Each E2E spec runs against a fresh Compose stack via the M1 `docker-compose.e2e.yml` tmpfs overlay. No data-cleanup hooks at test boundaries — the stack tears down and comes back up clean.
- **ADR-M2-026:** Sabotage tests (verification step 4 + 5) are NOT in the committed test suite. They are MANUAL verification steps documented in this brief, used during DevTask 13's review to prove the specs catch real regressions. Committing them as "negative tests" would have them fail on every CI run; the assertions are about the production code's behavior, not the tests' own.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
