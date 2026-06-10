---
status: TODO
issue: P6
pr:
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec_number: 6
devtasks_total: 3
devtasks_complete: 0
honors_decisions: [7, 9, 16, 30, 35]
---

# M1 Spec 6: CD release pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Continuous Deployment so (1) every merge to `main` publishes `service-task` + `web_client` container images to GitHub Container Registry tagged with `:{commit-sha}` and `:latest`, (2) every merge force-pushes the two component subtrees to their downstream mirror repos, and (3) every `v*.*.*` tag triggers a release workflow that adds a `:{semver}` image tag, packages the Helm chart, and creates a GitHub Release with the packaged chart attached.

**Architecture:** Three GitHub Actions workflows under `.github/workflows/`. `cd-publish.yml` builds and pushes container images on every merge to `main` using `docker/build-push-action`. `cd-subtree-sync.yml` runs `git subtree split` for each tracked component and force-pushes via the `SUBTREE_PUSH_TOKEN` GitHub Actions secret to the corresponding mirror repo. `cd-release.yml` triggers on `v*.*.*` tags, re-tags the latest images with the semver tag, packages the Helm chart at `deploy/helm/`, and creates a GitHub Release with the packaged `.tgz` attached. The Helm chart is a single-replica per-component Deployment + ClusterIP Service shape per Premise 8 (no horizontal scaling needed for single-user multi-device).

**Tech Stack:** GitHub Actions, `docker/login-action@v3`, `docker/build-push-action@v6`, `actions/checkout@v4`, `actions/upload-release-asset@v1` (or `softprops/action-gh-release@v2`), `helm/chart-testing-action@v2` (optional lint), Helm 3.x.

**Reads from:** `docs/initiatives/m1-bootstrap/DESIGN.md` Decisions appendix. Honors decisions #7 (GHCR), #9 (`deploy/helm/`), #16 (subtree mirror URLs + `SUBTREE_PUSH_TOKEN`), #30 (three-tag image strategy). Decision #17 scopes branch-protection enforcement out while the repository is private without GitHub Pro, so CD jobs are visible checks rather than required status checks.

**Depends on:** Specs 1-5 must have merged.

**Prerequisites (one-time, manual, before DevTask 10):**

- Create empty public GitHub repos: `jonpham/PSYKL-Client_WEB-PWA` (mirror of `components/web_client`) and `jonpham/PSYKL-API_Tasks` (mirror of `components/service-task`), per Decision #35.
- Generate a fine-grained personal access token with `contents: write` scope on those two repos, save as the `SUBTREE_PUSH_TOKEN` GitHub Actions secret in the monorepo settings.

---

## File Structure

| File                                                                      | Purpose                                                                                     | DevTask |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------- |
| `/Users/jp/code/psykl/.github/workflows/cd-publish.yml`                   | On merge to main: build + push service-task + web_client images to GHCR (sha + latest tags) | 9       |
| `/Users/jp/code/psykl/.github/workflows/cd-subtree-sync.yml`              | On merge to main: subtree-split + force-push to upstream mirror repos                       | 10      |
| `/Users/jp/code/psykl/.github/workflows/cd-release.yml`                   | On `v*.*.*` tag: re-tag images with semver, package helm chart, create GitHub Release       | 11      |
| `/Users/jp/code/psykl/deploy/helm/Chart.yaml`                             | Helm chart metadata                                                                         | 11      |
| `/Users/jp/code/psykl/deploy/helm/values.yaml`                            | Default values: image tags `:latest`, ports, replicas=1                                     | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/_helpers.tpl`                 | Standard Helm helpers (full name, labels, selectors)                                        | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/service-task-deployment.yaml` | Deployment for service-task                                                                 | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/service-task-service.yaml`    | ClusterIP Service for service-task                                                          | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/service-task-pvc.yaml`        | PersistentVolumeClaim for pglite data                                                       | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/web-client-deployment.yaml`   | Deployment for web_client (nginx)                                                           | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/web-client-service.yaml`      | ClusterIP Service for web_client                                                            | 11      |
| `/Users/jp/code/psykl/deploy/helm/templates/ingress.yaml`                 | Optional Ingress (disabled by default; M4+ enables)                                         | 11      |
| `/Users/jp/code/psykl/deploy/helm/.helmignore`                            | Standard Helm-ignore                                                                        | 11      |

