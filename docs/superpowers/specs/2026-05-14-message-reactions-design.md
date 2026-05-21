# Message Reactions — Design Spec

**Date:** 2026-05-14
**Feature:** Message Reactions (👍 ❤️ 😂)
**Time-box:** 45 minutes
**Context:** Part of a long-term Discord rebuild targeting 10k+ simultaneous users per channel. Each feature is implemented with scalability as a first-class concern; current infrastructure is kept simple but scalability gaps are tracked in a prioritized TODO.

---

## Overview

Users can react to any message with one or more of three fixed emojis: 👍 ❤️ 😂. Each emoji button is always visible under every message with a count (starting at 0). Clicking an emoji toggles the user's reaction on or off. Active reactions (those the current user has added) are visually distinguished. Reaction state syncs in real time across all connected clients via WebSocket.

---

## Data Model

**New NeDB collection:** `server/data/reactions.db`
**New model:** `server/models/reaction.js`

Each document represents one user's reaction to one message with one emoji:

```js
{
  _id:       string,   // auto-generated
  messageId: string,   // → Message._id
  userId:    string,   // → User._id
  emoji:     string,   // one of: "👍", "❤️", "😂"
  createdAt: number    // Date.now()
}
```

The triple `(messageId, userId, emoji)` is a unique constraint enforced at the application layer — no duplicate document can exist for the same combination.

**Enriched message shape sent to clients:**

Before any broadcast or initial fetch, reactions are joined onto messages server-side. Clients always receive:

```js
{
  _id, userId, channelId, content, createdAt,
  reactions: {
    "👍": ["userId1", "userId3"],
    "❤️": ["userId2"],
    "😂": []
  }
}
```

All three emoji keys are always present with at least an empty array. Clients never need to handle a missing key.

**Scalability note:** Embedding reactions as a map inside Message documents was explicitly rejected. A normalized collection supports independent indexing, per-user/per-emoji queries, and a clean migration path to PostgreSQL or Cassandra at scale.

---

## API

**One new endpoint:**

```
POST /channels/:channelId/messages/:messageId/reactions
Body:   { emoji: "👍" | "❤️" | "😂" }
Auth:   session required
```

**Toggle logic:**
1. Validate `emoji` is one of the three allowed values → `400` if not
2. Verify session is active → `401` if not
3. Verify message exists → `404` if not
4. Look up existing reaction for `(messageId, userId, emoji)`
5. If found → delete it (remove reaction)
6. If not found → insert it (add reaction)
7. Broadcast enriched message list via `UPDATE_ALL_MESSAGES`
8. Return `204 No Content`

---

## Server Model — `server/models/reaction.js`

Four static methods following the existing model pattern:

```js
Reaction.findOne(messageId, userId, emoji)   // lookup for toggle
Reaction.create({ messageId, userId, emoji }) // insert new reaction
Reaction.delete(id)                           // remove by _id
Reaction.getByMessageIds(ids)                 // bulk fetch for join
```

---

## Shared Helper — `server/util/joinReactions.js`

```js
// joinReactions(messages, reactions) → messages with reactions map attached
```

Called in both the `FETCH_ALL_MESSAGES` socket handler and after every reaction toggle. Ensures the enriched shape is consistent across all code paths. The three emoji keys are always initialized to `[]` before populating.

---

## WebSocket Events

No new events. Reactions piggyback on the existing `UPDATE_ALL_MESSAGES` event.

**Change to `FETCH_ALL_MESSAGES` handler:** calls `joinReactions()` before emitting so the initial sync includes reaction state.

**Reaction toggle flow:**
```
POST .../reactions
  → toggle in reactions DB
  → fetch all messages
  → joinReactions(messages, reactions)
  → emit UPDATE_ALL_MESSAGES (enriched) to all sockets
  → all clients update Zustand messages store
  → ReactionBar re-renders with updated counts + active state
```

The client-side Zustand messages store requires no structural changes.

**Scalability note (TODO priority 1):** Replace `UPDATE_ALL_MESSAGES` with a targeted `UPDATE_MESSAGE` event carrying only the changed message. At 10k users, the current broadcast sends megabytes of data on every reaction click.

