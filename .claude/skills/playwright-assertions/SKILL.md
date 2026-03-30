# Assertion helpers — Playwright + TypeScript

## Location
tests/utils/matchers.ts  — imported and registered in fixtures/index.ts

## Custom matchers available

### toHaveFormError(fieldName, message)
Checks [data-testid="{fieldName}-error"] is visible with given text.
```typescript
await expect(page).toHaveFormError('email', 'Invalid email address');
```

### toBeLoadedWithTitle(title)
Waits for networkidle then checks document.title.
```typescript
await expect(page).toBeLoadedWithTitle('Dashboard | MyApp');
```

### toMatchAppSnapshot(name)
Calls toHaveScreenshot with our naming convention: {feature}-{state}-{viewport}.png
```typescript
await expect(page).toMatchAppSnapshot('checkout-empty-cart-desktop');
```

## Standard assertion rules
- Always prefer Playwright's built-in web-first assertions (toBeVisible, toHaveText)
- Never use page.waitForTimeout() — use explicit waits in page objects
- Soft assertions for non-blocking checks: expect.soft(locator).toBeVisible()
- For lists: await expect(locator).toHaveCount(n) before iterating
