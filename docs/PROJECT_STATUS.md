# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Feature).

**Last completed plan & task:** `/plan-eng-review` closed all six M1 architectural Open Questions
**Active initiative:** M1 Bootstrap (`docs/initiatives/m1-bootstrap/`) — APPROVED, ready for spec writing
**Active spec:** _none yet — about to run `superpowers:writing-plans` to produce 11 specs_
**Active plan:** `superpowers:writing-plans` against M1 design doc → atomic ≤10-file specs in `docs/specs/m1-bootstrap/`
**Active skill:** _between skills — paused after `/plan-eng-review` close-out_
**Branch:** `feat/plan-and-bootstrap`
**Current step:** Committing `/plan-eng-review` artifacts (DESIGN.md decisions, PROJECT_STATUS update).
**Known blockers:** None.
**Next action:** Invoke `superpowers:writing-plans` against `docs/initiatives/m1-bootstrap/DESIGN.md` to break M1 into the 11 specs.

## M1 Locked-in Stack

| Layer | Choice |
|-------|--------|
| Package manager | pnpm + pnpm-workspace.yaml |
| Node runtime | Node 24 LTS (pinned via .nvmrc + engines) |
| pnpm version | 10.x (pinned via packageManager field) |
| API framework | NestJS, REST + spec-first OpenAPI 3.x, multi-transport-ready |
| PWA framework | Vite + React (SPA mode) + vite-plugin-pwa |
| ORM + migrations | Drizzle ORM + drizzle-kit |
| Database (M1) | SQLite (Postgres path at M4+) |
| LICENSE | MIT |

## Initiative Summary

| Initiative | Theme | Status | Initiative Doc |
| ---------- | ----- | ------ | -------------- |
| M1 — Bootstrap | Vertical slice + test pyramid + Continuous Integration / Continuous Deployment infra | 🟡 Designed, awaiting decisions | [`m1-bootstrap/`](initiatives/m1-bootstrap/) |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync | ⚪ Sketched | [`m2-pwa-crud-offline/`](initiatives/m2-pwa-crud-offline/) |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives | ⚪ Sketched | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab | Real authentication, multi-user data isolation, homelab self-host | ⚪ Sketched | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/) |

Legend: 🟢 Done · 🟡 Active · ⚪ Sketched / Not started
