# Design System — PSYKL

Rewritten on 2026-09-21 from the accepted `apple-reminders-ux` experiment, which shipped in `v0.4.1` after four operator review rounds. That prototype — not this document's previous revision — is the baseline the production app is built to. The 2026-08-14 revision was written before any of it was built; where the two disagree, the built and reviewed surface wins.

**Status:** APPROVED — the visual baseline for the [`to-do-ui`](initiatives/to-do-ui/DESIGN.md) initiative and everything after it. No open decisions.
**Scope:** Durable. This document outlives any one initiative and is refreshed, not deleted, at close-out.
**Source of truth for pixels:** this file. It was written from the accepted prototype's visual artifact and screenshots, which were reviewed against a running build at 390px and 1024px in light and dark; those planning artifacts were deleted when the experiment was retired (`to-do-ui` Spec 6), and are recoverable from git history if the evidence is ever needed. The shape those values compose into is drawn in [`docs/features/[20260924]P6_to-do-ui-retire-experiment-and-close-out.md`](features/%5B20260924%5DP6_to-do-ui-retire-experiment-and-close-out.md) → Visual Record.
**Companion:** [`docs/initiatives/todo-experience/UX.md`](initiatives/todo-experience/UX.md) covers screens, behavior, and gestures for the paused `todo-experience` initiative, and has been reconciled with this baseline.

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes. A PSYKL _session_ is one start/stop event against a task. Sessions ship in the `psykl-loop` initiative, not this one.
> - WCAG AA = the Web Content Accessibility Guidelines' AA contrast bar: 4.5:1 for normal text, 3:1 for large text and non-text indicators.
> - UI / UX = User Interface / User Experience.
> - Token = a named design value (`--text-primary`) referenced by components instead of a raw literal (`#1c1c1e`).

---

## Product Context

- **What this is:** An offline-first task manager. Its eventual differentiator is the PSYKL session, which attaches to a task in a later initiative. This one builds the task manager the sessions will attach to.
- **Who it's for:** One person. The operator. Single-user, multi-device, never collaborative ([`docs/PRODUCT.md`](PRODUCT.md) → Sync and Sharing Model).
- **Space:** Personal task management. Primary reference: **Apple Reminders, iOS 18, single-list view.** Secondary: Things 3, TickTick.
- **Project type:** Mobile-first PWA, installed to the home screen, used daily, frequently offline.

---

## The Governing Idea

**Be conventional, and be well-made.**

Unchanged from 2026-08-14, and now demonstrated rather than asserted. The bar is craft parity with Apple Reminders — not a distinct visual identity.

Three consequences:

1. **Do not innovate on interaction.** Where Reminders, Things, and TickTick agree on a pattern, use that pattern. Innovation budget is reserved for the PSYKL session, which is the only thing this product has that they do not.
2. **Craft is the differentiator within the task manager.** Being conventional does not mean being sloppy. The reference apps are pleasant because of pixel-level care: consistent alignment, honest touch targets, motion that explains rather than decorates.
3. **Personality lives in themes, not in the baseline.** The default is quiet and expected.

**First three seconds:** _I know how to use this._

### What the prototype changed about this document

The governing idea survived contact with a real build. The **values** did not. Four rounds of review moved the type scale up, the row height down, the palette onto Apple's system colors, and the capture affordance off the bottom bar entirely. Every table below carries built-and-reviewed numbers, not proposed ones.

---

## Theming Architecture

Themability stays a first-class requirement. This closes the visual half of the "Configurable term-map / UI theme architecture" open design surface tracked in [`docs/PROJECT_STATUS.md`](PROJECT_STATUS.md). (The term-map half — renaming PSYKL / Earth / Moon / HelioArc / Sun — remains open.)

### Two token tiers

**Primitive tokens** hold raw values, defined once per theme per color scheme. Components never reference them.

**Semantic tokens** name a role. Components reference only these. Adding a theme means supplying new primitive values against the same semantic names; no component CSS changes.

