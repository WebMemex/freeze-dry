import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/main/page.html');
});

test.describe('Example page', () => {
  test('Precheck: example page loads', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Freeze me.');
  });

  // test('', async ({ page }) => {
  // });
});
