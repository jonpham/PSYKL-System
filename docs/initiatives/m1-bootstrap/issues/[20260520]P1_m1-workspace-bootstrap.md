---
status: TODO            # TODO | IN-PROGRESS | DONE | BLOCKED
issue: P1               # local plan; replace with GH{n} once a GitHub Issue exists
branches:               # one entry per DevTask once branches are cut
  -
prs:                    # one entry per DevTask once PRs are opened
  -
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec: 1
devtasks_total: 2       # DevTask 1 + DevTask 2
devtasks_complete: 0
---

# 20260520 - M1 Spec 1: Workspace Bootstrap

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer**, I want to be able to **clone the PSYKL-System monorepo and run `pnpm install` from a fresh checkout** so that **I have a working development workspace with all packages, shared types, and tooling in place to start building any component**.

## Features (DevTasks composing this Spec)

1. **DevTask 1 — Workspace scaffolding.** Root `package.json` (with `packageManager` pinned to a concrete pnpm 10.x), `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc` (Node 24), `.npmrc` (with `engine-strict=true` per DESIGN.md Decision #18), `.gitignore`, `.editorconfig`, MIT `LICENSE` (no extension), `CHANGELOG.md` with an `Unreleased` heading. ~9 files. [DevTask 1 GitHub Sub-Issue link TBD]
2. **DevTask 2 — `packages/shared-types`.** Package scaffold + Zod schemas for `Task`, `TaskInput`, `TaskResponse` in `src/schemas/`, deriving TypeScript types via `z.infer`. Configured for consumption via `workspace:*` by `service-task` and `web_client`. Includes `zod-to-openapi` plumbing exporting an `openapi.json` builder helper. Unit tests for each schema's parsing. ~6 files. [DevTask 2 GitHub Sub-Issue link TBD]

## Verification Steps

**Associated E2E test:** none — E2E suite arrives in Spec 5.

**Manual verification:**

_Setup / Preconditions_
- Local machine has Node 24 LTS available (via `nvm`, `asdf`, or system install).
- Corepack enabled (`corepack enable`) so the `packageManager` field in `package.json` activates the correct pnpm version automatically.
- Repo cloned to a fresh path.

_Steps_
1. `cd` into the freshly-cloned repo.
2. Confirm `node -v` matches the `.nvmrc` value (Node 24.x.x).
3. Run `pnpm install` from the repo root.
4. Confirm `pnpm install` exits 0 with no engine-mismatch errors.
5. Confirm `packages/shared-types/node_modules/` exists.
6. Run `pnpm -r typecheck` — passes with zero errors.
7. Run `pnpm -r test:unit` — passes (the only tests exist in `packages/shared-types`, covering Zod schema parsing).
8. Verify root contains `LICENSE` (no extension), `CHANGELOG.md` with `## Unreleased` heading, `.editorconfig`, `.gitignore`, `.nvmrc`, `.npmrc`, `pnpm-workspace.yaml`.

_Expectation_
A developer who has never seen the repo can clone it, run two commands, and have a working workspace ready to add a component.

## Affected Components

- Repository root (new files): `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc`, `.npmrc`, `.gitignore`, `.editorconfig`, `LICENSE`, `CHANGELOG.md`.
- `packages/shared-types/` (new package): `package.json`, `tsconfig.json`, `src/index.ts`, `src/schemas/task.ts`, `src/schemas/task.unit.test.ts`, optional helpers for `zod-to-openapi`.

## Design Decisions

From `docs/initiatives/m1-bootstrap/DESIGN.md` → Decisions appendix:

- **#1** Package manager: `pnpm + pnpm-workspace.yaml`.
- **#5** LICENSE: `MIT` (filename `LICENSE`, no extension, per #26).
- **#6** Toolchain pins: Node 24 LTS via `.nvmrc` + `engines.node: '>=24.0.0 <25'`; pnpm 10.x via `packageManager: 'pnpm@10.x.x'`.
- **#18** `engine-strict=true` in `.npmrc` so engine mismatches fail-fast at install.
- **#24** pnpm script contract: every package defines `dev`, `build`, `lint`, `format:check`, `typecheck`, `test:unit`, `test:component`. Stubs allowed where layer doesn't apply.
- **#2b** Schema source of truth: Zod schemas live in `packages/shared-types/src/schemas/` and are re-used by `service-task` (via `nestjs-zod`) and `web_client` (via the emitted `openapi.json` derived from these schemas).

## Architecture Decisions (ADR)

- **ADR-M1-001:** Workspace tool is pnpm (not npm, yarn, or bun). Selected for AGENTS.md lockfile-exemption alignment, fast install, and strict node_modules layout that catches undeclared dependency bugs. See Decision #1.
- **ADR-M1-002:** TypeScript-first single source of truth for API contracts lives in `packages/shared-types` as Zod schemas. Types, NestJS DTOs, and the OpenAPI document are all derived from these schemas. See Decision #2b.
- **ADR-M1-003:** Strict engine pinning. `.npmrc` enforces `engine-strict=true` to convert engine-mismatch warnings into hard errors at install time, preventing "works on my machine" drift. See Decision #18.

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| _none yet_ | _none yet_ | _none yet_ |
