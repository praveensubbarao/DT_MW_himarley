import { expect, Locator, Page } from '@playwright/test';

export class HomePageActions {
  constructor(private readonly page: Page) {}

  async openHomePage() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageIsVisible() {
    await this.page.locator('body').waitFor({ state: 'visible' });
  }

  getBaseURL() {
    return ((this.page.context() as any)._options.baseURL ?? '') as string;
  }

  private async firstVisible(locator: Locator) {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible()) {
        return candidate;
      }
    }
    return null;
  }

  private async openHamburgerMenuIfNeeded(linkText: string) {
    const mobileLinks = this.page.locator('header a.mobile-navi.nav-link', { hasText: linkText });
    const visibleMobileLink = await this.firstVisible(mobileLinks);
    if (visibleMobileLink) {
      return;
    }

    const menuButton = this.page.locator(
      'button.navbar-toggler, button[aria-label*="toggle navigation" i], button[aria-label*="menu" i], button[aria-label*="navigation" i], button[aria-label*="open" i], button[title*="menu" i], button[title*="navigation" i], button[title*="open" i]'
    ).first();

    if ((await menuButton.count()) > 0 && (await menuButton.isVisible())) {
      await menuButton.click();
      const offcanvas = this.page.locator('#navbarOffcanvas, .offcanvas-collapse.navbar-collapse').first();
      await expect(offcanvas).toBeVisible({ timeout: 10000 });
      const visibleAfterOpen = await this.firstVisible(mobileLinks);
      if (visibleAfterOpen) {
        await expect(visibleAfterOpen).toBeVisible({ timeout: 10000 });
      }
    }
  }

  private async topNavLink(linkText: string) {
    const mobileLinks = this.page.locator('header a.mobile-navi.nav-link', { hasText: linkText });
    const visibleMobileLink = await this.firstVisible(mobileLinks);
    if (visibleMobileLink) {
      return visibleMobileLink;
    }

    return this.page.locator('header').getByRole('link', { name: linkText, exact: false }).first();
  }

  private async clickLocator(locator: Locator) {
    await expect(locator).toBeAttached({ timeout: 10000 });
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 10000 });
    } catch {
      // ignore if scroll fails for hidden/offscreen elements
    }
    try {
      await locator.click({ timeout: 10000 });
      return;
    } catch {
      try {
        await locator.click({ force: true, timeout: 10000 });
        return;
      } catch {
        const handle = await locator.elementHandle();
        if (handle) {
          await handle.evaluate((el: HTMLElement) => el.click());
          return;
        }
        throw new Error('Unable to click locator');
      }
    }
  }

  async expectTopNavLinkVisible(linkText: string) {
    await this.openHamburgerMenuIfNeeded(linkText);
    const link = await this.topNavLink(linkText);
    if (!(await link.isVisible())) {
      try {
        await link.scrollIntoViewIfNeeded({ timeout: 10000 });
      } catch {
        // ignore
      }
    }
    await expect(link).toBeVisible({ timeout: 20000 });
  }

  async clickTopNavLink(linkText: string) {
    await this.openHamburgerMenuIfNeeded(linkText);
    const link = await this.topNavLink(linkText);
    if (!(await link.isVisible())) {
      try {
        await link.scrollIntoViewIfNeeded({ timeout: 10000 });
      } catch {
        // ignore if scroll fails
      }
    }
    await this.clickLocator(link);
    const href = await link.getAttribute('href');
    await this.page.waitForLoadState('networkidle');
    return Boolean(href && href.trim() && href !== '#');
  }

  private async dropdownMenuForLink(linkText: string) {
    const mobileToggle = this.page.locator('header a.mobile-navi.nav-link.dropdown-toggle', { hasText: linkText }).first();
    if ((await mobileToggle.count()) > 0) {
      const menu = mobileToggle.locator('xpath=following-sibling::ul[contains(@class, "dropdown-menu")]').first();
      if ((await menu.count()) > 0) {
        return menu;
      }
    }

    const openDropdown = this.page.locator('.dropdown-menu.megamenu.show:visible').first();
    if ((await openDropdown.count()) > 0) {
      return openDropdown;
    }

    return this.page.locator('.dropdown-menu:visible').first();
  }

  async expectDropdownMenuVisible(linkText: string) {
    const dropdownMenu = await this.dropdownMenuForLink(linkText);
    await expect(dropdownMenu).toBeVisible({ timeout: 10000 });
  }

  async clickDropdownMenuLink(linkText: string, linkHrefFragment?: string) {
    const visibleDropdown = await this.dropdownMenuForLink(linkText);
    await expect(visibleDropdown).toBeVisible({ timeout: 10000 });

    const textButton = visibleDropdown.locator('span.btn-arrow.btn-arrow-right', { hasText: linkText }).first();
    if ((await textButton.count()) > 0) {
      await this.clickLocator(textButton);
      await this.page.waitForLoadState('networkidle');
      return;
    }

    const candidates = visibleDropdown.locator('a', { hasText: linkText });
    const candidateCount = await candidates.count();
    for (let index = 0; index < candidateCount; index += 1) {
      const candidate = candidates.nth(index);
      if (await candidate.isVisible()) {
        await this.clickLocator(candidate);
        await this.page.waitForLoadState('networkidle');
        return;
      }
    }

    if (linkHrefFragment) {
      const hrefCandidate = visibleDropdown.locator(`a[href*="${linkHrefFragment}"]`).first();
      if ((await hrefCandidate.count()) > 0) {
        await this.clickLocator(hrefCandidate);
        await this.page.waitForLoadState('networkidle');
        return;
      }
    }

    const fallback = visibleDropdown.getByText(linkText, { exact: false }).first();
    await this.clickLocator(fallback);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageUrlContains(pathFragment: string) {
    await expect(this.page).toHaveURL(new RegExp(`${pathFragment}`));
  }

  async expectPageBodyContains(text: string) {
    await expect(this.page.locator('body')).toContainText(text, { useInnerText: true });
  }

  async expectHeadingVisible(text: string) {
    const heading = this.page.getByRole('heading', { name: new RegExp(text, 'i') });
    if ((await heading.count()) > 0) {
      await expect(heading.first()).toBeVisible();
      return;
    }

    const visibleText = this.page
      .getByText(text, { exact: false })
      .filter({ has: this.page.locator(':visible') });
    await expect(visibleText.first()).toBeVisible();
  }
}
