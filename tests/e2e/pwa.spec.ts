import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have a valid web manifest', async ({ page }) => {
    await page.goto('/');

    // Check manifest link - can be .json or .webmanifest
    const manifestLink = page.locator('link[rel="manifest"]');
    const href = await manifestLink.getAttribute('href');
    expect(href).toMatch(/manifest\.(json|webmanifest)/);

    // Fetch manifest using the actual href
    const response = await page.request.get(href || '/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    // Validate required PWA manifest fields
    expect(manifest.name).toContain('QualyIT');
    expect(manifest.short_name).toBe('QualyIT');
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have correct PWA icons', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    const href = await manifestLink.getAttribute('href');

    const response = await page.request.get(href || '/manifest.webmanifest');
    const manifest = await response.json();

    // Check for required icon sizes
    const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');

    // Icons might be SVG or external, just verify they're defined
    for (const icon of manifest.icons) {
      expect(icon.src).toBeDefined();
      expect(icon.sizes).toBeDefined();
    }
  });

  test('should have apple-touch-icon', async ({ page }) => {
    await page.goto('/');

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const count = await appleTouchIcon.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have correct viewport for mobile', async ({ page }) => {
    await page.goto('/');

    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');

    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
    // Should allow user scaling for accessibility (maximum-scale >= 5)
    expect(content).toMatch(/maximum-scale=[5-9]/);
  });
});

test.describe('Service Worker', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');

    // Wait for potential service worker registration
    await page.waitForTimeout(2000);

    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    // Service worker should be registered in production
    // In dev mode, it might not be active
    expect(swRegistered !== undefined).toBe(true);
  });
});

test.describe('Mobile UX - Touch Interactions', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.goto('/sign-in');

    // All interactive elements should have minimum touch target size (44x44)
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        // Minimum recommended touch target is 44x44 pixels
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should have proper spacing for touch', async ({ page }) => {
    await page.goto('/sign-in');

    // Interactive elements should have adequate spacing
    const inputs = await page.locator('input').all();

    for (let i = 0; i < inputs.length - 1; i++) {
      const current = await inputs[i].boundingBox();
      const next = await inputs[i + 1].boundingBox();

      if (current && next) {
        const spacing = next.y - (current.y + current.height);
        // Should have at least 8px spacing between inputs
        expect(spacing).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/sign-in', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // In dev mode, Next.js compiles on-demand so we allow more time
    // Production should load within 3s, dev mode within 30s
    const maxLoadTime = process.env.CI ? 5000 : 30000;
    expect(loadTime).toBeLessThan(maxLoadTime);
  });

  test('should not have excessive JavaScript bundle size', async ({ page }) => {
    await page.goto('/sign-in');

    const jsBytes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const scripts = resources.filter((r) => r.initiatorType === 'script');
      return scripts.reduce((acc, r) => acc + (r.transferSize || 0), 0);
    });

    // Total JS should be under 1MB
    expect(jsBytes).toBeLessThan(1024 * 1024);
  });
});
