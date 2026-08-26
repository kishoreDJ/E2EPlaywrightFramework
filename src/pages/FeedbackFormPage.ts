import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface FeedbackFormFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  product?: string;
  message?: string;
}

export class FeedbackFormPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly productDropdown: Locator;
  private readonly messageTextarea: Locator;
  private readonly addAttachmentButton: Locator;
  private readonly attachmentInput: Locator;
  private readonly submitButton: Locator;
  public readonly successMessage: Locator;
  public readonly firstNameError: Locator;
  public readonly lastNameError: Locator;
  public readonly emailError: Locator;
  public readonly messageError: Locator;
  public readonly genericErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.productDropdown = page.locator('[role="combobox"]').first();
    this.messageTextarea = page.locator('#message');
    this.addAttachmentButton = page.getByText('ADD ATTACHMENT', { exact: true });
    this.attachmentInput = page.locator('#attachment');
    this.submitButton = page.getByText('SUBMIT', { exact: true });
    this.successMessage = page.getByText('Thank you for your feedback.');
    this.firstNameError = page.getByText('Please enter your first name');
    this.lastNameError = page.getByText('Please enter your last name');
    this.emailError = page.getByText('Please enter a valid email');
    this.messageError = page.getByText('Please enter a valid message');
    this.genericErrorMessage = page.getByText('There was an error processing your request');
  }

  public async openForSlug(slug: string): Promise<void> {
    await this.goto(`/feedback/${slug}`);
    await this.waitForPageLoad();
    await this.closePopupIfPresent();
  }

  public async fillForm(fields: FeedbackFormFields): Promise<void> {
    if (fields.firstName !== undefined) await this.firstNameInput.fill(fields.firstName);
    if (fields.lastName !== undefined) await this.lastNameInput.fill(fields.lastName);
    if (fields.email !== undefined) await this.emailInput.fill(fields.email);
    if (fields.message !== undefined) await this.messageTextarea.fill(fields.message);
    if (fields.product !== undefined) await this.selectProduct(fields.product);
  }

  public async selectProduct(optionText: string): Promise<void> {
    await this.productDropdown.click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  public async uploadFiles(filePaths: string[]): Promise<void> {
    await this.closePopupIfPresent();
    const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.addAttachmentButton.click()]);
    await chooser.setFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  public async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  public hasProductDropdown(): Promise<boolean> {
    return this.page.locator('[role="combobox"]').count().then((count) => count > 0);
  }
}
