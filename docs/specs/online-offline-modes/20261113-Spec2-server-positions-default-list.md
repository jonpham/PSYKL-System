---
status: TODO
issue: GH144
pr:
completed_at:
created_at: 2026-11-13
initiative: online-offline-modes
spec_number: 2
devtasks_total: 3
devtasks_complete: 0
honors_decisions: [7, 10, 15, 16]
---

# Server Positions and Default List — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-11-13
**Initiative:** `online-offline-modes`
**Spec:** 2/5
**Spec User Story:** _As a PSYKL user, my "Tasks" list is always there: I cannot delete it, and the server keeps it. As a PWA developer, I can create a list without picking its position, so the online-only path (Spec 3) never computes a position or bootstraps a list._
**Reads from:** [`docs/initiatives/online-offline-modes/DESIGN.md`](../../initiatives/online-offline-modes/DESIGN.md) Decisions 7, 10, 15, 16 (LOCKED).
**Visual artifact:** [`20261113-Spec2-server-positions-default-list-visual-artifact.md`](20261113-Spec2-server-positions-default-list-visual-artifact.md)

**Goal:** The default list can't be deleted from the PWA or the API. `POST /lists` appends a list after the user's last one when no `position` is sent. `service-task` creates the default list, or restores it, at start-up and after `/test/reset`.

**Architecture:**

- **UI first.** `useLists()` replaces its single `canDelete` flag with `canDeleteList(id)`, which is false for `DEFAULT_LIST_ID`.
- **Server refuses the delete.** `DELETE /lists/{DEFAULT_LIST_ID}` answers `409`. The PWA's sync queue already moves a refused (4xx) write to Failed (`sync/replay.ts:129`), so the client needs no new code.
- **Position.** `ListService.createList` computes a missing position inside one PGlite transaction, so two creates at once cannot take the same key.
- **Seed.** `seedDefaultList(db)` creates the default list if it is missing, or clears its `deleted_at` if a device deleted it before Decision 16. Start-up (`prepareApp`) and the test reset call it. `createDb()` and the Nest testing modules do not, so no existing test sees a new row.

**Tech Stack:** React 18 + Vitest + Playwright (`web_client`), NestJS 11, Drizzle on PGlite, Zod + `zod-to-openapi` (`packages/shared-types`), `fractional-indexing`. The client already uses `fractional-indexing`; Spec 2 adds it to `service-task`.

> Vocabulary: `DevTask` = workflow unit (one PR). `Task` = the PSYKL data entity. "Tasks" in quotes is the default list's title.

## Global Constraints

- Server changes are limited to Decisions 10, 15 and 16 (DESIGN.md → Constraints). No schema migration.
- The sync path is unchanged, except that it no longer offers to delete the default list. It keeps sending a provisional `position` on every create, and the server stores it verbatim (Decision 10).
- `position` is a fractional-index key, compared byte-wise (`COLLATE "C"`). The server generates keys with the same library as the client (`fractional-indexing`).
- `DEFAULT_LIST_ID` is `00000000-0000-7000-8000-000000000001`. The client's copy moves to `components/web_client/src/services/default-list.ts`. The PWA does not import `@psykl/shared-types` at runtime, because that would bundle Zod. The server's copy is in `packages/shared-types/src/schemas/list.ts`, and the two must never drift.
- The rule follows the list's **id**, not its title. A renamed default list is still protected.
- ≤10 production behavior source files per DevTask PR. Commit headers describe feature work only. Every new user-visible behavior ships with an End-to-End test in the same PR.
- Each DevTask branches off `spec/online-offline-modes-s2-server-positions-default-list` after the previous one merged. Nothing is stacked.

## Review Focus

1. **The user renames "Tasks", then opens List options.** Delete List must still be absent, because the rule follows the id. → DevTask 5, `useLists.default-list.unit.test.ts` "still protects the default list after it is renamed".
2. **A device queued a delete of the default list before Decision 16, then syncs.** The server answers `409`, the entry lands in Failed, and nothing retries forever. Start-up restores the list (Review Focus 5). → DevTask 6 contract test "refuses to delete the default list", plus the existing 4xx replay tests in `sync/__tests__/`.
3. **Two creates without a position arrive together.** Each must get a distinct key, both after the previous last list. A shared key can never be re-ordered (`useLists.positions.ts:17-19`). → DevTask 6, `list-server-position.integration.test.ts` "gives two simultaneous creates distinct positions".
4. **The user's last list is in Recently Deleted.** A new list must go after the tombstone, so restoring it cannot collide. → DevTask 6, "appends after a deleted list too".
5. **A database from before Decision 16 holds a deleted or purged default list.** Start-up must restore the deleted one, and recreate the purged one before the user's first list. → DevTask 7, `default-list-seed.integration.test.ts` "restores a default list deleted before Decision 16" and "recreates a purged default list ahead of the user's lists".

