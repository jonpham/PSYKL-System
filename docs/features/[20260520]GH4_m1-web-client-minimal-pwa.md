---
status: DONE
issue: [GH#4](https://github.com/jonpham/PSYKL-System/issues/4)
branches:
  - feat/web-client-pwa-shell
  - feat/web-client-task-ui-from-pwa-shell
  - chore/m1-s3-dt7-husky-precommit
  - feat/m1-s3-dt8-storybook-play-tests
prs:
  - https://github.com/jonpham/PSYKL-System/pull/19
  - https://github.com/jonpham/PSYKL-System/pull/23
  - https://github.com/jonpham/PSYKL-System/pull/24
  - https://github.com/jonpham/PSYKL-System/pull/25
completed_at: 2026-05-27
created_at: 2026-05-20
initiative: m1-bootstrap
spec: consolidated-into-this-doc
---

# M1 Spec 3: web_client Minimal PWA

## User Story

As a **user**, I want to **open the PWA, type a task title, click create, and see the new task appear in the list** so that **PSYKL-System has a working end-to-end frontend that exercises the full architecture (PWA → API → pglite → back) and proves the dogfood loop on the web surface before Spec 4 boxes it up in Docker Compose**.

## Features

1. **Installable Vite + React (SPA mode) PWA** at `components/web_client/`, served by `vite dev` on `:5173` locally. Web App Manifest emitted by `vite-plugin-pwa` makes the app installable on desktop and mobile (offline service worker is M2 work — M1 is "online-required").
2. **Typed Task CRUD against `service-task`** via `openapi-fetch` consuming `openapi-typescript`-generated types from `components/service-task/openapi.json` (Decision #12). End-to-end type safety: a Zod schema change in `service-task` propagates through the emitted OpenAPI document into the client's generated types and surfaces as a `tsc` error in `web_client`.
3. **TaskCreateForm + TaskList UI Components** with the `<title input> → Create → list update` happy path, plus loading and error states. Each UI Component lives in its own folder (`src/components/<Name>/`) with co-located unit tests, Storybook stories with play functions, and an `index.ts` re-export — per the **AGENTS.md UI Component Folder Layout** rule introduced from PR #23 review.
4. **Husky + lint-staged pre-commit gate** at the repo root running ESLint (`--max-warnings 0 --fix`), Prettier (`--write` on staged files; `--check` workspace-wide), and project-wide `pnpm -r typecheck` on every commit. Pulls the Static Analysis layer (Test Pyramid Layer 1) forward to local commit time so failures don't reach CI.
5. **Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon`** as the UI Component-layer CLI gate. `pnpm --filter @psykl/web-client test:component` builds the Storybook static, serves it via `http-server`, runs `test-storybook --ci` against it, and the test-runner exit code gates the layer. The retired `*.component.test.tsx` Vitest pattern is gone for UI applications; the `*.contract.test.ts` pattern still governs service-layer Component tests.
6. **MSW handler set shared between Vitest unit tests and Storybook play functions** — `src/test/msw-handlers.ts` is the single source of truth, consumed by `vitest.config.ts` setup and by `.storybook/preview.ts` via `mswLoader`. Handlers model the `service-task` contract including the `X-User-Id: local` default-deny posture.
7. **AGENTS.md working agreement updates** that landed alongside the implementation: UI Component vs system **component** terminology disambiguation; UI Component Folder Layout (every UI Component its own directory, private children nest under their single parent, root pages flat as the only exception); rebase-before-PR rule with explicit-refspec push guardrail; sibling-default DevTask branching with stacking permitted only on real ordering dependency.
8. **M1 DESIGN.md Decisions appendix updates:** Decision #33 (Component-layer back-end stub) was re-opened and superseded — MSW remains the stub mechanism but inside Storybook stories via `msw-storybook-addon` instead of inside Vitest tests. Decision #34 documents the re-open rationale and back-points to #33 and PR #23 review.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m1-bootstrap/DESIGN.md` (Decisions #33 + #34).
- Original issue brief: `docs/initiatives/m1-bootstrap/issues/[20260520]P3_m1-web-client-minimal-pwa.md` (consolidated into this feature doc and removed by this PR).
- Execution spec: `docs/specs/m1-bootstrap/20260520-S3-web-client-minimal-pwa.md` (consolidated into this feature doc and removed by this PR; the four DevTask Step checklists, File Structure table, and STOP-point convention live only in git history from here forward).
- GitHub issue: [#4](https://github.com/jonpham/PSYKL-System/issues/4).
- Constituent DevTask PRs: [#19](https://github.com/jonpham/PSYKL-System/pull/19) (DT5 PWA shell), [#23](https://github.com/jonpham/PSYKL-System/pull/23) (DT6 Task UI), [#24](https://github.com/jonpham/PSYKL-System/pull/24) (DT7 Husky pre-commit), [#25](https://github.com/jonpham/PSYKL-System/pull/25) (DT8 Storybook + Play tests).
- Spec integration PR: [#21](https://github.com/jonpham/PSYKL-System/pull/21).

## Implementation Notes

- **DT5 (PWA shell, PR #19)** scaffolded Vite + React + TypeScript with `vite-plugin-pwa`, an App-shell component with a Unit test, and deferred the `src/test/setup.ts` MSW wiring to DT6 to stay inside the DevTask PR file limit. Vitest was bumped to 3.2.4 (vs the planned 2.x in the spec doc) because Vitest 2 pulls Vite 5 types that conflict with the locked Vite 6 toolchain during `tsc -b`.
- **DT6 (Task UI consuming service-task API, PR #23)** added `src/api/client.ts` wrapping `openapi-fetch` with the `X-User-Id: local` header default; `TaskCreateForm` and `TaskList` as flat files initially; MSW handlers in `src/test/msw-handlers.ts` shared by unit/component tests; and `App.tsx` wiring. The PR review surfaced the UI Component Folder Layout rule, which was adopted mid-PR: components were moved from `src/components/<Name>.tsx` flat files to `src/components/<Name>/{<Name>.tsx, <Name>.unit.test.tsx, <Name>.component.test.tsx, index.ts}` folders with a sibling `index.ts` re-export per AGENTS.md.
- **DT7 (Husky pre-commit, PR #24, merged into DT6 branch)** added repo-root `.husky/pre-commit` invoking `pnpm exec lint-staged` then `pnpm -r format:check` then `pnpm -r typecheck`. Lint-staged config inline in root `package.json` maps `*.{ts,tsx}` to ESLint `--max-warnings 0 --fix` then `prettier --write`; `*.{js,jsx,json,md,yml,yaml,css}` to `prettier --write`. The project-wide `typecheck` runs _after_ `lint-staged` because `tsc` needs project references and can't be parameterized by staged file list. `prepare: "husky"` in root `package.json` ensures a fresh `pnpm install` installs the hook for every contributor. README.md documents the gate and the `--no-verify` escape hatch per AGENTS.md Git Safety Protocol.
- **DT8 (Storybook + Play tests, PR #25)** re-opened M1 DESIGN.md Decision #33 (with explicit user authorization per AGENTS.md Design Doc Discipline) and added Decision #34 documenting the supersession. Storybook 8 was hand-wired in `.storybook/main.ts` + `.storybook/preview.ts` (skipping `storybook init` which is TTY-bound). The `msw-storybook-addon` `mswLoader` reuses the existing handlers from `src/test/msw-handlers.ts` plus a per-story `resetStore` loader to mirror the Vitest `beforeEach` reset. `pnpm --filter @psykl/web-client test:component` was rewritten to `storybook build --quiet --output-dir storybook-static && concurrently -k -s first -n SB,TEST "http-server storybook-static --port 6006 --silent" "wait-on tcp:6006 && test-storybook --url http://127.0.0.1:6006"` — `-s first` ensures the test-runner's exit code propagates as the layer gate, and `-k` tears down the server when tests exit. The Vitest `*.component.test.tsx` files were deleted; `vitest.config.ts` was tightened to match `*.unit.test.tsx` only. `@storybook/addon-essentials` and `@storybook/addon-interactions` were pinned to `^8.6.18` (matching the rest of the `@storybook/*` family) to avoid duplicate resolution of `@storybook/test`. `playwright` was added as an explicit dev dep because `@storybook/test-runner@0.19` has it as a peer without auto-install. `public/mockServiceWorker.js` is checked in (not gitignored) so CI builds can serve it without a postinstall script; `storybook-static/` is gitignored and rebuilt fresh each `test:component` run. `web_client` `format:check` switched to `--ignore-path ../../.prettierignore` (was `--ignore-path ../../.gitignore`) so storybook-static and the third-party MSW worker are excluded from Prettier without being gitignored; `**/src/api/types.ts` was added to `.prettierignore` to maintain the exclusion the gitignore-based form provided.
- **Coverage parity over the retired Vitest UI Component tests** is preserved by the two play functions: `TaskCreateForm.stories.tsx > CreatesTaskOnSubmit` (fill input → click Create → assert `onCreated` called once with the Task → assert input clears); `TaskList.stories.tsx > IntegratedWithCreateForm` (render `<App />` → assert empty-state → create first task → assert first task appears + empty-state gone → create second task → assert both render). An additional `AppLoadError` play function asserts the `App.tsx` `useEffect` error branch by overriding the MSW `GET /tasks` handler with a 500 response — coverage the retired Vitest tests didn't include.

## Verification Steps

**Associated E2E test:** none. End-to-end tests via Playwright arrive in M1 Spec 5 (CI test pipeline).

**Manual verification**

_Setup / Preconditions_

- Spec 1 and Spec 2 complete and merged.
- Node 24 LTS is active.
- Dependencies installed with `pnpm install` (the Husky hook installs automatically via the `prepare` script).
- `pnpm --filter @psykl/service-task build:openapi` has been run to emit `components/service-task/openapi.json`.
- `pnpm --filter @psykl/web-client codegen` has been run to refresh `components/web_client/src/api/types.ts` from the emitted OpenAPI document.

_Steps_

1. Run `pnpm -r lint`.
2. Run `pnpm -r format:check`.
3. Run `pnpm -r typecheck`.
4. Run `pnpm -r test:unit` (covers all workspaces; `web_client` contributes 9 unit tests).
5. Run `pnpm -r test:component` (covers all workspaces; `web_client` runs `storybook build` and then `test-storybook` against the built static).
6. Run `pnpm --filter @psykl/service-task dev` in one terminal (service on `:3000`).
7. Run `pnpm --filter @psykl/web-client dev` in another (Vite on `:5173`).
8. Open `http://localhost:5173`. Confirm the PSYKL app shell renders with no console errors.
9. DevTools → Application → Manifest. Confirm the Web App Manifest loads (name, icons, theme color). The PWA is installable.
10. Confirm the page shows an empty-state copy ("no tasks yet" or similar) with the title input and Create button.
11. Type "first task from PWA" → click Create. The task appears in the list with title + relative timestamp.
12. Refresh. The task is still there (persisted via service-task → pglite).
13. Open the Network tab; create another task. Confirm one `POST /tasks` with `X-User-Id: local` and `Content-Type: application/json` returning 201; one `GET /tasks` returning 200 with both tasks.
14. Confirm no CORS errors.
15. Stage an obviously-broken `.ts` file (e.g., unused import) and `git commit`. Confirm the pre-commit hook rejects the commit.
16. Restore the file, stage a clean change, commit. Confirm the hook passes and the commit lands.

_Expectation_
A minimal PWA that creates and lists PSYKL `Task` records via the real `service-task` API. Type-safe end-to-end (no hand-coded request/response shapes). Installable as a PWA. Local pre-commit gate enforces the Static Analysis layer before code reaches CI. Storybook UI Component test-runner is the CLI gate behind `pnpm -r test:component` and doubles as the Manual Visual Check surface (`pnpm --filter @psykl/web-client storybook` boots the Storybook UI).

## Affected Components

- `components/web_client/` (new component): React + Vite + TypeScript app, Storybook 8 + test-runner, MSW handlers, UI Component folder layout.
- Repository root:
  - `.husky/pre-commit` (new), `package.json` (added `husky`, `lint-staged`, `prepare: "husky"`, inline `lint-staged` config), `pnpm-lock.yaml`.
  - `AGENTS.md` (UI Component disambiguation, UI Component Folder Layout, rebase-before-PR rule, sibling-default branching with stacking-on-dependency carve-out, test pyramid taxonomy refinement for the Component layer).
  - `eslint.config.js`, `.prettierignore`, `.gitignore` (Storybook static + MSW worker + generated types exclusions).
  - `README.md` (Pre-commit hooks section).
- `docs/initiatives/m1-bootstrap/DESIGN.md`: Decision #33 rewritten + new Decision #34.
- `docs/PROJECT_STATUS.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/STACK.md`: status, change log, architecture, and stack updates.

## Design Decisions

- **#3** PWA framework: Vite + React (SPA mode) + `vite-plugin-pwa`.
- **#11** Test file locations: Unit + Component colocated next to source.
- **#12** OpenAPI artifact path + build order: `web_client` consumes the emitted `openapi.json` via `openapi-typescript`; both the JSON and the generated `types.ts` are gitignored.
- **#14** Port `:5173` for the Vite dev server.
- **#15** CORS posture: `service-task` allows `Origin: http://localhost:5173`; `VITE_API_URL` env var defaults to `http://localhost:3000`.
- **#22** No Integration test layer in `web_client` for M1.
- **#24** pnpm script contract (`lint`, `format:check`, `typecheck`, `test:unit`, `test:component`).
- **#33** Component-layer back-end stub: **superseded by #34** — MSW remains the mechanism but invoked inside Storybook stories via `msw-storybook-addon`, not inside Vitest tests.
- **#34 (new)** UI Component-layer toolchain: Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon`. Vitest still drives the Unit layer; the `*.component.test.tsx` filename pattern is retired for UI applications; service-side `*.contract.test.ts` is unchanged.

## Architecture Decisions (ADR)

- **ADR-M1-009:** Vite + React in SPA mode chosen over Next.js / Remix / SvelteKit specifically to avoid server-component-blended frameworks (per DESIGN.md Premise 4). The PWA is a clean static app served by nginx in production (Decision #21), not a Node server.
- **ADR-M1-010:** Service worker and offline cache deferred to M2. M1 ships an installable manifest only — the PWA is "online-required" for M1.
- **ADR-M1-011:** MSW (Mock Service Worker) is the Component-layer back-end stub. Operates at the HTTP boundary (closest to "stubbed back-end"), reusable across Vitest setup and Storybook stories, doesn't require mocking the `openapi-fetch` client internals.
- **ADR-M1-012:** Type safety end-to-end via generated `openapi-typescript` types consumed by `openapi-fetch`. The contract is enforced by `tsc`.
- **ADR-M1-013 (new in DT8):** UI Component-layer tests use Storybook 8 + `@storybook/test-runner` + play functions instead of Vitest + Testing Library. Same MSW handler set is shared across Vitest unit tests and Storybook stories via `msw-storybook-addon`. The CLI gate (`pnpm -r test:component`) drives the test-runner against a built Storybook static. Benefits: each UI Component test doubles as a visual Manual Visual Check surface; the same scenarios run in the Storybook UI and in CI. Cost: ~5s extra per `test:component` run vs the prior Vitest invocation, and Storybook 8 will require import-path updates when M1 upgrades to Storybook 9.
- **ADR-M1-014 (new in DT7):** Static Analysis runs on every local commit via Husky pre-commit, in addition to its mandatory CI run. Pre-commit composition: lint-staged (per-file ESLint `--fix` + Prettier `--write`) → workspace-wide `pnpm -r format:check` → workspace-wide `pnpm -r typecheck`. The `--no-verify` escape hatch is documented but its use must be logged in the commit body per AGENTS.md Git Safety Protocol.
- **ADR-M1-015 (new from PR #23 review):** UI Component Folder Layout. Every UI Component gets its own directory with `<Name>.tsx`, colocated tests (`*.unit.test.tsx` + `*.stories.tsx`), and an `index.ts` re-export. Private child UI Components nest as subdirectories of their single parent (promoted back to top level when a second consumer appears). Root-page components (e.g., `App.tsx`) are the only flat exception.

## Change Log

| Date       | PR                                                     | Summary                                                                                                                                                                |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-25 | [#19](https://github.com/jonpham/PSYKL-System/pull/19) | DT5: Vite + React + `vite-plugin-pwa` PWA shell scaffolded; App-shell Unit test.                                                                                       |
| 2026-05-27 | [#23](https://github.com/jonpham/PSYKL-System/pull/23) | DT6: Task UI consuming `service-task` API via typed `openapi-fetch`; MSW-backed UI Component tests; UI Component Folder Layout adopted; status/changelog/spec updates. |
| 2026-05-27 | [#24](https://github.com/jonpham/PSYKL-System/pull/24) | DT7: Husky + lint-staged pre-commit gate running ESLint + Prettier + `tsc` on every commit; `--no-verify` escape hatch documented.                                     |
| 2026-05-27 | [#25](https://github.com/jonpham/PSYKL-System/pull/25) | DT8: Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon` replace the Vitest UI Component tests; DESIGN.md #33 → #34 re-open.               |
| 2026-05-27 | [#21](https://github.com/jonpham/PSYKL-System/pull/21) | Spec integration: all four DevTasks merged onto `spec/m1-s3-web-client-minimal-pwa`; this feature doc lands here.                                                      |
