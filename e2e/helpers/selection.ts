import type { Page } from '@playwright/test';

import { expect } from './isolated-test';

/**
 * Shared drivers for the selection-mode specs: entering the mode, pooling a
 * row, and the list plumbing those stories need around them. Kept out of the
 * spec so the spec reads as the user stories it documents.
 */
export async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByRole('textbox', { name: 'New task title' }).fill(title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listitem', { name: title })).toBeVisible();
}

export async function createList(page: Page, title: string): Promise<void> {
  await page.goto('/lists');
  await page.getByRole('button', { name: 'New List' }).click();
  await page.getByLabel('New list name').fill(title);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
}

export async function openList(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
  await page
    .getByRole('navigation', { name: 'PSYKL navigation' })
    .getByRole('button', { name: title, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

export async function currentListName(page: Page): Promise<string> {
  return (await page.getByRole('heading').first().textContent())?.trim() ?? '';
}

export async function enterSelectionMode(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'List options' }).click();
  await page.getByRole('menuitem', { name: 'Select Items' }).click();
  await expect(page.getByRole('button', { name: 'Done selecting' })).toBeVisible();
}

export async function select(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: `Select ${title}` }).click();
  await expect(page.getByRole('checkbox', { name: `Deselect ${title}` })).toBeChecked();
}

export function rowTitles(page: Page) {
  return page.getByRole('listitem').getByRole('button', { name: /^select |^deselect /i });
}
