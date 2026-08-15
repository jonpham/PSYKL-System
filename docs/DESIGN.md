# Design System — PSYKL

Rewritten during `/plan-design-review` (gstack) on 2026-08-14, replacing the bespoke "Ledger" visual identity written by `/design-consultation` on 2026-08-13. The prototype built during that review showed the Ledger direction reading as rigid and engineering-focused; the operator re-scoped the initiative toward conventional task-manager craft with a themable surface. The Ledger survives as one selectable theme.

**Status:** Proposed — input to `/plan-eng-review`, which locks the theming architecture alongside the data model.
**Scope:** Durable. This document outlives the `todo-experience` initiative and is refreshed, not deleted, at initiative close-out.
**Companion:** [`docs/initiatives/todo-experience/UX.md`](initiatives/todo-experience/UX.md) covers screens, behavior, and gestures. This file covers the visual system and theming only.

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes. A PSYKL _session_ is one start/stop event against a task. Sessions ship in the `psykl-loop` initiative, not this one.
> - OFL = SIL Open Font License.
> - WCAG AA = the Web Content Accessibility Guidelines' AA contrast bar: 4.5:1 for normal text, 3:1 for large text and non-text indicators.
> - UI / UX = User Interface / User Experience.
> - Token = a named design value (`--text-primary`) referenced by components instead of a raw literal (`#1a1a1a`).

---

## Product Context

- **What this is:** An offline-first task manager. Its eventual differentiator is the PSYKL session, which attaches to a task in the next initiative. This initiative builds the task manager the sessions will attach to.
- **Who it's for:** One person. The operator. Single-user, multi-device, never collaborative ([`docs/PRODUCT.md`](PRODUCT.md) → Sync and Sharing Model).
- **Space:** Personal task management. Reference apps: Apple Reminders, Things 3, TickTick.
- **Project type:** Mobile-first PWA, installed to the home screen, used daily, frequently offline.

---

## The Governing Idea

**Be conventional, and be well-made.**

The bar for this initiative is craft parity with Apple Reminders, Things 3, and TickTick — not a distinct visual identity. Those three apps have converged on a set of conventions because the conventions work: a circular checkbox on the leading edge, a title that wraps rather than truncates, a subdued metadata line, swipe actions, a bottom-anchored capture field, and a detail sheet. PSYKL adopts them.

This is a deliberate reversal. The previous version of this document argued for a bespoke industrial identity that "refused to soften," and derived a dense ruled-ledger surface from first principles. Building it revealed the cost: the design was distinctive and unpleasant to use, and every planning pass spent its budget relitigating the philosophy instead of the product.

Three consequences:

1. **Do not innovate on interaction.** Where Reminders, Things, and TickTick agree on a pattern, use that pattern. Innovation budget is reserved for the PSYKL session, which is the only thing this product has that they do not.
2. **Craft is the differentiator within this initiative.** Being conventional does not mean being sloppy. The three reference apps are pleasant because of pixel-level care: consistent alignment, honest touch targets, motion that explains rather than decorates. That is what to match.
3. **Personality lives in themes, not in the baseline.** The opinionated aesthetic is not deleted — it is demoted to a theme the operator can select. The default is quiet and expected.

**First three seconds:** _I know how to use this._

---

## Theming Architecture

Themability is a first-class requirement, not a later enhancement. This closes the "Configurable term-map / UI theme architecture" open design surface tracked in [`docs/PROJECT_STATUS.md`](PROJECT_STATUS.md), for the visual half. (The term-map half — renaming PSYKL / Earth / Moon / HelioArc / Sun — remains open and is not part of this initiative.)

### Two token tiers

**Primitive tokens** hold raw values and are defined once per theme per color scheme. Components never reference them.

**Semantic tokens** name a role. Components reference only these. Adding a theme means supplying a new set of primitive values and mapping them to the same semantic names; no component CSS changes.

