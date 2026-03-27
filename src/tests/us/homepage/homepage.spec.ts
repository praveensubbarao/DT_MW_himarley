import { test, expect } from '@/utils/fixtures/homepageBaseTest';

test.describe('Himarley homepage', () => {
  // Steps:
  // 1. Open the configured homepage via Playwright base URL.
  // 2. Read the configured base URL from the page context.
  // 3. Verify the current page URL matches the expected homepage URL.
  // 4. Assert that the homepage content is visible.
  test('loads the homepage and verifies the base URL', async ({ page, homePageActions }) => {
    await homePageActions.openHomePage();
    const baseURL = homePageActions.getBaseURL();
    await expect(page).toHaveURL(`${baseURL}/`);
    await homePageActions.expectPageIsVisible();
  });
});
