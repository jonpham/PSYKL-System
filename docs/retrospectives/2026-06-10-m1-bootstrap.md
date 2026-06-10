---
created_at: 2026-06-10
initiative: M1 Bootstrap
constituent_prs:
  - https://github.com/jonpham/PSYKL-System/pull/19
  - https://github.com/jonpham/PSYKL-System/pull/21
  - https://github.com/jonpham/PSYKL-System/pull/23
  - https://github.com/jonpham/PSYKL-System/pull/24
  - https://github.com/jonpham/PSYKL-System/pull/25
  - https://github.com/jonpham/PSYKL-System/pull/27
  - https://github.com/jonpham/PSYKL-System/pull/28
  - https://github.com/jonpham/PSYKL-System/pull/29
  - https://github.com/jonpham/PSYKL-System/pull/30
  - https://github.com/jonpham/PSYKL-System/pull/31
  - https://github.com/jonpham/PSYKL-System/pull/32
  - https://github.com/jonpham/PSYKL-System/pull/33
  - https://github.com/jonpham/PSYKL-System/pull/34
  - https://github.com/jonpham/PSYKL-System/pull/35
  - https://github.com/jonpham/PSYKL-System/pull/36
  - https://github.com/jonpham/PSYKL-System/pull/37
type: retrospective
scope: per-initiative
status: FINAL
---

# Retrospective — M1 Bootstrap

> Per-initiative retrospective per AGENTS.md → Workflow Retrospectives. Drafted at M1 close-out before the v0.1.0 tag cut and M2 design kickoff.
>
> **Format note:** the "What went well" and "What went poorly" lists below are the agent's observations across all six M1 Specs (1–6) plus the post-merge fixup work (PRs #35, #36) and this close-out branch (#37). The user's observations live under the "User additions" subsections — fill those in before committing.

## What went well — agent observations

