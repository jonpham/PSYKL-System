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

## Code Comments

- **Production code comments** exist only for what naming and structure can't convey — a non-obvious constraint, a cross-file behavior the reader can't see locally, a deliberate deviation from the obvious approach. If a comment just restates what the code already says (variable names, control flow), delete it.
- **Test code comments are held to a looser bar.** A test's job includes documenting behavior for a future reader (see AGENTS.md → Test Structure Convention), so context, rationale, and cross-file explanations belong there even when the assertion below is self-evident on its own.
- **Code must never reference markdown documents** (`.md` files) in a comment. Docs may reference code; code may reference other code (a file path, a class name, an inline `path:line`); code referencing a doc rots the moment the doc moves or the decision it recorded changes. State the rule directly instead.
- Avoid duplicating the same rationale in two places in one file (e.g., a docblock and an inline comment two lines later making the same point) — say it once, in the more useful location.
