import * as path from "path";
import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { JewelryPage } from "../pages/JewelryPage";
import { CheckoutPage, GuestAddress } from "../pages/CheckoutPage";
import { readCsv } from "../utils/csvReader";
import { env } from "../../env";
import testData from "../data/testData.json";

interface PaymentTestData {
  [key: string]: string;
  paymentMethod: string;
}

const productName = testData.jewelry.productName;
const guestAddress: GuestAddress = testData.guestCheckout.billingAddress;
const paymentDataRows = readCsv<PaymentTestData>(path.join(__dirname, "../data/testData.csv"));

test.describe("Jewelry: browse, add to cart, and complete checkout as guest", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  for (const paymentData of paymentDataRows) {
    test(`user can buy a jewelry product end to end paying by "${paymentData.paymentMethod}"`, async ({ page }) => {
      const homePage = new HomePage(page);
      const jewelryPage = new JewelryPage(page);
      const checkoutPage = new CheckoutPage(page);

      await test.step("Go to the Jewelry tab", async () => {
        await homePage.goto();
        await homePage.clickTopMenuItem("Jewelry");

        await expect(page).toHaveURL(/\/jewelry$/);
      });

      await test.step(`Select the "${productName}" product`, async () => {
        await jewelryPage.selectProduct(productName);

        await expect(page.getByRole("heading", { name: productName, exact: true })).toBeVisible();
      });

      await test.step("Add the product to the cart", async () => {
        await jewelryPage.addSelectedProductToCart();
      });

      await test.step("Go to the shopping cart", async () => {
        await jewelryPage.goToShoppingCart();

        await expect(page).toHaveURL(/\/cart$/);
        await expect(checkoutPage.cartRowFor(productName)).toBeVisible();
      });

      await test.step("Accept terms of service and start checkout as guest", async () => {
        await checkoutPage.acceptTermsAndCheckout();
        await checkoutPage.continueAsGuest();
      });

      await test.step("Fill in the billing address", async () => {
        await checkoutPage.fillBillingAddress(guestAddress);
      });

      await test.step("Use the same address for shipping", async () => {
        await checkoutPage.continueWithSameShippingAddress();
      });

      await test.step("Select the default shipping method", async () => {
        await checkoutPage.continueWithDefaultShippingMethod();
      });

      await test.step(`Select payment method "${paymentData.paymentMethod}"`, async () => {
        await checkoutPage.selectPaymentMethod(paymentData.paymentMethod);
      });

      await test.step("Confirm payment info", async () => {
        await checkoutPage.continuePaymentInfo();
      });

      await test.step("Confirm the order and complete the purchase", async () => {
        await checkoutPage.confirmOrder();
        await checkoutPage.expectOrderCompleted();
      });
    });
  }
});
