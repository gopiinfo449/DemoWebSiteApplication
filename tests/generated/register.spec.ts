import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { RegisterPage, RegistrationDetails } from "../pages/RegisterPage";
import { env } from "../../env";
import testData from "../data/testData.json";

const newUser = testData.registration.newUser;
const { validationMessages } = testData.registration;

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@example.com`;
}

function buildRegistrationDetails(overrides: Partial<RegistrationDetails> = {}): RegistrationDetails {
  return {
    gender: newUser.gender as RegistrationDetails["gender"],
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: uniqueEmail("qa.register.test"),
    password: newUser.password,
    confirmPassword: newUser.password,
    ...overrides,
  };
}

test.describe("Register: create a new account", () => {
  test.use({ baseURL: env.demoWebShop.baseURL });

  test("user can register a new account successfully", async ({ page }) => {
    const homePage = new HomePage(page);
    const registerPage = new RegisterPage(page);
    const details = buildRegistrationDetails();

    await test.step("Go to the registration page", async () => {
      await registerPage.goto();

      await expect(page).toHaveURL(/\/register$/);
    });

    await test.step("Fill in the registration form and submit", async () => {
      await registerPage.register(details);
    });

    await test.step("Verify the account was created", async () => {
      await registerPage.expectRegistrationSuccessful();
    });

    await test.step("Continue and verify the user is logged in", async () => {
      await registerPage.clickContinue();

      await homePage.expectLoggedInAs(details.email);
    });
  });

  test("shows validation errors when required fields are missing", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step("Go to the registration page and submit an empty form", async () => {
      await registerPage.goto();
      await registerPage.submit();
    });

    await test.step("Verify required field validation errors are shown", async () => {
      await registerPage.expectFieldValidationError("FirstName", validationMessages.firstNameRequired);
      await registerPage.expectFieldValidationError("LastName", validationMessages.lastNameRequired);
      await registerPage.expectFieldValidationError("Email", validationMessages.emailRequired);
      await registerPage.expectFieldValidationError("Password", validationMessages.passwordRequired);
    });
  });

  test("shows an error when password and confirmation password do not match", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const details = buildRegistrationDetails({ confirmPassword: `${newUser.password}Mismatch` });

    await test.step("Go to the registration page", async () => {
      await registerPage.goto();
    });

    await test.step("Submit the form with mismatched passwords", async () => {
      await registerPage.register(details);
    });

    await test.step("Verify the password mismatch error is shown", async () => {
      await registerPage.expectFieldValidationError("ConfirmPassword", validationMessages.passwordsDoNotMatch);
    });
  });

  test("shows an error when the email is already registered", async ({ page }) => {
    const homePage = new HomePage(page);
    const registerPage = new RegisterPage(page);
    const email = uniqueEmail("qa.register.duplicate.test");

    await test.step("Register a first account with a new email", async () => {
      await registerPage.goto();
      await registerPage.register(buildRegistrationDetails({ email }));
      await registerPage.expectRegistrationSuccessful();
      await registerPage.clickContinue();
    });

    await test.step("Log out so a new account can be registered", async () => {
      await homePage.logout();
    });

    await test.step("Attempt to register a second account with the same email", async () => {
      await registerPage.goto();
      await registerPage.register(buildRegistrationDetails({ email }));
    });

    await test.step("Verify the duplicate email error is shown", async () => {
      await registerPage.expectValidationSummaryError(validationMessages.emailAlreadyExists);
    });
  });
});
