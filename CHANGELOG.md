# Changelog

## Unreleased

- Completed M1 Spec 1 Workspace Bootstrap: pnpm workspace scaffold, Node/pnpm pins, MIT license, and `@psykl/shared-types`.
- Completed M1 Spec 2 service-task minimal API: NestJS Task API, pglite/Drizzle persistence, global `UserIdGuard`, OpenAPI emission, and static analysis.
- M1 Spec 3 web_client minimal PWA — all four DevTasks implementation-complete: Vite + React + `vite-plugin-pwa` shell (DT5, #19 merged); Task UI consuming the `service-task` API via typed `openapi-fetch` (DT6, #23 open); Husky + lint-staged pre-commit static-analysis gate running ESLint + Prettier + project-wide `tsc` on every commit (DT7, #24 merged into DT6 branch); Storybook 8 + `@storybook/test-runner` + play functions + `msw-storybook-addon` adopted as the UI Component-layer CLI gate, retiring the Vitest `*.component.test.tsx` pattern for UI apps (DT8, #25 open). Spec 3 also adopted the AGENTS.md UI Component Folder Layout (per-component directories with `index.ts` re-exports; private child UI Components nest under their single parent). DT8 re-opens and supersedes M1 DESIGN.md Decision #33 with a new Decision #34 documenting the rationale. AGENTS.md updates landed alongside: UI Component vs system component terminology disambiguation, the rebase-before-PR rule with explicit-refspec push guardrail, and stacking-only-on-real-dependency for DevTask branches.
