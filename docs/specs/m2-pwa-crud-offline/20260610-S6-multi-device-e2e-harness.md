---
status: TODO
issue: P6
pr:
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 6
devtasks_total: 1
devtasks_complete: 0
step_gating: false
honors_decisions: [43, 45, 50, 51, 55]
---

# Multi-Device End-to-End Harness — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Prove M2 offline sync, LWW conflict resolution, tombstone propagation, and idempotent retry against the real Docker Compose stack.

**Architecture:** Playwright opens two isolated browser contexts against one running PSYKL stack. Contexts simulate two devices for the same `user_id`; `context.setOffline(true/false)` creates deterministic offline transitions.

**Tech Stack:** Playwright Chromium, Docker Compose E2E overlay, service-task, web_client, pglite.

---

## Overview

As a developer, CI proves M2 behavior works end-to-end, not only through unit/component mocks. This spec touches the repo-root `e2e/` package and may make small testability adjustments to the PWA if needed.

## Data Model

No schema changes. Tests assert durable effects through the running service and browser IDB state.

## API

No new API surface.

## Implementation Components

- Modify `e2e/playwright.config.ts` if two-context helpers need shared setup.
- Create `e2e/m2-offline-sync.e2e.spec.ts`.
- Create `e2e/helpers/multi-device.ts`.
- Possibly modify `components/web_client/src/testids.ts` if stable selectors are not already available; prefer accessible roles first.

## Test Plan

End-to-End:

| File                              | Assertion                                             |
| --------------------------------- | ----------------------------------------------------- |
| `e2e/m2-offline-sync.e2e.spec.ts` | offline create syncs when online returns              |
| `e2e/m2-offline-sync.e2e.spec.ts` | two-context LWW conflict returns newest client update |
| `e2e/m2-offline-sync.e2e.spec.ts` | delete tombstone propagates to second context         |
| `e2e/m2-offline-sync.e2e.spec.ts` | network drop mid-PATCH retries idempotently           |

Static, unit, integration, and component layers run unchanged as part of full verification.

## DevTasks

Spec integration branch: `spec/m2-s6-multi-device-e2e-harness`.

### DevTask M2-13: Add two-context M2 E2E coverage

**Branch:** `feat/m2-s6-dt13-multi-device-e2e`
**Affected:** `e2e/m2-offline-sync.e2e.spec.ts`, `e2e/helpers/multi-device.ts`, `e2e/playwright.config.ts`, optionally `components/web_client/src/testids.ts`.

- [ ] Step 1: Write failing helper test or first E2E setup proving two browser contexts share one backend but have isolated browser storage.
- [ ] Step 2: Write failing E2E: device A creates task offline, returns online, task appears after sync and survives reload.
- [ ] Step 3: Write failing E2E: device A and B edit same task, newer `updated_at` wins, stale write receives current row.
- [ ] Step 4: Write failing E2E: device A deletes task, device B hydrates with tombstone and hides the task from default list.
- [ ] Step 5: Write failing E2E: network drops mid-PATCH, replay sends same `Idempotency-Key`, server applies the write once.
- [ ] Step 6: Implement `openTwoDevices()` and helper methods for `setOffline`, `createTask`, `editTask`, `completeTask`, `deleteTask`, and `expectTaskVisible`.
- [ ] Step 7: Add any stable selectors only where accessible roles are insufficient.
- [ ] Step 8: Run `pnpm test:e2e -- m2-offline-sync.e2e.spec.ts`.
- [ ] Step 9: Run manual sabotage checks from the P6 issue brief locally during review: invert LWW comparison and confirm conflict test fails; disable idempotency cache and confirm retry test fails; revert both before commit.
- [ ] Step 10: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, durable docs, M2 status handoff, and delete the P6 issue brief plus this spec at close-out.
- [ ] Step 11: Run full verification: `pnpm verify:prepare`, `pnpm verify:static`, `pnpm verify:unit`, `pnpm verify:integration`, `pnpm verify:component`, `pnpm verify:e2e`.
- [ ] Step 12: Commit with `feat: verify m2 offline sync end to end`.

## Verification

1. `pnpm verify:prepare`
2. `pnpm verify:static`
3. `pnpm verify:unit`
4. `pnpm verify:integration`
5. `pnpm verify:component`
6. `pnpm verify:e2e`

## Decisions made during spec drafting

- Sabotage checks remain manual review steps, not committed tests, because they intentionally make production code fail.

## Open Questions / Risks

- Playwright offline mode is binary and deterministic; it does not cover high latency or partial packet loss. That remains out of M2 scope per Decision #51.

## Affected by / Depends on

- Depends on Specs 1 through 5.
- This is the final M2 integration proof.