---

## Task 9: Container registry publish (GHCR) on merge to main

Start DevTask 9 on a branch off `main`: `git checkout main && git pull && git checkout -b infra/cd-ghcr-publish`.

- [x] **Step 1: Write `.github/workflows/cd-publish.yml`**

```yaml
name: CD Publish

on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write

jobs:
  publish:
    name: Build and push container images to GHCR
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        include:
          - component: service-task
            dockerfile: components/service-task/Dockerfile
          - component: web_client
            dockerfile: components/web_client/Dockerfile

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ghcr.io/jonpham/psykl-${{ matrix.component }}:${{ github.sha }}
            ghcr.io/jonpham/psykl-${{ matrix.component }}:latest
          cache-from: type=gha,scope=${{ matrix.component }}
          cache-to: type=gha,mode=max,scope=${{ matrix.component }}
```

Notes:

- Two-tag strategy on merge per Decision #30 (`:{sha}` + `:latest`). Semver tag (`:{semver}`) lands in DevTask 11's release workflow.
- `GITHUB_TOKEN` has `packages: write` here because the workflow declares it. Image visibility (public/private) follows the repo visibility by default; can be changed in GHCR settings after first push.
- Matrix iterates over both components in parallel.

- [x] **Step 2: Smoke-test deferred to Spec close-out (Phase B)**

