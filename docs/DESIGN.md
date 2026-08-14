# Design System — PSYKL

Written by `/design-consultation` (gstack) on 2026-08-13, with outside design directions from Codex (`gpt-5.5`) and an independent Claude subagent synthesized into the result.

**Status:** Proposed — not yet reviewed by `/plan-design-review`, not yet implemented.
**Scope:** Durable. This document outlives the `todo-experience` initiative and is refreshed, not deleted, at initiative close-out.
**Companion:** [`docs/initiatives/todo-experience/UX.md`](initiatives/todo-experience/UX.md) covers screen behavior, user stories, and gesture vocabulary for the active initiative. This file covers the visual system only.

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes. A PSYKL _session_ is one start/stop event against a task.
> - OFL = SIL Open Font License.
> - CDN = Content Delivery Network.
> - WCAG AA = the Web Content Accessibility Guidelines' AA contrast bar: 4.5:1 for normal text, 3:1 for large text and non-text indicators.
> - UI = User Interface.

---

## Product Context

- **What this is:** An offline-first task manager whose differentiator is the PSYKL session — a fixed period of focused work started against a task. The task list is the substrate the sessions attach to.
- **Who it's for:** One person. The operator. Single-user, multi-device, never collaborative ([`docs/PRODUCT.md`](PRODUCT.md) → Sync and Sharing Model).
- **Space:** Personal task management. Peers: Apple Reminders, Things 3, Todoist, TickTick, Superlist.
- **Project type:** Mobile-first PWA, installed to the home screen, used daily, frequently offline.

---

## The Governing Idea

**The list is arranged, not scored.**

Nothing in the interface ever tells you a task matters. You told it, by putting it where it is. Position in the list _is_ the priority, maintained by hand on whatever cadence you choose. There is no flag, no star, no priority field, no urgency colour, and no algorithmic ranking — this is the design's answer to the "Priority / flag: **Out** — replace with ordering" line in the initiative design.

Two consequences the whole system follows from:

1. **Drag-to-reorder is the hero interaction**, not a feature on a list. Every other decision — row height, type size, contrast, motion — is checked against "does this stay legible and calm when forty rows are stacked and being rearranged?"
2. **Effort is retrospective, never declared.** The app never asks how big a task is. Energy is inferred later from PSYKL session history: elapsed time, loop count, and post-loop input, aggregated by tag and parent list. Until sessions exist, there is **no effort signal in the interface at all**, because any such signal would be fabricated.

### The feeling, in ratio

The operator's brief was roughly three parts _effortful, engaging, drives productivity_ to one part _calm, at your own pace_.

The category treats calm and dense as opposites and buys calm by removing information — Things 3's whole thesis is low density and generous whitespace. That equation is inherited from Apple's flat-design era rather than derived from what a task list is for. A well-set page of a book is dense and calm; a slot machine is sparse and frantic. **Calm comes from regularity and restraint of contrast, not from volume of whitespace.**

So: the effortful three lives in density, monospaced precision, small confident type, strict alignment, and a complete absence of encouragement — a tool that assumes you are competent. The calm one lives in the fact that a dense screen contains no competing signals: one hue, one weight, one rule colour, everything on a 4px grid.

**First three seconds:** _This is my arrangement, exactly as I left it._

---

## Aesthetic Direction

