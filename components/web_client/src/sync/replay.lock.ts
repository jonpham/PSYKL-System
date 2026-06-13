import { v7 as uuidv7 } from 'uuid';

import { openPsyklDb } from '../db/idb';
import type { PsyklDb } from '../db/idb.types';

const replayLockKey = 'replay_lock';
const staleLockMs = 30_000;

type ReplayLockOptions = {
  db?: PsyklDb;
  now?: () => Date;
  owner?: string;
};

type ReplayLockValue = { heartbeat_at: string; owner: string };

async function acquireReplayLock(options: ReplayLockOptions = {}): Promise<boolean> {
  const owner = options.owner ?? uuidv7();
  const now = options.now?.() ?? new Date();
  const database = options.db ?? (await openPsyklDb());
  try {
    const transaction = database.transaction('sync_meta', 'readwrite');
    const existing = await transaction.store.get(replayLockKey);
    const lock = parseReplayLock(existing?.value);
    if (lock && Date.parse(lock.heartbeat_at) + staleLockMs > now.getTime()) {
      await transaction.done;
      return lock.owner === owner;
    }

    await transaction.store.put({
      key: replayLockKey,
      value: { owner, heartbeat_at: now.toISOString() },
    });
    await transaction.done;
    return true;
  } finally {
    if (!options.db) {
      database.close();
    }
  }
}

async function releaseReplayLock(options: Pick<ReplayLockOptions, 'db' | 'owner'>): Promise<void> {
  const database = options.db ?? (await openPsyklDb());
  try {
    const transaction = database.transaction('sync_meta', 'readwrite');
    const existing = await transaction.store.get(replayLockKey);
    const lock = parseReplayLock(existing?.value);
    if (lock?.owner === options.owner) {
      await transaction.store.delete(replayLockKey);
    }
    await transaction.done;
  } finally {
    if (!options.db) {
      database.close();
    }
  }
}

function parseReplayLock(value: unknown): ReplayLockValue | undefined {
  if (!value || typeof value !== 'object' || !('owner' in value) || !('heartbeat_at' in value)) {
    return undefined;
  }
  const lock = value as Record<string, unknown>;
  if (typeof lock['owner'] !== 'string' || typeof lock['heartbeat_at'] !== 'string') {
    return undefined;
  }
  return { heartbeat_at: lock['heartbeat_at'], owner: lock['owner'] };
}

export { acquireReplayLock, releaseReplayLock };
export type { ReplayLockOptions };
