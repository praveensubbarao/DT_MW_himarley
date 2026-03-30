# Page objects — Playwright + TypeScript

## Purpose
Generate page object classes that extend BasePage.
Every page action must go through a method — never raw selectors in tests.

## BasePage (always extend this)
Located at: tests/pages/BasePage.ts
```typescript
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(`${process.env.BASE_URL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  protected loc(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async waitForToast(message: string) {
    await this.page.locator(`[data-testid="toast"]`)
      .filter({ hasText: message })
      .waitFor({ state: 'visible' });
  }
}
```

## Selector priority (always in this order)
1. data-testid — preferred for all interactive elements
2. ARIA role + name — for semantic elements without testId
3. text content — only for read-only display text
4. CSS class — NEVER (classes change with refactors)

## Page class template
```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  readonly url = '/checkout';

  readonly orderSummary = this.loc('order-summary');
  readonly placeOrderBtn = this.loc('place-order-btn');
  readonly promoCodeInput = this.loc('promo-code-input');

  async goto() { await super.goto(this.url); }

  async applyPromoCode(code: string) {
    await this.promoCodeInput.fill(code);
    await this.loc('apply-promo-btn').click();
    await this.waitForToast('Promo code applied');
  }

  async placeOrder() {
    await this.placeOrderBtn.click();
    await this.page.waitForURL('**/order-confirmation/**');
  }
}
```

## Rules Claude must follow
- All locators as class properties (not inline in methods)
- Methods return `Promise<void>` unless they return data
- Waits go inside page methods, never in test files
- One page class per route/screen
