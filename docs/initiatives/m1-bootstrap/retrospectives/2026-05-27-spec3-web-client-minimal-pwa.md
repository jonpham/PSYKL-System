---
created_at: 2026-05-27
spec: M1 Spec 3 (web_client minimal PWA)
constituent_prs:
  - https://github.com/jonpham/PSYKL-System/pull/19
  - https://github.com/jonpham/PSYKL-System/pull/23
  - https://github.com/jonpham/PSYKL-System/pull/24
  - https://github.com/jonpham/PSYKL-System/pull/25
  - https://github.com/jonpham/PSYKL-System/pull/21
type: retrospective
scope: per-spec
---

# Retrospective — M1 Spec 3 (web_client minimal PWA)

> Per-Spec retrospective. AGENTS.md → Workflow Retrospectives currently only mandates per-initiative retrospectives; this is a new per-Spec instance, motivated by the user request after Spec 3 close-out. Recommend codifying per-Spec retrospectives as optional-on-friction (see Proposed AGENTS.md changes → Retrospective Cadence).

## What went well

1. **TDD held across all four DevTasks.** Every DevTask ordered tests-first → implementation → green → refactor → commit. DT8's play functions even maintained coverage parity with the retired Vitest UI Component tests.
2. **Code review surfaced real issues before merge.** `/superpowers:requesting-code-review` against PR #21 caught 6 Important issues (deprecated ESLint flag, stale spec frontmatter, missing feature doc, etc.). One reviewer-flagged issue (Important #1 `SubmitEvent`) was reviewer-wrong — pushed back with cited evidence from `@types/react@19.2`; saved to memory to prevent re-flagging.
3. **Subagent-driven development worked once `isolation: "worktree"` was configured correctly.** Implementer subagents ran in throwaway worktrees; the user could keep working in their primary worktree throughout.
4. **AGENTS.md updates landed mid-flight when the underlying rule was wrong.** The "no-stacking" DevTask branching rule got rewritten to "stacking only on real dependency" with a rebase-before-PR rule, after surfacing the trade-off in DT7/DT8 sequencing.
5. **Locked-decision re-open executed with rigor.** DT8 superseded M1 DESIGN.md Decision #33 by adding a new Decision #34 with explicit back-link, rationale, and AGENTS.md test taxonomy propagation. Reviewer independently verified.
6. **Hard rule on git-push upstream verification caught a real bug.** When DT8 was branched off `origin/feat/web-client-task-ui-from-pwa-shell`, its tracking upstream defaulted to that parent. A bare `git push` would have shoved DT8 commits onto the DT6 branch. The explicit-refspec rule forced the right form.

## What went poorly

1. **Subagent worktree pollution on first dispatch.** Initial DT7 implementer ran inside the user's active worktree and switched its branch out from under them. The user had to interrupt to ask why their worktree had moved. Root cause: the controller didn't use `Agent isolation: "worktree"` parameter; the subagent-driven-development skill doesn't make this prominent. Fixed mid-session by switching all subsequent subagent dispatches to isolation mode.
2. **Permission prompt flood.** Subagents inherit the parent's permission mode; non-allowlisted commands kept prompting. Patched mid-flight with `/fewer-permission-prompts` adding a project-shared `.claude/settings.json` allowlist (15 entries). Should have been pre-tuned before subagent dispatch.
3. **Token cost ran high.** Four implementer subagents + four reviewer subagents totaled ≈430k tokens excluding controller overhead. The user issued an explicit token-conservation warning mid-session. The skill doesn't currently surface a token budget or recommend batching/pausing.
4. **AGENTS.md "no-stacking" rule was wrong for the immediate need.** The original rule (siblings-only) didn't anticipate K+1 depending on K's unmerged work. Discovered when the user asked for stacked PRs and I had to flag the conflict. The user committed an AGENTS.md update mid-session (commit `11e5f89`) to permit dependency-driven stacking.
5. **Husky pre-commit hook was retrofitted at S3 instead of bootstrapped at S1.** Earlier S1+S2 DevTasks merged without the Static Analysis local gate. Going forward, the gate should be part of the initial workspace scaffold, not added three Specs in.
6. **Spec doc frontmatter staleness when a decision re-opens.** The spec doc's `honors_decisions: [..., 33]` didn't update when DT8 superseded #33 via #34. Reviewer caught it.
7. **README went stale.** Hadn't been updated since DT5; the user had to ask explicitly. Should be a checklist item in every Spec close-out.
8. **Feature doc workflow under-specified.** The user clarified during close-out that issue briefs + execution-plan specs should be consolidated into the per-Spec feature doc and then deleted. AGENTS.md previously only documented deletion at _initiative_ close-out, not _Spec_ close-out.
9. **The subagent code reviewer mis-flagged a deprecated-in-React-19 API.** Both the controller and the reviewer flagged `import type { SubmitEvent } from 'react'` as wrong; the user corrected both with citation from `@types/react@19.2.15`'s deprecation notice. Saved to memory.

## Proposed AGENTS.md changes (autonomous — landing in this commit)

These are tightenings or codifications of patterns already lived during S3. Discrete and safe.

