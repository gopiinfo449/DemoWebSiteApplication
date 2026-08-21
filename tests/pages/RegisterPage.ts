import { Page, Locator, expect } from "@playwright/test";

export type Gender = "Male" | "Female";

export interface RegistrationDetails {
  gender: Gender;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export class RegisterPage {
  readonly page: Page;

  readonly maleGenderRadio: Locator;
  readonly femaleGenderRadio: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly continueButton: Locator;
  readonly resultMessage: Locator;
  readonly validationSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.maleGenderRadio = page.getByRole("radio", { name: "Male", exact: true });
    this.femaleGenderRadio = page.getByRole("radio", { name: "Female", exact: true });
    this.firstNameInput = page.getByLabel("First name:", { exact: true });
    this.lastNameInput = page.getByLabel("Last name:", { exact: true });
    this.emailInput = page.getByLabel("Email:", { exact: true });
    this.passwordInput = page.getByLabel("Password:", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Confirm password:", { exact: true });
    this.registerButton = page.getByRole("button", { name: "Register" });
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.resultMessage = page.locator(".result");
    this.validationSummary = page.locator(".validation-summary-errors");
  }

  async goto(): Promise<void> {
    await this.page.goto("/register");
  }

  async selectGender(gender: Gender): Promise<void> {
    if (gender === "Male") {
      await this.maleGenderRadio.check();
    } else {
      await this.femaleGenderRadio.check();
    }
  }

  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.selectGender(details.gender);
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.passwordInput.fill(details.password);
    await this.confirmPasswordInput.fill(details.confirmPassword);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  async register(details: RegistrationDetails): Promise<void> {
    await this.fillRegistrationForm(details);
    await this.submit();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  fieldValidationError(fieldName: string): Locator {
    return this.page.locator(`span.field-validation-error[data-valmsg-for="${fieldName}"]`);
  }

  async expectRegistrationSuccessful(): Promise<void> {
    await expect(this.page).toHaveURL(/\/registerresult\/\d+$/);
    await expect(this.resultMessage).toHaveText("Your registration completed");
    await expect(this.continueButton).toBeVisible();
  }

  async expectFieldValidationError(fieldName: string, message: string): Promise<void> {
    await expect(this.fieldValidationError(fieldName)).toHaveText(message);
  }

  async expectValidationSummaryError(message: string): Promise<void> {
    await expect(this.validationSummary).toContainText(message);
  }
}
