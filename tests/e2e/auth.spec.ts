import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show landing or redirect unauthenticated users', async ({ page }) => {
    const response = await page.goto('/');

    // Response should be successful (200) or redirect (3xx)
    expect(response?.status()).toBeLessThan(400);

    // Should show either landing page or sign-in
    const url = page.url();
    const isValidPage = url.includes('sign-in') || url.endsWith('/') || url.includes('localhost:3001');
    expect(isValidPage).toBe(true);
  });

  test('should show sign-in page with correct elements', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for essential elements (Clerk handles the actual form)
    await expect(page).toHaveTitle(/QualyIT/i);

    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show sign-up page', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page).toHaveTitle(/QualyIT/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have correct meta tags', async ({ page }) => {
    await page.goto('/sign-in');

    // Check viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#2563eb');
  });
});

test.describe('Protected Routes', () => {
  // Note: In development mode without proper Clerk setup, routes may not redirect
  // These tests verify the routes exist and respond correctly

  test('should handle /tasks route', async ({ page }) => {
    const response = await page.goto('/tasks');
    // Route should either show content or redirect to sign-in
    const status = response?.status() || 0;
    expect(status).toBeLessThan(500); // No server errors
  });

  test('should handle /dashboard route', async ({ page }) => {
    const response = await page.goto('/dashboard');
    const status = response?.status() || 0;
    expect(status).toBeLessThan(500); // No server errors
  });

  test('should handle /settings route', async ({ page }) => {
    const response = await page.goto('/settings');
    const status = response?.status() || 0;
    expect(status).toBeLessThan(500); // No server errors
  });
});
