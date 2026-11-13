---
status: TODO
issue: GH144
pr:
completed_at:
created_at: 2026-11-13
initiative: online-offline-modes
spec_number: 2
devtasks_total: 2
devtasks_complete: 0
honors_decisions: [7, 10, 15]
---

# Server Positions and Default List — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-11-13
**Initiative:** `online-offline-modes`
**Spec:** 2/5
**Spec User Story:** _As a PWA developer, I can create a list without picking its position, and find the default list already on the server, so that the online-only path (Spec 3) never has to compute a position or bootstrap a list._
**Reads from:** [`docs/initiatives/online-offline-modes/DESIGN.md`](../../initiatives/online-offline-modes/DESIGN.md) Decisions 7, 10, 15 (LOCKED).

**Goal:** `POST /lists` appends the list after the user's last one when `position` is omitted, and `service-task` seeds the default list (`DEFAULT_LIST_ID`, "Tasks") at start-up and after `/test/reset`.

**Architecture:**

- **Position.** `ListService.createList` computes a missing position inside one PGlite transaction, so two creates at once cannot take the same key.
- **Seed.** `seedDefaultList(db)` inserts the default list only when the single user `local` owns no list rows at all. Start-up (`prepareApp`) and the test reset both call it.
- **Not touched.** Nothing changes in `createDb()` or in the Nest testing modules, so no existing test sees a new row.

**Tech Stack:** NestJS 11, Drizzle on PGlite, Zod + `zod-to-openapi` in `packages/shared-types`, `fractional-indexing` (the client already uses it; Spec 2 adds it to `service-task`).

> Vocabulary: `DevTask` = workflow unit (one PR). `Task` = the PSYKL data entity. "Tasks" in quotes is the default list's title.

## Global Constraints

- Server changes are limited to Decision 10's contract (DESIGN.md → Constraints). No schema migration.
- The sync path is unchanged (Decision 10): the PWA keeps sending a provisional `position` on every create, and the server stores it verbatim.
- `position` is a fractional-index key, compared byte-wise (`COLLATE "C"`); the server must generate keys with the same library the client uses (`fractional-indexing`).
- `DEFAULT_LIST_ID` is `00000000-0000-7000-8000-000000000001`, the value in `components/web_client/src/hooks/useLists.default-list.ts:28`. The two must never drift.
- No user-visible change, so no visual artifact and no new End-to-End test. The existing suite must still pass, and it is the drift guard for `DEFAULT_LIST_ID` (see Review Focus 5).
- ≤10 production behavior source files per DevTask PR; commit headers describe feature work only.

## Review Focus

1. **Two creates without a position arrive together.** Each must get a distinct key, both after the previous last list. A shared key can never be re-ordered (`useLists.positions.ts:17-19`). → DevTask 5, `list-server-position.integration.test.ts` "gives two simultaneous creates distinct positions".
2. **The user's last list is in Recently Deleted.** The new list must go after the tombstone too, so restoring it cannot collide. → DevTask 5, "appends after a deleted list too".
3. **A device re-sends a create it already made, without a position.** The stored row must come back unchanged, with no new key generated. → DevTask 5, "returns the stored list when the same id is created again".
4. **The user deleted the default list, or it was purged after 30 days.** A restart must not bring it back while the user still has any list row. → DevTask 6, `default-list-seed.integration.test.ts` "leaves a deleted default list deleted" and "does not seed a user who already has lists".
5. **The client's `DEFAULT_LIST_ID` and the server's drift apart.** A device would then show two "Tasks" lists. → DevTask 6 adds a cross-reference comment at both definitions. `e2e/lists.e2e.spec.ts:58` (`['Tasks', 'Reading', 'Groceries']`) fails on a second "Tasks", so the full End-to-End run in DevTask 6 Step 6 is the guard.

---

## Data Model

No schema changes. The default list is an ordinary `lists` row:

