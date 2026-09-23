import { expect, test } from './helpers/isolated-test';

test.describe('experiment tools', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a developer never sees experiment tools until they open an experiment', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);
  });

  test('a developer switches from a prototype to production and back without leaving the page', async ({ page }) => {
    await page.goto('/exp/apple-reminders-ux');
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();
    await expect(page.getByRole('button', { name: /switch experience/i })).toContainText('Apple Reminders UX');

    // Into production.
    await page.getByRole('button', { name: /switch experience/i }).click();
    await page
      .getByRole('dialog', { name: 'Switch experience' })
      .getByRole('button', { name: /Production/ })
      .click();
    await expect(page).toHaveURL(/\/$/);

    // The tools came along, and now name the production experience.
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();
    await expect(page.getByRole('button', { name: /switch experience/i })).toContainText('Production');

    // Back into the prototype.
    await page.getByRole('button', { name: /switch experience/i }).click();
    await page
      .getByRole('dialog', { name: 'Switch experience' })
      .getByRole('button', { name: /Apple Reminders UX/ })
      .click();
    await expect(page).toHaveURL(/\/exp\/apple-reminders-ux$/);
  });

  test('a developer puts the experiment tools away for good', async ({ page }) => {
    await page.goto('/exp/apple-reminders-ux');
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();

    await page.getByRole('button', { name: 'Close experiment tools' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);

    // Closing is a decision, not a dismissal: it survives a reload.
    await page.reload();
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);
  });

  test('a developer dismisses the experience picker with Escape', async ({ page }) => {
    await page.goto('/exp/apple-reminders-ux');
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();
    await page.getByRole('button', { name: /switch experience/i }).click();
    await expect(page.getByRole('dialog', { name: 'Switch experience' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Switch experience' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/exp\/apple-reminders-ux$/);
  });

  test('a developer reads the experiment list in dark mode', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('radio', { name: 'Dark' }).click();

    const row = page.getByRole('button', { name: /Apple Reminders UX/ });
    await expect(row).toBeVisible();
    // The title used to inherit the user-agent button color and disappear here.
    await expect(row).toHaveCSS('color', 'rgb(255, 255, 255)');
    // One bordered row per experiment, not a run of text.
    await expect(row).toHaveCSS('border-style', 'solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