1. **Subagent-Driven Development discipline.** New subsection codifying: always use `Agent isolation: "worktree"` for implementer subagents; pre-tune `.claude/settings.json` allowlist before dispatch; track token budgets and pause/handoff at the controller's discretion.
2. **Git push upstream verification.** Add the DT8 "branched-off-origin-ref" trap as an example in the existing HARD RULE on `git push`.
3. **Locked-decision re-open ceremony — narrow-scope path.** Clarify that a narrow tooling-swap re-open may use the lighter ceremony (rewrite original decision + add new decision with rationale + back-link) without a full `/plan-eng-review` pass, provided the scope is contained and the user explicitly approves. Wider scope re-opens still require `/plan-eng-review`.
4. **`honors_decisions:` frontmatter refresh on re-open.** Add a rule under File & Status Discipline: when a decision referenced in any spec doc's `honors_decisions:` is re-opened, every spec doc referencing it must add the new decision number.
5. **Per-Spec doc consolidation at Spec close-out.** Clarify the existing "After completing an initiative... can be deleted" rule: at Spec close-out, the per-Spec issue brief AND execution-plan spec are consolidated into the per-Spec feature doc under `docs/features/` and then DELETED. Initiative-level docs are deleted at initiative close-out per the existing rule.
6. **README + durable docs (`ARCHITECTURE.md`, `STACK.md`, `CHANGELOG.md`) refresh at Spec close-out.** Add a checklist item: every Spec PR's close-out commit refreshes README script tables (if scripts changed), `ARCHITECTURE.md` (if the Spec shipped a new component or new ADRs), `STACK.md` (if the stack table changed), and `CHANGELOG.md` (always — one entry per Spec).
7. **Per-Spec retrospective convention.** New subsection: per-Spec retrospectives are optional but recommended whenever the Spec surfaced friction worth recording. Land them at `docs/initiatives/{initiative}/retrospectives/{date}-{spec-slug}.md`.

## Proposed: per-component AGENTS.md split (NEEDS USER DECISION)

### Current state

`AGENTS.md` is ~33 KB and mixes:

- Universal workflow rules (vocabulary, Phase-Gating, Git Conventions, Test Discipline taxonomy, Skill Routing, Feature Doc rules).
- TypeScript- and pnpm-specific bits (`pnpm -r lint`, `--max-warnings 0`, ESLint flat config, recursive scripts, `tsc -b`, ≤10 production-behavior source files rule).
- React-specific bits (UI Component Folder Layout, Storybook + Play tests).
- NestJS/Drizzle/pglite-specific bits (default-deny `UserIdGuard`, `*.contract.test.ts` naming, `tests/integration/` location).

When M3 lands SwiftUI / iOS / iPadOS / macOS clients, the React-specific bits won't apply and SwiftUI conventions will need to land somewhere. AGENTS.md will balloon.

### Proposed split

```
AGENTS.md                                # Universal working agreement (stays at repo root)
  - Vocabulary, Phase-Gating, Git Conventions
  - Test Discipline (taxonomy: the 5 layers — definitions only, not toolchains)
  - Doc Discipline (feature docs, Decisions appendix, retrospectives)
  - Skill Routing

components/service-task/AGENTS.md        # NEW
  - TypeScript + NestJS + Drizzle + pglite specifics
  - `*.contract.test.ts` + `tests/integration/` location convention
  - Default-deny `UserIdGuard` pattern
  - service-task-specific pnpm scripts
  - References AGENTS.md (root) for universal rules

components/web_client/AGENTS.md          # NEW
  - TypeScript + React + Vite + Storybook + MSW specifics
  - UI Component Folder Layout
  - `*.unit.test.tsx` + `*.stories.tsx` location convention
  - web_client-specific pnpm scripts
  - References AGENTS.md (root) for universal rules

components/ios_client/AGENTS.md          # FUTURE (M3)
  - Swift + SwiftUI + Xcode specifics
```

### Trade-offs

**For the split:**

- Per-component AGENTS.md files travel cleanly with the downstream mirror repos (M1 Spec 6 subtree push) — the mirror gets the rules that apply to it.
- Root AGENTS.md stays focused and easier to skim.
- Adding a new component (M3 iOS) doesn't bloat root.
- Reviewers of a `components/web_client/*` PR see the React-specific rules right next to the code.

**Against the split:**

- Two-file lookup for new contributors ("which AGENTS.md governs this rule?").
- Risk of drift between root and per-component files (universal rules accidentally restated per-component).
- Smaller payoff today (only 2 components); larger payoff when ios_client / ipados_client / macos_client land in M3.

### Recommendation

Defer the split until **M3** when the third component-tech-stack arrives. For M1/M2:

- Keep AGENTS.md as the single source of truth.
- Tag sections clearly when they apply to one component-tech-stack only (e.g., prefix React/PWA-specific subsections with "For TypeScript UI components:" so future readers know the scope).
- At M3 kickoff, split as part of the iOS component bootstrap.

But this is your call. Tag your preference and I'll execute (or not) accordingly.

## Action items rolling forward

- [ ] Land the autonomous AGENTS.md changes proposed above (this commit).
- [ ] User decision: per-component AGENTS.md split timing (now vs. M3).
- [ ] Pre-tune `.claude/settings.json` allowlist before Spec 4 kickoff (already done; carries forward).
- [ ] When Spec 4 runs subagent-driven-development, dispatch ALL implementers with `isolation: "worktree"` from turn one.
- [ ] Bootstrap Husky pre-commit in any future fresh-project template (not retrofitted).