```css
/* Semantic contract — every theme MUST define all of these */
--bg-app; /* the list surface                          */
--bg-grouped; /* grouped/inset surfaces, settings rows     */
--bg-elevated; /* menus, popovers, sheets                   */
--bg-pressed; /* press feedback                            */
--bg-selected; /* selected row, active destination          */

--text-primary; /* task titles, headings                     */
--text-secondary; /* metadata, empty states, destination labels */
--text-tertiary; /* placeholders, unchecked checkbox stroke   */
--text-on-accent; /* type and glyphs sitting on --accent       */

--separator; /* row separators and structural hairlines   */

--accent; /* interactive: tint, links, checkbox fill   */
--accent-session; /* RESERVED — a live PSYKL session only      */
--status-warn; /* sync queued / attention, not failure      */
--status-good; /* sync settled                              */
--destructive; /* delete actions, failures, overdue         */
--focus-ring; /* keyboard focus, never --accent alone      */

--font-ui; /* titles, labels, prose                     */
--font-numeric; /* counts, identifiers                       */

--radius-control; /* buttons, inputs, menus                    */
--radius-field; /* the inline title-edit field               */
--icon-tile; /* the destination/action glyph tile         */
--icon-glyph; /* the stroke artwork inside that tile       */
--gutter; /* page gutter                               */
--row-min; /* row floor and touch-target floor          */
--content-max; /* reading-column ceiling                    */
```

**Every token is defined at the theme's root selector.** Media blocks — `prefers-color-scheme`, `prefers-reduced-motion` — may only _redefine_ values or set rules; a token whose sole definition sits inside one is dead everywhere else. This is not a style preference. Five tokens were silently orphaned inside a `prefers-reduced-motion` block during the prototype's first review round, and the 16px gutter, 44px row floor, and 680px desktop column were inert for a full round before measurement caught it.

### Rules that survive theming

A theme may change values. A theme may not change these, because they are correctness, not taste:

- **Every theme ships light and dark**, both designed rather than inverted.
- **`--accent-session` is reserved for a live PSYKL session in every theme.** Never a link, never a button, never a selection state. This is the one rule carried forward wholesale from the retired Ledger system, and it is the reason the differentiator will read as significant when it lands in `psykl-loop`.
- **No theme may remove a state signal.** Completion, pending sync, failure, and focus must each remain distinguishable without relying on hue alone.
- **Row metrics are not themable.** Themes change color and type; layout stays fixed so the density work is not re-litigated per theme.

### Appearance, contrast, and theme

Three distinct, orthogonal choices:

| Choice         | Values                           | Where it lives                                                 |
| -------------- | -------------------------------- | -------------------------------------------------------------- |
| **Appearance** | System · Light · Dark            | Shipped in the prototype. Settings; persisted device-locally.  |
| **Contrast**   | Standard _(default)_ · Increased | New in production (`to-do-ui` Spec 5). Settings; device-local. |
| **Theme**      | Plain _(default)_ · Ledger       | Not built. Plain is the only theme in the app today.           |

`System` stamps nothing and lets `prefers-color-scheme` decide; `Light` and `Dark` stamp `data-theme` on the root and win in both directions. `Increased` stamps `data-contrast="increased"` and composes with all three appearances.

All three are **device-local preferences, never synced** — how you like to look at one device is not a property of your data. They live in the `sync_meta` IndexedDB store, which is never enqueued (`todo-experience/DESIGN.md` → Data-model decisions locked here).

**A theme must define both contrast levels.** Standard is the theme as designed; Increased is the same design with the values that fall below WCAG AA raised until they clear it. A theme that ships only Standard is incomplete.

### Themes

| Theme                 | Character                                                                         | Status                                                       |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Plain** _(default)_ | Conventional and quiet. Platform type, system blue tint, neutral grays.           | Shipped. The only theme in the app.                          |
| **Ledger**            | The retired bespoke identity: warm paper, hairline rules, IBM Plex, ember accent. | Deferred, not deleted. Preserves the 2026-08-13 design work. |

