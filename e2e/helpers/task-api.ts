import { randomBytes } from 'node:crypto';

import { expect } from '@playwright/test';

const apiBaseUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

function idempotencyKey(): string {
  const bytes = randomBytes(16);
  const time = BigInt(Date.now());
  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Number((time >> BigInt(8 * (5 - index))) & 0xffn);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function deleteServerTask(userId: string, title: string): Promise<void> {
  const listResponse = await fetch(new URL('/tasks', apiBaseUrl), { headers: { 'X-User-Id': userId } });
  expect(listResponse.ok).toBe(true);
  const tasks = (await listResponse.json()) as Array<{ id: string; title: string }>;
  const task = tasks.find((item) => item.title === title);
  expect(task).toBeDefined();

  const now = new Date().toISOString();
  const response = await fetch(new URL(`/tasks/${task!.id}`, apiBaseUrl), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey(),
      'X-User-Id': userId,
    },
    body: JSON.stringify({ deleted_at: now, updated_at: now }),
  });
  expect(response.ok, `DELETE /tasks/${task!.id}: ${response.status} ${await response.text()}`).toBe(true);
}