The workflow triggers on `push: branches: [main]`. DevTask PRs target the Spec integration branch (not `main`) per AGENTS.md Git Conventions, so the workflow cannot fire during DevTask 9. Real smoke-test happens when the Spec 6 integration PR (#31) merges to `main`; verification commands live in `cd-release-pipeline_manual-instructions.md` Phase B (B.1 one-time GHCR permission check, B.2 GHCR image visibility check).

Reference (original plan text — kept for posterity):

> Open a throwaway PR (e.g., add an `## Unreleased` bullet to `CHANGELOG.md`). Merge it. Watch the `CD Publish` workflow run in the Actions tab. After ~5 minutes, both images should appear at:

```
https://github.com/jonpham?tab=packages&repo_name=PSYKL-System
```

with at least two tags each: `<sha>` and `latest`.

If first run fails on `permission denied` to GHCR: in repo Settings → Actions → General → "Workflow permissions", set to "Read and write permissions" and check "Allow GitHub Actions to create and approve pull requests". Re-run the workflow.

- [x] **Step 3: Commit DevTask 9**

```bash
git add .github/workflows/cd-publish.yml
git commit -m "infra(M1-T9): CD publish service-task + web_client images to GHCR on merge

Two-tag strategy per Decision #30: :{sha} + :latest on every merge to
main. Semver tag added by DevTask 11's release workflow.

Matrix-fans out across both components in parallel. Uses gha cache
backend for layer caching. Honors Decisions #7, #30."
```

Push, open PR (this is the second time CD Publish runs — once on the PR merge, again on the PR itself if Actions runs PR builds too). After merge, verify the new SHA appears as a tag on both GHCR images.

---

## Task 10: Subtree-sync to downstream mirror repos

Start DevTask 10 on a branch off `main`: `git checkout main && git pull && git checkout -b infra/cd-subtree-sync`.

**Prerequisite check:** Confirm `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` exist (empty, public, no branch protection) per Decision #35. Confirm `SUBTREE_PUSH_TOKEN` secret is set in the monorepo's Settings → Secrets → Actions. If either is missing, do those one-time manual steps FIRST.

- [x] **Step 1: Write `.github/workflows/cd-subtree-sync.yml`**

```yaml
name: CD Subtree Sync

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  subtree-sync:
    name: Mirror component subtrees to their downstream repos
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        include:
          - component: web_client
            prefix: components/web_client
            mirror: jonpham/PSYKL-Client_WEB-PWA
          - component: service-task
            prefix: components/service-task
            mirror: jonpham/PSYKL-API_Tasks

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # subtree split needs full history

      - name: Configure git
        run: |
          git config user.name "psykl-subtree-sync[bot]"
          git config user.email "actions@github.com"

      - name: Split the subtree
        id: split
        run: |
          SPLIT_SHA=$(git subtree split --prefix=${{ matrix.prefix }} HEAD)
          echo "SPLIT_SHA=$SPLIT_SHA" >> $GITHUB_OUTPUT
          echo "Split sha for ${{ matrix.prefix }}: $SPLIT_SHA"

      - name: Force-push subtree to mirror (per Decision #16; AGENTS.md force-push exception)
        env:
          SUBTREE_PUSH_TOKEN: ${{ secrets.SUBTREE_PUSH_TOKEN }}
        run: |
          git push --force \
            "https://x-access-token:${SUBTREE_PUSH_TOKEN}@github.com/${{ matrix.mirror }}.git" \
            ${{ steps.split.outputs.SPLIT_SHA }}:refs/heads/main
```

- [x] **Step 2: Smoke-test deferred to Spec close-out (Phase B)**

Same reason as DevTask 9 Step 2: the workflow triggers on `push: branches: [main]`. DevTask PRs target the Spec integration branch, so the workflow does not fire during DevTask review. Real smoke-test happens when the Spec 6 integration PR (#31) merges to `main`; verification commands live in `cd-release-pipeline_manual-instructions.md` Phase B.3 (mirror-repo populated check).

Reference (original plan text — kept for posterity):

> Open a throwaway PR touching `components/web_client/src/App.tsx` (add a harmless comment). Merge. Wait for `CD Subtree Sync` to complete. Visit `https://github.com/jonpham/PSYKL-Client_WEB-PWA`. The mirror should now contain the latest `web_client` subtree as its `main` branch with a single commit (the split commit).
>
> Repeat the same on `components/service-task` to verify both mirrors update.

- [x] **Step 3: Commit DevTask 10**

```bash
git add .github/workflows/cd-subtree-sync.yml
git commit -m "infra(M1-T10): CD subtree-sync to downstream mirror repos on merge

Matrix fans out across components/web_client and components/service-task.
Force-pushes via SUBTREE_PUSH_TOKEN secret to jonpham/PSYKL-Client_WEB-PWA
and jonpham/PSYKL-API_Tasks respectively (per Decision #35).

This is the documented AGENTS.md force-push exception — mirror repos
are downstream-only and force-push is the canonical pattern for
git subtree split.

components/ios_client intentionally excluded until M3 introduces real
iOS code worth mirroring.

Honors Decisions #16 + AGENTS.md Git Conventions force-push exception."
```

Push, open PR, merge.

---

## Task 11: Helm chart + tagged-release workflow

Start DevTask 11 on a branch off `main`: `git checkout main && git pull && git checkout -b infra/helm-chart-and-release-workflow`.

- [x] **Step 1: Create `deploy/helm/Chart.yaml`**

```yaml
apiVersion: v2
name: psykl
description: PSYKL-System — time-independent planning around energy cycles.
type: application
version: 0.1.0
appVersion: '0.1.0'
home: https://github.com/jonpham/PSYKL-System
sources:
  - https://github.com/jonpham/PSYKL-System
maintainers:
  - name: Jonathan Pham
keywords:
  - planning
  - productivity
  - self-hosted
```

- [x] **Step 2: Create `deploy/helm/values.yaml`**

```yaml
# Default values for the psykl Helm chart.
# Override via `helm install psykl ./deploy/helm -f my-values.yaml` or `--set`.

serviceTask:
  image:
    repository: ghcr.io/jonpham/psykl-service-task
    tag: latest # CD overrides this to :{semver} when packaging for a tagged release
    pullPolicy: IfNotPresent
  replicas: 1 # PSYKL is single-user multi-device per Premise 8; horizontal scaling unnecessary
  port: 3000
  env:
    PGLITE_DATA_DIR: /var/lib/psykl/pglite
    PORT: '3000'
    CORS_ORIGIN: '' # set per-environment (e.g., to the web_client public URL)
  persistence:
    size: 1Gi
    storageClassName: '' # default StorageClass; override per cluster

webClient:
  image:
    repository: ghcr.io/jonpham/psykl-web_client
    tag: latest
    pullPolicy: IfNotPresent
  replicas: 1
  port: 80

ingress:
  enabled: false # M4+ flips this to true with real host configuration
  className: ''
  host: psykl.local
  tls: false
```

- [x] **Step 3: Create `deploy/helm/templates/_helpers.tpl`**

```
{{/* Standard chart label set. */}}
{{- define "psykl.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: psykl
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "psykl.serviceTask.selectorLabels" -}}
app.kubernetes.io/name: psykl
app.kubernetes.io/component: service-task
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "psykl.webClient.selectorLabels" -}}
app.kubernetes.io/name: psykl
app.kubernetes.io/component: web-client
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

- [x] **Step 4: Create `deploy/helm/templates/service-task-pvc.yaml`**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Release.Name }}-pglite-data
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.serviceTask.persistence.size }}
  {{- if .Values.serviceTask.persistence.storageClassName }}
  storageClassName: {{ .Values.serviceTask.persistence.storageClassName }}
  {{- end }}
```

- [x] **Step 5: Create `deploy/helm/templates/service-task-deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-service-task
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.serviceTask.replicas }}
  selector:
    matchLabels:
      {{- include "psykl.serviceTask.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "psykl.serviceTask.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: service-task
          image: "{{ .Values.serviceTask.image.repository }}:{{ .Values.serviceTask.image.tag }}"
          imagePullPolicy: {{ .Values.serviceTask.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.serviceTask.port }}
              protocol: TCP
          env:
            {{- range $k, $v := .Values.serviceTask.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          volumeMounts:
            - name: pglite-data
              mountPath: /var/lib/psykl/pglite
          readinessProbe:
            httpGet:
              path: /tasks
              port: http
              httpHeaders:
                - name: X-User-Id
                  value: readiness
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /tasks
              port: http
              httpHeaders:
                - name: X-User-Id
                  value: liveness
            initialDelaySeconds: 15
            periodSeconds: 30
      volumes:
        - name: pglite-data
          persistentVolumeClaim:
            claimName: {{ .Release.Name }}-pglite-data
```

Note: the readiness/liveness probes hit `/tasks` with a placeholder `X-User-Id` header. The guard accepts any non-empty value, so the probe gets a real response (200 with an empty list if no tasks exist for that placeholder user). M4 will refine this to a dedicated `/healthz` endpoint exempted from the guard.

- [x] **Step 6: Create `deploy/helm/templates/service-task-service.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-service-task
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  ports:
    - port: {{ .Values.serviceTask.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "psykl.serviceTask.selectorLabels" . | nindent 4 }}
```

- [x] **Step 7: Create `deploy/helm/templates/web-client-deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-web-client
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.webClient.replicas }}
  selector:
    matchLabels:
      {{- include "psykl.webClient.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "psykl.webClient.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: web-client
          image: "{{ .Values.webClient.image.repository }}:{{ .Values.webClient.image.tag }}"
          imagePullPolicy: {{ .Values.webClient.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.webClient.port }}
              protocol: TCP
          readinessProbe:
            httpGet: { path: /, port: http }
            initialDelaySeconds: 3
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /, port: http }
            initialDelaySeconds: 10
            periodSeconds: 30
```

- [x] **Step 8: Create `deploy/helm/templates/web-client-service.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-web-client
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  ports:
    - port: {{ .Values.webClient.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "psykl.webClient.selectorLabels" . | nindent 4 }}
```

- [x] **Step 9: Create `deploy/helm/templates/ingress.yaml`**

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
  labels:
    {{- include "psykl.labels" . | nindent 4 }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-service-task
                port:
                  number: {{ .Values.serviceTask.port }}
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-web-client
                port:
                  number: {{ .Values.webClient.port }}
  {{- if .Values.ingress.tls }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Release.Name }}-tls
  {{- end }}
{{- end }}
```

(Disabled by default in `values.yaml`; M4+ enables when there's a real cluster.)

- [x] **Step 10: Create `deploy/helm/.helmignore`**

```
.DS_Store
.git/
.gitignore
.editorconfig
*.tgz
*.tar.gz
.helmignore
README.md
```

- [x] **Step 11: Verify the chart renders cleanly**

Install Helm 3.x locally if not present: `brew install helm` (mac) or per https://helm.sh/docs/intro/install/.

```bash
cd /Users/jp/code/psykl
helm lint deploy/helm
helm template psykl-test deploy/helm > /tmp/psykl-rendered.yaml
head -50 /tmp/psykl-rendered.yaml
# Inspect the rendered Deployment, Service, PVC manifests for sanity.
```

Expected: `helm lint` passes with no errors. `helm template` renders without errors and produces valid Kubernetes YAML.

- [x] **Step 12: Create `.github/workflows/cd-release.yml`**

````yaml
name: CD Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write # for GitHub Release creation
  packages: write # for re-tagging GHCR images

jobs:
  release:
    name: Tag images with semver, package helm chart, create GitHub Release
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Compute version (strip leading "v")
        id: version
        run: |
          VERSION=${GITHUB_REF_NAME#v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "ref=${GITHUB_REF_NAME}" >> $GITHUB_OUTPUT
          echo "Releasing version: $VERSION (tag: $GITHUB_REF_NAME)"

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Re-tag service-task image with :{semver}
        run: |
          docker pull ghcr.io/jonpham/psykl-service-task:${{ github.sha }}
          docker tag ghcr.io/jonpham/psykl-service-task:${{ github.sha }} ghcr.io/jonpham/psykl-service-task:${{ steps.version.outputs.version }}
          docker push ghcr.io/jonpham/psykl-service-task:${{ steps.version.outputs.version }}

      - name: Re-tag web_client image with :{semver}
        run: |
          docker pull ghcr.io/jonpham/psykl-web_client:${{ github.sha }}
          docker tag ghcr.io/jonpham/psykl-web_client:${{ github.sha }} ghcr.io/jonpham/psykl-web_client:${{ steps.version.outputs.version }}
          docker push ghcr.io/jonpham/psykl-web_client:${{ steps.version.outputs.version }}

      - name: Set up Helm
        uses: azure/setup-helm@v4
        with:
          version: v3.16.0

      - name: Lint Helm chart
        run: helm lint deploy/helm

      - name: Set chart version + appVersion to match the tag
        run: |
          sed -i "s/^version: .*/version: ${{ steps.version.outputs.version }}/" deploy/helm/Chart.yaml
          sed -i "s/^appVersion: .*/appVersion: \"${{ steps.version.outputs.version }}\"/" deploy/helm/Chart.yaml

      - name: Set image tags in values.yaml to the semver
        run: |
          sed -i "s|tag: latest|tag: ${{ steps.version.outputs.version }}|g" deploy/helm/values.yaml

      - name: Package Helm chart
        run: |
          mkdir -p dist
          helm package deploy/helm --destination dist/

      - name: Generate release notes
        run: |
          {
            echo "# PSYKL-System ${{ steps.version.outputs.ref }}"
            echo ""
            echo "## Container images"
            echo "- \`ghcr.io/jonpham/psykl-service-task:${{ steps.version.outputs.version }}\`"
            echo "- \`ghcr.io/jonpham/psykl-web_client:${{ steps.version.outputs.version }}\`"
            echo ""
            echo "## Helm chart"
            echo "Install with:"
            echo '```bash'
            echo "helm install psykl psykl-${{ steps.version.outputs.version }}.tgz"
            echo '```'
            echo ""
            echo "## Changelog"
            echo "See [CHANGELOG.md](https://github.com/${{ github.repository }}/blob/${{ steps.version.outputs.ref }}/CHANGELOG.md)."
          } > release-notes.md

      - name: Create GitHub Release with helm chart attached
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.version.outputs.ref }}
          name: ${{ steps.version.outputs.ref }}
          body_path: release-notes.md
          draft: false
          prerelease: false
          files: |
            dist/psykl-${{ steps.version.outputs.version }}.tgz