- **Direction:** Industrial / Utilitarian, with editorial typographic discipline. A ruled ledger, not an app surface.
- **Decoration level:** Minimal. Type, hairline rules, and one accent do all the work.
- **Mood:** A tool someone built for themselves and then refused to soften. Flush edges, no cards, no floating panels, no shadows, no depth trickery, no texture, no illustration, no gradient anywhere.
- **Reference points:** [Things 3](https://culturedcode.com/things/) for what to beat on craft and deliberately lose on density; [Superlist](https://www.superlist.com/) for what to avoid (saturated, playful, gradient-heavy reads as _fun_, not as _work_); the [Pratt critique of Reminders](https://ixd.prattsi.org/2024/12/design-critique-reminders-macos-app/) for the specific defect worth beating — drag handles that are invisible until you already know they exist.

### Anti-patterns, permanently banned

Purple or violet gradients. Glassmorphism. Card stacks with drop shadows. Uniform bubble border-radius. Gradient buttons. Three-column icon grids. Centered-everything layouts. Confetti, streaks, points, badges, levels, or any completion celebration. `system-ui` as the display or body face. Multi-colour tag pills.

---

## Typography

**IBM Plex Sans** for titles, labels, and prose. **IBM Plex Mono** for every numeral, date, tag, count, and identifier.

Both are OFL, free, and a designed superfamily — the mono column and the prose column belong to each other, and that shared skeleton is what produces the ledger effect. Every number in the app sits in a tabular monospace column and aligns vertically down the list. That single choice does most of the instrument work.

**Loading — self-hosted, not CDN.** This is an offline-first PWA. Fonts are bundled with the client, served same-origin, and precached by the Service Worker alongside the app shell. A Google Fonts `<link>` would render the app in fallback the first time it is opened offline, which is the exact scenario the product is built for. Subset to Latin, `woff2` only, `font-display: swap`.

Prototypes and mockups may load Plex from a CDN for convenience. Shipped code may not.

### Scale

Mobile-first, tuned for a dense list on a 4px baseline.

| Token     | Size / line-height          | Face + weight | Use                          |
| --------- | --------------------------- | ------------- | ---------------------------- |
| `meta-xs` | 11 / 16, +0.06em, uppercase | Plex Mono 500 | tags, counts, section labels |
| `meta-sm` | 12 / 16                     | Plex Mono 500 | due dates, timestamps        |
| `row`     | 15 / 20                     | Plex Sans 400 | task title — the workhorse   |
| `body`    | 15 / 24                     | Plex Sans 400 | notes, detail sheet prose    |
| `section` | 13 / 16, +0.08em, uppercase | Plex Sans 600 | section header within a list |
| `label`   | 13 / 16                     | Plex Sans 500 | form labels, buttons         |
| `screen`  | 24 / 28, −0.02em            | Plex Sans 600 | list name                    |

Bold is scarce on purpose. Section headers and the list name are the only places weight 600 appears in the list view, so nothing else can shout in a peripheral scan.

---

## Color

**Approach:** Restrained to the point of severity. One accent, and it is spent on one thing.

### The accent is reserved

`--ember` means **a PSYKL session is live**. Nothing else. It is never a link, never a button, never a selection state, never a focus ring, never a tag, never "primary action."

This is the single most load-bearing rule in the system. Because the accent never appears on chrome, the task list is effectively monochrome, which is what lets forty rows read as calm rather than noisy. It also means that starting a session visibly lights the app up — the differentiator gets the only saturated thing in the product. Spending ember on a Save button would devalue the currency and make this look like every other app.

Consequence for the `todo-experience` initiative: **it ships with almost no colour in it.** That is intended, not an oversight.

Buttons are ink on hairline. Selection is a ground shift. Completion is a subtraction.

### Light — canonical

Designed first. Every decision is checked against this theme.

```css
:root {
  --ground: #f4f2ed; /* warm paper, never #FFFFFF */
  --raised: #eae7e0; /* detail sheet, quick-add rail */
  --pressed: #e4e0d7; /* press + drag-lift ground shift */
  --rule: #d2cec5; /* row separators */
  --rule-strong: #b9b4a9; /* section separators */
  --ink-primary: #191a1a; /* 15.7:1 */
  --ink-secondary: #63665f; /*  5.2:1 */
  --ink-tertiary: #6c6f68; /*  4.6:1 — completed rows, placeholders */
  --ember: #d8410a; /* RESERVED: live PSYKL session only */
  --ember-dim: #f0c9b2;
  --ash: #9e3323; /* destructive swipe ground, delete confirm */
  --focus: #2e3a3f; /* 2px focus ring — deliberately not ember */
}
```

### Dark — faithful port

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #0e0f0f;
    --raised: #161818;
    --pressed: #1e2120;
    --rule: #26292a;
    --rule-strong: #3a3e3f;
    --ink-primary: #e8e6e1;
    --ink-secondary: #8e918f; /* 5.9:1 */
    --ink-tertiary: #7a7d7b; /* 4.5:1 */
    --ember: #ff6a1f;
    --ember-dim: #7a3512;
    --ash: #b33a2b;
    --focus: #9fb4bc;
  }
}
```

### Rules

- **No white ground in either theme.** `#F4F2ED` over `#FFFFFF` is most of what separates "considered" from "default."
- **No semantic colour palette.** There is no success green, no warning amber, no info blue. Success is a state change, not a hue. Errors use `--ash`, which is also the destructive-swipe ground, because they are the same idea: something is being undone.
- **No overdue styling, ever.** No red rows, no "3 days late," no escalating colour as a date approaches. A date passing is not a moral event; the date sits in the metadata column, in `--ink-secondary`, being true. This is the visual expression of Premise P2 in the initiative design.
- **Contrast.** `--ink-primary` and `--ink-secondary` clear WCAG AA for normal text in both themes. `--ink-tertiary` sits at ~4.5:1 and is only used where a second, non-colour signal is also present (completed rows also strike through and shrink). `--ember` at ~4:1 on light ground is **never used for small text** — when it carries type, the type is ≥18.66px semibold, or the ink is light-on-ember.
- **Dark is not an inversion.** Surfaces are re-chosen, not flipped, and accent saturation is reduced relative to naive inversion.