| Column                            | Seeded value                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                              | `DEFAULT_LIST_ID`                                                                                                                                  |
| `user_id`                         | `local`. It is the only user until `multi-tenant-auth` (#117), and the PWA sends `X-User-Id: local` (`components/web_client/src/api/client.ts:8`). |
| `title`                           | `Tasks`                                                                                                                                            |
| `position`                        | `generateKeyBetween(null, null)` = `a0`, the same key the client's bootstrap uses                                                                  |
| `updated_at`                      | `1970-01-01T00:00:00.000Z`. Any edit a device makes wins Last-Write-Wins.                                                                          |
| `created_at`, `server_updated_at` | `now()` defaults, so the next pull sees the row                                                                                                    |

## API

```
POST /lists
Body:     { id, title, position?, updated_at }     ← position now optional
Auth:     X-User-Id, enforced by the global guard (unchanged)
Response: 201 List. When position is omitted, List.position is generated:
          after the highest position among ALL the caller's lists, deleted ones included.
Errors:   400 when position is present but empty or longer than 64 characters (unchanged), 401 / 403 (unchanged)
```

OpenAPI: `zod-to-openapi` drops `position` from `ListInput.required` and carries the new `.describe()` text. `openapi.json` and `web_client/src/api/types.ts` are gitignored and regenerate at build (Decisions #12, #25 of M1). The client's `ListInput.position` becomes optional. That is safe, because the client only produces `ListInput`, never reads it.

## Visual Artifact

_None. No user-facing surface changes._

---

## DevTasks

The two DevTasks are independent, so they are **siblings**. Each branches off `spec/online-offline-modes-s2-server-positions-default-list` and opens its PR against it. DevTask 6 is the last one and carries the close-out. Both touch `packages/shared-types/src/schemas/list.ts`, in different places. Rebase whichever merges second.

### DevTask 5: Server appends a list when no position is sent

**Files:** 2 production files: `packages/shared-types/src/schemas/list.ts` and `components/service-task/src/list/list.service.ts`. `components/service-task/package.json` also changes; it is config and not counted.
**Branch:** `feat/online-offline-modes-s2-dt5-server-appended-position`
**PR:** _tbd_

**Interfaces:**

- Produces: `ListInput.position?: string`. With it omitted, `ListService.createList(userId, input)` returns a `List` whose `position` is `generateKeyBetween(<caller's max position, deleted included> ?? null, null)`.

- [ ] **Step 1: Failing schema test.** Append to `packages/shared-types/src/schemas/list.unit.test.ts`, inside `describe('ListInputSchema')`:

```ts
it('accepts a list input without a position, for the server to assign', () => {
  const withoutPosition = { id: valid.id, title: valid.title, updated_at: valid.updated_at };
  expect(ListInputSchema.parse(withoutPosition)).toEqual(withoutPosition);
});

it('still rejects an empty position', () => {
  expect(() => ListInputSchema.parse({ ...valid, position: '' })).toThrow();
});
```

Run: `pnpm --filter @psykl/shared-types test:unit -- list.unit`
Expected: the first test FAILS (a Zod "Required" error on `position`). The second test passes.

- [ ] **Step 2: Make `position` optional.** In `packages/shared-types/src/schemas/list.ts`, change `ListInputSchema`'s `position`:

```ts
    position: z
      .string()
      .min(1)
      .max(64)
      .optional()
      .describe('Omit to have the server append the list after the caller\'s last one (deleted lists included)'),
```

Run: `pnpm --filter @psykl/shared-types test:unit && pnpm --filter @psykl/shared-types build`
Expected: PASS. `ListInput['position']` is now `string | undefined`.

Run: `pnpm -r typecheck`
Expected: FAIL in `components/service-task/src/list/list.service.ts`, because `position: input.position` is not assignable to `string`. Step 4 fixes it. Do not commit yet: the pre-commit typecheck blocks this state, so Steps 1-4 are one commit.

- [ ] **Step 3: Failing integration tests.** Add `fractional-indexing` to `service-task` with `pnpm --filter @psykl/service-task add fractional-indexing@^4.0.0`, the version `web_client` pins. Then create `components/service-task/tests/integration/list-server-position.integration.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './task.integration-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/list.service.ts (createList → appendPosition)
 */
describe('server-assigned list position', () => {
  let app: TestApp;
  const id = (suffix: string) => `018f0000-0000-7000-8000-0000000000${suffix}`;
  const create = (suffix: string, extra: Record<string, unknown> = {}) =>
    app
      .post('/lists')
      .send({ id: id(suffix), title: `list ${suffix}`, updated_at: '2026-11-13T10:00:00.000Z', ...extra });

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('gives the first list the first key', async () => {
    // When the first list is created without a position
    const response = await create('01').expect(201);

    // Then it gets the key a device would have picked
    expect(response.body.position).toBe('a0');
  });

  it('appends after the last list', async () => {
    // Given two lists with client-chosen positions
    await create('01', { position: 'a0' }).expect(201);
    await create('02', { position: 'a1' }).expect(201);

    // When a third is created without one
    const response = await create('03').expect(201);

    // Then it sorts after both
    expect(response.body.position > 'a1').toBe(true);
    const order = (await app.get('/lists').expect(200)).body.map((list: { id: string }) => list.id);
    expect(order).toEqual([id('01'), id('02'), id('03')]);
  });

  it('appends after a deleted list too', async () => {
    // Given the last list is in Recently Deleted
    await create('01', { position: 'a0' }).expect(201);
    await create('02', { position: 'a5' }).expect(201);
    await app
      .delete(`/lists/${id('02')}`)
      .send({ deleted_at: '2026-11-13T11:00:00.000Z' })
      .expect(200);

    // When a list is created without a position
    const response = await create('03').expect(201);

    // Then restoring the deleted one can never collide with it
    expect(response.body.position > 'a5').toBe(true);
  });

  it("ignores another user's lists", async () => {
    // Given someone else owns a list far down the order
    await app
      .post('/lists')
      .set('X-User-Id', 'someone-else')
      .send({
        id: id('09'),
        title: 'theirs',
        position: 'a9',
        updated_at: '2026-11-13T10:00:00.000Z',
      })
      .expect(201);

    // When this user creates their first list
    const response = await create('01').expect(201);

    // Then its position starts this user's own order
    expect(response.body.position).toBe('a0');
  });

  it('gives two simultaneous creates distinct positions', async () => {
    // Given one existing list
    await create('01', { position: 'a0' }).expect(201);

    // When two creates without a position arrive together
    const [first, second] = await Promise.all([create('02'), create('03')]);

    // Then both land after it, on different keys
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const positions = [first.body.position, second.body.position];
    expect(new Set(positions).size).toBe(2);
    expect(positions.every((position: string) => position > 'a0')).toBe(true);
  });

  it('keeps a position the client sent, verbatim', async () => {
    // Given the sync path's provisional position
    const response = await create('01', { position: 'a0V' }).expect(201);

    // Then the server stores it unchanged
    expect(response.body.position).toBe('a0V');
  });

  it('returns the stored list when the same id is created again', async () => {
    // Given a list the server positioned
    const created = await create('01').expect(201);
    await create('02', { position: 'b0' }).expect(201);

    // When a device re-sends the first create, still without a position
    const replay = await create('01').expect(201);

    // Then the stored row comes back, not a new position after b0
    expect(replay.body.position).toBe(created.body.position);
  });
});
```

Run: `pnpm --filter @psykl/service-task test:integration -- list-server-position`
Expected: FAIL. The type error from Step 2 does not stop vitest. Every create without a position returns 500, a `not-null` violation on `lists.position`. "keeps a position the client sent, verbatim" passes.

- [ ] **Step 4: Assign the position in a transaction.** In `components/service-task/src/list/list.service.ts`:

```ts
import { and, desc, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';
```

Replace `createList` and add `appendPosition`:

```ts
  async createList(userId: string, input: ListInput): Promise<ListResponse> {
    // One transaction (PGlite runs transactions exclusively), so two creates
    // without a position cannot both read the same last key (Decision 10).
    return this.db.transaction(async (tx) => {
      const position = input.position ?? (await this.appendPosition(tx, userId));
      // onConflictDoNothing: two devices can race to create the same default-list
      // id (see list-persistence.integration.test.ts for why). A replay keeps the
      // stored row, including a position the server assigned earlier.
      const [inserted] = await tx
        .insert(schema.lists)
        .values({ id: input.id, userId, title: input.title, position, updatedAt: new Date(input.updated_at) })
        .onConflictDoNothing({ target: schema.lists.id })
        .returning();
      if (inserted) {
        return this.toResponse(inserted);
      }
      const [stored] = await tx
        .select()
        .from(schema.lists)
        .where(and(eq(schema.lists.id, input.id), eq(schema.lists.userId, userId)));
      if (!stored) {
        throw new NotFoundException('List not found');
      }
      return this.toResponse(stored);
    });
  }

  /**
   * The key after the caller's highest position. Deleted lists count, so a
   * restore can never collide with a list created while it was deleted.
   */
  private async appendPosition(tx: Pick<Db, 'select'>, userId: string): Promise<string> {
    const [last] = await tx
      .select({ position: schema.lists.position })
      .from(schema.lists)
      .where(eq(schema.lists.userId, userId))
      .orderBy(desc(schema.lists.position))
      .limit(1);
    return generateKeyBetween(last?.position ?? null, null);
  }
```

The `NotFoundException` branch keeps today's behavior: a duplicate id owned by another user (#117) answers 404. `ORDER BY position DESC` uses the column's `COLLATE "C"`, so it agrees with JavaScript string order.

Run: `pnpm --filter @psykl/service-task test:integration -- list-server-position`
Expected: PASS, 7/7.

Run: `pnpm -r typecheck && pnpm --filter @psykl/service-task test:integration && pnpm --filter @psykl/service-task test:component && pnpm --filter @psykl/service-task test:unit`
Expected: all PASS.

If `tx`'s type does not fit `Pick<Db, 'select'>`, type it as `Parameters<Parameters<Db['transaction']>[0]>[0]` and ledger the ruling.

- [ ] **Step 5: Contract test for the HTTP shape.** Create `components/service-task/src/list/__tests__/list.controller.create-position.contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { listControllerHarness, listCreateBody, validListId } from './list.controller.contract-support.js';

/**
 * Behavior enforced by:
 * packages/shared-types/src/schemas/list.ts (ListInputSchema.position optional)
 * components/service-task/src/list/list.service.ts (appendPosition)
 */
describe('POST /lists', () => {
  const harness = listControllerHarness();

  it('creates a list without a position and returns the one the server chose', async () => {
    // Given
    const body = { id: validListId('201'), title: 'no position', updated_at: '2026-05-20T12:00:00.000Z' };

    // When
    const response = await harness.createList({ userId: 'position-contract-user', body }).expect(201);

    // Then
    expect(response.body).toMatchObject({ id: validListId('201'), title: 'no position', position: 'a0' });
  });

  it('still rejects an empty position', async () => {
    // Given
    const body = listCreateBody({ id: validListId('202'), position: '' });

    // When / Then
    await harness.createList({ userId: 'position-contract-user', body }).expect(400);
  });
});
```

Run: `pnpm --filter @psykl/service-task test:component -- create-position`
Expected: PASS, 2/2. The behavior already exists, so this pins the HTTP contract and does not drive it.

- [ ] **Step 6: Commit and tick this DevTask in this doc.**

```bash
git add packages/shared-types/src/schemas components/service-task pnpm-lock.yaml docs/specs/online-offline-modes/20261113-Spec2-server-positions-default-list.md
git commit -m "feat: append a list after the caller's last one when no position is sent" -m "- Spec 2 doc: DevTask 5 steps checked"
```

### DevTask 6: Seed the default list on the server, and close out Spec 2

**Files:** 6 production files:

- `packages/shared-types/src/schemas/list.ts`
- `components/service-task/src/list/default-list.seed.ts` (new)
- `components/service-task/src/app.bootstrap.ts` (new)
- `components/service-task/src/main.ts`
- `components/service-task/src/testing/test-reset.controller.ts`
- `components/web_client/src/hooks/useLists.default-list.ts` (comment only)

**Branch:** `feat/online-offline-modes-s2-dt6-seeded-default-list`
**PR:** _tbd_

**Interfaces:**

- Produces: `DEFAULT_LIST_ID`, `DEFAULT_LIST_TITLE` exported from `@psykl/shared-types`; `seedDefaultList(db: Db): Promise<void>` and `SINGLE_USER_ID = 'local'` from `src/list/default-list.seed.ts`; `prepareApp(app: INestApplication): Promise<void>` from `src/app.bootstrap.ts`.
- If DevTask 5 has merged first, `fractional-indexing` is already a dependency. Otherwise add it as in DevTask 5 Step 3.

- [ ] **Step 1: Failing constant test.** Append to `packages/shared-types/src/schemas/list.unit.test.ts`, changing its import to `import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE, ListInputSchema } from './list';`:

```ts
describe('default list', () => {
  it('has an id every create accepts', () => {
    expect(
      ListInputSchema.parse({
        id: DEFAULT_LIST_ID,
        title: DEFAULT_LIST_TITLE,
        position: 'a0',
        updated_at: '2026-11-13T10:00:00.000Z',
      }).id,
    ).toBe('00000000-0000-7000-8000-000000000001');
  });
});
```

Run: `pnpm --filter @psykl/shared-types test:unit -- list.unit`
Expected: FAIL, because `DEFAULT_LIST_ID` is not exported.

- [ ] **Step 2: Export the constants.** At the end of `packages/shared-types/src/schemas/list.ts`:

```ts
/**
 * The default list every account starts with. A fixed id so every device and
 * the server agree on it without a round trip. MUST equal DEFAULT_LIST_ID in
 * components/web_client/src/hooks/useLists.default-list.ts (the PWA does not
 * import this package at runtime; e2e/lists.e2e.spec.ts catches drift).
 */
export const DEFAULT_LIST_ID = '00000000-0000-7000-8000-000000000001';
export const DEFAULT_LIST_TITLE = 'Tasks';
```

Run: `pnpm --filter @psykl/shared-types test:unit && pnpm --filter @psykl/shared-types build`
Expected: PASS.

- [ ] **Step 3: Failing seed integration tests.** Create `components/service-task/tests/integration/default-list-seed.integration.test.ts`:

```ts
import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { type Db, schema } from '../../src/db/index.js';
import { seedDefaultList, SINGLE_USER_ID } from '../../src/list/default-list.seed.js';
import { insertList, listService } from './list.integration-support.js';
import { createIntegrationDb } from './task.integration-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/default-list.seed.ts (Decision 15)
 */
describe('default list seed', () => {
  let db: Db;
  const rowsFor = (userId: string) => db.select().from(schema.lists).where(eq(schema.lists.userId, userId));

  beforeEach(async () => {
    db = await createIntegrationDb();
  });

  it('creates the default list on a fresh database', async () => {
    // When
    await seedDefaultList(db);

    // Then
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: DEFAULT_LIST_ID, title: 'Tasks', position: 'a0', deletedAt: null });
    expect(rows[0]!.updatedAt.toISOString()).toBe('1970-01-01T00:00:00.000Z');
  });

  it('seeds once however many times the service starts', async () => {
    // When
    await seedDefaultList(db);
    await seedDefaultList(db);

    // Then
    expect(await rowsFor(SINGLE_USER_ID)).toHaveLength(1);
  });

  it('leaves a deleted default list deleted', async () => {
    // Given the user deleted the default list
    await seedDefaultList(db);
    await db
      .update(schema.lists)
      .set({ deletedAt: new Date('2026-11-01T00:00:00.000Z') })
      .where(eq(schema.lists.id, DEFAULT_LIST_ID));

    // When the service restarts
    await seedDefaultList(db);

    // Then it is still in Recently Deleted
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.deletedAt).not.toBeNull();
  });

  it('does not seed a user who already has lists', async () => {
    // Given the default list was purged but other lists remain
    await insertList(db, { title: 'Groceries', position: 'a0', updatedAt: new Date('2026-11-01T00:00:00.000Z') });

    // When
    await seedDefaultList(db);

    // Then no second list appears at position a0
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows.map((row) => row.title)).toEqual(['Groceries']);
  });

  it("lets a device's own edit of the default list win", async () => {
    // Given the seeded list
    await seedDefaultList(db);

    // When a device renames it (any real timestamp is newer than the seed)
    const renamed = await listService(db).patchList(SINGLE_USER_ID, DEFAULT_LIST_ID, {
      title: 'Inbox',
      updated_at: '2026-11-13T10:00:00.000Z',
    });

    // Then the rename lands
    expect(renamed.title).toBe('Inbox');
  });

  it("answers a device's own create of the default list with the seeded row", async () => {
    // Given the seeded list
    await seedDefaultList(db);

    // When a device that bootstrapped offline syncs its create
    const response = await listService(db).createList(SINGLE_USER_ID, {
      id: DEFAULT_LIST_ID,
      title: 'Tasks',
      position: 'a0',
      updated_at: '2026-11-13T09:00:00.000Z',
    });

    // Then it gets the one shared row back, not a second list
    expect(response.id).toBe(DEFAULT_LIST_ID);
    expect(await rowsFor(SINGLE_USER_ID)).toHaveLength(1);
  });
});
```

Run: `pnpm --filter @psykl/service-task test:integration -- default-list-seed`
Expected: FAIL, because `default-list.seed.js` cannot be resolved.

- [ ] **Step 4: Write the seed.** Create `components/service-task/src/list/default-list.seed.ts`:

```ts
import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE } from '@psykl/shared-types';
import { eq } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

import { type Db, schema } from '../db/index.js';

/**
 * The only user until multi-tenant-auth (#117): the PWA sends `X-User-Id: local`.
 * Decision 15 moves the seed to user creation once users exist.
 */
const SINGLE_USER_ID = 'local';

/** Epoch, so any edit a device makes to the default list wins Last-Write-Wins. */
const SEEDED_UPDATED_AT = new Date(0);

/**
 * Ensures the default list exists (DESIGN.md Decisions 10, 15). It seeds only
 * when the user owns no list rows at all, deleted ones included, so a default
 * list the user deleted stays deleted. A purged one does not return either,
 * while other lists remain.
 */
async function seedDefaultList(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    const [any] = await tx
      .select({ id: schema.lists.id })
      .from(schema.lists)
      .where(eq(schema.lists.userId, SINGLE_USER_ID))
      .limit(1);
    if (any) {
      return;
    }
    await tx
      .insert(schema.lists)
      .values({
        id: DEFAULT_LIST_ID,
        userId: SINGLE_USER_ID,
        title: DEFAULT_LIST_TITLE,
        position: generateKeyBetween(null, null),
        updatedAt: SEEDED_UPDATED_AT,
      })
      // lists.id is a global primary key (#117): never fail start-up over it.
      .onConflictDoNothing({ target: schema.lists.id });
  });
}

export { seedDefaultList, SINGLE_USER_ID };
```

Run: `pnpm --filter @psykl/service-task test:integration -- default-list-seed`
Expected: PASS, 6/6.

- [ ] **Step 5: Failing contract tests for start-up and reset.**

Create `components/service-task/src/__tests__/app.bootstrap.contract.test.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prepareApp } from '../app.bootstrap.js';
import { AppModule } from '../app.module.js';

/**
 * Behavior enforced by:
 * components/service-task/src/app.bootstrap.ts (what main.ts runs before listen)
 */
describe('service start-up', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await prepareApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts with the default list already on the server', async () => {
    // When
    const response = await request(app.getHttpServer()).get('/lists').set('X-User-Id', 'local').expect(200);

    // Then
    expect(response.body).toEqual([expect.objectContaining({ id: DEFAULT_LIST_ID, title: 'Tasks', position: 'a0' })]);
  });

  it('still rejects a request with no X-User-Id', async () => {
    // When / Then
    await request(app.getHttpServer()).get('/lists').expect(401);
  });
});
```

Append to `components/service-task/src/testing/__tests__/test-reset.contract.test.ts`, inside `describe('POST /test/reset')`, and add `import { DEFAULT_LIST_ID } from '@psykl/shared-types';`:

```ts
it('puts the default list back after wiping the server', async () => {
  // Given a reset service
  process.env[TEST_RESET_FLAG] = 'enabled';
  await seedList(app, 'local', validId('004'));

  // When the suite resets between tests
  await request(app.getHttpServer()).post('/test/reset').set('X-User-Id', caller).expect(200);

  // Then the next test starts the way a fresh service does (Decision 15)
  const lists = await request(app.getHttpServer()).get('/lists').set('X-User-Id', 'local').expect(200);
  expect((lists.body as Array<{ id: string }>).map((list) => list.id)).toEqual([DEFAULT_LIST_ID]);
});
```

Run: `pnpm --filter @psykl/service-task test:component -- app.bootstrap test-reset`
Expected: FAIL. `app.bootstrap.js` does not exist yet, and the reset leaves `[]`.

- [ ] **Step 6: Wire start-up and reset, then run everything.** Create `components/service-task/src/app.bootstrap.ts`:

```ts
import type { INestApplication } from '@nestjs/common';

import { UserIdGuard } from './auth/user-id.guard.js';
import type { Db } from './db/index.js';
import { corsOptions } from './http/cors.options.js';
import { seedDefaultList } from './list/default-list.seed.js';
import { DB_TOKEN } from './task/task.service.js';

/**
 * Everything the running service sets up before it listens. It lives outside
 * main.ts so a contract test can run the same start-up.
 */
async function prepareApp(app: INestApplication): Promise<void> {
  app.enableCors(corsOptions());
  app.useGlobalGuards(new UserIdGuard());
  await seedDefaultList(app.get<Db>(DB_TOKEN));
}

export { prepareApp };
```

Replace the body of `bootstrap()` in `components/service-task/src/main.ts`:

```ts
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { prepareApp } from './app.bootstrap.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await prepareApp(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`service-task listening on http://0.0.0.0:${port}`);
}

void bootstrap();
```

In `components/service-task/src/testing/test-reset.controller.ts`, import `seedDefaultList` from `'../list/default-list.seed.js'` and re-seed after the truncate:

```ts
await this.db.execute(sql`truncate table tasks, lists, idempotency restart identity`);
// Leave the service as a fresh start would (Decision 15): the default list is back.
await seedDefaultList(this.db);
return { reset: true };
```

In `components/web_client/src/hooks/useLists.default-list.ts`, after the existing `DEFAULT_LIST_ID` comment block, add one line above the constant:

```ts
// MUST equal DEFAULT_LIST_ID in packages/shared-types/src/schemas/list.ts — the server seeds it (Decision 15).
```

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:integration && pnpm -r test:component`
Expected: all PASS.

Run the End-to-End suite against Compose: `./scripts/e2e-up.sh && pnpm test:e2e`, then `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`.
Expected: the same pass count as `main` (89 passed, 3 skipped). If `lists.e2e.spec.ts` shows two "Tasks" lists, the client and server ids have drifted (Review Focus 5).

- [ ] **Step 7: Commit the seed.**

```bash
git add packages/shared-types/src components/service-task components/web_client/src/hooks/useLists.default-list.ts pnpm-lock.yaml
git commit -m "feat: seed the default list on the server at start-up and after a test reset"
```

- [ ] **Step 8: Close out Spec 2.** This is the final DevTask, so it lands in the same PR:
  - Create the feature doc `docs/features/[{YYYYMMDD}]GH144_server-positions-default-list.md` from `docs/templates/FEATURE.md`, using the close-out date. It has no Visual Record, because no surface changed. Carry over the "Decisions made during spec drafting" below as S2-1 to S2-4.
  - Add **ADR-OOM-003: The Server Assigns List Positions and Seeds the Default List** to `docs/ARCHITECTURE.md`, after ADR-OOM-002. It should cite Decisions 10 and 15 and S2-1 to S2-4.
  - Add a `CHANGELOG.md` Unreleased entry: `POST /lists` takes an optional `position`, and the server seeds "Tasks".
  - Update `docs/PROJECT_STATUS.md`: Spec 2 is the last completed spec, and Spec 3 `online-only-lists-tasks` is next.
  - Update `docs/initiatives/online-offline-modes/MILESTONE.md` to "Spec 2 done; Spec 3 next".
  - Delete this spec doc.

```bash
git commit -am "feat: close out server-assigned positions and the seeded default list" -m "- Feature doc, ADR-OOM-003, CHANGELOG, PROJECT_STATUS, MILESTONE; Spec 2 doc deleted"
```

(Use `git add` for the new feature doc and `git rm` for this doc before the commit.)

---

## Verification (manual)

1. `pnpm install && docker compose up --build`
2. `curl -s localhost:3000/lists -H 'X-User-Id: local'` returns one list: `Tasks`, `a0`.
3. `curl -s -X POST localhost:3000/lists -H 'X-User-Id: local' -H 'Content-Type: application/json' -d '{"id":"0199bbbb-0000-7000-8000-000000000001","title":"Reading","updated_at":"2026-11-13T10:00:00.000Z"}'` returns `"position":"a1"`.
4. The PWA at `http://localhost:5173` shows one "Tasks" list, not two.

## Decisions made during spec drafting

- **S2-1 — Seed only when the user has no list rows at all.** Decision 10 says the server "ensures the default list exists". This narrows it, so that a default list the user deleted, or one purged after 30 days, is not brought back while other lists remain. It is also never seeded at a position another list already holds. Cost if wrong: Spec 3's online path meets a user with zero active lists and must handle it, which it has to do anyway once the user deletes everything.
- **S2-2 — Seed from start-up (`prepareApp`) and the test reset, not from `createDb()`.** This keeps every existing test's empty database empty; about ten test files use the `local` user. `prepareApp` also moves CORS and the guard out of `main.ts`, so a contract test can run the real start-up.
- **S2-3 — The seeded `updated_at` is the epoch.** A device's rename, reorder or delete always wins Last-Write-Wins against the seed.
- **S2-4 — Appended positions count deleted lists.** A restored list cannot land on the same key as one created while it was deleted.
- **DevTask numbering** continues from Spec 1 (DevTasks 1-4), so this Spec has DevTasks 5 and 6.

## Open Questions / Risks

- **A stored position that `fractional-indexing` cannot parse** makes `appendPosition` throw, and the create answers 500. Every writer today uses the library, so no such key exists. Validating keys at the schema would change the sync path's contract, which is out of scope (DESIGN.md → Out of Scope). Recorded for Spec 3.
- **Homelab upgrade.** The deployed database already holds the user's lists, so S2-1 seeds nothing there. That is the intended behavior.

## Affected by / Depends on

- Spec 1 (`data-mode-seam`) is merged to `main` (#149).
- Spec 3 (`online-only-lists-tasks`) depends on this Spec's contract.
