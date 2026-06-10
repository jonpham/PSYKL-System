---
status: ACTIVE
spec: 20260520-S6-cd-release-pipeline.md
created_at: 2026-05-29
deleted_at_spec_closeout: true
---

# Spec 6 — CD Release Pipeline: Manual Instructions

> Companion to [`20260520-S6-cd-release-pipeline.md`](20260520-S6-cd-release-pipeline.md). Every step here is **manual work the human operator must do** — repo creation, secret setup, tag cuts, real-cluster verification. The AI assistant cannot do these.
>
> **Lifecycle:** This doc is created at Spec 6 kickoff and **deleted in the Spec 6 integration Pull Request at close-out** (per AGENTS.md doc-sprawl rule). The durable record of "how M1 release works" lives in the post-implementation feature doc under `docs/features/` and in `README.md` / `docs/STACK.md` updates at Spec close-out.

---

## Phase A — Prerequisites (do BEFORE DevTask 10 runs)

DevTask 9 (GHCR publish) needs nothing manual upfront. **DevTask 10 (subtree-sync) is blocked until both items below are done.**

### A.1 — Create the two empty downstream mirror repositories

Per M1 DESIGN.md Decision #16, `components/web_client` and `components/service-task` get mirrored to standalone public repositories on every merge to `main`.

```bash
gh repo create jonpham/psykl-web_client \
  --public \
  --description "Downstream mirror of components/web_client from PSYKL-System monorepo. Do not commit here directly — the monorepo is the source of truth."

gh repo create jonpham/psykl-service-task \
  --public \
  --description "Downstream mirror of components/service-task from PSYKL-System monorepo. Do not commit here directly — the monorepo is the source of truth."
```

**Verification:**

```bash
gh repo view jonpham/psykl-web_client --json name,visibility,isEmpty
gh repo view jonpham/psykl-service-task --json name,visibility,isEmpty
# Both should show: visibility=PUBLIC, isEmpty=true
```

**Important:** Leave both repos **empty** (no README, no LICENSE, no initial commit) and **without branch protection**. The first push from the subtree-sync workflow creates `main` from the split commit; any pre-existing branch protection on `main` will reject the force-push and break the workflow.

### A.2 — Create the `SUBTREE_PUSH_TOKEN` Personal Access Token

The subtree-sync workflow force-pushes to the two mirror repos. `GITHUB_TOKEN` (the default workflow token) only has access to the repo it's running in, so a separate token is needed.

1. Open https://github.com/settings/personal-access-tokens/new
2. Token settings:
   - **Token name:** `psykl-subtree-push`
   - **Resource owner:** `jonpham`
   - **Expiration:** pick a duration (recommend 1 year; rotation reminder goes on your calendar)
   - **Repository access:** Only select repositories → `jonpham/psykl-web_client` and `jonpham/psykl-service-task`
   - **Repository permissions** → **Contents:** Read and write
   - (Everything else: No access)
3. Click **Generate token** and copy it once (you cannot retrieve it later).

### A.3 — Save the token as a GitHub Actions secret on the monorepo

```bash
gh secret set SUBTREE_PUSH_TOKEN \
  --repo jonpham/PSYKL-System \
  --body "<paste-token-here>"
```

Or via UI: monorepo Settings → Secrets and variables → Actions → New repository secret → name `SUBTREE_PUSH_TOKEN`, value = token.

**Verification:**

```bash
gh secret list --repo jonpham/PSYKL-System | grep SUBTREE_PUSH_TOKEN
# Should print: SUBTREE_PUSH_TOKEN  <some-timestamp>
```

---

## Phase B — Per-DevTask post-merge manual checks

Each DevTask Pull Request lands on the Spec 6 integration branch (`spec/m1-s6-cd-release-pipeline`), not on `main`. The CD workflows below only fire when the **Spec 6 integration Pull Request merges to `main`** — that is when the smoke-tests for DevTask 9 and DevTask 10 actually happen.

### B.1 — One-time GHCR workflow permission check (first time `cd-publish.yml` runs)

If the first `CD Publish` run on `main` fails with `permission denied` pushing to `ghcr.io`:

1. Monorepo Settings → Actions → General → **Workflow permissions**
2. Select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests** (already on for other reasons)
4. Save
5. Re-run the failed workflow from the Actions tab

You should only need this once per repo.

### B.2 — Verify GHCR images appear (after Spec 6 merges to `main`)

After the Spec 6 integration Pull Request merges and `CD Publish` runs green:

```bash
gh api -H "Accept: application/vnd.github+json" \
  /users/jonpham/packages/container/psykl-service-task/versions \
  --jq '.[] | {name, tags: .metadata.container.tags}'

gh api -H "Accept: application/vnd.github+json" \
  /users/jonpham/packages/container/psykl-web_client/versions \
  --jq '.[] | {name, tags: .metadata.container.tags}'
```

**Expected:** Both images present, each with at least two tags — the merge-commit SHA and `latest`.

**Optional one-time visibility decision:** GHCR image visibility defaults to private when the source repo is private. If you want the M1 release images public, go to https://github.com/users/jonpham/packages/container/psykl-service-task/settings → "Change package visibility" → Public (and the same for `psykl-web_client`).

### B.3 — Verify mirror repos populated (after Spec 6 merges to `main`)

After `CD Subtree Sync` runs green:

```bash
gh api repos/jonpham/psykl-web_client/commits --jq '.[0] | {sha, message: .commit.message, date: .commit.author.date}'
gh api repos/jonpham/psykl-service-task/commits --jq '.[0] | {sha, message: .commit.message, date: .commit.author.date}'
```

