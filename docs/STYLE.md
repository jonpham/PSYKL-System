# Code Style

This document records project style preferences and static-tool ownership for rules not fully captured by Prettier.

## Static Tool Ownership

- Prettier owns whitespace, wrapping, quotes, and punctuation formatting.
- ESLint owns semantic style rules such as source file line caps, one declaration per `const`/`let`/`var` statement, and import/export ordering.
- Mechanical style rules belong in static analysis, not only agent instructions, so non-agent contributors get the same feedback locally and in continuous integration.
- `pnpm-lock.yaml` is intentionally ignored by Prettier so dependency commands can keep the lockfile in pnpm's native format.

## TypeScript Module Shape

- Keep executable behavior in the main module file.
- Move shared type-only contracts into an adjacent `*.types.ts` file when they distract from the behavior module or are consumed by multiple files.
- Prefer non-exported declarations in the behavior module and a single named export block at the bottom when it improves scanability.
- Keep imports and named exports alphabetized. ESLint enforces this through `simple-import-sort/imports` and `simple-import-sort/exports`.
