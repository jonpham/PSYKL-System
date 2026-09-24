# Visual Artifact — Task Item Details Drawer

> `target = production`, Standard Lane. Form B — low-fidelity wireframes. Carried into the feature doc's `## Visual Record` at close-out.

## 1. Today — row focused for editing (before)

```text
┌──────────────────────────────────────┐
│ ‹ Lists              Groceries   ⋯   │
├──────────────────────────────────────┤
│ ○  Buy oat milk                      │
│ ○  [ Call the vet______________ ]    │  ← row swaps to an input; no way
│ ◉  Renew passport                    │     to see times or delete just this
├──────────────────────────────────────┤
│ (+)                                  │
└──────────────────────────────────────┘
```

## 2. After — focused row gains the (i) affordance

```text
┌──────────────────────────────────────┐
│ ‹ Lists              Groceries   ⋯   │
├──────────────────────────────────────┤
│ ○  Buy oat milk                      │
│ ○  [ Call the vet____________ ]  (i) │  ← trailing slot, same x-position
│ ◉  Renew passport                    │     as the ≡ handle in selection mode
├──────────────────────────────────────┤
│ (+)                                  │
└──────────────────────────────────────┘
```

## 3. Task Item Drawer — mobile (sheet from the bottom)

```text
┌──────────────────────────────────────┐
│ ○  Buy oat milk           (dimmed)   │
├──────────────────────────────────────┤
│  ✕          Task            ✓        │  ← ✓ disabled until the title changes
├──────────────────────────────────────┤
│  [ Call the vet__________________ ]  │
├──────────────────────────────────────┤
│  Completed        —                  │
│  Last updated     23 Sep 2026, 14:02 │
│  Created          21 Sep 2026, 09:47 │
├──────────────────────────────────────┤
│              Delete                  │  ← centred, destructive colour
└──────────────────────────────────────┘
```

## 4. Desktop (shell ≥ 768px) — same drawer, centred modal

```text
┌──────────────────────────────────────────────────────┐
│  Sidebar   │   Groceries                             │
│            │ ┌────────────────────────────────────┐  │
│            │ │  ✕         Task          ✓         │  │
│            │ ├────────────────────────────────────┤  │
│            │ │  [ Call the vet _______________ ]  │  │
│            │ │  Completed / Last updated / Created│  │
│            │ │              Delete                │  │
│            │ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Notes

- **Timestamp empty state:** a task that is not complete shows `—` for Completed, never a blank row.
- **Close vs confirm semantics match `MoveToListDrawer`:** ✕ discards and closes; ✓ commits and closes; Escape behaves as ✕.
- **`MoveToListDrawer` changes too** — wireframe 4 applies to it unchanged, so both drawers share one desktop presentation.
- Delete closes the drawer immediately and soft-deletes optimistically; the task lands in Recently Deleted like any other deletion.