---

## Plain — the default theme

Every value below is taken from the shipped prototype's token sheet, not proposed.

### Typography

`--font-ui` is the platform UI stack, so the app reads as native on each device and needs no font download — which also means no font is missing on a cold offline start.

```css
--font-ui: -apple-system, blinkmacsystemfont, 'SF Pro Text', 'Segoe UI', roboto, sans-serif;
--font-numeric: ui-monospace, sfmono-regular, menlo, monospace;
```

| Token         | Size / line-height | Weight | Tracking | Use                                       |
| ------------- | ------------------ | ------ | -------- | ----------------------------------------- |
| `large-title` | 34 / 41            | 700    | -0.02em  | the list name at the top of the list view |
| `section`     | 22 / 28            | 700    | —        | destination and page headings             |
| `group`       | 20 / 25            | 600    | —        | grouped-list headings (Settings, Lists)   |
| `row`         | 17 / 22            | 400    | -0.01em  | task title — the workhorse                |
| `label`       | 15 / 20            | 500    | —        | buttons, destination labels, form labels  |
| `meta`        | 13 / 18            | 400    | —        | counts, timestamps, secondary detail      |

**17px for the task title, not 16px.** The 2026-08-14 revision specified 16/21 on the reasoning that 16px is "where a title stops feeling like a table cell." Built at 390px against real titles, 17/22 is where it stops; Reminders sits there for the same reason. The 34px list title replaces the previous 28px `title` token outright.

### Color

```css
:root {
  --bg-app: #fff;
  --bg-grouped: #f2f2f7;
  --bg-elevated: #fff;
  --bg-pressed: #d1d1d6;
  --bg-selected: #e5e5ea;

  --text-primary: #000; /* 21.0:1 */
  --text-secondary: #8e8e93; /*  3.3:1 — see the open decision below */
  --text-tertiary: #c7c7cc; /*  1.7:1 — non-text only */
  --text-on-accent: #fff;

  --separator: #c6c6c8;

  --accent: #007aff; /*  3.9:1 on --bg-app */
  --accent-session: #d8410a; /* RESERVED: live PSYKL session only */
  --status-warn: #fc0;
  --status-good: #34c759;
  --destructive: #ff3b30;
  --focus-ring: #007aff;

  --radius-control: 10px;
  --radius-field: 6px;
  --icon-tile: 2.5rem;
  --icon-glyph: 1.25rem;
  --gutter: 1rem;
  --row-min: 44px;
  --content-max: 680px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg-app: #000;
    --bg-grouped: #1c1c1e;
    --bg-elevated: #1c1c1e;
    --bg-pressed: #2c2c2e;
    --bg-selected: #2c2c2e;

    --text-primary: #fff;
    --text-secondary: #98989f;
    --text-tertiary: #48484a;

    --separator: #38383a;

    --accent: #0a84ff;
    --accent-session: #ff6a1f;
    --status-warn: #ffd60a;
    --status-good: #30d158;
    --destructive: #ff453a;
    --focus-ring: #0a84ff;
  }
}

:root[data-theme='dark'] {
  /* same dark primitives — so an explicit Dark choice wins on a light OS */
}
```

This replaces the 2026-08-14 palette wholesale. That palette derived its own blues and grays (`#0a68d8`, `#6b6b70`, `#e5e5e7`); the prototype uses Apple's system colors directly, because "craft parity with Reminders" and "a blue we picked ourselves" are not compatible goals.

`--accent` carries interactive meaning — active destination, links, the completed checkbox fill, glyph tiles.

**`--status-warn` is systemYellow, deliberately.** It reads as caution without shouting the way orange does, and it must never be confused with `--accent-session`, which is the only warm color with reserved meaning.

