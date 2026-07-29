---
initiative: m2-pwa-crud-offline
status: DONE
generated_by: superpowers:finishing-a-development-branch
completed_at: 2026-07-29
spec_prs:
  - https://github.com/jonpham/PSYKL-System/pull/44
  - https://github.com/jonpham/PSYKL-System/pull/45
  - https://github.com/jonpham/PSYKL-System/pull/46
  - https://github.com/jonpham/PSYKL-System/pull/47
  - https://github.com/jonpham/PSYKL-System/pull/56
  - https://github.com/jonpham/PSYKL-System/pull/66
devtask_prs:
  - https://github.com/jonpham/PSYKL-System/pull/53
  - https://github.com/jonpham/PSYKL-System/pull/54
  - https://github.com/jonpham/PSYKL-System/pull/57
  - https://github.com/jonpham/PSYKL-System/pull/58
  - https://github.com/jonpham/PSYKL-System/pull/59
  - https://github.com/jonpham/PSYKL-System/pull/60
  - https://github.com/jonpham/PSYKL-System/pull/67
  - https://github.com/jonpham/PSYKL-System/pull/68
---

# M2 Retrospective: PWA CRUD + Offline-First

> Written during M2 initiative close-out using `superpowers:finishing-a-development-branch`.

## Outcome

M2 completed the PWA Task Create/Read/Update/Delete loop and turned the web client into an offline-first surface. The shipped system now has client-generated Task identity, Last-Write-Wins mutation reconciliation, soft-delete tombstones, idempotent Task mutations, IndexedDB as the PWA read model, a replaying sync queue, an owned Service Worker with Background Sync, the full Task CRUD user interface, and multi-device End-to-End coverage against the real Docker Compose stack.

The durable M2 record is split by Spec under `docs/features/`:

- M2 Spec 1: [`[20260610]GH38_m2-service-task-patch-delete-lww-idempotency.md`](../features/%5B20260610%5DGH38_m2-service-task-patch-delete-lww-idempotency.md)
- M2 Spec 2: [`[20260612]GH39_m2-pwa-indexeddb-store.md`](../features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md)
- M2 Spec 3: [`[20260613]GH40_m2-sync-engine.md`](../features/%5B20260613%5DGH40_m2-sync-engine.md)
- M2 Spec 4: [`[20260618]GH41_m2-service-worker-background-sync.md`](../features/%5B20260618%5DGH41_m2-service-worker-background-sync.md)
- M2 Spec 5: [`[20260724]P5_m2-pwa-crud-ui-polish.md`](../features/%5B20260724%5DP5_m2-pwa-crud-ui-polish.md)
- M2 Spec 6: [`[20260728]P6_m2-multi-device-e2e-harness.md`](../features/%5B20260728%5DP6_m2-multi-device-e2e-harness.md)

## Decisions Preserved

The feature docs and durable architecture docs cover every M2 design decision:

- Decisions #34, #35, #41, #43, #44, #45, and #56 are recorded by Spec 1's service contract feature doc and ADR-M2-001 through ADR-M2-005.
- Decisions #37, #38, #39, #40, and #46 are recorded by Spec 2's IndexedDB feature doc and ADR-M2-005 through ADR-M2-009.
- Decisions #40, #41, #42, #43, #47, #48, and #52 are recorded by Spec 3's sync-engine feature doc and ADR-M2-010 through ADR-M2-013.
- Decisions #36, #49, #51, #52, and #55 are recorded by Spec 4's Service Worker feature doc and ADR-M2-014 through ADR-M2-017.
- UI implementation decisions from Spec 5 are recorded in its feature doc; they refine the M2 user-interface scope without reopening the locked architecture decisions.
- Decision #50 and final harness decisions are recorded by Spec 6's feature doc and ADR-M2-018 through ADR-M2-020.
- Decision #53 is now durable in `docs/PRODUCT.md` Surface Areas and the PWA architecture sections.
- Decision #54 is satisfied by the existing `docs/PRODUCT.md` PWA permanence wording.

## What Worked

- The Spec/DevTask split kept the large offline-first surface reviewable. Service contract, IndexedDB, replay, Service Worker, UI polish, and E2E harness work each had a clear verification boundary.
- The five-layer test pyramid caught real failures. Unit tests covered pure queue and UI behavior, Integration tests covered pglite and IndexedDB behavior, Component tests covered Service Worker browser behavior, and E2E covered the full sync story.
- The final multi-device E2E harness found a real optimistic UI ordering bug: Background Sync registration could delay IDB notification while offline. Fixing that made the product path better, not just the tests greener.
- Sabotage checks on Last-Write-Wins and idempotency were worth the time. They proved the new E2E assertions fail for the right reasons.

## What Was Friction

- Long-lived shared Spec branches make status language go stale quickly. `PROJECT_STATUS.md` needs a refresh at the start and end of every work block, especially when DevTask branches are merged locally before the Spec PR is pushed.
- Playwright route interception can accidentally bypass app-level request decoration. The retry test originally forwarded a server request without the per-test `X-User-Id`; harness helpers should own this kind of header propagation.
- Single-device E2E tests that chain mutations immediately after create can race local optimistic state against replay reconciliation. E2E helpers should wait for the local queue to drain when the story is about persisted follow-up mutations rather than queued offline behavior.
- Initiative close-out timing needed explicit user direction. AGENTS.md describes initiative close-out after the Spec PR merges; this session intentionally moved the close-out docs into PR #66 so `main` is immediately ready for M3 after merge.

## Proposed AGENTS.md Changes

No immediate rule changes. The existing close-out checklist was sufficient after the user clarified that M2 initiative close-out should be included in PR #66 before merge.

## M3 Handoff

After PR #66 merges:

1. Fast-forward local `main` to `origin/main`.
2. Cut the M2 release tag per `README.md` → Release.
3. Create `feat/plan-m3-apple-native-product-discovery` from updated `main`.
4. Start the M3 design pass from [`docs/initiatives/m3-apple-native-product-discovery/MILESTONE.md`](../initiatives/m3-apple-native-product-discovery/MILESTONE.md), using the M2 dogfood-ready PWA as the baseline.
