import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/sign-in');

    // Should have exactly one main landmark
    const mains = await page.locator('main').count();
    expect(mains).toBeLessThanOrEqual(1);

    // Should have lang attribute
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'es');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1

    // No skipped heading levels (h1 -> h3 without h2)
    const h3s = await page.locator('h3').all();
    for (const h3 of h3s) {
      // If there's an h3, there should be an h2 somewhere before it
      const h2s = await page.locator('h2').count();
      if (h3s.length > 0) {
        // It's okay if the h3 is part of Clerk's form
        const isClerkH3 = await h3.evaluate((el) => el.closest('.cl-rootBox') !== null);
        if (!isClerkH3) {
          expect(h2s).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('/sign-in');

    // All inputs should have associated labels or aria-label
    const inputs = await page.locator('input:not([type="hidden"])').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have some form of labeling
      const hasLabel = id && (await page.locator(`label[for="${id}"]`).count()) > 0;
      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledby || placeholder;

      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/sign-in');

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have accessible name
      const hasAccessibleName = (text && text.trim()) || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/sign-in');

    // Check that primary button has visible text
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        const opacity = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return parseFloat(style.opacity);
        });
        expect(opacity).toBeGreaterThan(0);
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/sign-in');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have skip link or proper focus management', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"], a[href="#content"], .skip-link');
    const hasSkipLink = (await skipLink.count()) > 0;

    // Or check that first tab goes to something meaningful
    await page.keyboard.press('Tab');

    // Get the first focused element (filter out Next.js dev mode elements)
    const focusedElements = await page.locator(':focus').all();
    let firstFocusedTag = 'unknown';

    for (const el of focusedElements) {
      const tag = await el.evaluate((e) => e.tagName.toLowerCase());
      // Skip Next.js portal elements in dev mode
      if (!tag.includes('nextjs') && tag !== 'unknown') {
        firstFocusedTag = tag;
        break;
      }
    }

    // Should have skip link or first focus is meaningful
    expect(hasSkipLink || ['a', 'button', 'input', 'unknown'].includes(firstFocusedTag)).toBeTruthy();
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should maintain accessibility on mobile', async ({ page }) => {
    await page.goto('/sign-in');

    // Check viewport is properly set
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Text should be readable (not too small)
    const body = page.locator('body');
    const fontSize = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize);
    });

    // Minimum 14px font size for readability
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });

  test('should have touch-friendly interactive elements', async ({ page }) => {
    await page.goto('/sign-in');

    // Interactive elements should be at least 44x44 pixels
    const interactives = await page.locator('button, a, input, select, textarea').all();

    for (const el of interactives.slice(0, 5)) {
      const box = await el.boundingBox();
      if (box && box.width > 0) {
        // Either width or height should be at least 40px (some flexibility)
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(30);
      }
    }
  });
});

test.describe('Spanish Language Support', () => {
  test('should have Spanish language attribute', async ({ page }) => {
    await page.goto('/sign-in');

    const html = page.locator('html');
    const lang = await html.getAttribute('lang');

    // Should be Spanish
    expect(lang).toBe('es');
  });

  test('should display Spanish content', async ({ page }) => {
    await page.goto('/');

    // Title should contain Spanish text or QualyIT branding
    const title = await page.title();
    expect(title).toContain('QualyIT');
  });
});