````

Note: the workflow assumes the `cd-publish.yml` workflow has already pushed the `:{sha}` images for this commit (it runs first, on merge to main, before the user tags). If the tag fires immediately and the publish hasn't completed, the `docker pull` will fail and the release errors — the operator should wait for `cd-publish.yml` to complete before tagging. Future iteration: add a `workflow_run` dependency.

- [x] **Step 13: Verify chart packages cleanly**

```bash
helm package deploy/helm --destination /tmp/
ls /tmp/psykl-0.1.0.tgz
# Inspect:
tar tzf /tmp/psykl-0.1.0.tgz | head -20
```

Expected: `psykl-0.1.0.tgz` exists, contains `Chart.yaml`, `values.yaml`, and all template files.

- [x] **Step 14: Commit DevTask 11**

```bash
git add deploy/helm/ .github/workflows/cd-release.yml
git commit -m "infra(M1-T11): Helm chart at deploy/helm/ + tagged-release workflow

Helm chart: Chart.yaml, values.yaml (replicas=1 per Premise 8), templates
for service-task (Deployment + Service + PVC for pglite) and web-client
(Deployment + Service), optional ingress (disabled by default; M4+ enables).
helm lint passes; helm template renders cleanly.

Release workflow triggers on v*.*.*\* tags: pulls :{sha} images,
re-tags as :{semver}, packages chart with version/appVersion/tag synced
to the semver, creates GitHub Release with the .tgz attached.

Honors Decisions #7, #9, #16, #30."
```

