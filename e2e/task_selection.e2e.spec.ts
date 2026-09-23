import { expect, test } from './helpers/isolated-test';
import {
  createList,
  createTask,
  currentListName,
  enterSelectionMode,
  openList,
  rowTitles,
  select,
} from './helpers/selection';

test.describe('task selection', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user selects several tasks and deletes them in one action', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const [oats, bread, beans] = [`oats ${stamp}`, `bread ${stamp}`, `beans ${stamp}`];
    for (const title of [oats, bread, beans]) {
      await createTask(page, title);
    }

    await enterSelectionMode(page);
    await select(page, oats);
    await select(page, beans);

    // Deleting a batch takes two presses: the first arms, the second performs.
    await page.getByRole('button', { name: 'Delete selected tasks' }).click();
    await page.getByRole('button', { name: 'Confirm deleting 2 tasks' }).click();

    await expect(page.getByRole('listitem', { name: oats })).toHaveCount(0);
    await expect(page.getByRole('listitem', { name: beans })).toHaveCount(0);
    await expect(page.getByRole('listitem', { name: bread })).toBeVisible();
  });

  test('a user changes their mind about a batch delete before it happens', async ({ page }) => {
    await page.goto('/');
    const title = `keep me ${Date.now()}`;
    await createTask(page, title);

    await enterSelectionMode(page);
    await select(page, title);
    await page.getByRole('button', { name: 'Delete selected tasks' }).click();
    await expect(page.getByRole('button', { name: 'Confirm deleting 1 task' })).toBeVisible();

    // Leaving the mode is a way out of the armed action, and nothing is lost.
    await page.getByRole('button', { name: 'Done selecting' }).click();

    await expect(page.getByRole('listitem', { name: title })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('listitem', { name: title })).toBeVisible();
  });

  test('a user marks several tasks complete in one action', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const [first, second] = [`rake ${stamp}`, `mow ${stamp}`];
    for (const title of [first, second]) {
      await createTask(page, title);
    }

    await enterSelectionMode(page);
    await select(page, first);
    await select(page, second);
    await page.getByRole('button', { name: 'Mark selected tasks complete' }).click();

    // No second gesture to get back: completing the batch leaves the mode.
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();

    await expect(page.getByRole('checkbox', { name: `Mark ${first} incomplete` })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: `Mark ${second} incomplete` })).toBeChecked();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Mark ${first} incomplete` })).toBeChecked();
  });

  test('a user moves several tasks to another list', async ({ page }) => {
    const destination = `Weekend ${Date.now()}`;
    await createList(page, destination);

    await page.goto('/');
    const stamp = Date.now();
    const [moved, stayed] = [`pack ${stamp}`, `stay ${stamp}`];
    for (const title of [moved, stayed]) {
      await createTask(page, title);
    }
    const origin = await currentListName(page);

    await enterSelectionMode(page);
    await select(page, moved);
    await page.getByRole('button', { name: 'Move selected tasks' }).click();

    const drawer = page.getByRole('dialog', { name: 'Move to:' });
    await expect(drawer.getByRole('radio', { name: origin })).toHaveCount(0);
    await drawer.getByRole('radio', { name: destination }).click();
    await drawer.getByRole('button', { name: 'Move' }).click();

    await expect(page.getByRole('listitem', { name: moved })).toHaveCount(0);
    await expect(page.getByRole('listitem', { name: stayed })).toBeVisible();

    await openList(page, destination);
    await expect(page.getByRole('listitem', { name: moved })).toBeVisible();
  });

  test('a user re-orders the tasks in a list by hand', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const titles = [`one ${stamp}`, `two ${stamp}`, `three ${stamp}`];
    for (const title of titles) {
      await createTask(page, title);
    }

    await enterSelectionMode(page);
    await expect(rowTitles(page)).toHaveText(titles);

    // Keyboard is the pointer-free equivalent of dragging the handle, and the
    // one a test can drive deterministically.
    await page.getByRole('button', { name: `Reorder ${titles[2] as string}` }).focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    await expect(rowTitles(page)).toHaveText([titles[2] as string, titles[0] as string, titles[1] as string]);
  });

  test('a user renames the list they are looking at while selecting', async ({ page }) => {
    const original = `Errands ${Date.now()}`;
    await createList(page, original);
    await openList(page, original);

    await enterSelectionMode(page);
    await page.getByRole('button', { name: `Rename ${original}` }).click();
    const field = page.getByRole('textbox', { name: 'List name' });
    const renamed = `Weekend errands ${Date.now()}`;
    await field.fill(renamed);
    await field.press('Enter');

    await expect(page.getByRole('button', { name: `Rename ${renamed}` })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: renamed })).toBeVisible();
  });

  test('a user leaves selection mode and the list behaves normally again', async ({ page }) => {
    await page.goto('/');
    const title = `edit me ${Date.now()}`;
    await createTask(page, title);

    await enterSelectionMode(page);
    // While selecting, a tap on the title pools the task rather than editing it.
    await expect(page.getByRole('button', { name: `Edit ${title}` })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'New Task' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete selected tasks' })).toBeDisabled();

    await page.getByRole('button', { name: 'Done selecting' }).click();

    await expect(page.getByRole('button', { name: `Edit ${title}` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'List options' })).toBeVisible();
  });
});
