import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { CategoryPage } from "../pages/CategoryPage";
import { env } from "../../env";

const baseUrl = `${env.demoWebShop.baseURL}/`;

const validEmail = process.env.DEMOWEBSHOP_EMAIL;
const validPassword = process.env.DEMOWEBSHOP_PASSWORD;

if (!validEmail || !validPassword) {
  throw new Error(
    "Missing demowebshop credentials. Ensure DEMOWEBSHOP_EMAIL and DEMOWEBSHOP_PASSWORD are set in .env"
  );
}

interface TopMenuItem {
  name: string;
  path: string;
  heading: string;
}

interface SubMenuItem extends TopMenuItem {
  parent: string;
}

const topLevelMenuItems: TopMenuItem[] = [
  { name: "Books", path: "/books", heading: "Books" },
  { name: "Computers", path: "/computers", heading: "Computers" },
  { name: "Electronics", path: "/electronics", heading: "Electronics" },
  { name: "Apparel & Shoes", path: "/apparel-shoes", heading: "Apparel & Shoes" },
  { name: "Digital downloads", path: "/digital-downloads", heading: "Digital downloads" },
  { name: "Jewelry", path: "/jewelry", heading: "Jewelry" },
  { name: "Gift Cards", path: "/gift-cards", heading: "Gift Cards" },
];

const subMenuItems: SubMenuItem[] = [
  { parent: "Computers", name: "Desktops", path: "/desktops", heading: "Desktops" },
  { parent: "Computers", name: "Notebooks", path: "/notebooks", heading: "Notebooks" },
  { parent: "Computers", name: "Accessories", path: "/accessories", heading: "Accessories" },
  { parent: "Electronics", name: "Camera, photo", path: "/camera-photo", heading: "Camera, photo" },
  { parent: "Electronics", name: "Cell phones", path: "/cell-phones", heading: "Cell phones" },
];

test.describe("SCRUM-2: Validate login functionality for Demo Web Shop", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  test("user can log in successfully with valid credentials", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC1 - Login with valid credentials", async () => {
      await homePage.gotoLogin();
      await homePage.login(validEmail, validPassword);

      await expect(page).toHaveURL(baseUrl);
      await homePage.expectLoggedInAs(validEmail);
    });
  });

  test("user cannot log in with invalid credentials", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC2 - Login with invalid credentials", async () => {
      await homePage.gotoLogin();
      await homePage.login("nonexistent_user_xyz@example.com", "WrongPassword123!");

      await expect(page).toHaveURL(/\/login/);
      await homePage.expectLoginErrorMessage("Login was unsuccessful");
      await homePage.expectNotLoggedIn();
    });
  });

  test("user cannot log in with empty credentials", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC2 (edge case) - Submit login form with empty email and password", async () => {
      await homePage.gotoLogin();
      await homePage.loginButton.click();

      await expect(page).toHaveURL(/\/login/);
      await homePage.expectLoginErrorMessage("Login was unsuccessful");
      await homePage.expectNotLoggedIn();
    });
  });

  test("user cannot log in with a malformed email address", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC2 (edge case) - Submit login form with a syntactically invalid email", async () => {
      await homePage.gotoLogin();
      await homePage.login("not-an-email", "SomePassword1!");

      await expect(page).toHaveURL(/\/login/);
      await homePage.expectLoginErrorMessage("Please enter a valid email address.");
      await homePage.expectNotLoggedIn();
    });
  });

  test("login safely rejects SQL-injection-style credentials", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC2 (edge case) - Submit SQL-injection-style input as email and password", async () => {
      await homePage.gotoLogin();
      await homePage.login("' OR '1'='1", "' OR '1'='1");

      await expect(page).toHaveURL(/\/login/);
      await homePage.expectNotLoggedIn();
    });
  });

  test('"Remember me?" sets a persistent (non-session) auth cookie on login', async ({ page, context }) => {
    const homePage = new HomePage(page);

    await test.step("AC1 (edge case) - Login with Remember me checked", async () => {
      await homePage.gotoLogin();
      await homePage.login(validEmail, validPassword, true);

      await expect(page).toHaveURL(baseUrl);
      const authCookie = (await context.cookies()).find((c) => c.name === "NOPCOMMERCE.AUTH");
      expect(authCookie, "expected a NOPCOMMERCE.AUTH cookie to be set after login").toBeTruthy();
      expect(authCookie!.expires, "Remember me should set a persistent (non-session) cookie").toBeGreaterThan(-1);
    });
  });

  test("user can log out after logging in", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("AC1 (edge case) - Login, then log out and verify session ends", async () => {
      await homePage.gotoLogin();
      await homePage.login(validEmail, validPassword);
      await expect(homePage.logoutLink).toBeVisible();

      await homePage.logout();

      await expect(page).toHaveURL(baseUrl);
      await homePage.expectLoggedOut();
      await expect(homePage.accountLink(validEmail)).toHaveCount(0);
    });
  });
});

test.describe("SCRUM-2: Validate home page menu navigation for Demo Web Shop", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  for (const item of topLevelMenuItems) {
    test(`top menu item "${item.name}" navigates to its page`, async ({ page }) => {
      const homePage = new HomePage(page);
      const categoryPage = new CategoryPage(page);

      await test.step(`AC3 - Click "${item.name}" and verify navigation`, async () => {
        await homePage.goto();
        await homePage.clickTopMenuItem(item.name);

        await expect(page).toHaveURL(new RegExp(`${item.path}$`));
        await categoryPage.expectHeading(item.heading);
      });
    });
  }

  for (const item of subMenuItems) {
    test(`submenu item "${item.name}" (under ${item.parent}) navigates to its page`, async ({ page }) => {
      const homePage = new HomePage(page);
      const categoryPage = new CategoryPage(page);

      await test.step(`AC3 - Hover "${item.parent}", click "${item.name}", and verify navigation`, async () => {
        await homePage.goto();
        await homePage.openSubMenuItem(item.parent, item.name);

        await expect(page).toHaveURL(new RegExp(`${item.path}$`));
        await categoryPage.expectHeading(item.heading);
      });
    });
  }
});
