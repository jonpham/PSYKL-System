# Changelog

## Unreleased

- Completed M1 Spec 1 Workspace Bootstrap: pnpm workspace scaffold, Node/pnpm pins, MIT license, and `@psykl/shared-types`.
- Completed M1 Spec 2 service-task minimal API: NestJS Task API, pglite/Drizzle persistence, global `UserIdGuard`, OpenAPI emission, and static analysis.
- M1 Spec 3 web_client minimal PWA — functional baseline: Vite + React + `vite-plugin-pwa` shell (DT5, #19) and Task UI consuming the `service-task` API via typed `openapi-fetch` with MSW-stubbed UI Component tests (DT6, #23). Adopted AGENTS.md UI Component Folder Layout (per-component directories with `index.ts` re-exports; private child UI Components nest under their single parent). Quality follow-ups DT7 (Husky pre-commit) and DT8 (Storybook + Play tests, supersedes M1 DESIGN.md Decision #33) tracked in the Spec 3 plan.
