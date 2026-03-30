# Test scaffolding — Playwright + TypeScript

## Config: playwright.config.ts shape
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [['html'], ['allure-playwright']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

## Fixture pattern: tests/fixtures/index.ts
All tests import `{ test, expect }` from here — never from @playwright/test directly.
```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

type Fixtures = { loginPage: LoginPage; dashboardPage: DashboardPage; };

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await lp.login(process.env.TEST_USER!, process.env.TEST_PASS!);
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
```

## Test anatomy
```typescript
import { test, expect } from '../fixtures';

test.describe('Checkout flow', () => {
  test.beforeEach(async ({ page }) => { /* shared setup */ });

  test('user can apply a promo code', { tag: '@smoke' }, async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.applyPromoCode('SAVE10');
    await expect(checkoutPage.discountLine).toBeVisible();
  });
});
```

## Tagging strategy
@smoke      — runs on every PR (< 5 min)
@regression — nightly full suite
@wip        — skipped in CI, local only
