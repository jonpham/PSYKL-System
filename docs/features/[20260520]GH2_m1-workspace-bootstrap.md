---
status: DONE
issue: [GH#2](https://github.com/jonpham/PSYKL-System/issues/2)
branches:
  - infra/m1-workspace-bootstrap
  - chore/shared-types-zod-schemas
prs:
  - https://github.com/jonpham/PSYKL-System/pull/10
  - https://github.com/jonpham/PSYKL-System/pull/11
  - https://github.com/jonpham/PSYKL-System/pull/13
completed_at: 2026-05-25
created_at: 2026-05-20
initiative: m1-bootstrap
spec: docs/specs/m1-bootstrap/20260520-S1-workspace-bootstrap.md
---

# M1 Spec 1: Workspace Bootstrap

## User Story

As a developer, I want to clone the PSYKL-System monorepo and run `pnpm install` from a fresh checkout so that I have a working development workspace with all packages, shared types, and tooling in place to start building any component.

## Features

1. Root pnpm workspace scaffold with Node 24 and pnpm 10 pins.
2. Repository baseline files: `.nvmrc`, `.npmrc`, `.editorconfig`, `.gitignore`, `LICENSE`, `CHANGELOG.md`, `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json`.
3. `packages/shared-types` package exporting Zod schemas and TypeScript types for the PSYKL `Task` data-model entity.
4. OpenAPI builder helper in `@psykl/shared-types` for downstream service generation.
5. Unit tests covering valid and invalid Task schema parsing and OpenAPI document generation.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m1-bootstrap/DESIGN.md`.
- Original issue brief: `docs/initiatives/m1-bootstrap/issues/[20260520]P1_m1-workspace-bootstrap.md`.
- Execution spec: `docs/specs/m1-bootstrap/20260520-S1-workspace-bootstrap.md`.
- GitHub issue: [#2](https://github.com/jonpham/PSYKL-System/issues/2).

## Implementation Notes

- DevTask 1 established the monorepo root as the source of truth for package manager, runtime, TypeScript, editor, ignore, license, and changelog policy.
- DevTask 2 added `@psykl/shared-types` as the first workspace package. Its Zod schemas define the `Task`, `TaskInput`, and `TaskResponse` contracts used by the API and future PWA client.
- The OpenAPI builder lives with the schemas so downstream service and client code regenerate contracts rather than hand-maintaining API artifacts.
- The package participates in the full pnpm script contract even where a test layer is a no-op, so recursive CI commands stay deterministic as more packages arrive.

## Verification Steps

**Associated E2E test:** none. End-to-end tests arrive in M1 Spec 5.

**Manual verification**

Setup / Preconditions:
- Node 24 LTS is active.
- Corepack is enabled.
- The repo is checked out from `main`.

Steps:
1. Run `pnpm install`.
2. Run `pnpm --filter @psykl/shared-types test:unit`.
3. Run `pnpm --filter @psykl/shared-types typecheck`.
4. Run `pnpm --filter @psykl/shared-types build`.
5. Confirm root workspace files and `packages/shared-types/dist/` exist after build.

Expectation: a fresh checkout installs cleanly, builds shared types, and exposes schema/types that downstream components can consume through `workspace:*`.

## Affected Components

- Repository root workspace/tooling files.
- `packages/shared-types`.

## Design Decisions

- Decision #1: pnpm workspace is the monorepo package manager.
- Decision #2b: Zod schemas in `packages/shared-types` are the schema source of truth.
- Decision #5: MIT license.
- Decision #6: Node 24 LTS and pnpm 10.x are pinned.
- Decision #18: `engine-strict=true` makes runtime mismatches fail fast.
- Decision #24: every component/package participates in the pnpm script contract.
- Decision #26: license file is named `LICENSE`.

## Architecture Decisions (ADR)

- **ADR-M1-001:** pnpm is the workspace and lockfile standard for M1.
- **ADR-M1-002:** `@psykl/shared-types` provides a schema-first contract package consumed by service and client components.
- **ADR-M1-003:** strict engine pinning prevents drift across developer machines and CI.
- **ADR-M1-004:** generated artifacts such as `dist/`, `openapi.json`, and generated client API types are excluded from source control and rebuilt by package scripts or CI.

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| 2026-05-21 | [#10](https://github.com/jonpham/PSYKL-System/pull/10) | Added root pnpm workspace scaffold, Node/pnpm pins, repository baseline files, MIT license, and lockfile. |
| 2026-05-21 | [#11](https://github.com/jonpham/PSYKL-System/pull/11) | Added `@psykl/shared-types` package with Task Zod schemas, OpenAPI builder, and unit tests. |
| 2026-05-22 | [#13](https://github.com/jonpham/PSYKL-System/pull/13) | Landed the completed workspace bootstrap stack on `main`. |
