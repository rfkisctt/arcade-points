import { test, expect } from '@playwright/test';

/**
 * Leaderboard page tests.
 * Default language is EN. Verifies page loads, search, refresh, submit button, and routing.
 */

test.describe('Leaderboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  });

  test('leaderboard component container is visible', async ({ page }) => {
    await expect(page.locator('.bg-\\[\\#161616\\]').first()).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search name/i);
    await expect(searchInput).toBeVisible();
  });

  test('search input filters the list', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search name/i);
    await searchInput.fill('zzznomatchxyz');
    await expect(
      page.getByText(/no participant|no match/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('refresh button is visible and clickable', async ({ page }) => {
    const refreshBtn = page.getByTitle('Refresh');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await expect(refreshBtn).toBeVisible();
  });

  test('"Submit profile" button navigates to /calculate', async ({ page }) => {
    const submitBtn = page.getByRole('link', { name: /submit profile|submit profil/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    await expect(page).toHaveURL(/\/calculate/);
  });

  test('loading state or entries are shown on page load', async ({ page }) => {
    const leaderboardCard = page.locator('.bg-\\[\\#161616\\]')
      .filter({ hasText: /ranking|loading|participant|peserta/i }).first();
    await expect(leaderboardCard).toBeVisible({ timeout: 10000 });
  });

  test('empty state message is shown when leaderboard is empty', async ({ page }) => {
    const content = page.locator('.bg-\\[\\#161616\\]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
    const hasEntries = await page.locator('img[referrerpolicy="no-referrer"]').count();
    if (hasEntries === 0) {
      await expect(page.getByText(/no participants yet|belum ada peserta/i)).toBeVisible();
    }
  });
});
