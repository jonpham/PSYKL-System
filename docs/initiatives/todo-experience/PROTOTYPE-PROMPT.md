# Prototype Prompt — paste this into Claude, ChatGPT, v0, or Stitch

Written by `/design-consultation` (gstack) on 2026-08-13.
Sources: [`docs/DESIGN.md`](../../DESIGN.md) (visual system) and [`UX.md`](UX.md) (behavior). If those change, change this.
`deleted_at_spec_closeout: true` — this is scaffolding. Once a direction is chosen and built in Storybook, delete it.

---

## How to use this

The block below is self-contained. Copy everything between the `---8<---` markers into a fresh conversation. No edits needed.

**Recommended: [claude.ai](https://claude.ai) with artifacts.** It is the only option that gives you a _working_ prototype — real scroll, real drag, the sheet actually opening. Density and calm can only be judged by scrolling, and no image generator can show you that. Iterate conversationally: "tighter rows", "show me 80 tasks", "now dark", "make the mono column heavier".

**Second opinion: ChatGPT with canvas.** Same brief, different model. If both produce something you like, the brief is good; if they diverge wildly, the brief is underspecified — which is itself useful feedback on `DESIGN.md`.

**Also free:** [v0.dev](https://v0.dev) (best at dense list UI, closest to shippable React), [Google Stitch](https://stitch.withgoogle.com) (designed-looking mockups, exports to Figma), [Google AI Studio](https://aistudio.google.com) Build mode (no subscription needed), [Figma](https://figma.com) free tier if you would rather push pixels by hand.

**Skip Perplexity for this.** It is the weakest of the three at design fidelity. Use it for competitor research instead.

**Fonts:** the prompt loads IBM Plex from a CDN because that is convenient in a prototype. The shipped PWA must self-host and precache Plex — a CDN font renders in fallback when the app is opened offline, which is the exact scenario the product exists for.

**What to judge, in order:** Does a 40-row list feel calm or noisy? Is 44px too tight to hit reliably with a thumb? Does the right-aligned mono column actually read as a column? Does completing a task feel like a release or like nothing happened? Does the near-total absence of colour read as considered or as unfinished?

---8<--- COPY FROM HERE ---8<---

Build an interactive HTML prototype of a mobile-first task list app called PSYKL. Single self-contained file. Vanilla HTML/CSS/JS or React, your call — but it must actually run and scroll.

## What the app is

An offline-first personal task manager for one person. Its differentiator, not built yet, is a "PSYKL session": a fixed period of focused work started against a task. Tasks accumulate sessions over their life.

The product refuses clock-time scheduling. No notifications, no alarms, no "work on this at 3pm", no repeat rules, no overdue styling. A due date is a _fact_ about a task; a schedule is a claim on the user's attention, and the app never makes one.

## The governing idea

**The list is arranged, not scored.** Nothing in the interface tells the user a task matters. They told it, by putting it where it is. Position in the list IS the priority. There is no priority field, no flag, no star, no urgency colour, no algorithmic sorting.

So drag-to-reorder is the hero interaction, not a feature on a list. Everything is judged by whether it stays legible and calm when 40 rows are stacked and being rearranged.

The app never asks how big or heavy a task is. Effort is measured retrospectively from session history, which does not exist yet, so there is NO effort or weight indicator anywhere in this prototype.

## The feeling

Roughly three parts "effortful, engaging, drives productivity" to one part "calm, at your own pace".

Do NOT buy calm by removing information. The category treats calm and dense as opposites and that is wrong — a well-set page of a book is dense and calm, a slot machine is sparse and frantic. Calm comes from regularity and restraint of contrast, not from volume of whitespace.

Effort lives in: density, monospaced precision, small confident type, strict 4px alignment, and a complete absence of encouragement. A tool that assumes the user is competent.
Calm lives in: one hue, one weight, one rule colour, nothing competing for attention.

First three seconds should read as: _this is my arrangement, exactly as I left it._

## Aesthetic

A ruled ledger, not an app surface. Industrial and utilitarian with editorial typographic discipline. Flush edges, hairline rules, full-bleed rows.

Banned outright: cards, drop shadows, elevation, rounded containers, gradients (especially purple), glassmorphism, texture, illustration, icons in coloured circles, pill shapes, centered layouts, confetti or any completion celebration, badges, streaks, points, progress rings.

## Typography

IBM Plex Sans for titles, labels, and prose. IBM Plex Mono for EVERY numeral, date, tag, and count.

Load from a CDN for this prototype.

| Use                  | Spec                                           |
| -------------------- | ---------------------------------------------- |
| Task title           | Plex Sans 400, 15px / 20px                     |
| Notes, prose         | Plex Sans 400, 15px / 24px                     |
| Section header       | Plex Sans 600, 13px / 16px, +0.08em, UPPERCASE |
| List name            | Plex Sans 600, 24px / 28px, −0.02em            |
| Form labels, buttons | Plex Sans 500, 13px / 16px                     |
| Tags, counts         | Plex Mono 500, 11px / 16px, +0.06em, UPPERCASE |
| Due dates            | Plex Mono 500, 12px / 16px                     |

Bold is scarce on purpose. Weight 600 appears ONLY on section headers and the list name, so nothing else can shout in a peripheral scan.

Every number lives in a right-aligned tabular mono column that aligns vertically down the entire list. This is the single strongest density device in the design — get it right.

## Colour

Light theme is canonical. Ship a dark theme too via `prefers-color-scheme`, plus a manual toggle so both can be compared.

```css
/* Light — canonical */
--ground: #f4f2ed; /* warm paper. NEVER #FFFFFF */
--raised: #eae7e0; /* sheets, quick-add rail */
--pressed: #e4e0d7; /* press + drag-lift */
--rule: #d2cec5; /* row separators */
--rule-strong: #b9b4a9; /* section separators */
--ink-primary: #191a1a;
--ink-secondary: #63665f;
--ink-tertiary: #6c6f68; /* completed rows, placeholders */
--ember: #d8410a; /* RESERVED — see below */
--ash: #9e3323; /* destructive only */
--focus: #2e3a3f; /* focus ring, deliberately not ember */

/* Dark */
--ground: #0e0f0f;
--raised: #161818;
--pressed: #1e2120;
--rule: #26292a;
--rule-strong: #3a3e3f;
--ink-primary: #e8e6e1;
--ink-secondary: #8e918f;
--ink-tertiary: #7a7d7b;
--ember: #ff6a1f;
--ash: #b33a2b;
--focus: #9fb4bc;
```

**CRITICAL — the accent is reserved.** `--ember` means "a PSYKL session is live" and nothing else. It is never a link, never a button, never a selection state, never a focus ring, never a tag. Because sessions do not exist in this prototype, **ember appears exactly zero times.** The prototype is monochrome. That is intentional, not an omission — it is what lets 40 rows read as calm, and it means starting a session will later be the first coloured thing the user ever sees.

Buttons are ink on hairline. Selection is a ground shift. Completion is a subtraction.

There is no success green, no warning amber, no info blue. No overdue styling — no red rows, no "3 days late", no escalation as a date approaches. A date passing is not a moral event; the date sits in the metadata column being true.

## Spacing and metrics

4px base unit. Everything is a multiple, no exceptions. 16px page gutter. Rows bleed full width; the rule between them bleeds too. Border radius 2px on inputs and sheets, 0 everywhere else.

| Element                 | Height |
| ----------------------- | ------ |
| Task, single line       | 44px   |
| Task with metadata line | 60px   |
| Task, completed         | 40px   |
| Section header          | 32px   |
| Quick-add rail          | 52px   |

Single column, capped at 720px on desktop.

## Row anatomy

Leading edge: a checkbox, 24px inside a 44px touch area. It stays — short tasks get ticked, long tasks get sessions.

Then the title: single line, truncated with an ellipsis, NEVER wrapping. A wrapping title destroys the scan rhythm.

Optional second line when there is metadata: a `▤` note indicator, then tags in mono uppercase, then the due date right-aligned in mono.

Trailing edge: nothing. No chevron, no play button, no overflow menu. The row is not a call to action.

Completed: title strikes through, drops to `--ink-tertiary`, row collapses 44px → 40px, metadata line drops.

## Interactions to build

- Tap checkbox → toggle complete. Row compacts over 140ms. No celebration, no bounce, no sound.
- Tap row body → task detail sheet slides up (240ms) with title as an editable input, notes, due date, tags. Leave the primary button position **empty with a comment marking it reserved for "Start PSYKL"**.
- Swipe right on a row → complete.
- Swipe left on a row → reveal Delete in `--ash`, requiring confirmation.
- Long-press a row → a `⠿` grip fades in at the trailing edge in `--ink-tertiary`, the row takes `--pressed` ground and lifts (180ms), and dragging opens an insertion gap other rows animate around (200ms settle). **Do not skip this — it is the hero interaction.**
- Tap a section header → collapse/expand, keeping the count visible in mono.
- Bottom-anchored quick-add rail that never scrolls away. Enter commits and keeps focus for the next capture.

Motion is minimal-functional: it explains a state change or it does not happen. Respect `prefers-reduced-motion`.

## Content — use this, not lorem ipsum

List name: **Build**. Two more lists in the switcher: **Errands**, **Someday**.

**Generate at least 40 tasks across 3 sections.** This is not optional. The entire thesis is that density stays calm at scale, and 8 pretty rows tells me nothing. Roughly a third should carry a metadata line, roughly six should be completed, and the rest plain. Mix short titles and long ones that truncate.

Sections: `ACTIVE`, `WAITING`, `BACKLOG`.

Sample tasks, extend in this register — real work, mundane and specific, no motivational filler:

```
Rewrite the sync queue dispatch by entity type    ▤ INFRA           Aug 22
Draft the migration plan for existing queued ops                    Aug 20
Decide fractional index representation             DEEP
Call the dentist                                                    Aug 14
Reply to the k3s ingress thread                    OPS
Read the LexoRank paper properly                   DEEP READING
Renew the domain                                                    Sep 01
Figure out why the second device drops the last patch  ▤ BUG
Buy coffee
Write the section representation ADR               ▤ DEEP
```

## Deliverable

One self-contained file. It must scroll, drag, complete, and open the sheet for real. Include a light/dark toggle in the header.

Do not add a Today view, a dashboard, a settings screen, a sidebar, a search bar, an onboarding flow, an empty-state illustration, or a stats panel. None of those exist in this product.

---8<--- COPY TO HERE ---8<---

## Follow-up prompts worth having ready

- `Show me 120 tasks instead of 40. Does it still feel calm?`
- `Rows are too tight. Take them to 48px and show me both side by side.`
- `Try it with the metadata column left-aligned instead, so I can see why right-aligned is better.`
- `Now dark theme. Does the near-total absence of colour still read as considered?`
- `Add the live-session screen using --ember, so I can see what the first coloured thing in the product looks like.`
- `Make the drag interaction slower and more physical. I want to feel the arrangement.`

## Bringing a result back

Once a direction feels right, the useful thing to carry back is: which row height won, whether the mono column earned its place, what the drag felt like, and anything in [`UX.md`](UX.md) § 10 Open Questions that the prototype answered. That is the input to `/plan-design-review`.
