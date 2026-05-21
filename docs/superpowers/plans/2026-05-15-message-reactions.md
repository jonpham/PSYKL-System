# Message Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time emoji reaction system (👍 ❤️ 😂) to messages, backed by a normalized NeDB reactions collection, with Vitest unit tests, Storybook stories, and a Playwright smoke test.

**Architecture:** A separate `reactions` NeDB collection stores one document per `(messageId, userId, emoji)` triple. Before every `UPDATE_ALL_MESSAGES` broadcast, the server joins reactions onto messages via a `joinReactions` helper, so clients always receive an enriched message shape with a `reactions` map. A single toggle endpoint adds or removes the reaction for the session user and then rebroadcasts.

**Tech Stack:** NeDB (@seald-io/nedb), Express 5, Socket.io 4, React 19, Zustand 5, Vitest, @testing-library/react, Storybook, Playwright

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `server/models/reaction.js` | Reaction CRUD — findOne, create, delete, getByMessageIds |
| Create | `server/models/reaction.test.js` | Vitest server unit tests for Reaction model |
| Create | `server/util/joinReactions.js` | Join reactions array onto messages array |
| Create | `server/util/joinReactions.test.js` | Vitest unit tests for joinReactions |
| Modify | `server/index.js` | Add toggle endpoint; update fetchAndEmitMessagesTo to join reactions |
| Create | `src/components/ReactionBar.jsx` | Renders 👍 ❤️ 😂 buttons with counts + active state |
| Create | `src/components/ReactionBar.module.css` | Default and active button styles |
| Create | `src/components/ReactionBar.test.jsx` | Vitest + @testing-library/react component tests |
| Create | `src/components/ReactionBar.stories.jsx` | Storybook stories — Default, WithReactions, UserReacted, SingleActive |
| Modify | `src/components/MessageViewer.jsx` | Pass reactions prop to Message; render ReactionBar |
| Modify | `src/actions.js` | Add toggleReaction action |
| Create | `src/setupTests.js` | Import @testing-library/jest-dom for client tests |
| Create | `vitest.config.server.mjs` | Vitest config for Node/CommonJS server tests |
| Create | `vitest.config.client.mjs` | Vitest config for jsdom React component tests |
| Modify | `package.json` | Add devDependencies; add test:server, test:client, test:e2e, storybook scripts |
| Create | `playwright.config.js` | Playwright config pointing at localhost:3456 |
| Create | `e2e/reactions.spec.js` | Playwright smoke test: toggle a reaction, verify count increments |

---

## Task 1: Install dependencies and configure Vitest

**Files:**
- Create: `vitest.config.server.mjs`
- Create: `vitest.config.client.mjs`
- Create: `src/setupTests.js`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest and React testing deps**

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create server Vitest config**

Create `vitest.config.server.mjs`:
```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.js'],
  },
})
```

- [ ] **Step 3: Create client Vitest config**

Create `vitest.config.client.mjs`:
```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/setupTests.js'],
  },
})
```

- [ ] **Step 4: Create setupTests.js**