---

## Frontend

### New component: `src/components/ReactionBar.jsx`

```js
// Props
{ channelId, messageId, reactions, activeUserId }
// reactions: { "👍": [...userIds], "❤️": [...], "😂": [...] }
```

- Renders three buttons in fixed order: 👍 ❤️ 😂
- Each button shows emoji + count
- If `activeUserId` is in that emoji's array, button renders with active CSS class
- On click: calls `toggleReaction(channelId, messageId, emoji)` action
- No optimistic update — UI reflects WebSocket response only

### New style: `src/components/ReactionBar.module.css`

Two button states: default and active (highlighted).

### New action: added to `src/actions.js`

```js
toggleReaction(channelId, messageId, emoji)
// POST .../reactions — no return value needed
```

### Integration point

`MessageViewer.jsx` renders `<ReactionBar>` below each message's content. The `reactions` field is already present on the enriched message object — no additional data fetching required.

**Scalability note (TODO):** Wrap `ReactionBar` in `React.memo` and ensure stable prop references to prevent all reaction bars re-rendering when any single message changes.

---

## Error Handling

**Server:**
- Invalid emoji → `400 Bad Request`: `"Invalid emoji"`
- No session → `401 Unauthorized`
- Message not found → `404 Not Found`
- DB errors → Express error handler (existing pattern)

**Client:**
- A failed toggle produces no `UPDATE_ALL_MESSAGES` broadcast; UI stays in current state
- No user-facing error display at this scope

---

## Testing

### Infrastructure

| Tool | Purpose |
|------|---------|
| Vitest | Unit tests — server models + React components (replaces Jest) |
| Storybook | UI component isolation + visual integration testing |
| Playwright | E2E scaffold + smoke test; full suite is future work |

### Vitest — server unit tests (`server/models/reaction.test.js`)

- `create()` inserts a reaction document with correct fields
- `findOne()` retrieves by `(messageId, userId, emoji)`
- `delete()` removes the document
- `getByMessageIds()` returns all reactions for a set of message IDs
- Toggle round-trip: create then delete leaves no document

Migrate existing `user.test.js` from Jest to Vitest (API-compatible, config change only).

### Vitest — component unit tests (`src/components/ReactionBar.test.jsx`)

- Renders all three emoji buttons with correct counts
- Applies active CSS class when `activeUserId` is in a reaction's user array
- Fires `toggleReaction` on button click
- Uses `@testing-library/react`

### Storybook stories (`src/components/ReactionBar.stories.jsx`)

| Story | State |
|-------|-------|
| `Default` | All counts 0, no active reactions |
| `WithReactions` | Mixed counts, none from active user |
| `UserReacted` | Active user reacted to all three — all highlighted |
| `SingleActive` | Active user reacted only to ❤️ — center button highlighted |

### Playwright (`e2e/reactions.spec.js`)

Smoke test: user logs in → selects channel → clicks 👍 on a message → count increments to 1.

Full multi-user real-time sync tests are flagged in SCALABILITY.md as the next E2E milestone.

### TDD order during implementation

1. Write Vitest server model tests → implement `reaction.js`
2. Write Vitest component tests → implement `ReactionBar.jsx`
3. Write Storybook stories → visual verify all states
4. Write Playwright smoke test → verify full end-to-end flow

---

## Scalability TODO (Prioritized)

Tracked in `SCALABILITY.md` at the project root.

| Priority | Item |
|----------|------|
| 1 | Replace `UPDATE_ALL_MESSAGES` with targeted `UPDATE_MESSAGE` event |
| 2 | Add DB indexes on `messageId`, `userId`, `emoji` in the reactions collection |
| 3 | Move online status from in-memory array to Redis |
| 4 | Add Socket.io Redis adapter for horizontal scaling |
| 5 | Paginate message history (cursor-based, scope joins to active window) |
| 6 | Migrate from NeDB to PostgreSQL or MongoDB |
| 7 | Expand Playwright to multi-tab real-time sync tests |
| 8 | Memoize `ReactionBar` with stable prop references |
| 9 | Add API-level integration tests and WebSocket event tests |
| 10 | Add rate limiting on the reactions toggle endpoint |
