import { test, expect } from '@/utils/fixtures/homepageBaseTest';

const topNavItems = [
  {
    label: 'Why Hi Marley',
    dropdownLinkText: 'Why Hi Marley',
    expectedPath: '/why-hi-marley',
  },
  {
    label: 'Insurance Cloud',
    dropdownLinkText: 'Discover the Impact',
    expectedPath: '/fnol',
  },
  {
    label: 'Customers',
    dropdownLinkText: 'Customer Success',
    expectedPath: '/customer-success',
  },
  {
    label: 'Partners',
    dropdownLinkText: 'Our Partners',
    expectedPath: '/partners',
  },
  {
    label: 'Company',
    dropdownLinkText: 'About Us',
    expectedPath: '/about-us',
  },
  {
    label: 'Resources',
    dropdownLinkText: 'Resource Center',
    expectedPath: '/resource-center',
  },
];

test.describe('Himarley homepage top navigation', () => {
  // Steps:
  // 1. Open the homepage using the configured Playwright base URL.
  // 2. Confirm the homepage is visible.
  // 3. For each top navigation item:
  //    a. Verify the navigation link is visible in the header.
  //    b. Click the top navigation link.
  //    c. Verify the dropdown menu appears.
  //    d. Click the expected dropdown menu item.
  //    e. Confirm the resulting page URL contains the expected path.
  //    f. Return to the homepage to continue the next item.
  test('HomePageTopNavigation', async ({ page, homePageActions }) => {
    await homePageActions.openHomePage();
    await homePageActions.expectPageIsVisible();

    for (const item of topNavItems) {
      await homePageActions.expectTopNavLinkVisible(item.label);
      const navigatedDirectly = await homePageActions.clickTopNavLink(item.label);

      if (!navigatedDirectly) {
        await homePageActions.expectDropdownMenuVisible(item.label);
        await homePageActions.clickDropdownMenuLink(item.dropdownLinkText, item.expectedPath);
      }

      await homePageActions.expectPageUrlContains(item.expectedPath);
      await homePageActions.openHomePage();
    }
  });
});
