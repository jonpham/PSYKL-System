# Visual Artifact — Bulk edit and list deletion UX fixes

Form C — state storyboard. Four surfaces, each as it is today and as it becomes.

## 1. Selection bar — completion action

| Pool              | Today                                          | After                                                 |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------- |
| All incomplete    | "Mark selected tasks complete" — completes all | "Toggle completion of selected tasks" — completes all |
| All complete      | **No-op**: every task is filtered out          | Un-completes all                                      |
| Mixed             | Completes the incomplete ones, skips the rest  | **Inverts each row independently**                    |
| Empty / in flight | Dimmed, disabled                               | Unchanged                                             |

The glyph is unchanged — the existing ring-and-filled-disc. Only the label and the semantics move.

## 2. Selection bar — delete, armed

```text
today                            after
┌──────────────────────────┐     ┌──────────────────────────┐
│   ( ● )   ( ⇥ )  ███████ │     │   ( ● )   ( ⇥ )  ((🗑))   │
└──────────────────────────┘     └──────────────────────────┘
  solid --destructive fill,        transparent; 2px inset
  glyph inverted to                --destructive ring around
  --text-on-accent                 the icon, glyph stays red
```

The open-lid glyph and the disarm rules from #126 are unchanged; only the fill becomes a ring.

## 3. Delete List — modal replaces the second press

```text
today                                 after
┌────────────────────────┐            ┌────────────────────────┐
│ Hide Completed         │            │ Hide Completed         │
│ Select Items           │            │ Select Items           │
│ Delete List?           │ ← 2nd      │ Delete List            │ ← one press,
└────────────────────────┘   press    └────────────────────────┘   sheet closes
  red text, `?` is the                       ↓
  only cue; tasks silently      ┌─────────────────────────────────┐
  re-homed, unannounced         │ Delete "Groceries"?             │
                                │ It still holds 4 items.         │
                                ├─────────────────────────────────┤
                                │ Delete With Items        (red)  │
                                │ Delete Just the List     (red)  │
                                │ Cancel                          │
                                └─────────────────────────────────┘
```

An empty list skips the modal's item language: the heading stands alone and only **Delete List** / **Cancel** are offered, because the two outcomes are identical with nothing inside.

## 4. Recently Deleted — what each row was

```text
today                              after
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ Groceries      30d [Restore] │   │ 📁 Groceries                 │
│ Milk           30d [Restore] │   │    list · 4 items 30d [Restore]│
│ Eggs           30d [Restore] │   ├──────────────────────────────┤
│ Weekly review  29d [Restore] │   │ ☑ Milk                       │
└──────────────────────────────┘   │    task          30d [Restore]│
  a list and its cascaded items    ├──────────────────────────────┤
  are indistinguishable rows       │ ☑ Eggs      task 30d [Restore]│
                                   ├──────────────────────────────┤
                                   │ ☑ Weekly review              │
                                   │    task          29d [Restore]│
                                   └──────────────────────────────┘
                                     every row says what it was; the
                                     list row restores as a unit
```

Restoring the list row brings the list and the four tasks deleted with it back together — the count on the row is what that press will return. The cascaded tasks keep their own rows too: restoring one alone brings back just that task, into the default list while its own list is still deleted.

## Notes

- Both destructive controls stay red at rest — the issue's alternative (neutral until armed) was considered and declined.
- The armed ring is inset so nothing reflows when the state changes, and must not shrink the 44px hit target.
- The modal follows `MoveToListDrawer`'s dialog pattern: `role="dialog"`, `aria-modal`, focus moved on open, Escape cancels.
- Cancel is last and unstyled; neither destructive option is the default focus target.
