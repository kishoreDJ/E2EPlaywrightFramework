/**
 * Live Chat Page - https://customer.qa.dowjones.com/contact/liveChat
 * Reached via Contact Us -> Live Chat in the top navigation.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LiveChatPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly countryButton: Locator;
  private readonly phoneInput: Locator;
  private readonly productLineCombobox: Locator;
  private readonly productAreaCombobox: Locator;
  private readonly languageCombobox: Locator;
  private readonly messageInput: Locator;
  private readonly startChatButton: Locator;
  private readonly attentionOverlayCloseButton: Locator;
  private readonly dropdownOption: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.countryButton = page.locator('button[role="combobox"][aria-label="Country"]');
    this.phoneInput = page.locator('#phone');
    this.productLineCombobox = page.locator('[role="combobox"]', { has: page.locator('#productLine') });
    this.productAreaCombobox = page.locator('[role="combobox"]', { has: page.locator('#productArea') });
    this.languageCombobox = page.locator('[role="combobox"]', { has: page.locator('#language') });
    this.messageInput = page.locator('#message');
    this.startChatButton = page.getByText('START CHAT', { exact: false });
    this.attentionOverlayCloseButton = page.locator('.sc-qOiPt [role="button"]', { hasText: 'Close' });
    this.dropdownOption = page.locator('[role="option"]');
  }

  public async open(): Promise<void> {
    await this.clickNavLink('Contact Us');
    await this.page.getByText('Live Chat', { exact: true }).first().click();
    await this.waitForPageLoad();
    await this.dismissAttentionOverlayIfPresent();
  }

  public async dismissAttentionOverlayIfPresent(): Promise<void> {
    if (await this.attentionOverlayCloseButton.isVisible().catch(() => false)) {
      await this.attentionOverlayCloseButton.click();
    }
  }

  public async fillContactDetails(details: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    message?: string;
  }): Promise<void> {
    if (details.firstName) await this.firstNameInput.fill(details.firstName);
    if (details.lastName) await this.lastNameInput.fill(details.lastName);
    if (details.email) await this.emailInput.fill(details.email);
    if (details.phone) await this.phoneInput.fill(details.phone);
    if (details.message) await this.messageInput.fill(details.message);
  }

  public async selectCountry(countryName: string): Promise<void> {
    await this.countryButton.click();
    await this.dropdownOption.filter({ hasText: countryName }).first().click();
  }

  public async selectProductLine(productLineName: string): Promise<void> {
    await this.productLineCombobox.click();
    await this.dropdownOption.filter({ hasText: productLineName }).first().click();
  }

  public async selectProductArea(productAreaName: string): Promise<void> {
    await this.productAreaCombobox.click();
    await this.dropdownOption.filter({ hasText: productAreaName }).first().click();
  }

  public async selectLanguage(languageName: string): Promise<void> {
    await this.languageCombobox.click();
    await this.dropdownOption.filter({ hasText: languageName }).first().click();
  }

  public async getLanguageOptions(): Promise<string[]> {
    await this.languageCombobox.click();
    const options = await this.dropdownOption.allTextContents();
    await this.page.keyboard.press('Escape');
    return options;
  }

  public async getProductAreaOptions(): Promise<string[]> {
    await this.productAreaCombobox.click();
    const options = await this.dropdownOption.allTextContents();
    await this.page.keyboard.press('Escape');
    return options;
  }

  public async clickStartChat(): Promise<void> {
    await this.startChatButton.click();
  }

  public getSelectedLanguage(): Promise<string> {
    return this.page.locator('#language').inputValue();
  }

  public getSelectedProductArea(): Promise<string> {
    return this.page.locator('#productArea').inputValue();
  }

  public getValidationErrors(): Promise<string[]> {
    return this.page
      .locator('[id*="Error"], [class*="error" i]')
      .allTextContents()
      .then((texts) => texts.map((t) => t.trim()).filter((t) => t.length > 0));
  }
}
