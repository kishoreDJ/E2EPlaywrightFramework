/**
 * FAQ Page - https://customer.qa.dowjones.com/faq/list
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FaqPage extends BasePage {
  private readonly searchInput: Locator;
  public readonly acceptTermsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[placeholder="Type something"]');
    this.acceptTermsButton = page.getByText('ACCEPT', { exact: true });
  }

  public async open(): Promise<void> {
    await this.clickNavLink('FAQ');
  }

  public async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.page.keyboard.press('Enter');
    await this.page.waitForURL(/searchTerm=/);
  }

  public async openArticle(title: string): Promise<void> {
    await this.page.getByText(title, { exact: true }).first().click();
    await this.page.waitForURL(/\/faq\/list\//);
  }
}
