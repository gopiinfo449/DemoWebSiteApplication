import { Page, Locator, expect } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly logoutLink: Locator;
  readonly loginLink: Locator;
  readonly topMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email:", { exact: true });
    this.passwordInput = page.getByLabel("Password:", { exact: true });
    this.rememberMeCheckbox = page.getByLabel("Remember me?", { exact: true });
    this.loginButton = page.getByRole("button", { name: "Log in" });
    this.logoutLink = page.getByRole("link", { name: "Log out" });
    this.loginLink = page.getByRole("link", { name: "Log in" });
    this.topMenu = page.locator("ul.top-menu");
  }

  accountLink(email: string): Locator {
    return this.page.getByRole("link", { name: email });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async expectLoggedInAs(email: string): Promise<void> {
    await expect(this.accountLink(email)).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.loginLink).toBeVisible();
  }

  async expectLoginErrorMessage(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectNotLoggedIn(): Promise<void> {
    await expect(this.page.getByRole("link", { name: /@/ })).toHaveCount(0);
  }

  async clickTopMenuItem(name: string): Promise<void> {
    await this.topMenu.getByRole("link", { name, exact: true }).click();
  }

  async openSubMenuItem(parentName: string, itemName: string): Promise<void> {
    await this.topMenu.getByRole("link", { name: parentName, exact: true }).hover();
    await this.topMenu.getByRole("link", { name: itemName, exact: true }).click();
  }
}