---

## Data Model

No schema changes. The default list is an ordinary `lists` row:

| Column                            | Seeded value                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                              | `DEFAULT_LIST_ID`                                                                                                                                            |
| `user_id`                         | `local`. It is the only user until `multi-tenant-auth` (#117), and the PWA sends `X-User-Id: local` (`components/web_client/src/api/client.ts:8`).           |
| `title`                           | `Tasks`                                                                                                                                                      |
| `position`                        | `generateKeyBetween(null, <user's first position> ?? null)`. That is `a0` on a fresh database, the same key the client's bootstrap uses.                     |
| `updated_at`                      | `1970-01-01T00:00:00.000Z` when created, so any edit a device makes wins Last-Write-Wins. `now()` when restored, so the restore wins over the old tombstone. |
| `created_at`, `server_updated_at` | `now()`, so the next pull sees the row                                                                                                                       |

## API

```
POST /lists
Body:     { id, title, position?, updated_at }     ← position now optional
Response: 201 List. When position is omitted, List.position is generated:
          after the highest position among ALL the caller's lists, deleted ones included.
Errors:   400 when position is present but empty or longer than 64 characters (unchanged), 401 / 403 (unchanged)

DELETE /lists/{id}
Errors:   409 when id is DEFAULT_LIST_ID: { message: "The default list cannot be deleted" }   ← new
          404 when the caller does not own the list (checked first, unchanged)
```

OpenAPI: `zod-to-openapi` drops `position` from `ListInput.required`, and `list-paths.ts` documents the new `409` on `DELETE /lists/{id}`. `openapi.json` and `web_client/src/api/types.ts` are gitignored and regenerate at build.

## Visual Artifact

[`20261113-Spec2-server-positions-default-list-visual-artifact.md`](20261113-Spec2-server-positions-default-list-visual-artifact.md): List options without Delete List on "Tasks", and unchanged on every other list.

---

## DevTasks

### DevTask 5: The PWA never offers to delete the default list

**Files:** 6 production files:

- `components/web_client/src/services/default-list.ts` (new)
- `components/web_client/src/hooks/useLists.default-list.ts`
- `components/web_client/src/hooks/useLists.ts`
- `components/web_client/src/hooks/useLists.sync.ts`
- `components/web_client/src/hooks/useLists.api.ts`
- `components/web_client/src/App.tsx`

**Branch:** `feat/online-offline-modes-s2-dt5-default-list-undeletable-ui`
**PR:** _tbd_

**Interfaces:**

- Produces: `DEFAULT_LIST_ID` and `isDefaultList(id: string): boolean` from `src/services/default-list.ts`. `UseListsResult.canDeleteList(id: string): boolean` replaces `canDelete: boolean`.
- `useLists.default-list.ts` keeps re-exporting `DEFAULT_LIST_ID`, so its existing importers are untouched.

- [ ] **Step 1: Skipped End-to-End test first.** Append to `e2e/list_deletion.e2e.spec.ts`, inside `test.describe('list deletion')`:

```ts
test.skip('a user is never offered to delete their Tasks list, even after renaming it', async ({ page }) => {
  await createList(page, `Errands ${Date.now()}`);
  await openList(page, 'Tasks');

  await page.getByRole('button', { name: 'List options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Select Items' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Delete List' })).toHaveCount(0);
});
```

Commit: `git commit -am "test: describe the Tasks list as undeletable end to end"`. The pre-commit typecheck passes, because the test is skipped and adds no types.

- [ ] **Step 2: Failing unit tests.** In `components/web_client/src/hooks/__tests__/useLists.default-list.unit.test.ts`, replace the test `'does not offer to delete the only remaining (default) list'` with the tests below. Then add the same `canDeleteList` checks to the test that creates "Groceries": `expect(result.current.canDeleteList(groceriesId)).toBe(true)`, placed before `// Act`.

```ts
it('does not offer to delete the default list', async () => {
  // Arrange
  const { result } = renderHook(() => useLists());
  await waitFor(() => {
    expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
  });

  // Act
  await act(async () => {
    await result.current.createList('Groceries');
  });

  // Assert — another list exists, and the default list is still protected
  await waitFor(() => {
    expect(result.current.lists).toHaveLength(2);
  });
  expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
});

it('still protects the default list after it is renamed', async () => {
  // Arrange
  const { result } = renderHook(() => useLists());
  await waitFor(() => {
    expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
  });
  await act(async () => {
    await result.current.createList('Groceries');
    await result.current.renameList(DEFAULT_LIST_ID, 'Inbox');
  });

  // Act
  await act(async () => {
    await result.current.deleteList(DEFAULT_LIST_ID);
  });

  // Assert — the rule follows the id, not the title
  await waitFor(() => {
    expect(result.current.lists.map((list) => list.title)).toEqual(['Inbox', 'Groceries']);
  });
  expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
  expect((await listSyncQueue()).some((entry) => entry.op === 'delete')).toBe(false);
});
```

Add `components/web_client/src/services/__tests__/default-list.unit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { DEFAULT_LIST_ID, isDefaultList } from '../default-list';

describe('isDefaultList', () => {
  it('recognises the default list by its fixed id', () => {
    expect(isDefaultList('00000000-0000-7000-8000-000000000001')).toBe(true);
    expect(DEFAULT_LIST_ID).toBe('00000000-0000-7000-8000-000000000001');
  });

  it('does not treat any other list as the default', () => {
    expect(isDefaultList('0199aaaa-0000-7000-8000-000000000001')).toBe(false);
  });
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useLists.default-list.unit.test.ts src/services/__tests__/default-list.unit.test.ts`
Expected: FAIL. `canDeleteList` is not a function, and `../default-list` cannot be resolved.

- [ ] **Step 3: Implement.** Create `components/web_client/src/services/default-list.ts`:

```ts
/**
 * The default list every account starts with (online-offline-modes DESIGN.md
 * Decisions 15, 16). It has a fixed id, so every device and the server agree on
 * it without a round trip, and it can never be deleted.
 *
 * MUST equal DEFAULT_LIST_ID in packages/shared-types/src/schemas/list.ts. The
 * PWA does not import that package at runtime, because it would bundle Zod.
 * Neither data path reads IndexedDB here, so both may import it.
 */
const DEFAULT_LIST_ID = '00000000-0000-7000-8000-000000000001';

function isDefaultList(id: string): boolean {
  return id === DEFAULT_LIST_ID;
}

export { DEFAULT_LIST_ID, isDefaultList };
```

In `components/web_client/src/hooks/useLists.default-list.ts`, delete the local `const DEFAULT_LIST_ID = …` line, keep its comment block, and add `import { DEFAULT_LIST_ID } from '../services/default-list';`. The existing `export { DEFAULT_LIST_ID, … }` stays.

In `components/web_client/src/hooks/useLists.ts`, replace `canDelete: boolean;` in `UseListsResult` with:

```ts
  /** False for the default list (Decision 16) and for the last remaining list. */
  canDeleteList(id: string): boolean;
```

In `components/web_client/src/hooks/useLists.sync.ts`, add `import { isDefaultList } from '../services/default-list';`. In `deleteList`, change the guard:

```ts
// The last remaining list and the default list can never be deleted
// (UX.md § 10 decision 1; online-offline-modes Decision 16).
if (lists.length <= 1 || isDefaultList(id)) {
  return;
}
```

Add a callback above the `return`, and return it in place of `canDelete`:

```ts
const canDeleteList = useCallback((id: string) => lists.length > 1 && !isDefaultList(id), [lists]);

return { canDeleteList, createList, deleteList, lists, moveList, renameList };
```

In `components/web_client/src/hooks/useLists.api.ts`, replace `canDelete: false,` with `canDeleteList: () => false,`.

In `components/web_client/src/App.tsx`, change `const { canDelete, lists, renameList } = useLists();` to `const { canDeleteList, lists, renameList } = useLists();`, and `canDelete={canDelete}` to `canDelete={activeList !== null && canDeleteList(activeList.id)}`. `activeList` is already declared above the header.

Update the four `TaskList` unit tests that mock `useLists`: replace `canDelete: true` with `canDeleteList: () => true`. These are test files and not counted.

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useLists.default-list.unit.test.ts src/services/__tests__/default-list.unit.test.ts`
Expected: PASS.

Run: `pnpm -r typecheck && pnpm -r lint && pnpm --filter @psykl/web-client test:unit && pnpm --filter @psykl/web-client test:component`
Expected: all PASS. `ListMenu` keeps its `canDelete` prop, so its story and unit test are untouched.

- [ ] **Step 4: Activate the End-to-End test.** Change `test.skip(` to `test(` in the test from Step 1. Run `./scripts/e2e-up.sh && pnpm test:e2e -- list_deletion`, then `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`.
      Expected: PASS, and the other `list_deletion` tests still pass.

- [ ] **Step 5: Commit, and tick this DevTask's steps in this doc.**

```bash
git add components/web_client/src e2e/list_deletion.e2e.spec.ts docs/specs/online-offline-modes/20261113-Spec2-server-positions-default-list.md
git commit -m "feat: never offer to delete the default Tasks list" -m "- Spec 2 doc: DevTask 5 steps checked"
```

Stop here for operator UX review of the PR, as in Spec 1. Do not begin DevTask 6 until DevTask 5 merges.

### DevTask 6: The list API refuses to delete the default list and appends lists without a position

**Files:** 3 production files: `packages/shared-types/src/schemas/list.ts`, `packages/shared-types/src/openapi/list-paths.ts` and `components/service-task/src/list/list.service.ts`. `components/service-task/package.json` also changes; it is config and not counted.
**Branch:** `feat/online-offline-modes-s2-dt6-list-api-contract`
**PR:** _tbd_

**Interfaces:**

- Produces:
  - `DEFAULT_LIST_ID`, `DEFAULT_LIST_TITLE` from `@psykl/shared-types`.
  - `ListInput.position?: string`.
  - `ListService.deleteList(userId, DEFAULT_LIST_ID, …)` throws `ConflictException('The default list cannot be deleted')`.
  - `ListService.createList(userId, input)` with no position returns `position = generateKeyBetween(<caller's max position, deleted included> ?? null, null)`.

- [ ] **Step 1: Failing schema tests.** In `packages/shared-types/src/schemas/list.unit.test.ts`, change the import to `import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE, ListInputSchema } from './list';`. Then append inside `describe('ListInputSchema')`:

```ts
it('accepts a list input without a position, for the server to assign', () => {
  const withoutPosition = { id: valid.id, title: valid.title, updated_at: valid.updated_at };
  expect(ListInputSchema.parse(withoutPosition)).toEqual(withoutPosition);
});

it('still rejects an empty position', () => {
  expect(() => ListInputSchema.parse({ ...valid, position: '' })).toThrow();
});
```

and at the end of the file:

```ts
describe('default list', () => {
  it('has an id every create accepts, matching the PWA', () => {
    const parsed = ListInputSchema.parse({
      id: DEFAULT_LIST_ID,
      title: DEFAULT_LIST_TITLE,
      updated_at: valid.updated_at,
    });
    expect(parsed.id).toBe('00000000-0000-7000-8000-000000000001');
  });
});
```

Move `valid` to module scope if the new `describe` cannot see it.

Run: `pnpm --filter @psykl/shared-types test:unit -- list.unit`
Expected: FAIL. `DEFAULT_LIST_ID` is not exported, and `position` is required.

- [ ] **Step 2: Schema and OpenAPI.** In `packages/shared-types/src/schemas/list.ts`, change `ListInputSchema`'s `position` to:

```ts
    position: z
      .string()
      .min(1)
      .max(64)
      .optional()
      .describe("Omit to have the server append the list after the caller's last one (deleted lists included)"),
```

Append to the same file:

```ts
/**
 * The default list every account starts with (online-offline-modes Decisions
 * 15, 16): fixed id, seeded by service-task, never deletable. MUST equal
 * DEFAULT_LIST_ID in components/web_client/src/services/default-list.ts.
 */
export const DEFAULT_LIST_ID = '00000000-0000-7000-8000-000000000001';
export const DEFAULT_LIST_TITLE = 'Tasks';
```

In `packages/shared-types/src/openapi/list-paths.ts`, in the `registerPath` for `method: 'delete'`, `path: '/lists/{id}'`, add to `responses`:

```ts
      409: { description: 'The default list (DEFAULT_LIST_ID) cannot be deleted' },
```

Run: `pnpm --filter @psykl/shared-types test:unit && pnpm --filter @psykl/shared-types build`
Expected: PASS. `pnpm -r typecheck` now FAILS in `list.service.ts` (`position: string | undefined`). Step 4 fixes it, so Steps 1-4 are one commit.

- [ ] **Step 3: Failing service tests.** Run `pnpm --filter @psykl/service-task add fractional-indexing@^4.0.0`. That is the version `web_client` pins.

Create `components/service-task/src/list/__tests__/list.controller.default-list.contract.test.ts`:

```ts
import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import { describe, expect, it } from 'vitest';

import {
  listControllerHarness,
  listCreateBody,
  listDeleteBody,
  validListId,
} from './list.controller.contract-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/list.service.ts (deleteList, appendPosition)
 */
describe('DELETE /lists/{id}', () => {
  const harness = listControllerHarness();

  it('refuses to delete the default list', async () => {
    // Given
    await harness.createList({ body: listCreateBody({ id: DEFAULT_LIST_ID, title: 'Tasks' }) }).expect(201);

    // When
    const response = await harness.deleteList({ id: DEFAULT_LIST_ID, body: listDeleteBody() }).expect(409);

    // Then
    expect(response.body.message).toBe('The default list cannot be deleted');
    const lists = await harness.getLists().expect(200);
    expect(
      (lists.body as Array<{ id: string; deleted_at: string | null }>).find((l) => l.id === DEFAULT_LIST_ID)
        ?.deleted_at,
    ).toBeNull();
  });

  it('still deletes any other list', async () => {
    // Given
    await harness.createList({ body: listCreateBody({ id: validListId('301') }) }).expect(201);

    // When / Then
    await harness.deleteList({ id: validListId('301'), body: listDeleteBody() }).expect(200);
  });

  it('answers 404, not 409, to a caller who does not own the default list', async () => {
    // When / Then
    await harness.deleteList({ id: DEFAULT_LIST_ID, userId: 'someone-else', body: listDeleteBody() }).expect(404);
  });
});

describe('POST /lists', () => {
  const harness = listControllerHarness();

  it('creates a list without a position and returns the one the server chose', async () => {
    // Given
    const body = { id: validListId('401'), title: 'no position', updated_at: '2026-05-20T12:00:00.000Z' };

    // When
    const response = await harness.createList({ userId: 'position-contract-user', body }).expect(201);

    // Then
    expect(response.body).toMatchObject({ id: validListId('401'), title: 'no position', position: 'a0' });
  });

  it('still rejects an empty position', async () => {
    // When / Then
    await harness
      .createList({ userId: 'position-contract-user', body: listCreateBody({ id: validListId('402'), position: '' }) })
      .expect(400);
  });
});
```

Create `components/service-task/tests/integration/list-server-position.integration.test.ts`:

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
    // When
    const response = await create('01').expect(201);

    // Then — the key a device would have picked
    expect(response.body.position).toBe('a0');
  });

  it('appends after the last list', async () => {
    // Given
    await create('01', { position: 'a0' }).expect(201);
    await create('02', { position: 'a1' }).expect(201);

    // When
    const response = await create('03').expect(201);

    // Then
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

    // When
    const response = await create('03').expect(201);

    // Then restoring the deleted one can never collide with it
    expect(response.body.position > 'a5').toBe(true);
  });

  it("ignores another user's lists", async () => {
    // Given
    await app
      .post('/lists')
      .set('X-User-Id', 'someone-else')
      .send({ id: id('09'), title: 'theirs', position: 'a9', updated_at: '2026-11-13T10:00:00.000Z' })
      .expect(201);

    // When
    const response = await create('01').expect(201);

    // Then
    expect(response.body.position).toBe('a0');
  });

  it('gives two simultaneous creates distinct positions', async () => {
    // Given
    await create('01', { position: 'a0' }).expect(201);

    // When
    const [first, second] = await Promise.all([create('02'), create('03')]);

    // Then
    expect([first.status, second.status]).toEqual([201, 201]);
    const positions: string[] = [first.body.position, second.body.position];
    expect(new Set(positions).size).toBe(2);
    expect(positions.every((position) => position > 'a0')).toBe(true);
  });

  it('keeps a position the client sent, verbatim', async () => {
    // When — the sync path's provisional position
    const response = await create('01', { position: 'a0V' }).expect(201);

    // Then
    expect(response.body.position).toBe('a0V');
  });

  it('returns the stored list when the same id is created again', async () => {
    // Given
    const created = await create('01').expect(201);
    await create('02', { position: 'b0' }).expect(201);

    // When a device re-sends the first create, still without a position
    const replay = await create('01').expect(201);

    // Then the stored row comes back, not a new position after b0
    expect(replay.body.position).toBe(created.body.position);
  });
});
```

Run: `pnpm --filter @psykl/service-task test:component -- default-list && pnpm --filter @psykl/service-task test:integration -- list-server-position`
Expected: FAIL:

- The default-list delete answers 200, not 409.
- Every create without a position answers 500, a `not-null` violation on `lists.position`.
- "keeps a position the client sent, verbatim", "still deletes any other list", the 404 test and the 400 test pass.

- [ ] **Step 4: Implement.** In `components/service-task/src/list/list.service.ts`:

```ts
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import type {
  List as ListResponse,
  ListDeleteInput,
  ListInput,
  ListPatchInput,
  ListRestoreInput,
} from '@psykl/shared-types';
import { and, desc, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';
```

In `deleteList`, right after `await this.requireList(userId, id);`:

```ts
// The default list is the home for a task whose list is gone; it lives as
// long as its owner (online-offline-modes Decision 16).
if (id === DEFAULT_LIST_ID) {
  throw new ConflictException('The default list cannot be deleted');
}
```

Replace `createList`, and add `appendPosition`:

```ts
  async createList(userId: string, input: ListInput): Promise<ListResponse> {
    // One transaction (PGlite runs transactions exclusively), so two creates
    // without a position cannot both read the same last key (Decision 10).
    return this.db.transaction(async (tx) => {
      const position = input.position ?? (await this.appendPosition(tx, userId));
      // onConflictDoNothing: two devices can race to create the same default-list
      // id (see list-persistence.integration.test.ts). A replay keeps the stored
      // row, including a position the server assigned earlier.
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

`ORDER BY position DESC` uses the column's `COLLATE "C"`, so it agrees with JavaScript string order. If `tx` does not fit `Pick<Db, 'select'>`, type it as `Parameters<Parameters<Db['transaction']>[0]>[0]` and ledger the ruling.

Run: `pnpm -r typecheck && pnpm -r lint && pnpm -r test:unit && pnpm --filter @psykl/service-task test:integration && pnpm --filter @psykl/service-task test:component`
Expected: all PASS.

- [ ] **Step 5: Commit, and tick this DevTask's steps in this doc.**

```bash
git add packages/shared-types/src components/service-task pnpm-lock.yaml docs/specs/online-offline-modes/20261113-Spec2-server-positions-default-list.md
git commit -m "feat: refuse to delete the default list and append lists sent without a position" -m "- Spec 2 doc: DevTask 6 steps checked"
```

### DevTask 7: The server keeps the default list, and Spec 2 closes out

**Files:** 4 production files:

- `components/service-task/src/list/default-list.seed.ts` (new)
- `components/service-task/src/app.bootstrap.ts` (new)
- `components/service-task/src/main.ts`
- `components/service-task/src/testing/test-reset.controller.ts`

**Branch:** `feat/online-offline-modes-s2-dt7-seeded-default-list`
**PR:** _tbd_

**Interfaces:**

- Consumes: `DEFAULT_LIST_ID`, `DEFAULT_LIST_TITLE` from DevTask 6.
- Produces:
  - From `src/list/default-list.seed.ts`: `seedDefaultList(db: Db): Promise<void>` and `SINGLE_USER_ID = 'local'`.
  - From `src/app.bootstrap.ts`: `prepareApp(app: INestApplication): Promise<void>`.

- [ ] **Step 1: Failing seed integration tests.** Create `components/service-task/tests/integration/default-list-seed.integration.test.ts`:

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
 * components/service-task/src/list/default-list.seed.ts (Decisions 15, 16)
 */
describe('default list seed', () => {
  let db: Db;
  const rowsFor = (userId: string) =>
    db.select().from(schema.lists).where(eq(schema.lists.userId, userId)).orderBy(schema.lists.position);

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

  it('restores a default list deleted before Decision 16', async () => {
    // Given
    await seedDefaultList(db);
    await db
      .update(schema.lists)
      .set({ deletedAt: new Date('2026-11-01T00:00:00.000Z') })
      .where(eq(schema.lists.id, DEFAULT_LIST_ID));

    // When the service restarts
    await seedDefaultList(db);

    // Then it is back, with an edit time newer than the old delete
    const [row] = await rowsFor(SINGLE_USER_ID);
    expect(row).toMatchObject({ id: DEFAULT_LIST_ID, deletedAt: null });
    expect(row!.updatedAt.getTime()).toBeGreaterThan(new Date('2026-11-01T00:00:00.000Z').getTime());
  });

  it("recreates a purged default list ahead of the user's lists", async () => {
    // Given the default list was purged and another list holds a0
    await insertList(db, { title: 'Groceries', position: 'a0', updatedAt: new Date('2026-11-01T00:00:00.000Z') });

    // When
    await seedDefaultList(db);

    // Then the default list is first, on its own key
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows.map((row) => row.title)).toEqual(['Tasks', 'Groceries']);
    expect(rows[0]!.position < 'a0').toBe(true);
  });

  it('seeds nothing for any other user', async () => {
    // When
    await seedDefaultList(db);

    // Then
    expect(await rowsFor('someone-else')).toHaveLength(0);
  });

  it("lets a device's own edit of the default list win", async () => {
    // Given
    await seedDefaultList(db);

    // When a device renames it (any real timestamp is newer than the seed)
    const renamed = await listService(db).patchList(SINGLE_USER_ID, DEFAULT_LIST_ID, {
      title: 'Inbox',
      updated_at: '2026-11-13T10:00:00.000Z',
    });

    // Then
    expect(renamed.title).toBe('Inbox');
  });

  it("answers a device's own create of the default list with the seeded row", async () => {
    // Given
    await seedDefaultList(db);

    // When a device that bootstrapped offline syncs its create
    const response = await listService(db).createList(SINGLE_USER_ID, {
      id: DEFAULT_LIST_ID,
      title: 'Tasks',
      position: 'a0',
      updated_at: '2026-11-13T09:00:00.000Z',
    });

    // Then the one shared row, not a second list
    expect(response.id).toBe(DEFAULT_LIST_ID);
    expect(await rowsFor(SINGLE_USER_ID)).toHaveLength(1);
  });
});
```

Run: `pnpm --filter @psykl/service-task test:integration -- default-list-seed`
Expected: FAIL, because `default-list.seed.js` cannot be resolved.

- [ ] **Step 2: Write the seed.** Create `components/service-task/src/list/default-list.seed.ts`:

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

/** Epoch, so any edit a device makes to a newly created default list wins Last-Write-Wins. */
const SEEDED_UPDATED_AT = new Date(0);

/**
 * Keeps the default list in place (online-offline-modes Decisions 15, 16):
 * - created, ahead of every other list, when it is missing (a fresh database,
 *   or a database that purged it before Decision 16);
 * - restored when a device deleted it before Decision 16, with a fresh edit
 *   time so the restore wins over the old tombstone.
 */
async function seedDefaultList(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: schema.lists.id, position: schema.lists.position, deletedAt: schema.lists.deletedAt })
      .from(schema.lists)
      .where(eq(schema.lists.userId, SINGLE_USER_ID))
      .orderBy(schema.lists.position);
    const existing = rows.find((row) => row.id === DEFAULT_LIST_ID);
    if (existing) {
      if (existing.deletedAt !== null) {
        const now = new Date();
        await tx
          .update(schema.lists)
          .set({ deletedAt: null, updatedAt: now, serverUpdatedAt: now })
          .where(eq(schema.lists.id, DEFAULT_LIST_ID));
      }
      return;
    }
    await tx
      .insert(schema.lists)
      .values({
        id: DEFAULT_LIST_ID,
        userId: SINGLE_USER_ID,
        title: DEFAULT_LIST_TITLE,
        position: generateKeyBetween(null, rows[0]?.position ?? null),
        updatedAt: SEEDED_UPDATED_AT,
      })
      // lists.id is a global primary key (#117): never fail start-up over it.
      .onConflictDoNothing({ target: schema.lists.id });
  });
}

export { seedDefaultList, SINGLE_USER_ID };
```

Run: `pnpm --filter @psykl/service-task test:integration -- default-list-seed`
Expected: PASS, 7/7.

- [ ] **Step 3: Failing contract tests for start-up and reset.** Create `components/service-task/src/__tests__/app.bootstrap.contract.test.ts`:

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
  // Given
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

- [ ] **Step 4: Wire start-up and reset, then run everything.** Create `components/service-task/src/app.bootstrap.ts`:

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

Replace `components/service-task/src/main.ts` with:

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

In `components/service-task/src/testing/test-reset.controller.ts`, import `seedDefaultList` from `'../list/default-list.seed.js'`, and re-seed after the truncate:

```ts
await this.db.execute(sql`truncate table tasks, lists, idempotency restart identity`);
// Leave the service as a fresh start would (Decision 15): the default list is back.
await seedDefaultList(this.db);
return { reset: true };
```

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:integration && pnpm -r test:component`
Expected: all PASS.

Run the End-to-End suite: `./scripts/e2e-up.sh && pnpm test:e2e`, then `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`.
Expected: DevTask 5's count (90 passed, 3 skipped). If `e2e/lists.e2e.spec.ts:58` sees two "Tasks" lists, the client and server ids have drifted.

- [ ] **Step 5: Commit the seed.**

```bash
git add components/service-task
git commit -m "feat: keep the default list on the server, seeded at start-up and after a test reset"
```

- [ ] **Step 6: Close out Spec 2.** This is the final DevTask, so it lands in the same PR.
  - Create the feature doc `docs/features/[{YYYYMMDD}]GH144_server-positions-default-list.md` from `docs/templates/FEATURE.md`, dated on the close-out day. Its `## Visual Record` is the visual artifact, updated to what was built. Carry over the "Decisions made during spec drafting" below as S2-1 to S2-4.
  - Add **ADR-OOM-003: The Server Assigns List Positions and Keeps an Undeletable Default List** to `docs/ARCHITECTURE.md`, after ADR-OOM-002. It cites Decisions 10, 15, 16 and S2-1 to S2-4.
  - Add a `CHANGELOG.md` Unreleased entry covering three things: "Tasks" can no longer be deleted, `POST /lists` takes an optional `position`, and the server keeps the default list.
  - Update `docs/PROJECT_STATUS.md`: Spec 2 is the last completed spec, and Spec 3 `online-only-lists-tasks` is next.
  - Update `docs/initiatives/online-offline-modes/MILESTONE.md` to "Spec 2 done; Spec 3 next".
  - Delete this spec doc and its visual artifact with `git rm`.

```bash
git add docs CHANGELOG.md && git commit -m "feat: close out server-kept default list and server-assigned positions" -m "- Feature doc, ADR-OOM-003, CHANGELOG, PROJECT_STATUS, MILESTONE; Spec 2 docs deleted"
```

---

## Verification (manual)

1. `pnpm install && docker compose up --build`
2. `curl -s localhost:3000/lists -H 'X-User-Id: local'` returns one list: `Tasks`, `a0`.
3. `curl -s -X POST localhost:3000/lists -H 'X-User-Id: local' -H 'Content-Type: application/json' -d '{"id":"0199bbbb-0000-7000-8000-000000000001","title":"Reading","updated_at":"2026-11-13T10:00:00.000Z"}'` returns `"position":"a1"`.
4. `curl -s -o /dev/null -w '%{http_code}' -X DELETE localhost:3000/lists/00000000-0000-7000-8000-000000000001 -H 'X-User-Id: local' -H 'Content-Type: application/json' -d '{"deleted_at":"2026-11-13T10:00:00.000Z"}'` prints `409`.
5. In the PWA at `http://localhost:5173`, check List options on both lists:
   - On "Tasks", it shows no Delete List.
   - On "Reading", it still offers Delete List.

## Decisions made during spec drafting

- **S2-1 — The seed creates the default list if it's missing and restores it if it's deleted.** Under Decision 16 the list is never deleted, so the seed only repairs data from before the rule. A recreated list goes ahead of the user's first list, because the PWA treats the earliest list as the default (`getDefaultListId`).
- **S2-2 — Seed from start-up (`prepareApp`) and the test reset, not from `createDb()`.** This keeps every existing test's empty database empty; about ten test files use the `local` user. `prepareApp` also moves CORS and the guard out of `main.ts`, so a contract test can run the real start-up.
- **S2-3 — A newly created seed has the epoch as `updated_at`; a restore uses `now()`.** A device's edit wins over a fresh seed, and a restore wins over the stale tombstone.
- **S2-4 — Appended positions count deleted lists.** A restored list cannot land on the same key as one created while it was deleted.
- **No new client code for a refused delete.** A queued delete of the default list from before the rule gets `409`, lands in Failed (`sync/replay.ts:129`), and start-up restores the list.
- **Numbering.** DevTasks continue from Spec 1 (DevTasks 1-4), so this Spec has DevTasks 5-7. They run in UI-first order: DevTask 5 is client only, and DevTasks 6-7 are server.

## Open Questions / Risks

- **`getDefaultListId` (sync path) still means "the earliest list", not `DEFAULT_LIST_ID`.** If a user moves another list above "Tasks", tasks with no list are shown under that list instead. This was true before Decision 16 and is unchanged here. Spec 5, which moves the bootstrap behind the Sync Client, should make it return `DEFAULT_LIST_ID`.
- **A device holding a local tombstone of "Tasks" from before the rule** shows it as deleted until the next pull brings back the restored row. It then also shows one Failed entry, the refused delete.
- **A stored position that `fractional-indexing` cannot parse** makes `appendPosition` throw, and the create answers 500. Every writer today uses the library, so no such key exists. Validating keys at the schema would change the sync path's contract, which is out of scope.
- **"Unless its owner is deleted"** waits for `multi-tenant-auth` (#117). No users exist yet.

## Affected by / Depends on

- Spec 1 (`data-mode-seam`) is merged to `main` (#149).
- Spec 3 (`online-only-lists-tasks`) depends on this Spec's contract and on the default list always existing.