Push, open PR, merge.

- [ ] **Step 15: Cut the M1 release tag**

After all M1 specs (1-6) are merged:

```bash
git checkout main && git pull
# Update CHANGELOG.md: move ## Unreleased contents under ## [0.1.0] - YYYY-MM-DD
# Commit and push that change.
git tag -a v0.1.0 -m "M1 Bootstrap release"
git push origin v0.1.0
```

Watch the `CD Release` workflow run. Expected:

- Both images get an additional `:0.1.0` tag on GHCR.
- A new GitHub Release at `https://github.com/jonpham/PSYKL-System/releases/tag/v0.1.0` with `psykl-0.1.0.tgz` attached.

Install in a local cluster to verify:

```bash
# In a kind / minikube / k3s cluster:
helm install psykl-test ./deploy/helm
kubectl get pods   # both psykl-test-service-task and psykl-test-web-client pods Running
kubectl port-forward svc/psykl-test-web-client 8080:80
# Browse to http://localhost:8080 — confirm PWA loads
```

- [ ] **Step 16: Confirm CD checks are visible on GitHub**

After CD workflows run green on a few PRs, confirm `CD Publish / publish` and `CD Subtree Sync / subtree-sync` appear as visible checks on PRs and `main` runs. Do NOT configure required status checks while the repository is private without GitHub Pro. Do NOT include `CD Release / release` in PR expectations since that workflow only runs on tags.