Create `src/setupTests.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Update package.json scripts and remove Jest**

In `package.json`, replace the `"test"` script and add new ones, and move `jest` out of devDependencies (add vitest):

```json
"scripts": {
  "start": "npm-run-all --parallel server client",
  "client": "cross-env PORT=3456 react-scripts start",
  "server": "cross-env DEBUG=socket.io* nodemon ./server/index.js --watch server",
  "build": "react-scripts build",
  "test": "vitest run --config vitest.config.server.mjs",
  "test:client": "vitest run --config vitest.config.client.mjs",
  "test:all": "npm-run-all test test:client",
  "test:e2e": "playwright test",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "eject": "react-scripts eject",
  "prettier": "prettier --write .",
  "docker-build": "docker build -t discord .",
  "docker-run": "docker run -p 3456:3456 -p 8000:8000 -v $(pwd):/app -v /app/node_modules -it discord"
}
```

Remove `"jest": "^27.5.1"` from `devDependencies`.

- [ ] **Step 6: Verify existing user.test.js passes under Vitest**

```bash
npm test
```

Expected output: `✓ server/models/user.test.js > User > save > should save user successfully`

- [ ] **Step 7: Commit**

```bash
git add vitest.config.server.mjs vitest.config.client.mjs src/setupTests.js package.json package-lock.json
git commit -m "chore: install Vitest, testing-library; replace Jest"
```

---

## Task 2: Configure Storybook

**Files:**
- Auto-generated by Storybook init: `.storybook/main.js`, `.storybook/preview.js`

- [ ] **Step 1: Run Storybook init**

```bash
npx storybook@latest init
```

When prompted, accept all defaults. This auto-detects react-scripts and configures webpack builder.

- [ ] **Step 2: Verify Storybook starts**

```bash
npm run storybook
```

Expected: Browser opens at `http://localhost:6006` with default stories. Press Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add .storybook package.json package-lock.json
git commit -m "chore: add Storybook"
```

---

## Task 3: Configure Playwright

**Files:**
- Create: `playwright.config.js`
- Create: `e2e/.gitkeep`

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**

Create `playwright.config.js`:
```js
const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3456',
  },
  webServer: [
    {
      command: 'npm run server',
      port: 8000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run client',
      port: 3456,
      reuseExistingServer: true,
    },
  ],
})
```

- [ ] **Step 3: Create e2e directory**

```bash
mkdir -p e2e && touch e2e/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.js e2e/.gitkeep package.json package-lock.json
git commit -m "chore: add Playwright with chromium"
```

---

## Task 4: Reaction model — TDD

**Files:**
- Create: `server/models/reaction.js`
- Create: `server/models/reaction.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/models/reaction.test.js`:
```js
const Reaction = require('./reaction')

