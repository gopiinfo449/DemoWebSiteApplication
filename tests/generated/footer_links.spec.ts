import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { FooterPage, FooterColumn } from "../pages/FooterPage";
import { env } from "../../env";
import testData from "../data/testData.json";

interface InternalLink {
  column: FooterColumn;
  name: string;
  path: string;
  heading: string;
}

interface LoginRequiredLink {
  column: FooterColumn;
  name: string;
  path: string;
  returnUrl: string;
}

interface ExternalLink {
  column: FooterColumn;
  name: string;
  href: string;
  target: string;
}

const internalLinks = testData.footer.internalLinks as InternalLink[];
const loginRequiredLinks = testData.footer.loginRequiredLinks as LoginRequiredLink[];
const externalLinks = testData.footer.externalLinks as ExternalLink[];
const { loginHeading, rssLink, poweredByLink } = testData.footer;

test.describe("Footer: internal links navigate to the correct page", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  for (const link of internalLinks) {
    test(`"${link.name}" footer link navigates to ${link.path}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const footerPage = new FooterPage(page);

      await test.step(`Click "${link.name}" in the footer`, async () => {
        await homePage.goto();
        await footerPage.clickLink(link.column, link.name);
      });

      await test.step("Verify the destination page loads", async () => {
        await expect(page).toHaveURL(new RegExp(`${link.path}$`));
        await expect(page.getByRole("heading", { name: link.heading, exact: true }).first()).toBeVisible();
      });
    });
  }
});

test.describe("Footer: account links require sign in", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  for (const link of loginRequiredLinks) {
    test(`"${link.name}" footer link redirects an anonymous user to login`, async ({ page }) => {
      const homePage = new HomePage(page);
      const footerPage = new FooterPage(page);

      await test.step(`Click "${link.name}" in the footer`, async () => {
        await homePage.goto();
        await footerPage.clickLink(link.column, link.name);
      });

      await test.step("Verify the user is redirected to the login page", async () => {
        await expect(page).toHaveURL(new RegExp(`/login\\?ReturnUrl=${link.returnUrl}$`, "i"));
        await expect(page.getByRole("heading", { name: loginHeading, exact: true })).toBeVisible();
      });
    });
  }
});

test.describe("Footer: RSS feed link", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  test(`"${rssLink.name}" footer link points to a working RSS feed`, async ({ page, request }) => {
    const homePage = new HomePage(page);
    const footerPage = new FooterPage(page);

    await test.step("Verify the RSS link's destination", async () => {
      await homePage.goto();
      await expect(footerPage.link(rssLink.column as FooterColumn, rssLink.name)).toHaveAttribute(
        "href",
        rssLink.path
      );
    });

    await test.step("Verify the feed responds successfully with RSS content", async () => {
      const response = await request.get(`${env.demoWebShop.baseURL}${rssLink.path}`);
      expect(response.ok()).toBeTruthy();
      expect(response.headers()["content-type"]).toContain(rssLink.contentType);
    });
  });
});

test.describe("Footer: external links point to the correct destination", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  test("social and partner links have the correct href and open in a new tab", async ({ page }) => {
    const homePage = new HomePage(page);
    const footerPage = new FooterPage(page);

    await homePage.goto();

    for (const link of externalLinks) {
      await test.step(`Verify "${link.name}" link`, async () => {
        const locator = footerPage.link(link.column, link.name);
        await expect(locator).toHaveAttribute("href", link.href);
        await expect(locator).toHaveAttribute("target", link.target);
      });
    }

    await test.step(`Verify "${poweredByLink.name}" link`, async () => {
      await expect(footerPage.poweredByLink).toHaveAttribute("href", poweredByLink.href);
    });
  });
});