---

## Spec 6 Verification (after all 3 DevTasks merge + v0.1.0 cut)

- [ ] **Step 1: Verify all artifacts**

- GHCR images: `ghcr.io/jonpham/psykl-service-task:{0.1.0,latest,SHA}` and `ghcr.io/jonpham/psykl-web_client:{0.1.0,latest,SHA}` all present.
- Mirror repos: `jonpham/PSYKL-Client_WEB-PWA` and `jonpham/PSYKL-API_Tasks` both contain the latest component subtree as their `main` branch.
- GitHub Release: `https://github.com/jonpham/PSYKL-System/releases/tag/v0.1.0` exists with `psykl-0.1.0.tgz` attached.
- Local cluster install: `helm install psykl-test ./deploy/helm` brings up both pods Running, web_client reachable via port-forward.

- [ ] **Step 2: Close out the Spec AND the M1 initiative**

- Set this spec's frontmatter `status: DONE`, `devtasks_complete: 3`, populate branch/PR lists.
- Promote `docs/initiatives/m1-bootstrap/issues/[20260520]P6_m1-cd-release-pipeline.md` to `docs/features/`.
- At the M1 initiative level: per AGENTS.md, "After completing an initiative, scan feature documents created over the course of execution. If feature documents successfully summarize the high-level details of the initiative and its specs, the initiative and spec files can be deleted to minimize document sprawl." With 6 promoted feature docs in `docs/features/`, the contents of `docs/initiatives/m1-bootstrap/` (the DESIGN.md, MILESTONE.md, and `issues/` directory) can be archived or deleted.
- Per AGENTS.md, after an initiative completes, ask the user if there is anything about the AI-agentic development workflow that they would like changed and update AGENTS.md or this/related docs accordingly.
