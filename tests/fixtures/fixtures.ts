import { test as base, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { RegisterPage } from "../pages/RegisterPage";
import { FooterPage } from "../pages/FooterPage";
import { JewelryPage } from "../pages/JewelryPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CategoryPage } from "../pages/CategoryPage";

/**
 * Page-object fixtures. A test asks for the pages it needs by name, e.g.
 *   test("...", async ({ homePage, registerPage }) => { ... });
 * and gets an instance bound to that test's `page`. Fixtures are lazy:
 * only the ones a test destructures are created.
 */
type PageFixtures = {
  homePage: HomePage;
  registerPage: RegisterPage;
  footerPage: FooterPage;
  jewelryPage: JewelryPage;
  checkoutPage: CheckoutPage;
  categoryPage: CategoryPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  footerPage: async ({ page }, use) => {
    await use(new FooterPage(page));
  },
  jewelryPage: async ({ page }, use) => {
    await use(new JewelryPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  categoryPage: async ({ page }, use) => {
    await use(new CategoryPage(page));
  },
});

export { expect };
