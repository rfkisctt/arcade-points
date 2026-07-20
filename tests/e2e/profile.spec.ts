import { test, expect } from '@playwright/test';

/**
 * Profile page tests.
 * Verifies error states for invalid slugs and XSS safety.
 */

test.describe('Profile page — invalid slugs', () => {
  test('shows error state for slug with invalid characters', async ({ page }) => {
    await page.goto('/profile/!!invalid!!');
    await expect(
      page.getByText(/not found|tidak ditemukan/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows error state for too-short slug', async ({ page }) => {
    await page.goto('/profile/ab');
    await expect(
      page.getByText(/not found|tidak ditemukan/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows error state for non-existent valid-format slug', async ({ page }) => {
    await page.goto('/profile/zzznotexist12');
    await expect(
      page.getByText(/not found|tidak ditemukan/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Profile page — XSS safety', () => {
  test('XSS payload in slug is handled gracefully without script execution', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', dialog => {
      alertFired = true;
      dialog.dismiss();
    });

    await page.goto('/profile/%3Cscript%3Ealert(1)%3C%2Fscript%3E', { waitUntil: 'networkidle' });

    expect(alertFired).toBe(false);
    await expect(page.locator('body')).toBeVisible();
  });

  test('slug with SQL injection attempt returns error state', async ({ page }) => {
    await page.goto("/profile/'; DROP TABLE--");
    await expect(
      page.getByText(/not found|tidak ditemukan/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Profile page — back navigation', () => {
  test('back to leaderboard link is visible on a profile page', async ({ page }) => {
    await page.goto('/profile/validformatslug1');
    const backLink = page.getByRole('link', { name: /back|kembali/i });
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });
});
