import { test, expect } from '@playwright/test';

/**
 * Accessibility tests.
 * Verifies WCAG-relevant patterns: button labels, image alt text, semantic landmarks.
 * Note: Full WCAG compliance requires manual testing with assistive technologies.
 */

test.describe('Homepage — accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all interactive buttons have accessible text or aria-label', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim() ?? '';
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const hasAccessibleName = text.length > 0 || !!ariaLabel || !!title;
      expect(
        hasAccessibleName,
        `Button at index ${i} has no accessible name. text="${text}" aria-label="${ariaLabel}" title="${title}"`
      ).toBe(true);
    }
  });

  test('navbar links have visible text', async ({ page }) => {
    const navLinks = page.getByRole('navigation').first().getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = (await link.textContent())?.trim() ?? '';
      const ariaLabel = await link.getAttribute('aria-label');
      expect(
        text.length > 0 || !!ariaLabel,
        `Nav link at index ${i} has no accessible name`
      ).toBe(true);
    }
  });

  test('logo image has alt text', async ({ page }) => {
    const logoImg = page.locator('img[alt="Arcade Points"]').first();
    await expect(logoImg).toBeVisible();
    const alt = await logoImg.getAttribute('alt');
    expect(alt).toBe('Arcade Points');
  });

  test('footer has contentinfo landmark role', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });
});

test.describe('Calculate page — accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculate');
  });

  test('URL input has an informative placeholder', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder!.length).toBeGreaterThan(10);
  });

  test('submit button has visible text label', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /analyze profile|analisa profil/i });
    await expect(submitBtn).toBeVisible();
    const text = (await submitBtn.textContent())?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);
  });

  test('error message appears after invalid URL submission', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    await input.fill('https://evil.com/nope');
    await page.getByRole('button', { name: /analyze profile|analisa profil/i }).click();
    const errorBox = page.locator('[class*="red"]').first();
    await expect(errorBox).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Leaderboard page — accessibility', () => {
  test('search input has a placeholder for screen readers', async ({ page }) => {
    await page.goto('/leaderboard');
    const searchInput = page.getByPlaceholder(/search name|cari nama/i);
    await expect(searchInput).toBeVisible();
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('refresh button has a title attribute', async ({ page }) => {
    await page.goto('/leaderboard');
    const refreshBtn = page.getByTitle('Refresh');
    await expect(refreshBtn).toBeVisible();
    const title = await refreshBtn.getAttribute('title');
    expect(title).toBe('Refresh');
  });
});
