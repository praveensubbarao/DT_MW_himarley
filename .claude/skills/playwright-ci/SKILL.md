# CI + reporting — Playwright + TypeScript

## Pipeline file: .github/workflows/e2e.yml
```yaml
name: E2E tests
on:
  push:    { branches: [main] }
  pull_request: {}

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=chromium --grep @smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_USER: ${{ secrets.TEST_USER }}
          TEST_PASS: ${{ secrets.TEST_PASS }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ github.run_id }}
          path: |
            playwright-report/
            allure-results/
          retention-days: 14
```

## Allure annotations in tests
```typescript
import { allure } from 'allure-playwright';

test('user completes checkout', async ({ checkoutPage }) => {
  await allure.owner('payments-team');
  await allure.epic('Checkout');
  await allure.severity('critical');

  await allure.step('Navigate to checkout', async () => {
    await checkoutPage.goto();
  });
  await allure.step('Place order', async () => {
    await checkoutPage.placeOrder();
  });
});
```

## Reporting rules
- All tests in CI emit both HTML report and allure-results/
- Screenshots and traces auto-attach on failure (set in playwright.config)
- Never suppress reporter output with --reporter=null
