# Backlog Ideas

> Someday/maybe items outside the milestone roadmap. Things to come back to when time, curiosity, or context aligns. Not commitments. Not gated by any milestone.

Format: each idea is its own subsection with a short rationale, rough cost, and triggers that would promote it from "idea" to "real work."

---

## Learning experiments

### gRPC inside the NestJS service-task (one model, for learning)

**What:** Add a single non-critical model or RPC method exposed via gRPC inside the existing `components/service-task` NestJS app, using `@nestjs/microservices` and a `.proto` file. Educational only — PSYKL does not architecturally need gRPC for any planned milestone.

**Why:** Personal curiosity. NestJS supports REST + GraphQL + gRPC simultaneously via separate controller decorators on the same `TaskService` (or a sibling service), so adding one gRPC endpoint is a small, isolated experiment that teaches Buf's toolchain (`buf build`, `buf generate`, `buf breaking`) and the Protobuf schema-evolution discipline without committing the project to a gRPC future.

**Suggested model:** something with no iOS/PWA client dependencies — a metrics counter, a health-ping endpoint, an internal service-to-service `EchoRequest`. Avoid picking a real PSYKL entity (Task, Cycle, Retrospective) because that pulls in client-side gRPC migration work.

**Rough cost:** 1-3 days of focused work.

**Triggers to promote:** any of —
- Multiple service-task sessions in a row felt "settled" and need a learning side-quest.
- A subsequent initiative would benefit from gRPC for service-to-service traffic, and a prior experiment would reduce risk.
- The Architecture Evolution Roadmap in `docs/initiatives/m1-bootstrap/DESIGN.md` is being executed and the gRPC step is needed for real.

**Out of scope:** wiring a Connect-Web client into the PWA OR a Connect-Swift client into iOS. Those are real architecture decisions, not learning experiments.

---

## Infrastructure / deploy

### Automate the robin image-tag bump (write-back)

**What:** Remove the manual step in the homelab deploy flow where an operator hand-edits the semver image `tag:` in `PSYKL-GitOps/apps/psykl/values-robin.yaml` after cutting a release. Two candidate mechanisms: (a) a cross-repo GitHub Action in `PSYKL-System` that commits the new tag into the GitOps repo on release (precedent: the `SUBTREE_PUSH_TOKEN` cross-repo push in `cd-subtree-sync.yml`), or (b) ArgoCD Image Updater watching GHCR and writing back to git.

**Why:** Today deploying a new version to robin is: cut `vX.Y.Z` → manually bump the pin → ArgoCD syncs. The manual bump is easy to forget and adds friction as deploys get more frequent. See `README.md` → Deploy to k3s and ADR-M2-010 for the current flow and the rationale for the immutable-semver pin.

**Rough cost:** 0.5-1 day (Action approach); more for Image Updater (adds a cluster component + config).

**Triggers to promote:** any of —
- Homelab redeploys become frequent enough that the manual bump is a real chore.
- A CI-driven release cadence is adopted where hands-off rollout is expected.
- Multiple clusters/environments appear and hand-editing per-cluster values doesn't scale.

**Deferred:** intentionally — for a single-user single-cluster homelab the manual, git-auditable bump is acceptable and keeps the cross-repo credential surface minimal (decided 2026-07-23).

---

## (Add more learning experiments, tinkering ideas, or stretch goals below)

Each entry should answer: What is it? Why bother? Cost? What triggers promotion?
