import { test as base, expect } from '@playwright/test';
import { HomePageActions } from '@/actions/us/HomePageActions';

type AppOptions = {
  screenshotEnabled: boolean;
  screenshotName: string;
};

type AppFixtures = {
  homePageActions: HomePageActions;
  _autoScreenshot: void;
};

export const test = base.extend<AppOptions & AppFixtures>({
  screenshotEnabled: [false, { option: true }],
  screenshotName: ['', { option: true }],

  homePageActions: async ({ page }, use) => {
    await use(new HomePageActions(page));
  },

  _autoScreenshot: [
    async ({ page, screenshotEnabled, screenshotName }, use, testInfo) => {
      await use();
      if (!screenshotEnabled) return;
      if (testInfo.status !== testInfo.expectedStatus) return;
      const name = (screenshotName || testInfo.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await expect(page).toHaveScreenshot(`${name}.png`);
    },
    { auto: true },
  ],
});

export { expect };