**Overdue styling is in.** A past due date renders in `--destructive`. Premise P2 refuses _scheduling_ the user's attention, not stating facts. (Due dates are not built yet; this rule is waiting for them.)

### Contrast — Standard and Increased

**Decided 2026-09-21: ship both.** Standard is the prototype exactly as built and accepted; Increased is a second contrast level the user selects in Settings, in which every value below WCAG AA is raised until it clears.

Adopting Apple's system colors imports Apple's contrast behavior, which does not clear WCAG AA. Measured against `--bg-app` in light mode:

| Token              | Used for                                 | Measured  | Bar                       | Verdict                               |
| ------------------ | ---------------------------------------- | --------- | ------------------------- | ------------------------------------- |
| `--text-primary`   | task titles                              | 21.0:1    | 4.5:1                     | passes                                |
| `--text-secondary` | empty states, destination labels, counts | **3.3:1** | 4.5:1                     | **fails AA for normal text**          |
| `--text-tertiary`  | unchecked checkbox stroke                | **1.7:1** | 3:1                       | **fails AA for a non-text indicator** |
| `--accent`         | tint, links, checkbox fill               | 3.9:1     | 4.5:1 text · 3:1 non-text | passes as non-text; fails as text     |

The 2026-08-14 revision required every theme to clear AA for `--text-primary` and `--text-secondary`. The shipped prototype does not, and neither does Apple Reminders — a genuine conflict between "be conventional" and "clear AA," not an oversight in the build. Rather than resolve it by picking a side, the app lets the user pick.

**Increased Contrast is a small override, not a second palette.** Measuring every token showed only four need to move; the rest already clear their bar.

```css
:root[data-theme='light'][data-contrast='increased'] {
  --text-secondary: #6d6d72; /* 5.1:1  was 3.3:1 */
  --text-tertiary: #8e8e93; /* 3.3:1  was 1.7:1 — non-text bar is 3:1 */
  --accent: #0069e0; /* 5.1:1  was 3.9:1 — clears AA as link text */
}

@media (prefers-color-scheme: light) {
  :root[data-contrast='increased']:not([data-theme='dark']) {
    --text-secondary: #6d6d72;
    --text-tertiary: #8e8e93;
    --accent: #0069e0;
  }
}

@media (prefers-color-scheme: dark) {
  :root[data-contrast='increased']:not([data-theme='light']) {
    --text-tertiary: #6e6e73; /* 4.1:1  was 2.3:1 */
  }
}

:root[data-theme='dark'][data-contrast='increased'] {
  --text-tertiary: #6e6e73;
}
```

Dark mode needs only one override: `--text-secondary` already measures 7.3:1 there and `--accent` 5.8:1, both clearing AA without help. Light mode carries the other three. **`--text-primary`, `--destructive`, and the status colors are unchanged at both levels.**

Two rules follow, and they are correctness rather than taste:

- **Standard stays the default**, because it is what was designed, built, and accepted across four review rounds.
- **Increased may only raise contrast.** It is not a second design surface and not a place to revisit hues. If a future change makes Standard clear AA on its own, the corresponding override is deleted, not repurposed.

`--contrast` composes with appearance, not with theme selection: a theme supplies both levels (see Appearance, contrast, and theme above).

### Spacing and metrics

4px base unit. **16px page gutter** (`--gutter: 1rem`).

| Element                  | Metric                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| Task row, one-line title | **44px min** (`--row-min`)                                                     |
| Task row, wrapped title  | grows; **never truncates**                                                     |
| Title vertical padding   | 11px top and bottom                                                            |
| Checkbox                 | 22px circle, 1.5px stroke, in a 44px hit target                                |
| Checkbox column          | 36px, matching the title inset                                                 |
| Pending-sync dot         | 8px, in a column mirroring the header's trailing controls                      |
| Inline title-edit field  | `--radius-field` (6px)                                                         |
| Glyph tile               | 2.5rem circle, 1.25rem stroke artwork inside, 1.9px stroke                     |
| Capture affordance       | floating circular button, trailing bottom corner, clear of the safe-area inset |
| Content column           | **680px max** on desktop                                                       |

