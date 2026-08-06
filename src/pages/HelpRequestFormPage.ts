/**
 * Help Request Form - https://customer.qa.dowjones.com/contact/eform
 * Tabbed form: Help Request, Factiva Source Request, R&C profile update.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HelpRequestFormPage extends BasePage {
  private readonly attentionOverlayCloseButton: Locator;
  private readonly helpRequestTab: Locator;
  private readonly factivaSourceRequestTab: Locator;
  private readonly rcProfileUpdateTab: Locator;
  private readonly attachmentInput: Locator;
  private readonly productCombobox: Locator;
  private readonly productAreaCombobox: Locator;
  private readonly languageCombobox: Locator;
  private readonly dropdownOption: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly messageInput: Locator;
  private readonly submitButton: Locator;
  public readonly attachmentErrorMessage: Locator;
  public readonly thankYouHeading: Locator;
  public readonly faqLink: Locator;

  constructor(page: Page) {
    super(page);
    this.attentionOverlayCloseButton = page.getByText('Close', { exact: true });
    this.helpRequestTab = page.getByRole('tab', { name: 'Help Request', exact: true });
    this.factivaSourceRequestTab = page.getByRole('tab', { name: 'Factiva Source Request' });
    this.rcProfileUpdateTab = page.getByRole('tab', { name: 'R&C profile update' });
    this.attachmentInput = page.locator('#attachment');
    this.productCombobox = page.locator('[role="combobox"]').filter({ has: page.locator('label[for="productLine"]') });
    this.productAreaCombobox = page
      .locator('[role="combobox"]')
      .filter({ has: page.locator('label[for="productArea"]') });
    this.languageCombobox = page.locator('[role="combobox"]').filter({ has: page.locator('label[for="language"]') });
    this.dropdownOption = page.locator('[role="option"]');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.phoneInput = page.locator('#phone');
    this.messageInput = page.locator('#message, textarea').first();
    this.submitButton = page.getByText('SUBMIT', { exact: true });
    this.attachmentErrorMessage = page.getByText('Your attachment file type is not supported.', { exact: false });
    this.thankYouHeading = page.getByText('Thank you', { exact: true });
    this.faqLink = page.locator('a[href="/faq/list"]');
  }

  public async open(): Promise<void> {
    await this.goto('/contact/eform');
    await this.waitForPageLoad();
    if (await this.attentionOverlayCloseButton.isVisible().catch(() => false)) {
      await this.attentionOverlayCloseButton.click();
    }
  }

  public async openHelpRequestTab(): Promise<void> {
    await this.helpRequestTab.click();
  }

  public async openFactivaSourceRequestTab(): Promise<void> {
    await this.factivaSourceRequestTab.click();
  }

  public async openRcProfileUpdateTab(): Promise<void> {
    await this.rcProfileUpdateTab.click();
  }

  public async selectProduct(productName: string): Promise<void> {
    await this.productCombobox.click();
    await this.dropdownOption.filter({ hasText: productName }).first().click();
  }

  public async selectLanguage(languageName: string): Promise<void> {
    await this.languageCombobox.click();
    await this.dropdownOption.filter({ hasText: languageName }).first().click();
  }

  public async getProductAreaOptions(): Promise<string[]> {
    await this.productAreaCombobox.click();
    const options = await this.dropdownOption.allTextContents();
    await this.page.keyboard.press('Escape');
    return options;
  }

  public async uploadAttachment(filePath: string): Promise<void> {
    await this.attachmentInput.setInputFiles(filePath);
  }

  public async fillHelpRequest(fields: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
  }): Promise<void> {
    await this.firstNameInput.fill(fields.firstName);
    await this.lastNameInput.fill(fields.lastName);
    await this.emailInput.fill(fields.email);
    await this.phoneInput.fill(fields.phone);
    await this.messageInput.fill(fields.message);
  }

  public async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  public getFieldValue(fieldId: string): Promise<string> {
    return this.page.locator(`#${fieldId}`).inputValue();
  }

  public async fillField(fieldId: string, value: string): Promise<void> {
    await this.page.locator(`#${fieldId}`).fill(value);
  }
}
