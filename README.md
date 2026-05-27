# PSYKL-System

A time-independent planning tool for accomplishing and building / expending **PSY** (energy) across nested cycles:

- **PSYKL** — a self-defined period of work (minutes)
- **Earth** — day
- **Moon** — month
- **HelioArc** — season / quarter
- **Sun** — year

For people who want to build on their accomplishments using **repetition and energy levels** rather than standardized hours and periods.

> See [`docs/PRODUCT.md`](docs/PRODUCT.md) for the product brief (premise, hypothesis, MVP, future features, target surfaces).

---

## Repository Layout

This repository is a monorepo. Component repos are pulled in as Git Subtrees and acted on as **downstream mirrors** — the monorepo is the source of truth.

```
.
├── components/        # System components (each may have its own tech stack & upstream subtree mirror)
├── packages/          # Shared library packages used between components
├── docs/              # Project docs — see "Documentation" below
└── AGENTS.md          # Working agreement for AI assistants and humans
```

`components/` and `packages/` are currently empty — components will be scaffolded as initiatives are planned.

---

## Documentation

| Path                                               | What it is                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                           | Working agreement: workflow, terminology, conventions, skill routing |
| [`CLAUDE.md`](CLAUDE.md)                           | Claude Code entry point (sources `AGENTS.md`)                        |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)               | Product brief — premise, MVP, future features, surfaces, constraints |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Live status of the active initiative / spec / task                   |
| `docs/initiatives/{initiative}/`                   | `gstack` initiative planning, discovery, and design review artifacts |
| `docs/specs/{initiative}/`                         | Active `superpowers` implementation plans and specs                  |
| `docs/features/`                                   | Completed features (consolidated docs with GitHub issue & PR links)  |
| `docs/templates/`                                  | Templates for feature docs and other planning artifacts              |

---

## Workflow (Summary)

Full rules live in [`AGENTS.md`](AGENTS.md). Quick reference:

- **Initiatives** are planned with `gstack` → `docs/initiatives/`
- **Specs** are planned with `superpowers` → `docs/specs/`
- Completed specs are summarized into **feature docs** under `docs/features/`
- Branch naming: `(feat|bug|infra|chore)/short-description`
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- Never commit directly to `main`; never force-push
- Hard limit: ≤10 files changed per PR (lockfiles exempt)

---

## Pre-commit hooks

A Husky pre-commit hook gates the Static Analysis layer (Layer 1 of the test pyramid, per [`AGENTS.md`](AGENTS.md)) locally so failures surface before push:

- `lint-staged` runs ESLint (`--max-warnings 0 --fix`) and Prettier on staged `*.ts`/`*.tsx` files, and Prettier on staged `*.{js,jsx,json,md,yml,yaml,css}` files.
- After lint-staged, the hook runs `pnpm -r typecheck` once project-wide so cross-package TypeScript errors are caught before the commit lands.

The hook is installed automatically by the root `prepare` script on first `pnpm install`. To manually reinstall: `pnpm exec husky`.

**Escape hatch:** `git commit --no-verify` bypasses the hook. Per [`AGENTS.md`](AGENTS.md) Git Safety Protocol, only use `--no-verify` when the user has explicitly asked for it, and log the reason in the commit body.

---

## Links

- **GitHub Repo:** [jonpham/PSYKL-System](https://github.com/jonpham/PSYKL-System)
- **GitHub Project:** [PSYKL-System Project & Roadmap](https://github.com/users/jonpham/projects/6/)
- **Milestones:** [PSYKL-System/milestones](https://github.com/jonpham/PSYKL-System/milestones)
