# API mocking — Playwright + TypeScript

## Mock files location
tests/mocks/{domain}/{scenario}.json
e.g. tests/mocks/users/single-user.json
     tests/mocks/checkout/payment-declined.json

## Standard route mock helper
Located at tests/utils/mockRoute.ts
```typescript
export async function mockRoute(
  page: Page,
  urlPattern: string,
  fixture: unknown,
  status = 200
) {
  await page.route(`**${urlPattern}`, route =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    })
  );
}
```

## Usage in tests
```typescript
import { mockRoute } from '../utils/mockRoute';
import singleUser from '../mocks/users/single-user.json';

test('displays user profile', async ({ page, profilePage }) => {
  await mockRoute(page, '/api/users/123', singleUser);
  await profilePage.goto('123');
  await expect(profilePage.displayName).toHaveText('Jane Smith');
});
```

## Error simulation patterns
```typescript
await mockRoute(page, '/api/checkout', { message: 'Card declined' }, 402);
await mockRoute(page, '/api/search', {}, 500);

// Network timeout simulation
await page.route('**/api/slow-endpoint', route =>
  new Promise(resolve => setTimeout(() => resolve(route.abort()), 5000))
);
```

## Rules
- Always call mockRoute BEFORE page navigation
- One mock per endpoint per test — no shared mocks across test files
- Use JSON fixture files for happy-path data; inline objects for error cases