**Expected:** Both mirrors now have a commit on `main`. The commit message is the most recent monorepo commit that touched that subtree's prefix.

Browse the mirrors directly to confirm the file tree matches `components/web_client/` and `components/service-task/` respectively:

- https://github.com/jonpham/psykl-web_client
- https://github.com/jonpham/psykl-service-task

### B.4 — Confirm CD checks appear as visible (not required) status checks

After CD workflows run a few times on PRs and merges:

```bash
gh pr checks <pr-number-of-a-recent-pr>
```

**Expected:** `CD Publish / publish` and `CD Subtree Sync / subtree-sync` appear in the list as visible checks (passing/failing/skipped).

Per M1 DESIGN.md Decision #17, **do NOT configure required status checks** — branch protection on private repos requires GitHub Pro, which this repo does not have. CD checks stay informational until the project gets a paid plan or open-sources.

`CD Release / release` will NOT appear on Pull Requests — it only fires on `v*.*.*` tag pushes.

---

## Phase C — Cut the M1 v0.1.0 release tag

This is the final manual step of Spec 6 and the closing act of the M1 initiative. **Only do this after DevTask 9, DevTask 10, DevTask 11, and the Spec 6 close-out (including `CHANGELOG.md`, feature doc, durable-doc refreshes) have all merged to `main`.**

### C.1 — Move `CHANGELOG.md` Unreleased to a dated 0.1.0 section

```bash
git checkout main && git pull
```

Edit `CHANGELOG.md`:

- Rename the current `## Unreleased` heading to `## [0.1.0] - 2026-MM-DD` (use the tag date).
- Add a fresh empty `## Unreleased` heading above it.
- Commit:

```bash
git add CHANGELOG.md
git commit -m "docs(m1): release v0.1.0 — move Unreleased to dated 0.1.0 section"
```

Open a Pull Request and merge it through the normal review flow. **Do not merge without explicit approval — the AGENTS.md hard rule applies to this Pull Request like any other.**

### C.2 — Wait for `CD Publish` and `CD Subtree Sync` to complete on `main`

After the CHANGELOG Pull Request merges, both CD workflows run on the new `main` commit. The release workflow in the next step pulls the `:{sha}` images — they must exist before the tag is pushed.

```bash
gh run list --workflow=cd-publish.yml --branch=main --limit=1
gh run list --workflow=cd-subtree-sync.yml --branch=main --limit=1
# Both should show: status=completed conclusion=success
```

### C.3 — Tag and push v0.1.0

```bash
git checkout main && git pull
git tag -a v0.1.0 -m "M1 Bootstrap release"
git push origin v0.1.0
```

(`git push origin v0.1.0` is the explicit-refspec form per the AGENTS.md HARD RULE — it pushes only the tag, never any branch.)

### C.4 — Verify the release

Watch `CD Release` in the Actions tab:

```bash
gh run watch --workflow=cd-release.yml
```

After it completes, verify:

```bash
# 1. Both images have a :0.1.0 tag
gh api /users/jonpham/packages/container/psykl-service-task/versions --jq '.[] | select(.metadata.container.tags | contains(["0.1.0"]))'
gh api /users/jonpham/packages/container/psykl-web_client/versions  --jq '.[] | select(.metadata.container.tags | contains(["0.1.0"]))'

# 2. GitHub Release exists with the chart attached
gh release view v0.1.0 --repo jonpham/PSYKL-System
# Expected: psykl-0.1.0.tgz listed under "Assets"
```

Browse: https://github.com/jonpham/PSYKL-System/releases/tag/v0.1.0

### C.5 — Smoke-install the Helm chart in a local cluster

You need a local Kubernetes cluster — kind, minikube, or k3s. Install one if you don't have it (e.g., `brew install kind && kind create cluster`).

```bash
gh release download v0.1.0 --repo jonpham/PSYKL-System --pattern '*.tgz'
helm install psykl-test ./psykl-0.1.0.tgz

kubectl get pods
# Expected: both psykl-test-service-task-* and psykl-test-web-client-* in Running state

kubectl port-forward svc/psykl-test-web-client 8080:80
# In a browser: http://localhost:8080 — PWA should load
```

Cleanup:

```bash
helm uninstall psykl-test
kind delete cluster   # if you spun one up just for this
```

---

## Phase D — Initiative close-out

After Phase C succeeds, M1 is shipped. Per AGENTS.md initiative-close rules:

1. **Promote the Spec 6 issue brief** `docs/initiatives/m1-bootstrap/issues/[20260520]P6_m1-cd-release-pipeline.md` to `docs/features/[20260520]GH{n}_m1-cd-release-pipeline.md`.
2. **Delete this manual-instructions doc** (`cd-release-pipeline_manual-instructions.md`) and the execution plan (`20260520-S6-cd-release-pipeline.md`) — both are now consolidated into the feature doc.
3. **Audit `docs/initiatives/m1-bootstrap/`** — with six feature docs in `docs/features/` covering the whole milestone, the `DESIGN.md`, `MILESTONE.md`, and `issues/` directory can be deleted to minimize doc sprawl.
4. **Ask the user** (the AI workflow retrospective) whether anything about the agentic development workflow should change before M2, and update AGENTS.md accordingly.
5. **Update `docs/PROJECT_STATUS.md`** to mark M1 as 🟢 Done and name M2 — PWA CRUD + offline-first as the next initiative.
