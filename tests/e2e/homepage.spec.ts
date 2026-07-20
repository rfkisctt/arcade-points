import { test, expect } from '@playwright/test';

/**
 * Homepage smoke & functional tests.
 * Default language is EN. Verifies hero section, navigation, milestone table, footer, chat box.
 */

test.describe('Homepage — smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle('Arcade Points | Google Skills');
  });

  test('hero heading "Arcade Points" is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Arcade Points' })).toBeVisible();
  });

  test('navbar navigation links are visible', async ({ page }) => {
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
    await expect(page.getByRole('link', { name: /calculator/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /leaderboard/i }).first()).toBeVisible();
  });

  test('hero chat box textarea is visible and accepts input', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill('test input');
    await expect(textarea).toHaveValue('test input');
  });

  test('submit button in hero chat box is disabled when textarea is empty', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('');
    const submitBtn = page.locator('.hero-chat-box button[type="button"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button is enabled when textarea has content', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('leaderboard');
    const submitBtn = page.locator('.hero-chat-box button[type="button"]');
    await expect(submitBtn).toBeEnabled();
  });

  test('milestone table is visible with 4 rows', async ({ page }) => {
    await page.getByText('Milestone 1').first().scrollIntoViewIfNeeded();
    await expect(page.getByText('Milestone 1')).toBeVisible();
    await expect(page.getByText('Milestone 2')).toBeVisible();
    await expect(page.getByText('Milestone 3')).toBeVisible();
    await expect(page.getByText('Ultimate')).toBeVisible();
  });

  test('footer is visible with copyright text', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/arcade points/i)).toBeVisible();
  });

  test('language toggle button is visible and clickable', async ({ page }) => {
    const langToggle = page.getByTitle('Toggle language');
    await expect(langToggle).toBeVisible();
    await langToggle.click();
    await expect(langToggle).toBeVisible();
  });
});

test.describe('Homepage — navigation routing', () => {
  test('hero chat box navigates to leaderboard for "leaderboard" keyword', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea').first();
    await textarea.fill('leaderboard');
    await textarea.press('Enter');
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test('hero chat box navigates to calculate for a profile URL', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea').first();
    await textarea.fill('https://www.cloudskillsboost.google/public_profiles/test');
    await textarea.press('Enter');
    await expect(page).toHaveURL(/\/calculate/);
  });
});
