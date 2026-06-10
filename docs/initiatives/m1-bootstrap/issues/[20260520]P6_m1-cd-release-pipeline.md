---
status: TODO
issue: [GH#7](https://github.com/jonpham/PSYKL-System/issues/7)
branches:
  -
prs:
  -
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec: 6
devtasks_total: 3       # DevTask 9 + DevTask 10 + DevTask 11
devtasks_complete: 0
---

# 20260520 - M1 Spec 6: CD release pipeline

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As an **operator** (the user, self-hosting PSYKL-System on a homelab and eventually elsewhere), I want **merging to `main` to publish container images, sync subtree mirrors, and a `v*.*.*` tag to trigger the full release workflow** so that **PSYKL has a real distribution story from M1 onward — installable container images on GHCR, downstream component repos kept current as standalone deployables, and a packaged Helm chart per release** for any Kubernetes target.

## Features (DevTasks composing this Spec)

1. **DevTask 9 — Container registry publish (GHCR).** GitHub Actions workflow that builds and publishes `service-task` and `web_client` container images to GitHub Container Registry (`ghcr.io/jonpham/psykl-{service-task,web_client}`) on every merge to `main`. Tags per Decision #30: `:{commit-sha}` + `:latest`. Workflow declares `permissions: { contents: read, packages: write }`. ~4 files. [Sub-Issue TBD]
2. **DevTask 10 — Subtree-sync GitHub Action.** Workflow that runs `git subtree split` for `components/web_client` and `components/service-task` and force-pushes to upstream mirrors `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` (per Decision #16) after every merge to `main`, using the `SUBTREE_PUSH_TOKEN` GitHub Actions secret. `components/ios_client` is intentionally excluded until M3 introduces real iOS code worth mirroring. **Prerequisite:** the two upstream mirror repos must be created on GitHub before this DevTask can be implemented (manual step, not a DevTask deliverable). ~3 files. [Sub-Issue TBD]
3. **DevTask 11 — Helm chart at `deploy/helm/` + tagged-release workflow.** Helm chart at `deploy/helm/` containing: `Chart.yaml`, `values.yaml`, `templates/service-task-deployment.yaml`, `templates/service-task-service.yaml`, `templates/web-client-deployment.yaml`, `templates/web-client-service.yaml`, optional `templates/ingress.yaml` (commented placeholder for M4+). Release workflow triggered by `v*.*.*` tags runs image build + image-publish (additional `:{semver}` tag per Decision #30) + `helm package` + creates a GitHub Release with the packaged `.tgz` attached. `permissions: { contents: write, packages: write }` on the release workflow. ~8 files. [Sub-Issue TBD]

## Verification Steps

**Associated E2E test:** none — CD pipeline is verified by running it once end-to-end against the real GHCR and GitHub Release API.

**Manual verification:**

_Setup / Preconditions_

- Specs 1-5 complete and merged.
- Mirror repos created: `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` (both empty, public, no protection rules).
- `SUBTREE_PUSH_TOKEN` GitHub Actions secret set with a fine-grained PAT scoped to push on both mirror repos.
- Repo settings → Actions → "Allow GitHub Actions to create and approve PRs" enabled (for GHCR `GITHUB_TOKEN` packages-write scope).

_Steps_

1. Merge a PR to `main` after Spec 5 lands.
2. Confirm the merge-to-main CI workflow triggers `ci.yml` (Spec 5 jobs) AND `cd-publish.yml` (DevTask 9 + DevTask 10).
3. Visit `ghcr.io/jonpham/psykl-service-task` and `ghcr.io/jonpham/psykl-web_client`. Both should now show two tags: the new commit SHA and `:latest`.
4. Visit `https://github.com/jonpham/PSYKL-Client_WEB-PWA` and `https://github.com/jonpham/PSYKL-API_Tasks`. Each mirror should contain the latest commit history of just its component subtree.
5. Tag the commit: `git tag v0.1.0 && git push origin v0.1.0`.
6. Confirm `cd-release.yml` workflow triggers.
7. Visit GHCR again. Confirm each image now has an additional `:0.1.0` tag (in addition to the SHA and `:latest`).
8. Visit `https://github.com/jonpham/PSYKL-System/releases`. Confirm a new release "v0.1.0" exists with the packaged Helm chart `.tgz` attached as an asset.
9. Run `helm install psykl ./deploy/helm` (or download the `.tgz` from the release and `helm install psykl psykl-0.1.0.tgz`) against a local Kubernetes cluster (kind, minikube, k3s). Confirm both Deployments come up and `kubectl port-forward` to the web client works.

_Expectation_
M1 closes with `v0.1.0` tagged, two container images on GHCR, two subtree mirrors synced, one Helm chart packaged on the GitHub Release, and a working CD pipeline that handles every subsequent merge+tag without manual steps.

## Affected Components

- `.github/workflows/`: `cd-publish.yml` (DevTask 9), `cd-subtree-sync.yml` (DevTask 10), `cd-release.yml` (DevTask 11). May be merged into fewer files if scope allows.
- `deploy/helm/` (new directory at repo root): `Chart.yaml`, `values.yaml`, `templates/service-task-deployment.yaml`, `templates/service-task-service.yaml`, `templates/web-client-deployment.yaml`, `templates/web-client-service.yaml`, `templates/_helpers.tpl`, optional `templates/ingress.yaml`.

## Design Decisions

- **#7** Container image registry: GitHub Container Registry (GHCR) at `ghcr.io/jonpham/psykl-{service-task,web_client}`. Free for public repos; integrated with GitHub Actions via `GITHUB_TOKEN`.
- **#9** Helm chart location: `deploy/helm/` at repo root.
- **#16** Subtree mirror upstream URLs (re-opened by **#35**): `jonpham/PSYKL-Client_WEB-PWA`, `jonpham/PSYKL-API_Tasks`. Must be created before DevTask 10 runs. Secrets: `SUBTREE_PUSH_TOKEN` (fine-grained PAT, `contents: write` on both mirror repos).
- **#17** Branch-protection enforcement is scoped out while `PSYKL-System` is private without GitHub Pro. CD workflows provide visible merge/release evidence, not enforced required checks.
- **#30** Container image tag strategy: on merge to `main` → `:{sha}` + `:latest`; on `v*.*.*` tag → additionally `:{semver}`. Helm chart `values.yaml` defaults to `:latest`; release pipeline overrides to `:{semver}` for the packaged chart.

## Architecture Decisions (ADR)

- **ADR-M1-021:** GHCR chosen over Docker Hub / Harbor / self-hosted registry. Colocated with the source repo, no extra account or credential management, free for public repos, integrated with GitHub Actions. Self-hosters with Harbor/registry preferences can re-tag and push elsewhere — that's their choice, not M1's concern. See Decision #7.
- **ADR-M1-022:** Subtree mirrors force-pushed by CI on every merge (the documented AGENTS.md force-push exception). Mirrors are downstream-only; the monorepo is canonical. See Decision #16 and AGENTS.md → Git Conventions force-push exception.
- **ADR-M1-023:** Three-tag image strategy (sha + latest + semver). Covers precise-pin (sha for reproducible deployments), latest-tracking (for dogfood self-host), and pinned-major (for users who want stable releases). See Decision #30.
- **ADR-M1-024:** Helm chart at `deploy/helm/` (not at `chart/` or hidden under a component). Sister-directory to `components/` and `packages/`. Packages the GHCR-published images via `values.yaml` references. M1 ships the chart skeleton; M5+ adds deploy-environment-specific values files. See Decision #9.
- **ADR-M1-025:** Helm chart shape for M1: single-replica Deployment per component, ClusterIP Service per component, ingress optional (commented template only). pglite stores to a PersistentVolumeClaim mounted at `/var/lib/psykl/pglite`. Multi-replica + scaling deferred — PSYKL is single-user multi-device per Premise 8, so horizontal scaling has no current product justification.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