Five metrics decisions, each settled by building and measuring rather than by argument:

1. **Titles wrap and never truncate.** The 2026-08-14 revision capped titles at two lines then truncated. Built, the cap cut real titles where the meaning was, for no layout benefit — the list is vertical and has room. Reminders does not truncate either.
2. **The row floor is 44px, not 48px.** 48px was proposed to buy comfort; at 17px type with 11px padding the row already clears 44px, and the extra 4px only cost rows on screen.
3. **The checkbox column is 36px, not 44px.** 36px matches Reminders' title inset. A 44px column reaches back into the page gutter; the 44px hit target is achieved by expanding the target, not the column.
4. **Wrapped titles align the checkbox and pending dot to the first line**, not the block center. A two-line title otherwise floats its checkbox to the middle of the row, which reads as a misalignment bug.
5. **The content column is 680px, not 720px.** Measured at 1024px beside the persistent sidebar; 720px left the list reading as stretched.

**Separators:** row separators are a `--separator` hairline **inset to the title's leading edge**. A single full-bleed separator sits under the list title. The 2026-08-14 `--separator-strong` token is retired — one separator color proved sufficient, and a second invited the spreadsheet look the inset rule exists to prevent.

**Ordering:** open tasks first in their existing order, completed tasks below them in completion order. Completed rows stay visible unless the user hides them; hiding is a per-list device-local preference.

### Motion

- **Approach:** functional. Motion explains a state change or it does not happen.
- **Easing:** enter `ease-out` · exit `ease-in` · move `ease-in-out`
- **Durations:** press 100ms · checkbox fill + strike 200ms · row settle to its new position 250ms · chevron rotate 150ms · sheet in/out 300ms
- **`prefers-reduced-motion`:** everything collapses to instant state changes. The reduced-motion block contains **motion rules only** — never a token definition.

### Accessibility

- Touch targets ≥44px, including the checkbox's expanded hit area.
- `--focus-ring` renders as a visible ring on every interactive element. Keyboard focus is never invisible.
- Tab order runs sync control → checkbox → title → next row. Space or Return toggles a focused checkbox; Escape leaves an in-progress capture row.
- Completion, pending sync, and failure each carry a non-color signal in addition to color — strike-through and fill for completion, a dot for pending, a count for failure.
- **Drag-to-reorder, when it lands, requires a keyboard equivalent** — a focused row moves with a modifier plus arrow keys, announced via an ARIA live region. Pointer-only reorder is inaccessible.
- The contrast exception above is **resolved**: Standard ships as designed and Increased raises every failing token to WCAG AA, as a device-local Settings choice. See Contrast — Standard and Increased.

---

## Chrome and Navigation

New in this revision — the 2026-08-14 document specified no chrome, which the prototype's review rounds identified as the largest gap.

### List view, top to bottom

- **A header row** carrying the drawer toggle on the leading edge and the sync control on the trailing edge, both as glyph tiles. The header glyph sits at the same position whether the drawer is open or closed.
- **The list title** in `large-title`, followed by a full-bleed separator. Reminders' scroll-collapse of the title into the nav bar is **not** adopted.
- **The task list**, inset separators between rows.
- **A floating circular capture button** in the trailing bottom corner, clear of the safe-area inset. It opens a capture row in place; **there is no bottom-anchored capture bar.** The 2026-08-14 revision and the prototype's own first wireframe both specified a 56px bottom bar; review replaced it with the floating affordance, and the floating affordance is what shipped.

### The drawer

- Slides over the content on phone widths and is persistent at desktop widths.
- Carries destinations — the lists, plus Sync, Recently Deleted, and Settings — each with a glyph tile and a `label`.
- Lists collapse and expand under a chevron; Recently Deleted sits inside the Lists section.
- The active destination takes `--bg-selected`.
- **It replaces the list-switcher sheet** described in `todo-experience/UX.md` § 2.