```css
/* Semantic contract — every theme MUST define all of these */
--bg-app; /* the list surface                        */
--bg-surface; /* sheets, the capture field              */
--bg-elevated; /* menus, popovers                        */
--bg-pressed; /* press feedback, drag lift              */
--bg-selected; /* selected row, active list              */

--text-primary; /* task titles, headings                  */
--text-secondary; /* metadata, section headers              */
--text-tertiary; /* placeholders, completed titles         */
--text-on-accent; /* type sitting on --accent               */

--separator; /* row separators, hairlines              */
--separator-strong; /* section and structural separators      */

--accent; /* interactive: links, selection, toggles */
--accent-session; /* RESERVED — a live PSYKL session only   */
--destructive; /* delete actions and error states        */
--focus-ring; /* keyboard focus, never --accent alone   */

--font-ui; /* titles, labels, prose                  */
--font-numeric; /* dates, counts, identifiers             */
--radius-control; /* inputs, buttons                        */
--radius-surface; /* sheets, cards if a theme uses them     */
```

### Rules that survive theming

A theme may change values. A theme may not change these, because they are correctness, not taste:

- **Every theme ships light and dark**, both designed rather than inverted, and both clearing WCAG AA for `--text-primary` and `--text-secondary`.
- **`--accent-session` is reserved for a live PSYKL session in every theme.** It is never a link, never a button, never a selection state. This is the one rule carried forward wholesale from the Ledger system, and it is the reason the differentiator will read as significant when it lands in `psykl-loop`.
- **No theme may remove a state signal.** Completion, overdue-ness, pending sync, and focus must each remain distinguishable without relying on hue alone.
- **Row metrics are not themable** in this initiative. Themes change color and type; layout stays fixed so the density work is not re-litigated per theme.

### Themes shipped

| Theme                 | Character                                                                         | Status                                            |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Plain** _(default)_ | Conventional and quiet. Native-feeling type, blue accent, neutral grays.          | Default on first run.                             |
| **Ledger**            | The retired bespoke identity: warm paper, hairline rules, IBM Plex, ember accent. | Selectable. Preserves the 2026-08-13 design work. |

Theme selection is a device-local preference, **not synced**. A theme is a property of how you like to look at this device, not of your data. `/plan-eng-review` confirms this against the sync model.

---

## Plain — the default theme

### Typography

`--font-ui` is the platform UI stack, so the app reads as native on each device and needs no font download — which also means no font is missing on a cold offline start.

```css
--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-numeric: ui-monospace, SFMono-Regular, Menlo, monospace;
```

This reverses the previous system's ban on platform font stacks. That ban existed to serve a bespoke identity; with the identity retired, the platform stack is the correct conventional choice and it removes ~50KB of precached font from the app shell.

| Token     | Size / line-height | Weight | Use                                                     |
| --------- | ------------------ | ------ | ------------------------------------------------------- |
| `title`   | 28 / 34            | 700    | list name                                               |
| `section` | 15 / 20            | 600    | section header within a list                            |
| `row`     | 16 / 21            | 400    | task title — the workhorse                              |
| `body`    | 16 / 24            | 400    | notes, detail sheet prose                               |
| `label`   | 15 / 20            | 500    | buttons, form labels                                    |
| `meta`    | 13 / 18            | 400    | due dates, tags, counts (`--font-numeric` for numerals) |

16px for the task title, not 15px. The previous 15px was chosen to buy density; the reference apps all sit at 16–17px, and 16px is where a title stops feeling like a table cell.

### Color

