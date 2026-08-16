import { Page, Locator, expect } from "@playwright/test";

export class JewelryPage {
  readonly page: Page;
  readonly productTitleLinks: Locator;
  readonly addToCartButton: Locator;
  readonly barNotification: Locator;
  readonly viewCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitleLinks = page.locator(".product-item h2.product-title a");
    this.addToCartButton = page.getByRole("button", { name: "Add to cart" }).and(page.locator(".add-to-cart-button"));
    this.barNotification = page.locator("#bar-notification");
    this.viewCartLink = this.barNotification.getByRole("link", { name: "shopping cart" });
  }

  productLink(productName: string): Locator {
    return this.productTitleLinks.filter({ hasText: productName });
  }

  async selectProduct(productName: string): Promise<void> {
    await this.productLink(productName).click();
  }

  async addSelectedProductToCart(): Promise<void> {
    await this.addToCartButton.click();
    await expect(this.barNotification).toHaveClass(/success/);
    await expect(this.barNotification).toContainText("The product has been added to your");
  }

  async goToShoppingCart(): Promise<void> {
    await this.viewCartLink.click();
  }
}