### Glyphs

One tile size for every destination and action glyph — `--icon-tile`, a filled circle in `--accent`, with `--icon-glyph` stroke artwork in `--text-on-accent` at 1.9px, round caps and joins. Utility destinations (Recently Deleted, Settings) take `--text-secondary` as their tile fill instead of the tint, so the lists read as the primary destinations.

### Sync

Sync status is **chrome, not an interruption**: a single control in the header, backed by a Sync destination listing what is queued, what failed, and where another device replaced a local edit. The nag threshold (25 unsynced changes) and hard write ceiling (100) are unchanged behavior; only their presentation moved. Per-row pending state is an 8px dot in a column that hangs directly under the header's sync control, so the relationship reads without a legend.

**A failed task load stays silent while the device has tasks to show.** Offline-first means the local list is the truth, and the sync control already carries the signal.

---

## Ledger — the deferred theme

The design system written on 2026-08-13, preserved as a theme rather than deleted. Warm paper (`#F4F2ED`) over white, IBM Plex Sans and Plex Mono self-hosted, hairline rules, ember accent, near-total absence of color.

It supplies its own primitive values against the same semantic contract, including `--font-ui: 'IBM Plex Sans'` and `--font-numeric: 'IBM Plex Mono'`, both self-hosted and precached — a CDN font would render in fallback on a cold offline start, which is the exact scenario this product exists for. Its `--radius-control` is `2px`.

Full primitive values and their rationale live in the 2026-08-13 revision of this file, recoverable at commit `e8c0ef6`. They are restated in the theme's own token file if and when the theming layer is built. **Nothing schedules that work.**

---

## Anti-patterns, permanently banned

Purple or violet gradients. Glassmorphism. Confetti, streaks, points, badges, levels, or any completion celebration. Motivational copy. Gradient buttons. Three-column icon grids on any screen in this app. Multi-color tag pills. Any use of `--accent-session` outside a live PSYKL session.

Added by this revision, from what the build and its reviews found:

- **Inline `style={{…}}` objects and raw hex literals in components.** Every value comes from a token. See [`docs/STYLE.md`](STYLE.md) → Styling.
- **Token definitions inside a media block.** They are dead outside it.
- **A transient toast as the only record of a durable fact.** A stale write, a sync failure, or a refused write belongs somewhere the user can go back and look at.

Note what left this list in the 2026-08-14 rewrite and stays gone: cards, drop shadows, rounded corners, and platform font stacks are all permitted.

---

## Decisions Log