```css
:root {
  --bg-app: #ffffff;
  --bg-surface: #f7f7f8;
  --bg-elevated: #ffffff;
  --bg-pressed: #ececee;
  --bg-selected: #e8f0fe;

  --text-primary: #1c1c1e; /* 16.1:1 */
  --text-secondary: #6b6b70; /*  5.3:1 */
  --text-tertiary: #9a9aa0; /*  3.0:1 — non-text and completed only */
  --text-on-accent: #ffffff;

  --separator: #e5e5e7;
  --separator-strong: #c9c9cd;

  --accent: #0a68d8; /*  5.1:1 on --bg-app */
  --accent-session: #d8410a; /* RESERVED: live PSYKL session only */
  --destructive: #c0392b;
  --focus-ring: #0a68d8;

  --radius-control: 8px;
  --radius-surface: 12px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-app: #000000;
    --bg-surface: #1c1c1e;
    --bg-elevated: #2c2c2e;
    --bg-pressed: #2c2c2e;
    --bg-selected: #10305c;

    --text-primary: #f2f2f7; /* 18.4:1 */
    --text-secondary: #9b9ba1; /*  6.1:1 */
    --text-tertiary: #6e6e73;
    --text-on-accent: #ffffff;

    --separator: #2c2c2e;
    --separator-strong: #48484a;

    --accent: #4a9eff; /*  7.2:1 on --bg-app */
    --accent-session: #ff6a1f;
    --destructive: #ff5f52;
    --focus-ring: #4a9eff;
  }
}
```

`--accent` carries interactive meaning — selected list, links, the completed checkbox fill, toggle states. This is the conventional expectation and reverses the Ledger rule that withheld all color from chrome.

**Overdue styling is in.** A past due date renders in `--destructive`. The previous system forbade this on the grounds that "a date passing is not a moral event"; the reference apps all do it, users expect it, and premise P2 is about not _scheduling_ the user's attention, not about hiding facts.

### Spacing and metrics

4px base unit. 16px page gutter.

| Element                      | Metric                       |
| ---------------------------- | ---------------------------- |
| Task row, one-line title     | 48px min                     |
| Task row, wrapped title      | grows; 2-line title cap      |
| Task row, with metadata line | + 20px                       |
| Section header               | 44px, 24px space above       |
| Capture field                | 56px, bottom-anchored        |
| Checkbox                     | 22px circle, 44px hit target |
| Content column               | 720px max on desktop         |

**Four metrics decisions carried over from the 2026-08-13 prototype**, each validated by looking at 44 real tasks on a phone rather than by argument:

1. **Titles wrap to two lines, then truncate.** Single-line truncation cut more than half of real task titles at phone width, and cut them where the meaning was. This matches all three reference apps.
2. **The due date always sits on the title line**, right-aligned, regardless of whether tags or a note indicator are present. Letting it drop to the metadata line made the date column alternate between two vertical offsets, which destroyed the column it was supposed to form.
3. **The checkbox is a light circle**, `1px` in `--text-tertiary` unchecked, filled `--accent` when checked. A heavy 24px square out-shouted every title on screen, worst in dark mode.
4. **Sections separate with space above, not with heavier type.** At 40 rows the boundary between sections did not register when it was carried by weight and rules alone.

Rows are separated by a `--separator` hairline **inset to the title's left edge**, not full-bleed — full-bleed ruling on every row is what made the previous design read as a spreadsheet.

### Motion

- **Approach:** functional. Motion explains a state change or it does not happen.
- **Easing:** enter `ease-out` · exit `ease-in` · move `ease-in-out`
- **Durations:** press 100ms · completion 200ms · row reorder settle 200ms · sheet in/out 300ms · swipe snap 200ms
- **Reorder is the one place motion is spent generously.** The lifted row takes `--bg-pressed`, and an insertion gap opens that other rows animate around.
- **Respect `prefers-reduced-motion`:** everything collapses to instant state changes except the drag insertion gap, which is informational.

### Accessibility

- Touch targets ≥44px, including the checkbox's expanded hit area.
- `--focus-ring` renders as a 2px visible ring on every interactive element. Keyboard focus is never invisible.
- **Drag-to-reorder has a keyboard equivalent** — a focused row moves with a modifier plus arrow keys, and the move is announced via an ARIA live region. A pointer-only reorder is inaccessible, and reorder is the interaction this product cares most about.
- Completion, overdue, and pending-sync states each carry a non-color signal in addition to color.

