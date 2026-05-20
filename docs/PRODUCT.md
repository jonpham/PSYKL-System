# PSYKL-System — Product Brief

> Canonical product brief for PSYKL-System. Sits alongside the working agreement in [`AGENTS.md`](../AGENTS.md). When initiatives are planned with `gstack`, they should trace back to the premise, the Minimum Viable Product (MVP), and the constraints described here.
>
> **Glossary** (used freely below):
> - PSY = the unit of energy this tool helps a user manage. Treated as a first-class concept, not a unit of measure.
> - PSYKL = a "psychological work cycle" — a self-defined period of focused work, user-tunable, defaulting to 25 minutes (pomodoro-style).
> - PWA = Progressive Web App
> - CRUD = Create, Read, Update, Delete
> - MVP = Minimum Viable Product

## Premise

A time-independent planning tool for people who want to plan their work by **energy level and personal cycles** rather than by clock time and pre-scheduled calendar slots.

For users who get anxiety from clocks and meeting-style scheduling that doesn't reflect how their focus actually moves, PSYKL-System reframes "what should I do next" around energy and emergent patterns instead of fixed-time appointments.

## Differentiator

What makes PSYKL-System distinct from the dozens of existing pomodoro timers and todo apps:

1. **Retrospective-driven energy insight.** Tasks do not require an energy tag at creation. After PSYKLs complete, retrospectives aggregate task completions and timestamps and surface patterns — "tasks of type X tend to land in low-energy windows." The retro then invites the user to adapt: move that work earlier, break it down, batch differently.

2. **Adaptive PSYKL-boundary coaching.** At each terminal point of a PSYKL (user marks the task complete, user pauses for fatigue, or the countdown timer expires), the app suggests one of: take a break, move to the next task, do a recharge activity, or pick a known-higher-energy task. The suggestion is informed by the user's emerging history, not a fixed rule.

3. **Selective time-independence.** Countdown timers exist because they help users stick to their chosen PSYKL length. Calendar-grid views exist because they're the familiar way to visualize completed work over a week or month. What's intentionally absent is **clock-time scheduling of future tasks** — no "9am: write report" entries. The anti-clock stance shows up in the planning UI, not the execution UI.

## Aesthetic Naming

PSYKL-System uses celestial names (PSYKL, Earth, Moon, HelioArc, Sun) as **optional UI flavor**, not as architectural concepts. Code and data model use neutral terms (`cycle`, `task`, `period`). A configurable term-map at the UI layer can swap the celestial theme for a plain theme or any future theme without code churn. The celestial naming is fun, not load-bearing.

## Hypothesis

A rigid daily schedule fails certain users (planning paralysis, attention disorders, creative work with no external meetings) because their productive hours don't line up with traditional calendar slots. A tool that lets the user **commit to a focused-work cycle** of self-chosen length, **terminate that cycle on the user's terms** (completion, fatigue, or timer), and **learn from the user's actual patterns over time** can support more flexible work without losing the structure that prevents drift.

## Minimum Viable Product

The MVP closes the planning loop end-to-end:

- Maintain a backlog of tasks.
- Compile a daily plan from the backlog on first pickup of the day.
- Execute tasks in user-defined PSYKL cycles (default: 25-minute pomodoro; user-tunable per cycle and as a default).
- Each PSYKL terminates by user-completion, user-paused-for-fatigue, or timer expiry, and surfaces a coaching suggestion at the boundary.
- A simple retrospective view surfaces what got done and when.

> **MVP delivery is sequenced across milestones**, not packed into one. Milestone 1 (M1) ships only Create + Read of a `Task` with a `title` (architecture and workflow proof). M2 completes CRUD plus offline-first behavior. M3 introduces PSYKL execution and the first retrospective view on the native Apple clients. See `docs/initiatives/` for per-milestone scope and design.

## Future Features

- Recurring tasks (prevents daily re-creation of the same items)
- Daily Goals — recurring tasks that should land every day
- Expand task model: tags (location, priority, requirement, category, project), time estimates, task dependencies, notes / references / photos
- Map completed tasks to a daily summary; reverse-create a calendar of actual activity
- Task duration estimator based on prior completions
- End-of-day journal for retrospective
- Trend analytics across PSYKLs, days, weeks, months
- Sync to iCloud or Google Calendar
- Export to day-based Markdown files (downloadable as ZIP, or auto-backed-up to local filesystem)
- Import / sync with Apple Reminders
- Apple Watch integration (movement detection to pause or detect distraction)

## Surface Areas (Clients)

PSYKL-System ships as a set of clients sharing a single `service-task` backend:

- **PWA** (browser / desktop / Android via add-to-home-screen) — primary surface in Milestones 1 and 2, used for product discovery
- **iPhone (iOS)** — primary surface long-term; arrives in M3
- **iPad (iPadOS)** — arrives alongside the iOS client in M3
- **macOS** — arrives alongside the iOS client in M3 (SwiftUI multiplatform or Mac Catalyst, decided during M3 design)

Surface order is intentional: the PWA exists for cross-device dogfood and product iteration; the Apple-native clients carry the user's daily-driver experience once the product shape is known.

## Engineering Constraints

- All changes happen in this monorepo. The monorepo is the source of truth.
- Components (`components/web_client`, `components/service-task`, `components/ios_client`) are pushed to standalone upstream repositories as **downstream mirrors** via `git subtree split`. Never edit the mirrors directly.
- The monorepo hosts shared packages (`packages/`), system-level end-to-end tests, infrastructure (Docker Compose, helm charts), and project documentation (`docs/`).
- **Every component carries a Test-Driven Development (TDD) 5-layer test pyramid from M1**: Static Analysis → Unit → Integration → Component (system-component-isolation) → End-to-End. See [`AGENTS.md` → Test Discipline](../AGENTS.md).
- The PWA is offline-first from M2 onward (M1 ships an online-required PWA shell).
- A self-hosted Docker Compose deployment is supported.
- Architecture should permit scaling to ~100,000 concurrent users in a future production environment. Initial milestones do not optimize for that scale; they avoid choices that would actively preclude it.

## Staging Environments

- **Local** — application processes run directly on the host (for component-level dev).
- **Docker** — applications run as a Docker Compose cluster on the host (the default dev experience after M1).
- **Staging** — GitOps Continuous Integration / Continuous Deployment pipeline publishes container images, packages helm charts, and (eventually) deploys to a self-hosted Kubernetes cluster via Argo CD.
- **Production** — public-facing Platform-as-a-Service deployment orchestrated by Pulumi Infrastructure-as-Code. Release tags (`v*.*.*`) only.

## Milestone Roadmap

| Milestone | Theme | Status | Initiative dir |
|-----------|-------|--------|----------------|
| M1 | Bootstrap — vertical slice + test pyramid + Continuous Integration / Continuous Deployment infra | Designed | `docs/initiatives/m1-bootstrap/` |
| M2 | Complete Task Create/Read/Update/Delete + offline-first PWA | Sketched | `docs/initiatives/m2-pwa-crud-offline/` |
| M3 | Apple-native clients (iOS, iPadOS, macOS) + product discovery (PSYKL execution + retrospectives) | Sketched | `docs/initiatives/m3-apple-native-product-discovery/` |
| M4 | Multi-user authentication + homelab multi-instance support | Sketched | `docs/initiatives/m4-multi-user-auth-homelab/` |

Each initiative directory carries a `MILESTONE.md` summary suitable for the corresponding GitHub Milestone description, and (once designed) a `DESIGN.md` with full scope, premises, alternatives considered, and success criteria.