| Date       | Decision                                                                 | Rationale                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | Design system created as the bespoke "Ledger" identity                   | `/design-consultation`. Superseded 2026-08-14; recoverable at commit `e8c0ef6`.                                                                                                                                                                                                                                                          |
| 2026-08-14 | **Conventional-first baseline replaces the bespoke identity**            | An interactive prototype of the Ledger direction read as rigid and engineering-focused in real use. Innovation budget moves to `psykl-loop`.                                                                                                                                                                                             |
| 2026-08-14 | **Two-tier token architecture; themes are first-class**                  | Components reference semantic tokens only. Adding a theme supplies primitives and changes no component CSS. **Still holds.**                                                                                                                                                                                                             |
| 2026-08-14 | **Ledger demoted to a selectable theme, not deleted**                    | The token structure and designed dark theme were correct work regardless of direction. **Still holds**, now explicitly unscheduled.                                                                                                                                                                                                      |
| 2026-08-14 | **Theme choice is device-local, not synced**                             | A theme describes how you want to look at one device, not your data. **Still holds**, and now also governs appearance.                                                                                                                                                                                                                   |
| 2026-08-14 | **`--accent-session` stays reserved across every theme**                 | The only rule carried wholesale from the Ledger system. **Still holds.**                                                                                                                                                                                                                                                                 |
| 2026-08-14 | **Platform font stack in the default theme**                             | Reads as native and removes ~50KB of precached font from the app shell. **Still holds.**                                                                                                                                                                                                                                                 |
| 2026-08-14 | **Overdue styling is in**                                                | Premise P2 refuses _scheduling_ attention, not stating facts. **Still holds**; due dates are not built yet.                                                                                                                                                                                                                              |
| 2026-09-21 | **The shipped `apple-reminders-ux` prototype is the visual baseline**    | Four operator review rounds against a running build at 390px and 1024px, light and dark. Proposed values that were never built do not outrank reviewed ones.                                                                                                                                                                             |
| 2026-09-21 | **Apple system colors replace the derived palette**                      | `#007aff` / `#0a84ff` tint, `#8e8e93` secondary, `#c6c6c8` separator. "Craft parity with Reminders" and "a blue we picked ourselves" are not compatible goals. Imports an AA exception — see the open decision.                                                                                                                          |
| 2026-09-21 | **Task title is 17/22, the list title 34/41**                            | Built at 390px against real titles. 16px still read as a table cell; 17px is where Reminders sits, for the same reason.                                                                                                                                                                                                                  |
| 2026-09-21 | **Titles wrap and never truncate; the two-line cap is dropped**          | The cap cut real titles where the meaning was, for no layout benefit. The list is vertical and has room.                                                                                                                                                                                                                                 |
| 2026-09-21 | **Row floor 44px, checkbox column 36px, content column 680px**           | Measured, not argued. 48px cost rows on screen; a 44px column reached into the gutter; 720px read as stretched at 1024px.                                                                                                                                                                                                                |
| 2026-09-21 | **Wrapped rows align the checkbox and pending dot to the first line**    | Center alignment on a two-line title reads as a misalignment bug.                                                                                                                                                                                                                                                                        |
| 2026-09-21 | **Capture is a floating trailing-corner button, not a bottom bar**       | Both the 2026-08-14 revision and the prototype's first wireframe specified a 56px bottom bar; review replaced it, and the floating affordance is what shipped and was accepted.                                                                                                                                                          |
| 2026-09-21 | **A drawer with glyph destinations replaces the list-switcher sheet**    | The sheet was a modal detour for the app's most common navigation. The drawer also gives Sync, Recently Deleted, and Settings a home.                                                                                                                                                                                                    |
| 2026-09-21 | **`--separator-strong` retired; one separator color**                    | A second weight invited the spreadsheet look the inset rule exists to prevent.                                                                                                                                                                                                                                                           |
| 2026-09-21 | **`--status-warn` / `--status-good` added for sync state**               | Sync is chrome with three legible states. systemYellow reads as caution without competing with `--accent-session`.                                                                                                                                                                                                                       |
| 2026-09-21 | **Every token is defined at the theme root; media blocks only redefine** | Five tokens were orphaned inside a `prefers-reduced-motion` block during review round 1 and were inert for a full round. Correctness, not style.                                                                                                                                                                                         |
| 2026-09-21 | **Appearance (System/Light/Dark) is distinct from theme (Plain/Ledger)** | Orthogonal choices. Appearance shipped; theme is deferred with nothing scheduling it.                                                                                                                                                                                                                                                    |
| 2026-09-21 | **Contrast ships as a user choice: Standard (default) and Increased**    | `--text-secondary` at 3.3:1 and `--text-tertiary` at 1.7:1 fail WCAG AA, as Apple's own values do. Rather than choose between "be conventional" and "clear AA," the app lets the user choose. Increased is a four-token override, not a second palette; Standard stays the default because it is what was designed, built, and accepted. |
| 2026-09-21 | **A theme must define both contrast levels**                             | Otherwise adding a theme silently removes the accessible option. Increased may only raise contrast — never revisit hues.                                                                                                                                                                                                                 |
