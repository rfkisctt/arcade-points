import { test, expect } from '@playwright/test';

/**
 * Calculate page tests.
 * Default language is EN. Verifies form layout, validation, error states, and query param pre-fill.
 */

test.describe('Calculate page — layout and form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculate');
  });

  test('page loads with URL input visible', async ({ page }) => {
    await expect(page.locator('input[type="url"]')).toBeVisible();
  });

  test('page heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /points calculator|kalkulator poin/i })
    ).toBeVisible();
  });

  test('submit button is disabled when input is empty', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    await expect(input).toHaveValue('');
    const submitBtn = page.getByRole('button', { name: /analyze profile|analisa profil/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button is enabled when input has a URL', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    await input.fill('https://www.cloudskillsboost.google/public_profiles/test');
    const submitBtn = page.getByRole('button', { name: /analyze profile|analisa profil/i });
    await expect(submitBtn).toBeEnabled();
  });

  test('URL input has an informative placeholder', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder).toContain('cloudskillsboost.google');
  });

  test('how-to-get steps card is visible', async ({ page }) => {
    await expect(page.getByText(/how to get|cara mendapatkan/i)).toBeVisible();
  });

  test('step 1 open profile page instruction is visible', async ({ page }) => {
    await expect(page.getByText(/open your profile page|buka halaman profil/i)).toBeVisible();
  });
});

test.describe('Calculate page — error handling', () => {
  test('shows error for non-Google URL', async ({ page }) => {
    await page.goto('/calculate');
    const input = page.locator('input[type="url"]');
    await input.fill('https://evil.com/fake-profile');
    const submitBtn = page.getByRole('button', { name: /analyze profile|analisa profil/i });
    await submitBtn.click();
    const errorContainer = page.locator('[class*="red"]').first();
    await expect(errorContainer).toBeVisible({ timeout: 10000 });
  });

  test('shows error for HTTP (non-HTTPS) Google URL', async ({ page }) => {
    await page.goto('/calculate');
    const input = page.locator('input[type="url"]');
    await input.fill('http://www.cloudskillsboost.google/public_profiles/test');
    const submitBtn = page.getByRole('button', { name: /analyze profile|analisa profil/i });
    await submitBtn.click();
    const errorContainer = page.locator('[class*="red"]').first();
    await expect(errorContainer).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Calculate page — ?url= query param', () => {
  test('pre-fills input from ?url= query param', async ({ page }) => {
    const profileUrl = 'https://www.cloudskillsboost.google/public_profiles/test-prefill';
    await page.goto(`/calculate?url=${encodeURIComponent(profileUrl)}`);
    const input = page.locator('input[type="url"]');
    await expect(input).toHaveValue(profileUrl, { timeout: 5000 });
  });
});
