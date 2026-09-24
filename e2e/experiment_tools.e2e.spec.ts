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

  test('a developer finds no experiments while the registry is empty', async ({ page }) => {
    await page.goto('/exp');
    await expect(page.getByText('No experiments are registered right now.')).toBeVisible();

    // A retired experiment's URL says so rather than erroring.
    await page.goto('/exp/apple-reminders-ux');
    await expect(page.getByRole('code')).toHaveText('/exp/apple-reminders-ux');
    await expect(page.getByText('No experiments are registered right now.')).toBeVisible();

    // Reaching any /exp path still arms the tools, so a developer who lands on
    // a dead experiment URL is never stranded there.
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();
    await page.getByRole('button', { name: /switch experience/i }).click();
    const picker = page.getByRole('dialog', { name: 'Switch experience' });
    // Production is a synthetic row, so it is the only choice offered when the
    // registry is empty.
    await expect(picker.getByRole('listitem')).toHaveCount(1);

    await picker.getByRole('button', { name: /Production/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  // Mounting any `/exp` surface arms the tools, the index included, so the two
  // checks below need no registered experiment to run.
  test('a developer puts the experiment tools away for good', async ({ page }) => {
    await page.goto('/exp');
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();

    await page.getByRole('button', { name: 'Close experiment tools' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);

    // Closing is a decision, not a dismissal: it survives a reload.
    await page.reload();
    await expect(page.getByLabel('Experiment controls')).toHaveCount(0);
  });

  test('a developer dismisses the experience picker with Escape', async ({ page }) => {
    await page.goto('/exp');
    await page.getByRole('button', { name: 'Expand experiment controls' }).click();
    await page.getByRole('button', { name: /switch experience/i }).click();
    await expect(page.getByRole('dialog', { name: 'Switch experience' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Switch experience' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/exp$/);
  });

  /**
   * Skipped while no experiment is registered: both checks below need a live
   * `/exp/{slug}` — one switches into a named prototype and back, the other
   * reads a registered experiment's row in the Settings list. Re-activate them,
   * substituting the new slug and title, with the next experiment.
   */
  test.describe.skip('once an experiment is registered again', () => {
    test('a developer switches from a prototype to production and back without leaving the page', async ({ page }) => {
      await page.goto('/exp/sample-experiment');
      await page.getByRole('button', { name: 'Expand experiment controls' }).click();
      await expect(page.getByRole('button', { name: /switch experience/i })).toContainText('Sample Experiment');

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
        .getByRole('button', { name: /Sample Experiment/ })
        .click();
      await expect(page).toHaveURL(/\/exp\/sample-experiment$/);
    });

    test('a developer reads the experiment list in dark mode', async ({ page }) => {
      await page.goto('/settings');
      await page.getByRole('radio', { name: 'Dark' }).click();

      const row = page.getByRole('button', { name: /Sample Experiment/ });
      await expect(row).toBeVisible();
      // The title used to inherit the user-agent button color and disappear here.
      await expect(row).toHaveCSS('color', 'rgb(255, 255, 255)');
      // One bordered row per experiment, not a run of text.
      await expect(row).toHaveCSS('border-style', 'solid');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });
});
