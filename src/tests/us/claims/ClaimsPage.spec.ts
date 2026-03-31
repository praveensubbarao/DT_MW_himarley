import { test, expect } from '@/utils/fixtures/homepageBaseTest';

test.describe('Himarley Claims page', () => {
  // Steps:
  // 1. Navigate directly to the /claims/ path via Playwright base URL.
  // 2. Wait for the page to reach a stable network state.
  // 3. Assert the page URL contains '/claims'.
  // 4. Assert the page body is visible.
  // 5. Assert the primary heading on the Claims page is visible.
  test('loads the Claims page and verifies key content', async ({ page, homePageActions }) => {
    await page.goto('/claims/');
    await page.waitForLoadState('networkidle');

    await homePageActions.expectPageUrlContains('/claims');
    await homePageActions.expectPageIsVisible();
    await homePageActions.expectHeadingVisible('Claims');
  });
});
