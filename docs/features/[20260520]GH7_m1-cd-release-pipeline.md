---
status: DONE
issue: GH7
branches:
  - spec/m1-s6-cd-release-pipeline
  - infra/m1-s6-dt9-ghcr-publish
  - infra/m1-s6-dt10-subtree-sync
  - infra/m1-s6-dt11-helm-and-release
prs:
  - https://github.com/jonpham/PSYKL-System/pull/31
  - https://github.com/jonpham/PSYKL-System/pull/32
  - https://github.com/jonpham/PSYKL-System/pull/33
completed_at: 2026-06-09
created_at: 2026-06-09
initiative: docs/initiatives/m1-bootstrap/
spec: docs/specs/m1-bootstrap/20260520-S6-cd-release-pipeline.md (deleted at close-out)
---

# M1 Bootstrap Spec 6 — CD Release Pipeline

> Skill used to write this doc: `superpowers:executing-plans`.

## User Story

As an **operator** (the user, self-hosting PSYKL-System on a homelab and eventually elsewhere), I want **merging to `main` to publish container images and sync subtree mirrors, and a `v*.*.*` tag to trigger a full release with a packaged Helm chart**, so that **PSYKL has a real distribution story from M1 onward** — installable container images on GitHub Container Registry, downstream component repos kept current as standalone deployables, and a packaged Helm chart per release for any Kubernetes target.

## Features

Three GitHub Actions workflows + one Helm chart, landed across three DevTask PRs:

1. **CD Publish** (`.github/workflows/cd-publish.yml`) — on every push to `main`, builds `service-task` and `web_client` container images in parallel via a job matrix and pushes them to GitHub Container Registry with two tags: `:{commit-sha}` (precise pin) and `:latest` (latest-tracking). Uses GitHub Actions cache backend for Docker layer caching to keep builds fast. PR [#32](https://github.com/jonpham/PSYKL-System/pull/32).
2. **CD Subtree Sync** (`.github/workflows/cd-subtree-sync.yml`) — on every push to `main`, runs `git subtree split` for `components/web_client` and `components/service-task` and force-pushes to the downstream mirror repositories `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` (per Decision #16 as re-opened by Decision #35) using a fine-grained `SUBTREE_PUSH_TOKEN` PAT. This is the documented AGENTS.md force-push exception — mirror repos are downstream-only and `git subtree split` produces a new commit graph each time, so force-push is the canonical pattern. PR [#33](https://github.com/jonpham/PSYKL-System/pull/33).
3. **CD Release** (`.github/workflows/cd-release.yml`) — on every `v*.*.*` tag push, pulls the `:{sha}` images that `cd-publish.yml` produced for that commit, re-tags them as `:{semver}` and pushes the new tag (third tag per Decision #30's three-tag strategy), syncs the Helm chart's `version` + `appVersion` + `values.yaml` image tags to the semver, packages the chart into a `.tgz`, and creates a GitHub Release with the packaged chart attached as a release asset. PR (this Spec close-out).
4. **Helm chart** (`deploy/helm/`) — `Chart.yaml`, `values.yaml`, standard `_helpers.tpl`, and templates for `service-task` (Deployment + ClusterIP Service + PersistentVolumeClaim for pglite at `/var/lib/psykl/pglite`) and `web-client` (Deployment + ClusterIP Service), plus an optional Ingress (disabled by default; M4+ flips it on). Replicas default to 1 per Premise 8 (PSYKL is single-user multi-device; horizontal scaling is unnecessary). PR (this Spec close-out).

## Verification Steps

**Associated E2E test:** _none in code._ This Spec's verification is operational, not test-pyramid: workflows fire on real merges, and the chart smoke-installs in a local Kubernetes cluster.

**Manual verification (operator)**

_Setup / Preconditions_

- Mirror repos `jonpham/PSYKL-Client_WEB-PWA` (mirror of `components/web_client`) and `jonpham/PSYKL-API_Tasks` (mirror of `components/service-task`) exist as empty public GitHub repos with no branch protection.
- A `SUBTREE_PUSH_TOKEN` GitHub Actions secret is set on the monorepo, holding a fine-grained PAT with `contents: write` on both mirror repos.
- Local Kubernetes cluster available (kind, minikube, or k3s) for the smoke install at the end.

_Steps_

1. After the Spec 6 integration PR merges to `main`, watch `CD Publish` and `CD Subtree Sync` complete in the Actions tab.
2. Verify both GHCR images appear with `:{sha}` and `:latest` tags:
   ```bash
   gh api /users/jonpham/packages/container/psykl-service-task/versions --jq '.[] | {name, tags: .metadata.container.tags}'
   gh api /users/jonpham/packages/container/psykl-web_client/versions --jq '.[] | {name, tags: .metadata.container.tags}'
   ```
3. Verify both mirror repos populated with the latest subtree on `main`:
   ```bash
   gh api repos/jonpham/PSYKL-Client_WEB-PWA/commits --jq '.[0]'
   gh api repos/jonpham/PSYKL-API_Tasks/commits --jq '.[0]'
   ```
   Browse https://github.com/jonpham/PSYKL-Client_WEB-PWA and https://github.com/jonpham/PSYKL-API_Tasks and confirm the file trees match `components/web_client/` and `components/service-task/` respectively.
4. Cut the M1 v0.1.0 release (see "Release procedure" below).
5. Verify the GitHub Release at https://github.com/jonpham/PSYKL-System/releases/tag/v0.1.0 has the `psykl-0.1.0.tgz` Helm chart attached.
6. Smoke-install the chart in a local cluster:
   ```bash
   gh release download v0.1.0 --repo jonpham/PSYKL-System --pattern '*.tgz'
   helm install psykl-test ./psykl-0.1.0.tgz
   kubectl get pods   # both pods Running
   kubectl port-forward svc/psykl-test-web-client 8080:80
   # Browse http://localhost:8080 → PWA loads.
   helm uninstall psykl-test
   ```

_Expectation_ — M1 ships with two container images on GHCR (each tagged with sha + latest + semver), two subtree mirrors populated and current, one Helm chart packaged on the GitHub Release, and a working CD pipeline that handles every subsequent merge + tag without manual steps.

## Affected Components

- `.github/workflows/cd-publish.yml`, `cd-subtree-sync.yml`, `cd-release.yml` — three new workflows.
- `deploy/helm/` — new top-level directory: `Chart.yaml`, `values.yaml`, `.helmignore`, `templates/_helpers.tpl`, `templates/service-task-{deployment,service,pvc}.yaml`, `templates/web-client-{deployment,service}.yaml`, `templates/ingress.yaml`.
- `.prettierignore` — added `deploy/helm/templates/` so prettier's YAML parser doesn't choke on Helm Go-template syntax.
- `docs/initiatives/m1-bootstrap/DESIGN.md` — Decision #16 re-opened in place; Decision #35 added recording the re-open rationale.
- `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `README.md` — durable doc refreshes per AGENTS.md Spec close-out rule.

## Design Decisions

- **#7** — Container image registry is GitHub Container Registry. Free for public repos, integrated with GitHub Actions via `GITHUB_TOKEN`, no extra credential surface.
- **#9** — Helm chart location is `deploy/helm/` at repo root, sister to `components/` and `packages/`.
- **#16** _(re-opened by #35)_ — Subtree mirror upstream URLs are `jonpham/PSYKL-Client_WEB-PWA` (web_client) and `jonpham/PSYKL-API_Tasks` (service-task). Stored secret: `SUBTREE_PUSH_TOKEN` (fine-grained PAT, `contents: write` on both mirrors).
- **#17** — Branch-protection enforcement is scoped out while `PSYKL-System` is a private repository without GitHub Pro. CD workflow checks are visible (informational) rather than required status checks.
- **#30** — Three-tag image strategy: on merge to `main` → `:{sha}` + `:latest`; on `v*.*.*` tag → additionally `:{semver}`. Helm chart's `values.yaml` defaults to `:latest`; release pipeline overrides to `:{semver}` for the packaged chart.
- **#35** — Re-open of #16: mirror repo names changed from the mechanical `jonpham/psykl-{web_client,service-task}` to surface-descriptive `jonpham/PSYKL-Client_WEB-PWA` + `jonpham/PSYKL-API_Tasks`. These names encode role (PWA client vs future Apple-native client; tasks API vs future services) and leave namespace room for siblings. Narrow-scope re-open per AGENTS.md Design Doc Discipline: one workflow file, no cross-component contract change, no API/wire-format change. GHCR image names (Decision #7) are unaffected.

## Architecture Decisions (ADR)

- **ADR-M1-026: GHCR Continuous Publish on Merge to `main`.** Two container images (`psykl-service-task`, `psykl-web_client`) are built and pushed to GHCR on every merge to `main` via a job matrix, tagged with `:{sha}` and `:latest`. GitHub Actions cache backend provides Docker layer caching. The `GITHUB_TOKEN` carries `packages: write` because the workflow declares the permission; no extra credential surface. See Decision #7, #30.
- **ADR-M1-027: Subtree-Sync to Downstream Mirror Repos via Force-Push.** A second workflow runs `git subtree split` for each tracked component on every merge to `main` and force-pushes to its downstream mirror repository (`jonpham/PSYKL-Client_WEB-PWA`, `jonpham/PSYKL-API_Tasks`). This is the documented AGENTS.md force-push exception — mirror repos are downstream-only and `git subtree split` produces a new commit graph each time, so force-push is the canonical pattern. `components/ios_client` is intentionally excluded until M3 brings real iOS code. See Decision #16, #35, AGENTS.md Git Conventions.
- **ADR-M1-028: Helm Chart as the M1 Distribution Shape.** `deploy/helm/` is a single-chart, multi-Deployment chart: `service-task` (Deployment + Service + PVC for pglite persistence) and `web_client` (Deployment + Service) as siblings under one release. Replicas default to 1 per Premise 8 — PSYKL is single-user multi-device, so horizontal scaling is unnecessary. Ingress is optional and disabled by default; M4+ will flip it on with real host configuration. See Decision #9.
- **ADR-M1-029: Tagged-Release Workflow.** Pushing a `v*.*.*` tag triggers a third workflow that (1) pulls the `:{sha}` images that `cd-publish.yml` produced for that commit, (2) re-tags them as `:{semver}` and pushes the new tag, (3) syncs the Helm chart's `version` + `appVersion` + `values.yaml` image tags to the semver via `sed` in-workflow (no commit back to `main`), (4) packages the chart, (5) creates a GitHub Release with the `.tgz` attached. The workflow assumes `cd-publish.yml` has completed for the tagged commit; operator-side ordering of "wait for publish before tagging" is documented in the release procedure below. See Decision #30.
- **ADR-M1-030: Helm Templates Excluded from Prettier.** `deploy/helm/templates/` is added to `.prettierignore` because Helm Go-template syntax (`{{- ... -}}` actions embedded in YAML keys, values, and structural positions) is unparseable by prettier's YAML parser. `helm lint` and `helm template` provide the same correctness signal locally and in the release workflow.

## Release procedure — cutting the M1 v0.1.0 release

This procedure replaces the manual-instructions doc that was deleted at Spec close-out. It runs once per release.

**Preconditions (already done at Spec close-out):**

- All six M1 Specs (1–6) shipped to `main`.
- `CD Publish` and `CD Subtree Sync` workflows running green on every merge to `main`.

**Steps:**

1. **Update `CHANGELOG.md` for the release date.** Move the current `## Unreleased` heading + any unreleased bullets into a fresh dated section: `## [0.1.0] - 2026-MM-DD` (use the actual tag date). Add a fresh empty `## Unreleased` heading above it. Commit, open a Pull Request, merge with explicit approval per the AGENTS.md HARD RULE on PR merges.
2. **Wait for `CD Publish` and `CD Subtree Sync` to complete on `main`** for the CHANGELOG-update commit. `cd-release.yml` will pull the `:{sha}` images this commit produced, so they must exist before tagging:
   ```bash
   gh run list --workflow=cd-publish.yml --branch=main --limit=1
   gh run list --workflow=cd-subtree-sync.yml --branch=main --limit=1
   # Both: status=completed, conclusion=success
   ```
3. **Tag and push v0.1.0:**
   ```bash
   git checkout main && git pull
   git tag -a v0.1.0 -m "M1 Bootstrap release"
   git push origin v0.1.0
   ```
   `git push origin v0.1.0` is the explicit-refspec form per the AGENTS.md HARD RULE — pushes only the tag, never any branch.
4. **Watch `CD Release` complete:** `gh run watch --workflow=cd-release.yml`.
5. **Verify:**
   ```bash
   gh api /users/jonpham/packages/container/psykl-service-task/versions --jq '.[] | select(.metadata.container.tags | contains(["0.1.0"]))'
   gh api /users/jonpham/packages/container/psykl-web_client/versions  --jq '.[] | select(.metadata.container.tags | contains(["0.1.0"]))'
   gh release view v0.1.0 --repo jonpham/PSYKL-System   # expect psykl-0.1.0.tgz under Assets
   ```
6. **(Optional one-time)** Make GHCR images public if desired: https://github.com/users/jonpham/packages/container/psykl-service-task/settings → Change package visibility → Public (same for `psykl-web_client`).
7. **Helm smoke-install** in a local cluster:
   ```bash
   gh release download v0.1.0 --repo jonpham/PSYKL-System --pattern '*.tgz'
   helm install psykl-test ./psykl-0.1.0.tgz
   kubectl get pods    # both psykl-test-* pods Running
   kubectl port-forward svc/psykl-test-web-client 8080:80
   # Browse http://localhost:8080 — PWA loads.
   helm uninstall psykl-test
   ```
8. **First-time GHCR permission flip (only if `CD Publish` ever errors with `permission denied`):** Settings → Actions → General → Workflow permissions → select "Read and write permissions". Re-run the failed workflow.

## M1 Initiative close-out (after v0.1.0 ships)

When the v0.1.0 release is published, M1 is complete. Per AGENTS.md:

- Six per-Spec feature docs in `docs/features/` consolidate the M1 outcome. The initiative-level docs in `docs/initiatives/m1-bootstrap/` (`DESIGN.md`, `MILESTONE.md`, remaining issue briefs) can be deleted to minimize doc sprawl, since the feature docs collectively capture the high-level details.
- Workflow retrospective: ask the user what to change about the agentic development workflow before M2; update AGENTS.md accordingly. Land any retrospective at `docs/retrospectives/{YYYY-MM-DD}-m1-bootstrap.md`.
- Update `docs/PROJECT_STATUS.md` to mark M1 as 🟢 Done and name M2 — PWA CRUD + offline-first as the next initiative.

## Change Log

| Date       | PR                                                     | Summary                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-09 | [#32](https://github.com/jonpham/PSYKL-System/pull/32) | DevTask 9 — `cd-publish.yml`: build + push `service-task` + `web_client` images to GHCR with `:{sha}` and `:latest` tags on every merge to `main`.                                                                                                                                             |
| 2026-06-09 | [#33](https://github.com/jonpham/PSYKL-System/pull/33) | DevTask 10 — `cd-subtree-sync.yml`: force-push `components/web_client` and `components/service-task` subtrees to `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` mirrors on every merge to `main`. Includes Decision #16 re-open (Decision #35) with mirror name correction.      |
| 2026-06-09 | [#31](https://github.com/jonpham/PSYKL-System/pull/31) | DevTask 11 + Spec close-out — Helm chart at `deploy/helm/`, `cd-release.yml` tagged-release workflow, this feature doc, durable doc refreshes (`STACK.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `PROJECT_STATUS.md`, `README.md`, `AGENTS.md`), and deletion of the per-Spec planning artifacts. |
