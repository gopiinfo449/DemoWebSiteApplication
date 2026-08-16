import { Page, expect } from "@playwright/test";

export class CategoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectHeading(text: string): Promise<void> {
    await expect(this.page.getByRole("heading", { name: text, exact: true }).first()).toBeVisible();
  }
}