describe('Reaction', () => {
  describe('create', () => {
    test('inserts a reaction with correct fields', async () => {
      const reaction = await Reaction.create({ messageId: 'msg1', userId: 'user1', emoji: '👍' })
      expect(reaction.messageId).toBe('msg1')
      expect(reaction.userId).toBe('user1')
      expect(reaction.emoji).toBe('👍')
      expect(reaction.id).toBeDefined()
      expect(reaction.createdAt).toBeDefined()
    })
  })

  describe('findOne', () => {
    test('retrieves by messageId, userId, emoji', async () => {
      await Reaction.create({ messageId: 'msg2', userId: 'user2', emoji: '❤️' })
      const found = await Reaction.findOne('msg2', 'user2', '❤️')
      expect(found).toBeDefined()
      expect(found.messageId).toBe('msg2')
    })

    test('returns null when not found', async () => {
      const found = await Reaction.findOne('nonexistent', 'nobody', '👍')
      expect(found).toBeNull()
    })
  })

  describe('delete', () => {
    test('removes the document so findOne returns null', async () => {
      const reaction = await Reaction.create({ messageId: 'msg3', userId: 'user3', emoji: '😂' })
      await Reaction.delete(reaction.id)
      const found = await Reaction.findOne('msg3', 'user3', '😂')
      expect(found).toBeNull()
    })
  })

  describe('getByMessageIds', () => {
    test('returns all reactions for a set of message IDs', async () => {
      await Reaction.create({ messageId: 'msg4', userId: 'user4', emoji: '👍' })
      await Reaction.create({ messageId: 'msg4', userId: 'user5', emoji: '❤️' })
      await Reaction.create({ messageId: 'msg5', userId: 'user4', emoji: '😂' })
      const reactions = await Reaction.getByMessageIds(['msg4', 'msg5'])
      const ids = reactions.map(r => r.messageId)
      expect(ids).toContain('msg4')
      expect(ids).toContain('msg5')
    })

    test('returns empty array for unknown message IDs', async () => {
      const reactions = await Reaction.getByMessageIds(['unknown'])
      expect(reactions).toEqual([])
    })
  })

  describe('toggle round-trip', () => {
    test('create then delete leaves no document', async () => {
      const reaction = await Reaction.create({ messageId: 'msg6', userId: 'user6', emoji: '👍' })
      await Reaction.delete(reaction.id)
      const found = await Reaction.findOne('msg6', 'user6', '👍')
      expect(found).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL with `Cannot find module './reaction'`

- [ ] **Step 3: Implement the Reaction model**

Create `server/models/reaction.js`:
```js
const path = require('path')
const Datastore = require('../lib/datastore')

const db = new Datastore({
  filename: path.join(__dirname, '../data/reactions.db'),
})

const VALID_EMOJIS = ['👍', '❤️', '😂']

class Reaction {
  constructor(rawReaction) {
    const { _id: id, messageId, userId, emoji, createdAt } = rawReaction
    this.id = id
    this.messageId = messageId
    this.userId = userId
    this.emoji = emoji
    this.createdAt = createdAt == null ? Date.now() : createdAt
  }

  static findOne(messageId, userId, emoji) {
    return db.findOne({ messageId, userId, emoji }).then(raw => (raw ? new Reaction(raw) : null))
  }

  static create({ messageId, userId, emoji }) {
    return db
      .insert({ messageId, userId, emoji, createdAt: Date.now() })
      .then(raw => new Reaction(raw))
  }

  static delete(id) {
    return db.remove({ _id: id }, {})
  }

  static getByMessageIds(messageIds) {
    return db
      .find({ messageId: { $in: messageIds } })
      .then(raws => raws.map(raw => new Reaction(raw)))
  }
}

Reaction.VALID_EMOJIS = VALID_EMOJIS

module.exports = Reaction
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: All 6 Reaction tests pass alongside the existing User test.

- [ ] **Step 5: Commit**

```bash
git add server/models/reaction.js server/models/reaction.test.js
git commit -m "feat: add Reaction model with TDD"
```

---

## Task 5: joinReactions utility — TDD

**Files:**
- Create: `server/util/joinReactions.js`
- Create: `server/util/joinReactions.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/util/joinReactions.test.js`:
```js
const joinReactions = require('./joinReactions')

const messages = [
  { id: 'msg1', content: 'hello' },
  { id: 'msg2', content: 'world' },
]

describe('joinReactions', () => {
  test('attaches userId arrays to each emoji key', () => {
    const reactions = [
      { messageId: 'msg1', userId: 'user1', emoji: '👍' },
      { messageId: 'msg1', userId: 'user2', emoji: '👍' },
      { messageId: 'msg1', userId: 'user1', emoji: '❤️' },
    ]
    const result = joinReactions(messages, reactions)
    expect(result[0].reactions['👍']).toEqual(['user1', 'user2'])
    expect(result[0].reactions['❤️']).toEqual(['user1'])
    expect(result[0].reactions['😂']).toEqual([])
  })

  test('all three emoji keys are always present', () => {
    const result = joinReactions(messages, [])
    result.forEach(msg => {
      expect(msg.reactions).toHaveProperty('👍')
      expect(msg.reactions).toHaveProperty('❤️')
      expect(msg.reactions).toHaveProperty('😂')
    })
  })

  test('messages with no reactions get empty arrays for all emojis', () => {
    const result = joinReactions(messages, [])
    expect(result[0].reactions['👍']).toEqual([])
    expect(result[1].reactions['😂']).toEqual([])
  })

  test('reactions for one message do not bleed into another', () => {
    const reactions = [{ messageId: 'msg1', userId: 'user1', emoji: '👍' }]
    const result = joinReactions(messages, reactions)
    expect(result[1].reactions['👍']).toEqual([])
  })

  test('preserves all original message fields', () => {
    const result = joinReactions(messages, [])
    expect(result[0].id).toBe('msg1')
    expect(result[0].content).toBe('hello')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL with `Cannot find module './joinReactions'`

- [ ] **Step 3: Implement joinReactions**

Create `server/util/joinReactions.js`:
```js
const VALID_EMOJIS = ['👍', '❤️', '😂']

function joinReactions(messages, reactions) {
  const byMessageId = reactions.reduce((acc, r) => {
    if (!acc[r.messageId]) acc[r.messageId] = []
    acc[r.messageId].push(r)
    return acc
  }, {})

  return messages.map(msg => {
    const empty = Object.fromEntries(VALID_EMOJIS.map(e => [e, []]))
    const msgReactions = byMessageId[msg.id] || []
    msgReactions.forEach(r => {
      if (empty[r.emoji]) empty[r.emoji].push(r.userId)
    })
    return { ...msg, reactions: empty }
  })
}

module.exports = joinReactions
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: All joinReactions tests and previous tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/util/joinReactions.js server/util/joinReactions.test.js
git commit -m "feat: add joinReactions utility with TDD"
```

---

## Task 6: Update server to enrich messages with reactions

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add Reaction import and update fetchAndEmitMessagesTo**

In `server/index.js`, add the two new requires after the existing requires at the top:
```js
const Reaction = require('./models/reaction')
const joinReactions = require('./util/joinReactions')
```

Then replace the existing `fetchAndEmitMessagesTo` function with:
```js
const fetchAndEmitMessagesTo = async (socket) => {
  const messages = await Message.getAll()
  const reactions = await Reaction.getByMessageIds(messages.map(m => m.id))
  const enriched = joinReactions(messages, reactions)
  socket.emit(constants.serverEvents.UPDATE_ALL_MESSAGES, enriched)
}
```

- [ ] **Step 2: Add the reaction toggle endpoint**

Add this block after the existing `app.patch(...)` endpoint (before the `socketServer.sockets.on` block):
```js
app.post('/channels/:channelId/messages/:messageId/reactions', async (req, res) => {
  const { userId } = req.session
  const { messageId } = req.params
  const { emoji } = req.body

  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  if (!Reaction.VALID_EMOJIS.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' })

  const message = await Message.getById(messageId)
  if (!message) return res.status(404).json({ error: 'Message not found' })

  const existing = await Reaction.findOne(messageId, userId, emoji)
  if (existing) {
    await Reaction.delete(existing.id)
  } else {
    await Reaction.create({ messageId, userId, emoji })
  }

  await broadcastMessages()
  res.status(204).send()
})
```

- [ ] **Step 3: Manually verify the server starts without errors**

```bash
npm run server
```

Expected: `listening on *:8000` with no crash. Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: enrich messages with reactions; add toggle endpoint"
```

---

## Task 7: toggleReaction client action

**Files:**
- Modify: `src/actions.js`

- [ ] **Step 1: Add toggleReaction to actions.js**

At the bottom of `src/actions.js`, add:
```js
export const toggleReaction = async (channelId, messageId, emoji) => {
  await axios.post(getRoute(`/channels/${channelId}/messages/${messageId}/reactions`), { emoji })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions.js
git commit -m "feat: add toggleReaction client action"
```

---

## Task 8: ReactionBar component — TDD

**Files:**
- Create: `src/components/ReactionBar.jsx`
- Create: `src/components/ReactionBar.module.css`
- Create: `src/components/ReactionBar.test.jsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/ReactionBar.test.jsx`:
```jsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ReactionBar from './ReactionBar'
import * as actions from '../actions'

const defaultProps = {
  channelId: 'ch1',
  messageId: 'msg1',
  reactions: { '👍': [], '❤️': [], '😂': [] },
  activeUserId: 'user1',
}

describe('ReactionBar', () => {
  test('renders all three emoji buttons', () => {
    render(<ReactionBar {...defaultProps} />)
    expect(screen.getByText(/👍/)).toBeInTheDocument()
    expect(screen.getByText(/❤️/)).toBeInTheDocument()
    expect(screen.getByText(/😂/)).toBeInTheDocument()
  })

  test('shows count 0 when reactions array is empty', () => {
    render(<ReactionBar {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn.textContent).toMatch(/0/))
  })

  test('shows correct count when reactions exist', () => {
    const props = {
      ...defaultProps,
      reactions: { '👍': ['user2', 'user3'], '❤️': [], '😂': [] },
    }
    render(<ReactionBar {...props} />)
    expect(screen.getByText(/👍.*2|2.*👍/)).toBeInTheDocument()
  })

  test('applies active class only to emojis the active user has reacted with', () => {
    const props = {
      ...defaultProps,
      reactions: { '👍': ['user1'], '❤️': [], '😂': [] },
    }
    const { container } = render(<ReactionBar {...props} />)
    const activeButtons = container.querySelectorAll('[class*="active"]')
    expect(activeButtons).toHaveLength(1)
    expect(activeButtons[0].textContent).toMatch(/👍/)
  })

  test('calls toggleReaction with channelId, messageId, emoji on click', () => {
    const spy = vi.spyOn(actions, 'toggleReaction').mockResolvedValue(undefined)
    render(<ReactionBar {...defaultProps} />)
    fireEvent.click(screen.getByText(/👍/))
    expect(spy).toHaveBeenCalledWith('ch1', 'msg1', '👍')
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:client
```

Expected: FAIL with `Cannot find module './ReactionBar'`

- [ ] **Step 3: Implement ReactionBar.jsx**

Create `src/components/ReactionBar.jsx`:
```jsx
import React from 'react'
import { toggleReaction } from '../actions'
import styles from './ReactionBar.module.css'

const EMOJIS = ['👍', '❤️', '😂']

function ReactionBar({ channelId, messageId, reactions = { '👍': [], '❤️': [], '😂': [] }, activeUserId }) {
  return (
    <div className={styles.reactionBar}>
      {EMOJIS.map(emoji => {
        const users = reactions[emoji] || []
        const isActive = users.includes(activeUserId)
        return (
          <button
            key={emoji}
            className={`${styles.reactionButton}${isActive ? ` ${styles.active}` : ''}`}
            onClick={() => toggleReaction(channelId, messageId, emoji)}
          >
            {emoji} {users.length}
          </button>
        )
      })}
    </div>
  )
}

export default ReactionBar
```

- [ ] **Step 4: Create ReactionBar.module.css**

Create `src/components/ReactionBar.module.css`:
```css
.reactionBar {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.reactionButton {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #dcddde;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 8px;
}

.reactionButton:hover {
  background: rgba(255, 255, 255, 0.1);
}

.reactionButton.active {
  background: rgba(88, 101, 242, 0.3);
  border-color: #5865f2;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm run test:client
```

Expected: All 5 ReactionBar tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ReactionBar.jsx src/components/ReactionBar.module.css src/components/ReactionBar.test.jsx
git commit -m "feat: add ReactionBar component with TDD"
```

---

## Task 9: ReactionBar Storybook stories

**Files:**
- Create: `src/components/ReactionBar.stories.jsx`

- [ ] **Step 1: Write the stories**

Create `src/components/ReactionBar.stories.jsx`:
```jsx
import React from 'react'
import ReactionBar from './ReactionBar'

export default {
  title: 'Components/ReactionBar',
  component: ReactionBar,
  args: {
    channelId: 'ch1',
    messageId: 'msg1',
    activeUserId: 'user1',
  },
}

export const Default = {
  args: {
    reactions: { '👍': [], '❤️': [], '😂': [] },
  },
}

export const WithReactions = {
  args: {
    reactions: { '👍': ['user2', 'user3'], '❤️': ['user2'], '😂': [] },
  },
}

export const UserReacted = {
  args: {
    reactions: { '👍': ['user1', 'user2'], '❤️': ['user1'], '😂': ['user1'] },
  },
}

export const SingleActive = {
  args: {
    reactions: { '👍': [], '❤️': ['user1'], '😂': ['user2'] },
  },
}
```

- [ ] **Step 2: Verify all stories render in Storybook**

```bash
npm run storybook
```

Open `http://localhost:6006` and navigate to **Components > ReactionBar**. Verify all four stories render correctly:
- `Default`: three buttons showing `👍 0`, `❤️ 0`, `😂 0`, none highlighted
- `WithReactions`: `👍 2`, `❤️ 1`, `😂 0`, none highlighted (activeUser is user1, not in arrays)
- `UserReacted`: all three highlighted (user1 in all arrays)
- `SingleActive`: only `❤️` button highlighted

Press Ctrl+C when done.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReactionBar.stories.jsx
git commit -m "feat: add ReactionBar Storybook stories"
```

---

## Task 10: Integrate ReactionBar into MessageViewer

**Files:**
- Modify: `src/components/MessageViewer.jsx`

- [ ] **Step 1: Update the Message component and MessageViewer**

Replace the entire contents of `src/components/MessageViewer.jsx` with:
```jsx
import classnames from 'classnames'
import formatRelative from 'date-fns/formatRelative'
import React from 'react'
import { useChannelStore } from '../stores/channels'
import { useMessageStore } from '../stores/messages'
import { useUserStore } from '../stores/users'
import MessageEditor from './MessageEditor'
import ReactionBar from './ReactionBar'
import styles from './MessageViewer.module.css'

const Message = ({ content, createdAt, id, userId, channelId, reactions }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const user = useUserStore(state => state.users.find(user => user.id === userId))
  const activeUserId = useUserStore(state => state.activeUserId)
  const dateInstance = React.useMemo(() => new Date(createdAt), [createdAt])

  return (
    <div className={styles.message}>
      <div className={styles.metadata}>
        {user == null ? null : (
          <span className={styles.username}>{user.username}</span>
        )}
        <span className={styles.timestamp}>
          {formatRelative(dateInstance, new Date())}
        </span>
      </div>
      {isEditing ? (
        <MessageEditor
          channelId={channelId}
          id={id}
          content={content}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        content
      )}
      {userId === activeUserId && !isEditing ? (
        <button onClick={() => setIsEditing(true)} className={styles.editButton}>
          Edit
        </button>
      ) : null}
      <ReactionBar
        channelId={channelId}
        messageId={id}
        reactions={reactions}
        activeUserId={activeUserId}
      />
    </div>
  )
}

const MessageViewer = () => {
  const allMessages = useMessageStore(state => state.messages)
  const activeChannelId = useChannelStore(state => state.activeChannelId)
  const messagesForActiveChannel = React.useMemo(
    () => allMessages.filter(message => message.channelId === activeChannelId),
    [activeChannelId, allMessages]
  )
  const isEmpty = messagesForActiveChannel.length === 0

  return (
    <div
      className={classnames(styles.wrapper, { [styles.wrapperEmpty]: isEmpty })}
    >
      {isEmpty ? (
        <div className={styles.empty}>
          No messages{' '}
          <span aria-label="Sad face" role="img">
            😢
          </span>
        </div>
      ) : (
        messagesForActiveChannel.map(message => (
          <Message
            channelId={activeChannelId}
            key={message.id}
            id={message.id}
            content={message.content}
            createdAt={message.createdAt}
            userId={message.userId}
            reactions={message.reactions}
          />
        ))
      )}
    </div>
  )
}

export default MessageViewer
```

- [ ] **Step 2: Start the full app and manually test**

```bash
npm start
```

1. Open `http://localhost:3456`
2. Create a user and log in
3. Create a channel and send a message
4. Verify three reaction buttons appear below the message showing `👍 0 ❤️ 0 😂 0`
5. Click `👍` — count should increment to 1 and button should highlight
6. Click `👍` again — count should return to 0 and highlight should clear
7. Click `❤️` and `😂` — verify both work and highlight independently
8. Open a second browser tab, log in as a different user, send/view same channel — verify reaction counts sync in real time

- [ ] **Step 3: Commit**

```bash
git add src/components/MessageViewer.jsx
git commit -m "feat: integrate ReactionBar into MessageViewer"
```

---

## Task 11: Playwright smoke test

**Files:**
- Create: `e2e/reactions.spec.js`

- [ ] **Step 1: Write the smoke test**

Create `e2e/reactions.spec.js`:
```js
const { test, expect } = require('@playwright/test')

test('user can toggle a 👍 reaction and count increments', async ({ page }) => {
  await page.goto('/')

  // Create a new user
  const username = `testuser${Date.now()}`
  await page.fill('input[placeholder]', username)
  await page.getByRole('button', { name: /create/i }).click()

  // Log in as the created user (select from dropdown)
  await page.locator('select').selectOption({ label: username })
  await page.getByRole('button', { name: /log in/i }).click()

  // Select the first available channel
  await page.locator('li').first().click()

  // Send a message so there is something to react to
  await page.fill('textarea', 'Hello reactions!')
  await page.keyboard.press('Enter')

  // Click the 👍 reaction button on the message
  const thumbsUpButton = page.getByRole('button', { name: /👍/ }).first()
  await thumbsUpButton.click()

  // Verify the count is now 1
  await expect(page.getByRole('button', { name: /👍 1/ }).first()).toBeVisible()
})
```

- [ ] **Step 2: Run the smoke test**

Ensure the app is running (`npm start` in a separate terminal), then:
```bash
npm run test:e2e
```

Expected: 1 test passes. If selectors don't match the actual DOM, open `npx playwright codegen http://localhost:3456` to record the correct selectors and update the test.

- [ ] **Step 3: Commit**

```bash
git add e2e/reactions.spec.js
git commit -m "test: add Playwright smoke test for reaction toggle"
```

---

## Task 12: Final verification

- [ ] **Step 1: Run all unit tests**

```bash
npm run test:all
```

Expected: All server and client tests pass.

- [ ] **Step 2: Run E2E smoke test**

```bash
npm run test:e2e
```

Expected: Smoke test passes.

- [ ] **Step 3: Verify real-time sync manually**

Open two browser tabs at `http://localhost:3456`. Log in as different users in each tab. React to a message in Tab 1 — verify the count updates in Tab 2 without a refresh.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete message reactions feature"
```
