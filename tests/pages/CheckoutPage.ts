import { Page, Locator, expect } from "@playwright/test";

export interface GuestAddress {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address1: string;
  zipPostalCode: string;
  phoneNumber: string;
}

export class CheckoutPage {
  readonly page: Page;

  readonly cartItemRows: Locator;
  readonly termsOfServiceCheckbox: Locator;
  readonly checkoutButton: Locator;
  readonly checkoutAsGuestButton: Locator;
  readonly billingForm: Locator;
  readonly billingContinueButton: Locator;
  readonly shippingContinueButton: Locator;
  readonly shippingMethodContinueButton: Locator;
  readonly paymentMethodStep: Locator;
  readonly paymentMethodContinueButton: Locator;
  readonly paymentInfoContinueButton: Locator;
  readonly confirmOrderButton: Locator;
  readonly orderCompletedMessage: Locator;
  readonly orderNumber: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItemRows = page.locator("tr.cart-item-row");
    this.termsOfServiceCheckbox = page.locator(".terms-of-service").getByRole("checkbox");
    this.checkoutButton = page.getByRole("button", { name: "Checkout" });
    this.checkoutAsGuestButton = page.getByRole("button", { name: "Checkout as Guest" });
    this.billingForm = page.locator("#billing-new-address-form");
    this.billingContinueButton = page.locator("#billing-buttons-container").getByRole("button", { name: "Continue" });
    this.shippingContinueButton = page.locator("#shipping-buttons-container").getByRole("button", { name: "Continue" });
    this.shippingMethodContinueButton = page
      .locator("#shipping-method-buttons-container")
      .getByRole("button", { name: "Continue" });
    this.paymentMethodStep = page.locator("#checkout-step-payment-method");
    this.paymentMethodContinueButton = page
      .locator("#payment-method-buttons-container")
      .getByRole("button", { name: "Continue" });
    this.paymentInfoContinueButton = page
      .locator("#payment-info-buttons-container")
      .getByRole("button", { name: "Continue" });
    this.confirmOrderButton = page.locator("#confirm-order-buttons-container").getByRole("button", { name: "Confirm" });
    this.orderCompletedMessage = page.getByText("Your order has been successfully processed!");
    this.orderNumber = page.locator(".order-completed .details").first();
  }

  async goto(): Promise<void> {
    await this.page.goto("/cart");
  }

  cartRowFor(productName: string): Locator {
    return this.cartItemRows.filter({ hasText: productName });
  }

  async acceptTermsAndCheckout(): Promise<void> {
    await this.termsOfServiceCheckbox.check();
    await this.checkoutButton.click();
  }

  async continueAsGuest(): Promise<void> {
    await this.checkoutAsGuestButton.click();
  }

  async fillBillingAddress(details: GuestAddress): Promise<void> {
    await this.billingForm.getByLabel("First name:").fill(details.firstName);
    await this.billingForm.getByLabel("Last name:").fill(details.lastName);
    await this.billingForm.getByLabel("Email:", { exact: true }).fill(details.email);
    await this.billingForm.getByLabel("Country:").selectOption({ label: details.country });
    await this.billingForm.getByLabel("City:").fill(details.city);
    await this.billingForm.getByLabel("Address 1:").fill(details.address1);
    await this.billingForm.getByLabel("Zip / postal code:").fill(details.zipPostalCode);
    await this.billingForm.getByLabel("Phone number:").fill(details.phoneNumber);
    await this.billingContinueButton.click();
  }

  async continueWithSameShippingAddress(): Promise<void> {
    await this.shippingContinueButton.click();
  }

  async continueWithDefaultShippingMethod(): Promise<void> {
    await this.shippingMethodContinueButton.click();
  }

  async selectPaymentMethod(paymentMethod: string): Promise<void> {
    const escaped = paymentMethod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await this.paymentMethodStep.getByRole("radio", { name: new RegExp(`^${escaped}`) }).check();
    await this.paymentMethodContinueButton.click();
  }

  async continuePaymentInfo(): Promise<void> {
    await this.paymentInfoContinueButton.click();
  }

  async confirmOrder(): Promise<void> {
    await this.confirmOrderButton.click();
  }

  async expectOrderCompleted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout\/completed/);
    await expect(this.orderCompletedMessage).toBeVisible();
    await expect(this.orderNumber).toContainText(/Order number:\s*\d+/);
  }
}
