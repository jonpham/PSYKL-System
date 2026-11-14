# Visual Artifact — The default list cannot be deleted

> Production workflow, `online-offline-modes` Spec 2, DevTask 5 (Decision 16). It is carried into the Spec 2 feature doc's `## Visual Record` at close-out.

## Form B — Low-fidelity wireframes

**The "Tasks" default list → List options.** There is no Delete List item. Nothing replaces it: no disabled item and no explanation. The menu simply holds fewer actions, as it already does when only one list exists.

```text
┌ Tasks ───────────────── ⟳  ⋯ ┐
│ ○ buy stamps                  │
│ ○ call the dentist            │      ┌──────────────────────┐
│                               │      │ Show Completed (2)   │
│                               │      │ Select Items         │
│                               │      └──────────────────────┘
└───────────────────────────────┘
```

**Any other list → List options.** Nothing changes: Delete List is still offered and still opens the existing delete question.

```text
┌ Groceries ───────────── ⟳  ⋯ ┐
│ ○ oat milk                    │      ┌──────────────────────┐
│                               │      │ Show Completed (0)   │
│                               │      │ Select Items         │
│                               │      │ Delete List          │  ← red, as today
└───────────────────────────────┘      └──────────────────────┘
```

## Notes

- **Which list is "Tasks".** The rule follows the list's fixed id (`DEFAULT_LIST_ID`), not its title. A renamed default list still cannot be deleted, and a user-made list titled "Tasks" can.
- **Online path.** With Offline Mode off, the online path offers no Delete List on any list until Spec 3 implements it.