---

## Ledger — the alternate theme

The design system written on 2026-08-13, preserved as a theme rather than deleted. Warm paper (`#F4F2ED`) over white, IBM Plex Sans and Plex Mono self-hosted, hairline rules, ember accent, near-total absence of color.

It supplies its own primitive values against the same semantic contract, including `--font-ui: 'IBM Plex Sans'` and `--font-numeric: 'IBM Plex Mono'`, both self-hosted and precached — a CDN font would render in fallback on a cold offline start, which is the exact scenario this product exists for. Its `--radius-control` and `--radius-surface` are `2px`.

Full primitive values and the rationale behind them live in the 2026-08-13 revision of this file, recoverable at commit `e8c0ef6`. They are restated in the theme's own token file when the theming layer is built.

---

## Anti-patterns, permanently banned

Purple or violet gradients. Glassmorphism. Confetti, streaks, points, badges, levels, or any completion celebration. Motivational copy. Gradient buttons. Three-column icon grids on any screen in this app. Multi-color tag pills. Any use of `--accent-session` outside a live PSYKL session.

Note what left this list in the rewrite: cards, drop shadows, rounded corners, and platform font stacks are all permitted now. They were banned to serve an identity that no longer applies.

---

## Decisions Log

| Date       | Decision                                                                    | Rationale                                                                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | Design system created as the bespoke "Ledger" identity                      | `/design-consultation`, synthesizing Codex and an independent Claude subagent. Superseded 2026-08-14; recoverable at commit `e8c0ef6`.                                                                                                |
| 2026-08-14 | **Conventional-first baseline replaces the bespoke identity**               | An interactive prototype of the Ledger direction read as rigid and engineering-focused in real use. The operator re-scoped toward craft parity with Apple Reminders, Things 3, and TickTick. Innovation budget moves to `psykl-loop`. |
| 2026-08-14 | **Two-tier token architecture; themes are first-class**                     | Components reference semantic tokens only. Adding a theme supplies primitives and changes no component CSS. Closes the visual half of the theme-architecture open design surface.                                                     |
| 2026-08-14 | **Ledger demoted to a selectable theme, not deleted**                       | The token structure, computed contrast ratios, and designed dark theme were correct work regardless of direction. Keeping it proves the theming layer works against a genuinely different aesthetic rather than two shades of gray.   |
| 2026-08-14 | **Theme choice is device-local, not synced**                                | A theme describes how you want to look at one device, not your data. Confirmed against the sync model at `/plan-eng-review`.                                                                                                          |
| 2026-08-14 | **`--accent-session` stays reserved across every theme**                    | The only rule carried wholesale from the Ledger system. It is what makes the differentiator read as significant when `psykl-loop` lands.                                                                                              |
| 2026-08-14 | **Platform font stack in the default theme; the `system-ui` ban is lifted** | The ban existed to protect a bespoke identity. The platform stack is the conventional choice, reads as native, and removes ~50KB of precached font from the app shell. Self-hosted Plex remains mandatory within the Ledger theme.    |
| 2026-08-14 | **Overdue styling is in; the no-overdue-color rule is reversed**            | Premise P2 refuses _scheduling_ the user's attention, not stating facts. All three reference apps color a past due date and users expect it.                                                                                          |
| 2026-08-14 | **Titles wrap to two lines; the due date always sits on the title line**    | Both validated against 44 real tasks in the prototype. Single-line truncation cut over half of real titles; a date that moved between lines destroyed the column it was meant to form.                                                |
| 2026-08-14 | **Row rules are inset, not full-bleed; sections separate with space**       | Full-bleed ruling on every row is what made the previous design read as a spreadsheet. Section boundaries did not register at 40 rows when carried by type weight alone.                                                              |
