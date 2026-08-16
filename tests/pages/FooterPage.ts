import { Page, Locator } from "@playwright/test";

export type FooterColumn = "information" | "customerService" | "myAccount" | "followUs";

export class FooterPage {
  readonly page: Page;
  readonly footer: Locator;
  readonly poweredByLink: Locator;
  private readonly columns: Record<FooterColumn, Locator>;

  constructor(page: Page) {
    this.page = page;
    this.footer = page.locator(".footer");
    this.columns = {
      information: this.footer.locator(".column.information"),
      customerService: this.footer.locator(".column.customer-service"),
      myAccount: this.footer.locator(".column.my-account"),
      followUs: this.footer.locator(".column.follow-us"),
    };
    this.poweredByLink = page.locator(".footer-poweredby").getByRole("link", { name: "nopCommerce" });
  }

  link(column: FooterColumn, name: string): Locator {
    return this.columns[column].getByRole("link", { name, exact: true });
  }

  async clickLink(column: FooterColumn, name: string): Promise<void> {
    await this.link(column, name).click();
  }
}