1. **TDD discipline held across all 6 Specs.** Every DevTask ordered failing test → implementation → green → refactor → commit. Even the workflow-only DevTasks (S5/S6) carried test-shaped verification through the Static Analysis layer + manual operator verification, since the GitHub Actions workflows had no in-process test surface.
2. **Per-Spec retro outputs from S3 propagated forward correctly.** The S3 retro's autonomous AGENTS.md changes (sibling-default DevTask branching with stacking-only-on-real-dependency, `Agent isolation: "worktree"` for implementer subagents, `honors_decisions:` refresh on re-open, per-Spec retro convention) shaped S4–S6 and saved re-discovery work. None of those rules needed mid-flight rewriting again.
3. **Verification-before-completion caught two distinct CD bugs back-to-back at M1 close-out.** PR #31 merged with both `cd-publish.yml` (buildx + gha-cache mismatch) and `cd-subtree-sync.yml` (checkout extraheader hijacking the cross-repo push auth) silently broken. The skill stopped the "Spec 6 done" claim cold, forced log-reading + root-cause diagnosis, and produced PRs #35 + #36 with ADR-M1-026 + ADR-M1-027 operational footnotes as durable post-mortems.
4. **Decision #16 → #35 narrow-scope re-open worked cleanly.** Single workflow YAML + 5 durable docs updated in one atomic addendum commit, with rewritten Decision #16 + new Decision #35 + back-links + `honors_decisions:` refresh. The light ceremony (no `/plan-eng-review` pass) saved a day of review overhead and the conservative scope check held.
5. **HARD RULE on explicit-refspec push prevented multiple branch traps.** At least four times during M1 — `spec/m1-s6-cd-release-pipeline` first push, both fixup branches (#35, #36), and this docs branch (#37) — the local branch tracked `origin/main` because git inherited the source ref as upstream. Bare `git push` would have shoved DevTask/fixup/docs commits onto `main`. The mandatory `git push -u origin HEAD:<intended-branch>` form was the actual save each time.
6. **Sibling-default DevTask branching held under load.** S6 had three independent DevTasks (9, 10, 11). All three sat as siblings off `spec/m1-s6-cd-release-pipeline`. Each merged cleanly; no rebase cascades, no parent-child reorder. The stacking exception was never needed in S6.
7. **Skill transition discipline caught the missed handoff.** When the user asked "what skill?" mid-close-out, the honest answer was that `superpowers:executing-plans` should have transitioned to `superpowers:finishing-a-development-branch` after Spec 6 implementation completed. Surfacing this rather than papering over it produced the cleaner close-out flow that's now running.
8. **5-layer test pyramid from M1 paid off during close-out commits.** The Husky pre-commit hook (S3 ADR-M1-016) caught a baseline `tsc` failure on the first commit attempt for #34 because the gitignored `components/web_client/src/api/types.ts` codegen artifact was missing. Without the pyramid established from S3, that would have surfaced in CI instead.
9. **Per-Spec feature docs as the consolidated record worked end-to-end.** Every shipped Spec produced a feature doc under `docs/features/`, with the per-Spec issue brief + execution plan deleted at close-out. M1 ends with 6 feature docs (`GH2`–`GH7`) and a much cleaner `docs/initiatives/m1-bootstrap/` directory that can now be fully deleted.

## What went well — user additions

_User opted to leave this section empty for M1; agent observations stand as the well-side record._

## What went poorly — agent observations

1. **Spec 6 shipped TWICE with workflow bugs.** PR #31 merged with both CD workflows broken. `verification-before-completion` caught it post-hoc, but no proactive gate existed pre-merge. Suggestion: when a Spec ships a new GitHub Actions workflow, the Spec PR description should include "first run on the merge commit must show `conclusion: success`" as an explicit checkbox before close-out.
2. **Mirror-repo naming divergence was caught only at DevTask 10 execution time.** The original Decision #16 hardcoded `jonpham/psykl-{web_client,service-task}` based on the GHCR image prefix mechanical mapping. The user had already created the real mirrors with descriptive names (`PSYKL-Client_WEB-PWA` + `PSYKL-API_Tasks`). The plan + manual-instructions doc didn't ask the user to confirm names against actuals before plan finalization. The Decision #35 re-open absorbed the cost, but it could have been a pre-flight check.
3. **Manual-instructions doc lifecycle was opaque.** The companion `cd-release-pipeline_manual-instructions.md` was created at Spec 6 kickoff (Phase A operator prerequisites), deleted at Spec close-out per `deleted_at_spec_closeout: true`, with its release-procedure content ported to the Spec 6 feature doc, then moved again in PR #37 to README. Three doc locations for the same procedure across ~10 days. The lesson: **procedure docs (release, deploy) live in README from the start; never embed them in spec or feature docs.**
4. **Two sequential post-merge fixup PRs (#35, #36) instead of catching both pre-merge.** Both failures were diagnosable from the same `gh run view --log-failed` invocation. After #35 fixed cd-publish, I treated subtree-sync's failure as resolved-by-correlation rather than re-diagnosing. The right move was to read both failure logs at the first verification pass.
5. **PR #34's close-out mega-commit had high cognitive review load.** 13 files in one commit (Helm chart sources + cd-release.yml + 5 durable doc refreshes + 3 deletions). Formally OK per the ≤10-production-source-file rule (zero production-behavior source files), but reviewer-side burden was real. Suggestion: at Spec close-out, split into two commits on the same PR — one for implementation, one for docs/deletions — keeping the PR atomic but the review walk easier.
6. **CHANGELOG release-dating convention was ambiguous.** The feature doc had to spell out two options (leave per-Spec dated sections + add release marker vs consolidate into one block). Future releases shouldn't have to re-debate this. **Codified in PR #37's README → Release section as the durable rule — confirm the convention there before merging #37.**
7. **Parent worktree main went stale without an automatic reminder.** The user's `/Users/jp/code/psykl` worktree sat at `334d72d` (pre–Spec 6) for the entire S6 + post-merge fixup arc — 9 commits behind. AGENTS.md doesn't currently mandate syncing the parent worktree's main between Spec merges, and the staleness surfaced only when the user opened a deleted file from the IDE. Suggestion: add an "after Spec PR merge, sync parent worktree main" checkpoint to AGENTS.md → File & Status Discipline.
8. **`superpowers:finishing-a-development-branch` transition was missed.** Per the executing-plans skill's own Step 3, the transition should have been automatic when Spec 6 implementation completed. I didn't make it, the user asked which skill was active mid-close-out, and we recovered cleanly. But it shouldn't have needed the user prompt.
9. **No tooling check for prettier-incompatible files in `.prettierignore`.** Helm Go-template files broke the prettier-write pre-commit hook on PR #34's first commit attempt. Fix was trivial (one line in `.prettierignore`), but the failure mode was unguarded — prettier just errored mid-commit. Suggestion: a doctor-style script that catches "this file extension/path is in scope but unparseable by prettier" would have flagged it.

## What went poorly — user additions

_Fill in your bullets. Examples: friction you hit, places where the agent's framing was wrong, AGENTS.md rules that didn't fit, skill workflows that misfired, decisions you wanted re-opened, etc._

1. Lots of wasted tokens when agent does not confirm out of code configuration and naming.
2. Inconsistent spec and milestone closeouts. Need to prompt agent to remove references to completed / obsolete docs and summaries.
3. Code Style and linting is still relatively loose.

## Proposed AGENTS.md changes (autonomous — landing in the close-out commit)

These are codifications of patterns lived during M1. Discrete and safe. Items 6–8 fold in the user's "went poorly" bullets above. Item 9 codifies the skill-transition resolution.

1. **New-workflow proactive checklist.** Add a subsection under Test Discipline or Git Conventions: "When a Spec ships a new GitHub Actions workflow, the Spec PR description must include a checkbox confirming the first run on the merge-to-`main` commit shows `conclusion: success`. Operator-side verification, not a code gate." Tied to ADR-M1-026 + ADR-M1-027.
2. **Procedure-doc placement rule.** Add under Doc Discipline or Feature Docs: "Procedure docs (release, deploy, runbooks) live in README from the start. Feature docs and spec docs reference README sections by anchor; never duplicate procedural content." Tied to the Spec 6 release-procedure migration.
3. **Parent-worktree sync at Spec merge.** Add to File & Status Discipline: "After the Spec integration PR merges to `main`, the operator (or the agent on the operator's behalf) fast-forwards the parent worktree's `main` to `origin/main`. The Spec is not 'fully merged' from a worktree-discipline standpoint until this is done." Reminder, not an enforcement gate.
4. **CHANGELOG release-dating convention.** Add under File & Status Discipline: "At release tag cut, the CHANGELOG's per-Spec dated sections are preserved as the historical ship record. A new `## [X.Y.Z] - YYYY-MM-DD` heading is added above them as the release marker. The per-Spec sections are NOT consolidated into the release block — they carry per-Spec ship dates that the release block intentionally aggregates without losing." Codifies the README → Release section. **The release-marker line is agent-written at tag cut, per user decision below.**
5. **External-resource naming confirmation at plan finalization (folds in user bullet 1: "wasted tokens when agent does not confirm out-of-code configuration and naming").** Add to Design Doc Discipline: "Any decision that names an out-of-code resource — mirror repos, image registries, secret names, GitHub Actions secrets, cloud project IDs, domain names, external API endpoints — must be confirmed against the actual-created resource WITH the user before the plan's status flips to APPROVED. Skipping this confirmation has a real cost: the M1 mirror-name divergence (Decision #16 → #35) was discovered only at DevTask 10 execution time, requiring a re-open + 6-doc propagation that could have been a one-line plan edit pre-finalization."
6. **Spec/Milestone close-out completeness checklist (folds in user bullet 2: "inconsistent spec and milestone closeouts; need to prompt agent to remove references to completed/obsolete docs and summaries").** Add to File & Status Discipline as an explicit Spec close-out checklist the agent MUST walk: (a) feature doc created and consolidates issue brief + execution plan; (b) per-Spec issue brief and execution plan deleted; (c) `docs/STACK.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `README.md` (if scripts or procedure docs changed), `docs/PROJECT_STATUS.md` refreshed; (d) `honors_decisions:` frontmatter refreshed across all spec docs touched by any decision re-open in this Spec; (e) `grep -r` sweep across durable docs for any reference to the now-deleted planning files (issue briefs, execution plans, manual-instructions docs) — every match must either be updated or be intentional; (f) parent worktree's `main` fast-forwarded; (g) merged DevTask + Spec branches deleted locally and remotely. Add a Milestone close-out checklist mirror: (a) all Spec feature docs reviewed for completeness against the initiative DESIGN.md; (b) `docs/initiatives/{initiative}/{DESIGN.md, MILESTONE.md, issues/}` deleted; (c) PROJECT_STATUS handoff to the next initiative; (d) workflow retrospective at `docs/retrospectives/{date}-{initiative-slug}.md`; (e) tag cut and release notes published per README → Release.
7. **Code style + linting tightening — DEFERRED to M2 (folds in user bullet 3).** Per user decision at M1 close-out: defer until more behavior is added in M2, so the chosen rule tightening can be evaluated against a larger surface area than M1's vertical-slice code. M2 design phase produces the design doc; first M2 Spec or a between-initiative chore lands the actual rule changes.
8. **Skill-transition discipline (folds in resolved decision #3 below).** Strengthen AGENTS.md → Skill Transition Discipline: "At any skill's documented implementation-complete boundary (e.g., `superpowers:executing-plans` Step 3 → `superpowers:finishing-a-development-branch`; `superpowers:writing-plans` → execution; `/office-hours` → `/plan-eng-review`), the agent MUST surface the transition explicitly with the form 'I am about to transition from {A} to {B} because {reason}. Confirm?' and STOP for user approval before invoking the next skill. Auto-transition is forbidden, even when the source skill's instructions name the next skill as 'required sub-skill'." Tied to the missed handoff in this very initiative.

## Resolved decisions

1. **Per-component AGENTS.md split timing → defer to M3.** S3 retro recommendation upheld. Re-evaluate at M3 kickoff when SwiftUI / iOS / iPadOS / macOS conventions arrive and AGENTS.md balloon-risk becomes concrete.
2. **CHANGELOG release-marker authorship → agent-written.** At release tag cut, the agent (acting as the operator's hand) writes the `## [X.Y.Z] - YYYY-MM-DD` release-marker line above the per-Spec dated sections per change #4 above. Operator retains explicit-approval gate on the PR that lands the CHANGELOG date edit.
3. **Skill-transition discipline → STOP at implementation-complete boundary; ask before transitioning.** Codified as autonomous change #8 above.

## Deferred to M2

1. **Code style + linting tightening.** Candidate dimensions to scope when M2 design surfaces this: (a) ESLint rule strictness (turn current `warn` rules to `error`; enable `no-floating-promises`, `consistent-type-imports`, `prefer-readonly`, `no-restricted-imports`); (b) TypeScript compiler strictness (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`); (c) Prettier rule tightening (trailing-comma `all`, single-quote enforcement, import sorting); (d) pnpm-level enforcement (per-package `lint --max-warnings 0`, recursive sort-package-json, dep-cruise for module-boundary rules); (e) commit-style enforcement (commitlint + conventional-commits CI gate). M2 design phase produces the chosen dimensions via `/plan-eng-review`; first M2 Spec or a between-initiative chore lands the actual rule changes.

## Action items rolling into M2

- [x] Land autonomous AGENTS.md changes #1–6, #8 in this close-out commit. Change #7 (code style + linting) deferred to M2.
- [ ] M2 design phase: scope code style + linting tightening per "Deferred to M2" #1.
- [ ] Cut M1 v0.1.0 release per README → Release immediately after this PR merges to `main`.
- [ ] Delete `docs/initiatives/m1-bootstrap/{DESIGN.md, MILESTONE.md}` at initiative close-out (in this commit, separate from the actual v0.1.0 tag cut).
- [ ] Hand off `docs/PROJECT_STATUS.md` to M2 — name M2 PWA CRUD + offline-first as the next initiative; `feat/plan-m2-pwa-crud-offline` already exists as the parking branch.
- [ ] First M2 design doc must include the offline-first sync engine architecture (Service Worker scope, IndexedDB schema, sync queue, last-write-wins implementation) — currently a parked open surface in PROJECT_STATUS.
- [ ] Hand off `docs/PROJECT_STATUS.md` to M2 — `/office-hours` against `docs/initiatives/m2-pwa-crud-offline/` produces the M2 design doc; the `feat/plan-m2-pwa-crud-offline` branch is the parking place for M2 planning artifacts.
- [ ] First M2 design doc must include the offline-first sync engine architecture (Service Worker scope, IndexedDB schema, sync queue, last-write-wins implementation) — currently a parked open surface in PROJECT_STATUS.
