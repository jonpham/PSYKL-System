import { vi } from 'vitest';

import type { Db } from '../../db/index.js';

export function taskRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '0193e1c0-1234-7000-8000-000000000000',
    userId: 'local',
    title: 'task',
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    completedAt: null,
    updatedAt: new Date('2026-05-20T12:00:00.000Z'),
    serverUpdatedAt: new Date('2026-05-20T12:00:00.500Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function mockPatchDb(selectRows: unknown[], updateSet: ReturnType<typeof vi.fn>): Db {
  const where = vi.fn(async () => selectRows);
  const from = vi.fn(() => ({ where }));
  return {
    select: vi.fn(() => ({ from })),
    update: vi.fn(() => ({ set: updateSet })),
  } as unknown as Db;
}

export function mockCreateListDb(): Db {
  let insertedValues: { id: string; userId: string; title: string; updatedAt: Date } | undefined;
  const returning = vi.fn(async () => [
    {
      id: insertedValues?.id ?? 'mock-id',
      userId: insertedValues?.userId ?? 'local',
      title: insertedValues?.title ?? 'mock',
      createdAt: new Date(),
      completedAt: null,
      updatedAt: insertedValues?.updatedAt ?? new Date('2026-05-20T12:00:00.000Z'),
      serverUpdatedAt: new Date(),
      deletedAt: null,
    },
  ]);
  const values = vi.fn((valuesArg: { id: string; userId: string; title: string; updatedAt: Date }) => {
    insertedValues = valuesArg;
    return { returning };
  });
  const where = vi.fn(async () => []);
  const from = vi.fn(() => ({ where }));

  return {
    insert: vi.fn(() => ({ values })),
    select: vi.fn(() => ({ from })),
  } as unknown as Db;
}