---

## Spacing

- **Base unit:** 4px. Everything is a multiple. No exceptions, including optical ones.
- **Density:** Compact.
- **Scale:** `2xs 2` · `xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 24` · `2xl 32` · `3xl 48`

### Row metrics — the load-bearing numbers

| State                                                      | Height   |
| ---------------------------------------------------------- | -------- |
| Task, single line                                          | **44px** |
| Task with a metadata line (due date, tags, note indicator) | **60px** |
| Task, completed                                            | **40px** |
| Section header                                             | 32px     |
| Quick-add rail                                             | 52px     |

44px is the minimum comfortable touch target and it is also as tight as 15/20 type goes without the list reading as cramped. It is deliberately not 56px (Material) or 72px (Todoist) — those heights are what force competitors to buy calm with whitespace. Completed rows shrink to 40px so a finished section visibly compacts.

Horizontal: 16px page gutter. Rows bleed to the full width; the rule between them bleeds too. Nothing is inset in a card.

---

## Layout

- **Approach:** Grid-disciplined. One continuous ruled surface.
- **Grid:** Single column on mobile. Single column on desktop, capped at **720px** so rows never stretch to an unreadable measure. No sidebar in this initiative; list switching is a sheet.
- **Sections are typographic interruptions, not containers.** A section header is a rule plus a small uppercase label in the flow of the list. It does not box, indent, or tint the tasks under it.
- **Border radius:** 2px on inputs, sheets, and the quick-add rail. **0 everywhere else.** Nothing is a pill.
- **The quick-add rail is bottom-anchored and never scrolls away.** Capture is the most frequent action in the product and it gets the most reachable pixel on a phone.
- **Elevation:** there is none. Sheets slide over the list and are separated by a `--rule-strong` edge, not a shadow.

---

## Motion

- **Approach:** Minimal-functional. Motion explains a state change or it does not happen.
- **Easing:** enter `ease-out` · exit `ease-in` · move `ease-in-out`
- **Durations:** press feedback 120ms · row lift on drag 180ms · row reorder settle 200ms · completion 140ms · sheet in/out 240ms
- **Completion is a release of tension, not a reward.** The title fades to `--ink-tertiary`, strikes through, and the row collapses 44px → 40px over 140ms. No bounce, no spring, no checkmark flourish, no haptic celebration, no sound.
- **Reorder must feel physical.** The lifted row gets a `--pressed` ground and a visible insertion gap that other rows animate around. This is the hero interaction; it is the one place motion budget is spent generously.
- **Respect `prefers-reduced-motion`:** all of the above collapse to instant state changes, except the drag insertion gap, which stays because it is informational rather than decorative.

---

## Decisions Log

| Date       | Decision                                                     | Rationale                                                                                                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | Design system created                                        | `/design-consultation`, synthesizing Codex and an independent Claude subagent against the approved [`todo-experience` design](initiatives/todo-experience/DESIGN.md).                                                                                                                        |
| 2026-08-13 | Governing idea: the list is arranged, not scored             | Position _is_ priority. Implements "Priority / flag: Out — replace with ordering" from the initiative design's Feature Inventory.                                                                                                                                                            |
| 2026-08-13 | Effort is retrospective-only; no weight or estimate input    | Corrected by the operator mid-session. Both outside design voices independently proposed a per-task weight rail set at capture time; that inverts the model. Energy is inferred from session history by tag and parent list, so it cannot be displayed until `psykl-loop` ships sessions.    |
| 2026-08-13 | The checkbox stays                                           | Two completion paths must sit side by side: tick it for sub-5-minute tasks, run PSYKL loops for long ones. An earlier proposal to delete the checkbox was withdrawn — it assumed every task is session-sized.                                                                                |
| 2026-08-13 | `--ember` reserved exclusively for a live PSYKL session      | Makes a dense list monochrome and therefore calm, and gives the differentiator the only saturated thing in the product. Costs this initiative nearly all of its colour, deliberately.                                                                                                        |
| 2026-08-13 | Warm-paper light is canonical; dark ships as a faithful port | With the accent withdrawn from the list, dark loses the "lit gauge" quality that justified it, and paper suits a phone used in daylight. Dark remains available as the live session's own register.                                                                                          |
| 2026-08-13 | IBM Plex Sans + IBM Plex Mono, self-hosted                   | Free and OFL, unlike Söhne + Berkeley Mono (~$375) proposed by the subagent. Regular width rather than the Condensed proposed by Codex, which trades legibility at 15px for density better bought with row height. Self-hosting is mandatory: a CDN font breaks the offline-first guarantee. |
| 2026-08-13 | No semantic colour palette, no overdue styling               | Implements Premise P2 — a deadline is a fact about a task, not a claim on your attention.                                                                                                                                                                                                    |
