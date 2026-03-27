import { test as base, expect } from '@playwright/test';
import { HomePageActions } from '@/actions/us/HomePageActions';

type AppFixtures = {
  homePageActions: HomePageActions;
};

export const test = base.extend<AppFixtures>({
  homePageActions: async ({ page }, use) => {
    await use(new HomePageActions(page));
  },
});

export { expect };
